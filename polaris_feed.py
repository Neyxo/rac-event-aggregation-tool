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
import html
import json
import re
import shutil
import sys
import time
import tomllib
import urllib.error
import urllib.parse
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


def html_text(fragment):
    """Rough HTML -> text: paragraphs/line breaks become newlines, tags are dropped, entities decoded."""
    t = re.sub(r"</p>|</div>|</h\d>", "\n\n", re.sub(r"<br\s*/?>|</li>", "\n", fragment))
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    t = re.sub(r"[ \t]*\n[ \t]*", "\n", re.sub(r"[ \t]+", " ", t))
    return re.sub(r"\n\n+", "\n\n", t).strip()


MONTHS = {m: i for i, names in enumerate([
    "januar january janvier gennaio", "februar february février febbraio", "märz march mars marzo", "april avril aprile",
    "mai may maggio", "juni june juin giugno", "juli july juillet luglio", "august août agosto",
    "september septembre settembre", "oktober october octobre ottobre", "november novembre", "dezember december décembre dicembre",
], 1) for m in names.split()}


def deadline(text):
    """ISO date-time of the registration deadline in a Polaris registration text (de/fr/it/en), or ''."""
    low = text.lower().replace("\u202f", " ")
    month = next((MONTHS[w] for w in re.findall(r"[a-zäéû]+", low) if w in MONTHS), None)
    year = re.search(r"\b(20\d\d)\b", low)
    day = re.search(r"\b(\d{1,2})\b\.?\s+(?=[a-zäéû]+\s+20\d\d)", low) or re.search(r"[a-z]+\s+(\d{1,2}),\s+20\d\d", low)
    if not (month and year and day):
        return ""
    hour, minute = 23, 59
    tm = re.search(r"(\d{1,2}):(\d{2})\s*(am|pm)?", low)
    if tm:
        hour, minute = int(tm.group(1)) % 12 + (12 if tm.group(3) == "pm" else 0) if tm.group(3) else int(tm.group(1)), int(tm.group(2))
    try:
        return dt.datetime(int(year.group(1)), month, int(day.group(1)), hour, minute).isoformat(timespec="minutes")
    except ValueError:
        return ""


def parse_detail(page):
    """Image, full description and registration info from a Polaris event page."""
    image = re.search(r'property="og:image"\s+content="([^"]+)"', page)
    desc = re.search(r'ct-block-type-primary-code">(.*?)</div>', page, re.S)
    reg = re.search(r'event-participant-container">.*?<small>(.*?)</small>', page, re.S)
    return {
        "image": html.unescape(image.group(1)) if image else "",
        "description": html_text(desc.group(1)) if desc else "",
        "registration": html_text(reg.group(1)) if reg else "",
    }


def fetch_detail(club, event_id):
    time.sleep(0.5)
    return parse_detail(get(f"{club['base_url']}/{club['lang']}/agenda/show/{event_id}"))


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
    # Past events aren't re-checked or re-fetched: history is fixed once an event is over.
    missing = [i for i, rec in history.items() if i not in listed and upcoming(rec)]
    known_past = {i for i, rec in history.items() if prop(rec["vevent"], "DTEND") < now}
    fresh, errors = {}, []
    for i in dict.fromkeys([*listed, *missing]):
        if i in known_past:
            continue
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
        if not visible(rec, now):
            continue  # a cancelled event has no place in the history once its date is over
        if rec["status"] == "cancelled":
            label = CANCELLED.get(club["lang"], "Cancelled")
            ev = [f"SUMMARY:{label}: {l[8:]}" if l.startswith("SUMMARY:") else l for l in ev] + ["STATUS:CANCELLED"]
        meta = [f"DTSTAMP:{rec['modified']}", f"LAST-MODIFIED:{rec['modified']}", f"SEQUENCE:{rec['sequence']}"]
        lines += ["BEGIN:VEVENT", *ev, *meta, "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(fold(l) for l in lines) + "\r\n"


def geocode(query, cache):
    """[lat, lon] of a Swiss/Liechtenstein place via swisstopo, or None. Cached, incl. misses."""
    if query not in cache:
        url = "https://api3.geo.admin.ch/rest/services/api/SearchServer?" + urllib.parse.urlencode(
            {"searchText": query, "type": "locations", "sr": 4326, "limit": 1})
        try:
            results = json.loads(get(url))["results"]
        except urllib.error.HTTPError as e:
            if e.code >= 500:
                raise
            results = []  # swisstopo rejects some queries (long, "&", "|") with 400: treat as not found
        cache[query] = [round(results[0]["attrs"]["lat"], 5), round(results[0]["attrs"]["lon"], 5)] if results else None
    return cache[query]


def locate(location, city, cache):
    """Try the full location, then its comma-separated parts (usually "6005 Luzern" is last), then the club's city."""
    parts = [p.strip() for p in location.split(",")]
    for query in dict.fromkeys([location, *reversed(parts), city]):
        if query:
            try:
                if coords := geocode(query, cache):
                    return coords
            except Exception:
                return None  # geocoder unreachable: try again next run (misses aren't cached)
    return None


def ics_text(ev, name):
    value = next((l.split(":", 1)[1] for l in ev if re.match(name + "[;:]", l)), "")
    return re.sub(r"\\(.)", lambda m: "\n" if m.group(1) in "nN" else m.group(1), value)


def visible(rec, now):
    """Feed/site rule: active events always, cancelled ones only until their date is over."""
    return rec["status"] == "active" or prop(rec["vevent"], "DTEND") >= now


def site_data(clubs, histories, now, cache):
    """events.json for the search site: every visible event, merged across clubs by Polaris id."""
    events = {}
    for club in clubs:
        for i, rec in histories[club["id"]].items():
            if not visible(rec, now):
                continue
            if i in events:  # joint event listed by several clubs
                events[i]["clubs"].append(club["id"])
                continue
            ev = rec["vevent"]
            location = ics_text(ev, "LOCATION")
            detail = rec.get("detail", {})
            events[i] = {
                "id": i,
                "clubs": [club["id"]],
                "title": ics_text(ev, "SUMMARY"),
                "start": prop(ev, "DTSTART").isoformat(timespec="minutes"),
                "end": prop(ev, "DTEND").isoformat(timespec="minutes"),
                "allday": "T" not in ics_text(ev, "DTSTART"),
                "location": location,
                "coords": locate(location, club.get("city", ""), cache),
                "url": ics_text(ev, "URL"),
                "description": (detail.get("description") or ics_text(ev, "DESCRIPTION"))[:4000],
                "image": detail.get("image", ""),
                "registration": detail.get("registration", ""),
                "deadline": deadline(detail.get("registration", "")),
                "cancelled": rec["status"] == "cancelled",
            }
    return {
        "generated": now.isoformat(timespec="minutes"),
        "clubs": [{"id": c["id"], "name": c["name"], "short": c.get("short", c["name"]), "url": c["base_url"],
                   "color": c.get("color", "#d41367"), "logo": c.get("logo", ""), "district": c.get("district", ""),
                   "coords": locate("", c.get("city", ""), cache), "photos": c.get("photos", [])} for c in clubs],
        "events": sorted(events.values(), key=lambda e: e["start"]),
    }


def share_page(e, club_names):
    """Tiny page per event so a shared link shows title + picture in WhatsApp etc., then opens the app on that event."""
    esc = html.escape
    desc = esc(" ".join(e["description"].split())[:200])
    when = dt.datetime.fromisoformat(e["start"]).strftime("%d.%m.%Y" if e["allday"] else "%d.%m.%Y %H:%M")
    image = f'<meta property="og:image" content="{esc(e["image"])}">\n' if e["image"] else ""
    return f"""<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(e["title"])}</title>
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(e["title"])} · {when}">
<meta property="og:description" content="{esc(club_names)}{' · ' + esc(e['location']) if e['location'] else ''}. {desc}">
{image}<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=../event.html?id={esc(e["id"])}">
</head><body><p><a href="../event.html?id={esc(e["id"])}">{esc(e["title"])}</a></p></body></html>
"""


def write_status(out, site, histories, failures, stamp):
    clubs = {}
    for cid, h in histories.items():
        clubs[cid] = {"events": len(h), "cancelled": sum(r["status"] == "cancelled" for r in h.values()),
                      "without_detail": sum("detail" not in r and r["status"] == "active" for r in h.values())}
    status = {"generated": stamp, "events": len(site["events"]), "with_image": sum(bool(e["image"]) for e in site["events"]),
              "without_location": sum(e["coords"] is None for e in site["events"]), "clubs": clubs, "failures": failures}
    (out / "status.json").write_text(json.dumps(status, indent=1, ensure_ascii=False) + "\n")


def main():
    args = sys.argv[1:] + [None] * 3
    config, out, data = Path(args[0] or "clubs.toml"), Path(args[1] or "public"), Path(args[2] or "data")
    out.mkdir(exist_ok=True)
    data.mkdir(exist_ok=True)
    now = dt.datetime.now(TZ).replace(tzinfo=None)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    clubs = tomllib.loads(config.read_text())["clubs"]
    failures, histories = [], {}
    for club in clubs:
        path = data / f"{club['id']}.json"
        history = json.loads(path.read_text()) if path.exists() else {}
        try:
            listed = event_ids(club, backfill=not history and club.get("backfill", False))
            errors = sync(history, listed, lambda i: fetch_event(club, i), now, stamp)
            # Event page (image, full text, registration): fetched once per event, again when the event changed.
            for i, rec in history.items():
                if rec["status"] == "active" and ("detail" not in rec or rec["modified"] == stamp):
                    try:
                        rec["detail"] = fetch_detail(club, i)
                    except Exception as e:
                        errors.append(f"{i} detail: {e}")  # left out; retried next run
            path.write_text(json.dumps(history, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
            failures += [f"{club['id']} {e}" for e in errors]
        except Exception as e:
            # Keep the last good history; the feed below is built from it.
            failures.append(f"{club['id']}: {e}")
            history = json.loads(path.read_text()) if path.exists() else {}
        histories[club["id"]] = history
        (out / f"{club['id']}.ics").write_text(build_calendar(club, history, now), newline="")
        cancelled = sum(r["status"] == "cancelled" for r in history.values())
        print(f"{club['id']}: {len(history)} events in history ({cancelled} cancelled)")

    # Swiss-wide: one combined feed + the search site. Polaris ids are global, so merging dedupes joint events.
    merged = {i: rec for club in clubs for i, rec in histories[club["id"]].items()}
    everyone = {"name": "Rotaract Schweiz & Liechtenstein – alle Clubs", "lang": "de"}
    (out / "all.ics").write_text(build_calendar(everyone, merged, now), newline="")
    cache_path = data / "geocode.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    site = site_data(clubs, histories, now, cache)
    cache_path.write_text(json.dumps(cache, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    (out / "events.json").write_text(json.dumps(site, ensure_ascii=False, separators=(",", ":")))
    shutil.copytree(Path(__file__).with_name("site"), out, dirs_exist_ok=True)
    names = {c["id"]: c["name"] for c in clubs}
    (out / "e").mkdir(exist_ok=True)
    for e in site["events"]:
        (out / "e" / f"{e['id']}.html").write_text(share_page(e, " & ".join(names.get(c, c) for c in e["clubs"])))
    write_status(out, site, histories, failures, stamp)
    print(f"site: {len(site['events'])} events, {sum(e['coords'] is None for e in site['events'])} without location")

    for f in failures:
        print(f"::error::{f}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
