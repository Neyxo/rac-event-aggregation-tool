"""Build a subscribable ICS feed per club from its public Polaris agenda.

Every run syncs Polaris into a per-club history file (data/<id>.json) and builds
the feed from that history:
- past events are kept for good (Polaris drops them from the "upcoming" list),
- changed events (e.g. moved) are updated and get a higher SEQUENCE,
- an upcoming event that disappears is re-checked on its own; only if Polaris
  says it's gone (404 / login page) is it marked cancelled.

Usage: python3 polaris_feed.py [clubs.toml] [out_dir] [data_dir]
"""
import datetime as dt
import json
import re
import sys
import time
import tomllib
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

USER_AGENT = "rac-event-aggregation-tool (+https://github.com/Neyxo/rac-event-aggregation-tool)"
MAX_PAGES = 20
DEFAULT_DURATION = dt.timedelta(hours=2)
TZ = ZoneInfo("Europe/Zurich")
# Refuse a sync that would cancel more than this share of upcoming events at once:
# that's far more likely a Polaris problem than a wave of real cancellations.
MAX_CANCEL_RATIO = 0.5
CANCELLED = {"de": "Abgesagt", "fr": "Annulé", "it": "Annullato"}

# Polaris ships a VTIMEZONE without DST rules, so we write a correct one ourselves.
VTIMEZONE = """BEGIN:VTIMEZONE
TZID:Europe/Zurich
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE""".splitlines()


def get(url, attempts=3):
    """GET with retries on network errors and 5xx. 4xx is raised right away."""
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for n in range(attempts):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code < 500 or n == attempts - 1:
                raise
        except OSError:
            if n == attempts - 1:
                raise
        time.sleep(5 * 2**n)


def event_ids(club, backfill=False):
    """IDs of upcoming events plus this year's past ones; with backfill, every year Polaris offers."""
    url = f"{club['base_url']}/{club['lang']}/agenda?criteria%5BendsAt%5D="
    filters = ["latest", str(dt.date.today().year)]
    if backfill:
        filters += re.findall(r'<option value="(\d{4})"', get(url + "latest"))
    ids = []
    for f in dict.fromkeys(filters):
        # robots.txt disallows `limit=`, so page through instead.
        for page in range(1, MAX_PAGES + 1):
            html = get(f"{url}{f}&page={page}")
            new = [i for i in dict.fromkeys(re.findall(r"/agenda/show/(\d+)", html)) if i not in ids]
            if not new:
                break
            ids += new
    return ids


def fetch_event(club, event_id):
    """Cleaned VEVENT lines, or None if the event isn't public (any more). Raises on transient errors."""
    time.sleep(0.5)  # be gentle with Polaris
    try:
        ics = get(f"{club['base_url']}/{club['lang']}/agenda/ical/{event_id}")
    except urllib.error.HTTPError as e:
        if e.code in (403, 404, 410):
            return None
        raise
    if "BEGIN:VEVENT" not in ics:  # members-only / deleted events redirect to the login page
        return None
    return clean_vevent(ics, event_id)


def unfold(ics):
    return re.sub(r"\r?\n[ \t]", "", ics).splitlines()


def fold(line):
    """RFC 5545: max 75 octets per line, continuation lines start with a space."""
    out, cur = [], b""
    for ch in line:
        b = ch.encode()
        if len(cur) + len(b) > (75 if not out else 74):
            out.append(cur.decode())
            cur = b""
        cur += b
    out.append(cur.decode())
    return "\r\n ".join(out)


def parse_value(value):
    return dt.datetime.strptime(value[:15], "%Y%m%dT%H%M%S") if "T" in value else dt.datetime.strptime(value[:8], "%Y%m%d")


def prop(ev, name):
    """Local (Europe/Zurich, naive) datetime of DTSTART/DTEND."""
    return parse_value(next(l for l in ev if re.match(name + "[;:]", l)).split(":", 1)[1])


def clean_vevent(ics, event_id):
    """Extract the VEVENT from a Polaris per-event .ics and fix its quirks."""
    lines = unfold(ics)
    ev = lines[lines.index("BEGIN:VEVENT") + 1 : lines.index("END:VEVENT")]
    # Polaris generates a random UID per request; calendars need a stable one.
    # Event IDs are global across Polaris, so this also dedupes across clubs.
    ev = [f"UID:polaris-{event_id}@rotary.ch" if l.startswith("UID:") else l for l in ev]
    # DTSTAMP changes on every request; we set our own when building the feed.
    # Polaris also emits a second DTSTART/DTEND without TZID; keep only the TZID ones.
    ev = [l for l in ev if not re.match(r"(DTSTAMP[;:]|DTSTART:|DTEND:)", l)]
    start = next(l for l in ev if l.startswith("DTSTART"))
    end = next((l for l in ev if l.startswith("DTEND")), None)
    if end is None or end.split(":", 1)[1] == start.split(":", 1)[1]:
        # No end time entered in Polaris: assume a default duration (all-day: one day).
        params, value = start.split(":", 1)
        if "T" in value:
            new_end = (parse_value(value) + DEFAULT_DURATION).strftime("%Y%m%dT%H%M%S")
        else:
            new_end = (parse_value(value) + dt.timedelta(days=1)).strftime("%Y%m%d")
        ev = [l for l in ev if not l.startswith("DTEND")]
        ev.append(params.replace("DTSTART", "DTEND") + ":" + new_end)
    return ev


def sync(history, listed, fetch, now, stamp):
    """Merge the current Polaris state into `history` (event id -> record), in place.

    listed: ids Polaris lists right now. fetch(id) -> VEVENT lines | None (gone), raises if unsure.
    Returns a list of per-event errors (those events are left as they were).
    """
    def upcoming(rec):
        return rec["status"] == "active" and prop(rec["vevent"], "DTEND") >= now

    # Upcoming events we know but Polaris no longer lists: check each one directly.
    # Past events aren't re-checked: history is fixed once an event is over.
    missing = [i for i, rec in history.items() if i not in listed and upcoming(rec)]
    fresh, errors = {}, []
    for i in dict.fromkeys([*listed, *missing]):
        try:
            fresh[i] = fetch(i)
        except Exception as e:
            errors.append(f"{i}: {e}")

    gone = [i for i, ev in fresh.items() if ev is None and i in history and history[i]["status"] == "active"]
    n_upcoming = sum(map(upcoming, history.values()))
    if n_upcoming >= 4 and len(gone) > MAX_CANCEL_RATIO * n_upcoming:
        raise RuntimeError(f"{len(gone)} of {n_upcoming} upcoming events would be cancelled at once; refusing, check Polaris")

    for i, ev in fresh.items():
        rec = history.get(i)
        if ev is None:
            if rec and rec["status"] == "active":
                rec.update(status="cancelled", sequence=rec["sequence"] + 1, modified=stamp)
            continue  # never-public (members-only) events are simply ignored
        if rec is None:
            history[i] = {"status": "active", "vevent": ev, "sequence": 0, "first_seen": stamp, "modified": stamp}
        elif rec["vevent"] != ev or rec["status"] != "active":
            rec.update(status="active", vevent=ev, sequence=rec["sequence"] + 1, modified=stamp)
    return errors


def build_calendar(club, history, now):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//rac-event-aggregation-tool//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{club['name']}",
        "X-WR-TIMEZONE:Europe/Zurich",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        *VTIMEZONE,
    ]
    for rec in sorted(history.values(), key=lambda r: prop(r["vevent"], "DTSTART")):
        ev = rec["vevent"]
        if rec["status"] == "cancelled":
            if prop(ev, "DTEND") < now:
                continue  # a cancelled event has no place in the history once its date is over
            label = CANCELLED.get(club["lang"], "Cancelled")
            ev = [f"SUMMARY:{label}: {l[8:]}" if l.startswith("SUMMARY:") else l for l in ev] + ["STATUS:CANCELLED"]
        meta = [f"DTSTAMP:{rec['modified']}", f"LAST-MODIFIED:{rec['modified']}", f"SEQUENCE:{rec['sequence']}"]
        lines += ["BEGIN:VEVENT", *ev, *meta, "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) for l in lines) + "\r\n"


def main():
    args = sys.argv[1:] + [None] * 3
    config, out, data = Path(args[0] or "clubs.toml"), Path(args[1] or "public"), Path(args[2] or "data")
    out.mkdir(exist_ok=True)
    data.mkdir(exist_ok=True)
    now = dt.datetime.now(TZ).replace(tzinfo=None)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    failures = []
    for club in tomllib.loads(config.read_text())["clubs"]:
        path = data / f"{club['id']}.json"
        history = json.loads(path.read_text()) if path.exists() else {}
        try:
            listed = event_ids(club, backfill=not history)
            errors = sync(history, listed, lambda i: fetch_event(club, i), now, stamp)
            path.write_text(json.dumps(history, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
            failures += [f"{club['id']} {e}" for e in errors]
        except Exception as e:
            # Keep the last good history; the feed below is built from it.
            failures.append(f"{club['id']}: {e}")
            history = json.loads(path.read_text()) if path.exists() else {}
        (out / f"{club['id']}.ics").write_text(build_calendar(club, history, now), newline="")
        cancelled = sum(r["status"] == "cancelled" for r in history.values())
        print(f"{club['id']}: {len(history)} events in history ({cancelled} cancelled)")
    for f in failures:
        print(f"::error::{f}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
