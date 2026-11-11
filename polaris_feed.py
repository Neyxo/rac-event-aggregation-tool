"""Build a subscribable ICS feed per club from its public Polaris agenda.

Every run syncs Polaris into a per-club history file (data/<id>.json) and builds
the feed from that history:
- only the last month and the future are refreshed; older events are frozen
  and kept for good (Polaris drops them from the "upcoming" list),
- changed events (e.g. moved) are updated and get a higher SEQUENCE,
- an event that disappears is re-checked on its own; only if Polaris says
  it's gone (404 / login page) is it marked cancelled,
- feeds and site carry the last 24 months plus the future; data/ keeps everything.

Usage: python3 polaris_feed.py [clubs.toml] [out_dir] [data_dir]
"""
import datetime as dt
import html
import json
import os
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
REFRESH_PAST = dt.timedelta(days=30)  # events that ended earlier are frozen: never re-fetched or re-checked
PUBLISH_PAST = dt.timedelta(days=730)  # feeds and site go back this far; data/ keeps the full history
CANCELLED = {"de": "Abgesagt", "fr": "Annulé", "it": "Annullato"}
MEMBERS_ONLY = "X-MEMBERS-ONLY:TRUE"  # marks a VEVENT built from the agenda list because the event itself needs a login
MEMBERS = {"de": "nur für Mitglieder", "fr": "réservé aux membres", "it": "solo per soci"}
IG_API = "https://graph.facebook.com/v27.0"  # Instagram API with Facebook Login (Business Discovery)
IG_POSTS = 8
IG_MAX_BYTES = 1_500_000  # a picture bigger than this is skipped
IG_FIELDS = "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,children{media_type,media_url,thumbnail_url}"
PLATFORM_HOSTS = {"polaris.rotary.ch", "team.polaris.rotary.ch"}  # Polaris' own notices in the districts' lists (one "event" runs until 2099)

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


def parse_list(page):
    """Agenda list page -> {event id: what the list shows}. The list is public even for members-only events; their own pages are not."""
    items = {}
    for block in page.split("<li>")[1:]:
        link = re.search(r'href="([^"]*/agenda/show/(\d+))"', block)
        if not link:
            continue

        def grab(pattern):
            m = re.search(pattern, block, re.S)
            return html_text(m.group(1)) if m else ""

        image = re.search(r"list-picture\"[^>]*url\(([^)]+)\)", block)
        items.setdefault(link.group(2), {
            "url": html.unescape(link.group(1)), "title": grab(r"<h2>(.*?)</h2>"), "when": grab(r"<small[^>]*>(.*?)</small>"),
            "teaser": grab(r'ct-media-description">(.*?)</p>'), "location": grab(r'fa-map-marker-alt"></i>(.*?)</span>'),
            "registration": grab(r'fa-calendar-alt"></i>(.*?)</span>'), "image": html.unescape(image.group(1)) if image else ""})
    return items


def listed_events(club, backfill=False):
    """{id: list item} of upcoming events plus this year's past ones; with backfill, every year Polaris offers."""
    url = f"{club['base_url']}/{club['lang']}/agenda?criteria%5BendsAt%5D="
    filters = ["latest", str(dt.date.today().year)]
    if backfill:
        filters += re.findall(r'<option value="(\d{4})"', get(url + "latest"))
    items = {}
    for f in dict.fromkeys(filters):
        # robots.txt disallows `limit=`, so page through instead.
        for n in range(1, MAX_PAGES + 1):
            page = get(f"{url}{f}&page={n}")
            found = parse_list(page)
            new = [i for i in dict.fromkeys(re.findall(r"/agenda/show/(\d+)", page)) if i not in items]
            if not new:
                break
            items.update({i: found.get(i) for i in new})
    return items


def ics_esc(text):
    return re.sub(r"([\\;,])", r"\\\1", text).replace("\n", "\\n")


def stub_vevent(event_id, item, members=True):
    """VEVENT built from what the public agenda list shows: a members-only event, or (members=False) a Rotary event. None if its date can't be read."""
    # ponytail: day-before-month dates only (de/fr/it, the languages in clubs.toml); an English list date is skipped as before
    low = item["when"].lower()
    days = [dt.datetime(int(y), MONTHS[m], int(d)) for d, m, y in re.findall(r"(\d{1,2})\.?\s+([a-zäéû]+)\s+(20\d\d)", low) if m in MONTHS]
    if not days:
        return None
    times = [dt.timedelta(hours=int(h), minutes=int(m)) for h, m in re.findall(r"\b(\d{1,2}):(\d{2})\b", low)]
    if times:
        start, end = days[0] + times[0], days[-1] + times[-1]
        if end <= start:  # no end time on the list
            end = start + DEFAULT_DURATION
        when = [f"DTSTART;TZID=Europe/Zurich:{start:%Y%m%dT%H%M%S}", f"DTEND;TZID=Europe/Zurich:{end:%Y%m%dT%H%M%S}"]
    else:
        when = [f"DTSTART;VALUE=DATE:{days[0]:%Y%m%d}", f"DTEND;VALUE=DATE:{days[-1] + dt.timedelta(days=1):%Y%m%d}"]

    text = [f"{name}:{ics_esc(item[key])}" for name, key in (("SUMMARY", "title"), ("DESCRIPTION", "teaser"), ("LOCATION", "location")) if item[key]]
    return [f"UID:polaris-{event_id}@rotary.ch", *text, f"URL:{item['url']}", *when, *([MEMBERS_ONLY] if members else [])]


def fetch_event(club, event_id, item=None):
    """Cleaned VEVENT lines; for a members-only event the stub from its list item; None if it is gone. Raises on transient errors."""
    time.sleep(0.5)  # be gentle with Polaris
    try:
        ics = get(f"{club['base_url']}/{club['lang']}/agenda/ical/{event_id}")
    except urllib.error.HTTPError as e:
        if e.code in (403, 404, 410):
            return None
        raise
    if "BEGIN:VEVENT" not in ics:  # login page: members-only if the agenda still lists it, otherwise deleted
        return stub_vevent(event_id, item) if item else None
    return clean_vevent(ics, event_id)


def europe_event(e):
    """One event of Rotaract Europe's events API -> (VEVENT lines, detail). Its site runs The Events Calendar, whose API this is."""
    if e["all_day"]:
        start, end = (dt.date.fromisoformat(e[k][:10]) for k in ("start_date", "end_date"))
        when = [f"DTSTART;VALUE=DATE:{start:%Y%m%d}", f"DTEND;VALUE=DATE:{end + dt.timedelta(days=1):%Y%m%d}"]
    else:
        start, end = (dt.datetime.fromisoformat(e[k]).replace(tzinfo=dt.UTC).astimezone(TZ) for k in ("utc_start_date", "utc_end_date"))
        if end <= start:
            end = start + DEFAULT_DURATION
        when = [f"DTSTART;TZID=Europe/Zurich:{start:%Y%m%dT%H%M%S}", f"DTEND;TZID=Europe/Zurich:{end:%Y%m%dT%H%M%S}"]
    venue = e.get("venue") if isinstance(e.get("venue"), dict) else {}
    fields = {"SUMMARY": html.unescape(e["title"]), "DESCRIPTION": html_text(e.get("description") or ""),
              "LOCATION": ", ".join(html.unescape(venue[k]) for k in ("venue", "city", "country") if venue.get(k))}
    image = e.get("image") if isinstance(e.get("image"), dict) else {}
    vevent = [f"UID:rotaract-europe-{e['id']}@rotaracteurope.eu", *(f"{k}:{ics_esc(v)}" for k, v in fields.items() if v), f"URL:{e['url']}", *when]
    return vevent, {"image": image.get("url", ""), "description": "", "registration": ""}


def manual_event(m):
    """An event entered by hand in clubs.toml ([[events]]: id, title, url, start, optional end/location/description/image) -> (VEVENT lines, detail)."""
    fields = {"SUMMARY": m["title"], "DESCRIPTION": m.get("description", ""), "LOCATION": m.get("location", "")}
    when = [f"DTSTART;VALUE=DATE:{m['start']:%Y%m%d}", f"DTEND;VALUE=DATE:{m.get('end', m['start']) + dt.timedelta(days=1):%Y%m%d}"]
    vevent = [f"UID:{m['id']}@rac-event-aggregation-tool", *(f"{k}:{ics_esc(v)}" for k, v in fields.items() if v), f"URL:{m['url']}", *when]
    return vevent, {"image": m.get("image", ""), "description": "", "registration": ""}


def international_events(manual, now):
    """{id: (VEVENT lines, detail)}: Rotaract Europe's calendar plus the hand-entered events."""
    since = (now - REFRESH_PAST - dt.timedelta(days=1)).date().isoformat()  # covers the refresh window, so nothing looks "gone"
    data = json.loads(get(f"https://rotaracteurope.eu/wp-json/tribe/events/v1/events?per_page=50&start_date={since}"))
    # ponytail: one page of 50 (there are about 5). Past that, fail and keep the last history instead of cancelling what fell off; page through then.
    if data.get("total_pages", 1) > 1:
        raise RuntimeError("Rotaract Europe lists more than 50 events: page through total_pages")
    events = {f"eu{e['id']}": europe_event(e) for e in data["events"]}
    return events | {m["id"]: manual_event(m) for m in manual}


def html_text(fragment):
    """Rough HTML -> text: paragraphs/line breaks become newlines, tags are dropped, entities decoded."""
    t = re.sub(r"</p>|</div>|</h\d>", "\n\n", re.sub(r"<br\s*/?>|</li>", "\n", fragment.replace("\r", "")))  # a bare CR would break an ICS line
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
    if num := re.search(r"\b(\d{1,2})\.(\d{1,2})\.(20\d\d)(?:\s+(\d{1,2}):(\d{2}))?", low):  # the agenda list writes 19.02.2027 13:00
        d, mo, y, h, mi = num.groups()
        try:
            return dt.datetime(int(y), int(mo), int(d), int(h or 23), int(mi or 59)).isoformat(timespec="minutes")
        except ValueError:
            return ""
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


def parse_news(page, base_url):
    """Title, date, picture and link of each article on a Polaris news list page. Only the link is kept, never the text."""
    items = []
    for m in re.finditer(r'<a class="r-transfer-link"\s+href="([^"]+)">(.*?)</a>', page, re.S):
        href, block = html.unescape(m.group(1)), m.group(2)
        title = re.search(r"<h2>(.*?)</h2>", block, re.S)
        if not title:
            continue
        img, small = re.search(r'<img src="([^"]+)"', block), re.search(r"<small>(.*?)</small>", block, re.S)
        items.append({"url": href if href.startswith("http") else base_url + href, "title": html_text(title.group(1)),
                      "date": deadline(html_text(small.group(1)))[:10] if small else "", "image": html.unescape(img.group(1)) if img else ""})
    return items[:6]


def fetch_news(club, page="news"):
    """The club's news list, or (page="projects") its projects list: the same markup, so the same parser."""
    time.sleep(0.5)
    return parse_news(get(f"{club['base_url']}/{club['lang']}/content/{page}"), club["base_url"])


def instagram_user(url):
    """Username from a profile link (https://www.instagram.com/racluzern/ -> racluzern), or '' if it doesn't look like one."""
    name = urllib.parse.urlsplit(url).path.strip("/").split("/")[-1]
    return name if re.fullmatch(r"[A-Za-z0-9._]+", name) else ""  # it goes into the request's field expression


def parse_instagram(data):
    """Business Discovery answer -> the latest posts that have a picture: id, url (permalink), image (Instagram's URL), caption, date."""
    posts = []
    for m in data.get("business_discovery", {}).get("media", {}).get("data", []):
        src = m
        if m.get("media_type") == "CAROUSEL_ALBUM":  # the album itself usually has a media_url too, but the first child is the documented one
            src = next(iter(m.get("children", {}).get("data", [])), m)
        # a video's media_url is the video file (and Meta omits it for some reels): its picture is thumbnail_url
        image = src.get("thumbnail_url") if src.get("media_type") == "VIDEO" else src.get("media_url")
        if image and m.get("permalink") and str(m.get("id", "")).isdigit():  # the id becomes a file name
            posts.append({"id": str(m["id"]), "url": m["permalink"], "image": image,
                          "caption": " ".join((m.get("caption") or "").split())[:140], "date": (m.get("timestamp") or "")[:10]})
    return posts[:IG_POSTS]


def ig_get(url):
    """JSON from the Graph API; an API error comes back as its {"error": ...} body. The URL carries the token, so nothing raised here contains it."""
    time.sleep(0.5)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": USER_AGENT}), timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return {"error": json.loads(e.read())["error"]}
        except Exception:
            return {"error": {"code": e.code, "type": "HTTP", "message": ""}}
    except (OSError, ValueError) as e:
        raise RuntimeError(type(e).__name__) from None  # str(e) could quote the URL


def ig_download(url, path):
    """Save one picture from Instagram's CDN. False if it is not https, too big, empty or unreachable."""
    if not url.startswith("https://"):
        return False
    time.sleep(0.4)
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": USER_AGENT}), timeout=30) as r:
            body = r.read(IG_MAX_BYTES + 1)
    except OSError:
        return False
    if not body or len(body) > IG_MAX_BYTES:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return True


def fetch_instagram(clubs, out, token, user_id, fetch=ig_get, download=ig_download):
    """{club id: latest Instagram posts} for the clubs with an `instagram` link, pictures saved under out/ig/<club>/.

    Off (no request at all) unless both the token and the owner's Instagram user id are set. One Business Discovery
    request per club; a club that can't be read (personal or private account, any error) is simply left out.
    Unverified against Meta's docs, so everything is read defensively: that this works without App Review for an app
    admin's token, and that caption / children / thumbnail_url all come back inside the discovery answer.
    """
    token, user_id = (token or "").strip(), (user_id or "").strip()
    if not (token and user_id):
        return {}
    if not user_id.isdigit():
        print("::warning::Instagram: INSTAGRAM_USER_ID must be the numeric Instagram user id; pictures are off")
        return {}
    # ponytail: Instagram's picture URLs expire, so every run downloads the pictures again into the output dir and nothing
    # is kept in data/. If the token or Meta fails, the strip falls back to photos / event pictures; cache in data/ if that hurts.
    result = {}
    for club in clubs:
        name = instagram_user(club.get("instagram", ""))
        if not name:
            continue
        try:
            fields = f"business_discovery.username({name}){{media.limit({IG_POSTS}){{{IG_FIELDS}}}}}"
            data = fetch(f"{IG_API}/{user_id}?" + urllib.parse.urlencode({"fields": fields, "access_token": token}))
            if err := data.get("error"):
                if err.get("code") == 190:  # OAuthException: expired or revoked. No point asking for the other clubs.
                    print("::warning::Instagram: the token is expired or invalid. Renew the INSTAGRAM_TOKEN secret; pictures are off until then.")
                    break
                msg = str(err.get("message", "")).replace(token, "***")[:200]
                print(f"{club['id']} instagram: Graph error {err.get('code')} ({err.get('type')}) {msg}")
                continue
            posts = []
            for p in parse_instagram(data):
                rel = f"ig/{club['id']}/{p['id']}.jpg"
                if download(p["image"], out / rel):
                    posts.append({"url": p["url"], "image": rel, "caption": p["caption"], "date": p["date"]})
            if posts:
                result[club["id"]] = posts
        except Exception as e:
            print(f"{club['id']} instagram: {str(e).replace(token, '***')[:200]}")  # pictures only, never worth failing the run
    return result


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
    frozen = now - REFRESH_PAST

    def live(rec):  # in the refresh window: the future and the last month
        return rec["status"] == "active" and prop(rec["vevent"], "DTEND") >= frozen

    # Live events we know but Polaris no longer lists: check each one directly.
    # Older events aren't re-checked or re-fetched: history is fixed a month after an event.
    missing = [i for i, rec in history.items() if i not in listed and live(rec)]
    known_past = {i for i, rec in history.items() if prop(rec["vevent"], "DTEND") < frozen}
    fresh, errors = {}, []
    for i in dict.fromkeys([*listed, *missing]):
        if i in known_past:
            continue
        try:
            fresh[i] = fetch(i)
        except Exception as e:
            errors.append(f"{i}: {e}")

    gone = [i for i, ev in fresh.items() if ev is None and i in history and history[i]["status"] == "active"]
    # Counted twice: among all live events, and among the upcoming ones alone. A source that keeps its past events
    # (the Rotary lists) can only ever lose upcoming ones, and a month of past events must not dilute that.
    for what, pool in (("live", [i for i, r in history.items() if live(r)]),
                       ("upcoming", [i for i, r in history.items() if live(r) and prop(r["vevent"], "DTEND") >= now])):
        lost = sum(i in gone for i in pool)
        if len(pool) >= 4 and lost > MAX_CANCEL_RATIO * len(pool):
            raise RuntimeError(f"{lost} of {len(pool)} {what} events would be cancelled at once; refusing, check Polaris")

    for i, ev in fresh.items():
        rec = history.get(i)
        if ev is None:
            if rec and rec["status"] == "active":
                rec.update(status="cancelled", sequence=rec["sequence"] + 1, modified=stamp)
            continue  # unreadable and never stored: nothing to do
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
        if MEMBERS_ONLY in ev:
            label = MEMBERS.get(club["lang"], "members only")
            ev = [f"{l} ({label})" if l.startswith("SUMMARY:") else l for l in ev]
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
    """Feed/site rule: the last 24 months and the future; cancelled events only until their date is over."""
    end = prop(rec["vevent"], "DTEND")
    return end >= now - PUBLISH_PAST and (rec["status"] == "active" or end >= now)


def merged_history(clubs, histories):
    """The history behind all.ics: every club's events by id. The Rotary layer stays out, so Rotaract events are never drowned."""
    return {i: rec for club in clubs if club.get("source") != "rotary" for i, rec in histories[club["id"]].items()}


def site_data(clubs, histories, now, cache, news=None, projects=None, instagram=None):
    """events.json for the search site: every visible event, merged across clubs by Polaris id.

    The Rotary layer (district pseudo-clubs and their events) sits under its own "rotary" key, so "clubs" and "events"
    never contain it and only code that asks for the layer sees it."""
    events = {}
    for club in sorted(clubs, key=lambda c: c.get("source") == "rotary"):  # Rotary districts last: a joint event stays the Rotaract club's
        rotary = club.get("source") == "rotary"
        for i, rec in histories[club["id"]].items():
            if not visible(rec, now):
                continue
            if i in events:  # joint event listed by several clubs
                if not rotary:
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
                "members": MEMBERS_ONLY in ev,
                "layer": "rotary" if rotary else "",  # these go under the "rotary" key below; the site adds them when switched on in Settings
                "organiser": detail.get("organiser", ""),
            }
    by_start = sorted(events.values(), key=lambda e: e["start"])
    entries = [{"id": c["id"], "name": c["name"], "short": c.get("short", c["name"]), "url": c["base_url"],
                   "color": c.get("color", "#d41367"), "logo": c.get("logo", ""), "district": c.get("district", ""),
                   "coords": locate("", c.get("city", ""), cache), "photos": c.get("photos", []), "news": (news or {}).get(c["id"], []),
                   "projects": (projects or {}).get(c["id"], []),
                   "instagram": (instagram or {}).get(c["id"], []),  # latest posts, see fetch_instagram(); [] while that layer is off
                   "links": {k: c[k] for k in ("instagram", "linkedin") if c.get(k)},
                   "source": c.get("source", ""), "about": c.get("about", ""), "how": c.get("how", ""), "partners": c.get("partners", [])} for c in clubs]
    return {
        "generated": now.isoformat(timespec="minutes"),
        "clubs": [c for c in entries if c["source"] != "rotary"],
        "events": [e for e in by_start if e["layer"] != "rotary"],
        "rotary": {"clubs": [c for c in entries if c["source"] == "rotary"], "events": [e for e in by_start if e["layer"] == "rotary"]},
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
    status = {"generated": stamp, "events": len(site["events"]), "rotary_events": len(site["rotary"]["events"]), "with_image": sum(bool(e["image"]) for e in site["events"]),
              "without_location": sum(e["coords"] is None for e in site["events"]), "clubs": clubs, "failures": failures}
    (out / "status.json").write_text(json.dumps(status, indent=1, ensure_ascii=False) + "\n")


def sync_international(history, manual, now, stamp):
    fresh = international_events(manual, now)
    errors = sync(history, fresh, lambda i: fresh[i][0] if i in fresh else None, now, stamp)
    for i, (_, detail) in fresh.items():
        if i in history:
            history[i]["detail"] = detail
    return errors


def skip_hosts(clubs):
    """Hosts whose events the Rotary layer leaves out: Polaris' own notices and the Rotaract clubs, which have their own entries."""
    return PLATFORM_HOSTS | {urllib.parse.urlsplit(c["base_url"]).hostname for c in clubs if c.get("source") != "rotary"}


def rotary_items(items, skip):
    return {i: item for i, item in items.items() if urllib.parse.urlsplit(item["url"]).hostname not in skip}


def site_name(page):
    """Name of a Polaris site from its page title ("Einstiegsseite | Rotary Baden"), or ''."""
    title = re.search(r"<title>(.*?)</title>", page, re.S)
    return html_text(title.group(1)).split("|")[-1].strip() if title else ""


def organiser(host, names):
    """Name of the Rotary club behind a Polaris host. One request per new host, cached in `names`; the host itself if its page can't be read."""
    if host not in names:
        time.sleep(0.5)
        try:
            names[host] = site_name(get(f"https://{host}/de/", attempts=1)) or host
        except Exception:
            return host  # not cached: asked again next run
    return names[host]


def sync_rotary(club, history, now, stamp, skip, names):
    """A Rotary district: its own agenda plus the events its clubs share with other clubs, each built from its list item only."""
    # ponytail: list pages only (a handful of requests per district instead of one per event), so the description is the
    # list's teaser and an event without an end time on the list gets the default duration; fetch the event pages if that falls short
    items = {}
    for path in ("agenda", "agenda/other-clubs"):
        for n in range(1, MAX_PAGES + 1):
            time.sleep(0.5)
            found = parse_list(get(f"{club['base_url']}/{club['lang']}/{path}?criteria%5BendsAt%5D=latest&page={n}"))
            if not found.keys() - items.keys():  # past the last page Polaris repeats it
                break
            items = found | items
    items = rotary_items(items, skip)

    def fetch(i):
        if i in items:
            return stub_vevent(i, items[i], members=False)
        rec = history.get(i)  # the lists only show what is still ahead: an event that is over is kept, an upcoming one that left is cancelled
        # The start, not the end: an end the list doesn't show is our guess, and Polaris may drop the event as soon as it starts.
        return rec["vevent"] if rec and prop(rec["vevent"], "DTSTART") < now else None

    errors = sync(history, items, fetch, now, stamp)
    hosts = {i: urllib.parse.urlsplit(item["url"]).hostname for i, item in items.items()}
    org = {host: organiser(host, names) for host in sorted(set(hosts.values()))}  # once per host and run, also when its page can't be read
    for i, item in items.items():
        if i in history:
            history[i]["detail"] = {"image": item["image"], "description": "", "registration": item["registration"], "organiser": org[hosts[i]]}
    return errors


def sync_polaris(club, history, now, stamp):
    listed = listed_events(club, backfill=not history and club.get("backfill", False))

    def fetch(i):
        ev, rec = fetch_event(club, i, listed.get(i)), history.get(i)
        # ponytail: a members-only event that left the listings looks the same as a deleted one;
        # keep it once it has started (its end may be our default duration), cancel it while it is still upcoming
        if ev is None and rec and MEMBERS_ONLY in rec["vevent"] and prop(rec["vevent"], "DTSTART") < now:
            return rec["vevent"]
        return ev

    errors = sync(history, listed, fetch, now, stamp)
    # Event page (image, full text, registration): fetched once per event, again when the event changed.
    for i, rec in history.items():
        if rec["status"] == "active" and ("detail" not in rec or rec["modified"] == stamp):
            if MEMBERS_ONLY in rec["vevent"]:  # its page is the login form: the list item is all there is
                if listed.get(i):
                    rec["detail"] = {"image": listed[i]["image"], "description": "", "registration": listed[i]["registration"]}
                continue
            try:
                rec["detail"] = fetch_detail(club, i)
            except Exception as e:
                errors.append(f"{i} detail: {e}")  # left out; retried next run
    return errors


def main():
    args = sys.argv[1:] + [None] * 3
    config, out, data = Path(args[0] or "clubs.toml"), Path(args[1] or "public"), Path(args[2] or "data")
    out.mkdir(exist_ok=True)
    data.mkdir(exist_ok=True)
    now = dt.datetime.now(TZ).replace(tzinfo=None)
    stamp = dt.datetime.now(dt.UTC).strftime("%Y%m%dT%H%M%SZ")
    conf = tomllib.loads(config.read_text())
    clubs = conf["clubs"]
    failures, histories = [], {}
    news_path = data / "news.json"
    news = json.loads(news_path.read_text()) if news_path.exists() else {}
    projects_path = data / "projects.json"
    projects = json.loads(projects_path.read_text()) if projects_path.exists() else {}
    names_path = data / "rotary_clubs.json"  # Polaris host -> name of the Rotary club, for the organiser label
    names = json.loads(names_path.read_text()) if names_path.exists() else {}
    for club in clubs:
        path = data / f"{club['id']}.json"
        history = json.loads(path.read_text()) if path.exists() else {}
        try:
            # "international" is not a Polaris site: Rotaract Europe's API plus the hand-entered events
            if club.get("source") == "international":
                errors = sync_international(history, conf.get("events", []), now, stamp)
            elif club.get("source") == "rotary":
                errors = sync_rotary(club, history, now, stamp, skip_hosts(clubs), names)
            else:
                errors = sync_polaris(club, history, now, stamp)
            path.write_text(json.dumps(history, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
            failures += [f"{club['id']} {e}" for e in errors]
        except Exception as e:
            # Keep the last good history; the feed below is built from it.
            failures.append(f"{club['id']}: {e}")
            history = json.loads(path.read_text()) if path.exists() else {}
        histories[club["id"]] = history
        for page, lists in (("news", news), ("projects", projects)):
            try:
                if not club.get("source"):
                    lists[club["id"]] = fetch_news(club, page)
            except Exception as e:
                print(f"{club['id']} {page}: {e} (keeping the last list)")  # teasers only, not worth failing the run
        (out / f"{club['id']}.ics").write_text(build_calendar(club, history, now), newline="")
        cancelled = sum(r["status"] == "cancelled" for r in history.values())
        print(f"{club['id']}: {len(history)} events in history ({cancelled} cancelled)")

    # Swiss-wide: one combined feed + the search site. Polaris ids are global, so merging dedupes joint events.
    merged = merged_history(clubs, histories)
    everyone = {"name": "Rotaract Schweiz & Liechtenstein – alle Clubs", "lang": "de"}
    (out / "all.ics").write_text(build_calendar(everyone, merged, now), newline="")
    cache_path = data / "geocode.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    news_path.write_text(json.dumps(news, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    projects_path.write_text(json.dumps(projects, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    names_path.write_text(json.dumps(names, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    instagram = fetch_instagram(clubs, out, os.environ.get("INSTAGRAM_TOKEN"), os.environ.get("INSTAGRAM_USER_ID"))
    site = site_data(clubs, histories, now, cache, news, projects, instagram)
    cache_path.write_text(json.dumps(cache, indent=1, ensure_ascii=False, sort_keys=True) + "\n")
    (out / "events.json").write_text(json.dumps(site, ensure_ascii=False, separators=(",", ":")))
    shutil.copytree(Path(__file__).with_name("site"), out, dirs_exist_ok=True)
    by_id = {c["id"]: c for c in clubs}
    (out / "e").mkdir(exist_ok=True)
    for e in site["events"] + site["rotary"]["events"]:
        (out / "e" / f"{e['id']}.html").write_text(share_page(e, " & ".join(by_id[c]["name"] if c in by_id else c for c in e["clubs"])))
    write_status(out, site, histories, failures, stamp)
    print(f"site: {len(site['events'])} events (+ {len(site['rotary']['events'])} Rotary), {sum(e['coords'] is None for e in site['events'])} without location")

    for f in failures:
        print(f"::error::{f}")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
