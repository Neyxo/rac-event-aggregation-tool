"""Build a subscribable ICS feed per club from its public Polaris agenda.

Usage: python3 polaris_feed.py [clubs.toml] [out_dir]
"""
import datetime as dt
import re
import sys
import time
import tomllib
import urllib.request
from pathlib import Path

USER_AGENT = "rac-event-aggregation-tool (+https://github.com/Neyxo/rac-event-aggregation-tool)"
MAX_PAGES = 20
DEFAULT_DURATION = dt.timedelta(hours=2)

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


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def event_ids(club):
    """Upcoming events plus this year's past ones (so they don't vanish from calendars)."""
    ids = []
    for f in ("latest", str(dt.date.today().year)):
        # robots.txt disallows `limit=`, so page through instead.
        for page in range(1, MAX_PAGES + 1):
            html = get(f"{club['base_url']}/{club['lang']}/agenda?criteria%5BendsAt%5D={f}&page={page}")
            new = [i for i in dict.fromkeys(re.findall(r"/agenda/show/(\d+)", html)) if i not in ids]
            if not new:
                break
            ids += new
    return ids


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


def clean_vevent(ics, event_id):
    """Extract the VEVENT from a Polaris per-event .ics and fix its quirks."""
    lines = unfold(ics)
    ev = lines[lines.index("BEGIN:VEVENT") + 1 : lines.index("END:VEVENT")]
    # Polaris generates a random UID per request; calendars need a stable one.
    # Event IDs are global across Polaris, so this also dedupes across clubs.
    ev = [f"UID:polaris-{event_id}@rotary.ch" if l.startswith("UID:") else l for l in ev]
    # Polaris emits a second DTSTART/DTEND without TZID; keep only the TZID ones.
    ev = [l for l in ev if not re.match(r"(DTSTART|DTEND):", l)]
    start = next(l for l in ev if l.startswith("DTSTART"))
    end = next((l for l in ev if l.startswith("DTEND")), None)
    if end is None or end.split(":", 1)[1] == start.split(":", 1)[1]:
        # No end time entered in Polaris: assume a default duration.
        params, value = start.split(":", 1)
        new_end = dt.datetime.strptime(value, "%Y%m%dT%H%M%S") + DEFAULT_DURATION
        ev = [l for l in ev if not l.startswith("DTEND")]
        ev.append(params.replace("DTSTART", "DTEND") + ":" + new_end.strftime("%Y%m%dT%H%M%S"))
    return ev


def build_calendar(name, vevents):
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//rac-event-aggregation-tool//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        f"X-WR-CALNAME:{name}",
        "X-WR-TIMEZONE:Europe/Zurich",
        "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
        *VTIMEZONE,
    ]
    for ev in vevents:
        lines += ["BEGIN:VEVENT", *ev, "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) for l in lines) + "\r\n"


def build_club(club):
    vevents, skipped = [], []
    for i in event_ids(club):
        time.sleep(0.5)  # be gentle with Polaris
        ics = get(f"{club['base_url']}/{club['lang']}/agenda/ical/{i}")
        if "BEGIN:VEVENT" not in ics:  # members-only events redirect to the login page
            skipped.append(i)
            continue
        vevents.append(clean_vevent(ics, i))
    return build_calendar(club["name"], vevents), len(vevents), skipped


def main():
    config = Path(sys.argv[1] if len(sys.argv) > 1 else "clubs.toml")
    out = Path(sys.argv[2] if len(sys.argv) > 2 else "public")
    out.mkdir(exist_ok=True)
    for club in tomllib.loads(config.read_text())["clubs"]:
        ics, n, skipped = build_club(club)
        (out / f"{club['id']}.ics").write_text(ics, newline="")
        print(f"{club['id']}: {n} events, skipped (members-only): {', '.join(skipped) or 'none'}")


if __name__ == "__main__":
    main()
