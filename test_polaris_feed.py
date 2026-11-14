"""Run: python3 test_polaris_feed.py"""
import copy
import datetime as dt
import json
from pathlib import Path

import polaris_feed
from polaris_feed import (MEMBERS_ONLY, build_calendar, clean_vevent, deadline, europe_event, html_text, ics_text, manual_event, locate, merged_history, parse_detail, parse_list,
                          parse_news, rotary_items, share_page, site_data, site_name, skip_hosts, stub_vevent, sync, unfold)

# Shape of a real Polaris per-event .ics: folded lines, random UID, DTSTAMP,
# duplicate DTSTART, DTEND == DTSTART.
SAMPLE = (
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n"
    "UID:abc\r\nDTSTAMP:20261107T084239Z\r\nSUMMARY:Stamm am Weihnachtsmarkt\r\n"
    "DESCRIPTION:Wir treffen uns am Weihnachtsmarkt und freuen uns auf euch. Bri\r\n"
    " ngt gerne Freunde mit!\r\n"
    "DTSTART;TZID=Europe/Zurich:20261210T190000\r\n"
    "DTEND;TZID=Europe/Zurich:20261210T190000\r\n"
    "DTSTART:20261210T190000\r\n"
    "END:VEVENT\r\nEND:VCALENDAR\r\n"
)

# --- cleaning a Polaris event
ev = clean_vevent(SAMPLE, "217808")
assert ev[0] == "UID:polaris-217808@rotary.ch", ev
assert not any(l.startswith("DTSTAMP") for l in ev), ev
assert [l for l in ev if l.startswith("DTSTART")] == ["DTSTART;TZID=Europe/Zurich:20261210T190000"], ev
assert [l for l in ev if l.startswith("DTEND")] == ["DTEND;TZID=Europe/Zurich:20261210T210000"], ev
assert "DESCRIPTION:Wir treffen uns am Weihnachtsmarkt und freuen uns auf euch. Bringt gerne Freunde mit!" in ev

# A real end time is kept as is.
ev2 = clean_vevent(SAMPLE.replace("DTEND;TZID=Europe/Zurich:20261210T190000", "DTEND;TZID=Europe/Zurich:20261210T230000"), "217808")
assert "DTEND;TZID=Europe/Zurich:20261210T230000" in ev2

# All-day events (date only) get a one-day end.
allday = clean_vevent(SAMPLE.replace("TZID=Europe/Zurich:20261210T190000", "VALUE=DATE:20261210"), "1")
assert "DTEND;VALUE=DATE:20261211" in allday, allday


# --- syncing into the history
def event(eid, start, summary="Event"):
    return [f"UID:polaris-{eid}@rotary.ch", f"SUMMARY:{summary}",
            f"DTSTART;TZID=Europe/Zurich:{start}", f"DTEND;TZID=Europe/Zurich:{start[:9]}235900"]


NOW = dt.datetime(2026, 11, 7, 12, 0)
polaris = {  # what Polaris returns per id; None = gone / login page
    "past": event("past", "20260101T190000"),
    "a": event("a", "20261127T180000"),
    "b": event("b", "20261210T190000"),
    "c": event("c", "20261215T190000"),
    "d": event("d", "20261220T190000"),
    "private": None,
}
h = {}
assert sync(h, list(polaris), polaris.get, NOW, "T1") == []
assert set(h) == {"past", "a", "b", "c", "d"}, "members-only events are never stored"
assert all(r["sequence"] == 0 and r["status"] == "active" for r in h.values())

# Unchanged run: nothing changes.
before = copy.deepcopy(h)
sync(h, list(polaris), polaris.get, NOW, "T2")
assert h == before

# Moved event: updated, sequence bumped.
polaris["a"] = event("a", "20261128T180000")
sync(h, list(polaris), polaris.get, NOW, "T3")
assert h["a"]["vevent"] == polaris["a"] and h["a"]["sequence"] == 1 and h["a"]["modified"] == "T3"

# Past event drops off the listing: kept, not re-checked.
calls = []
def tracking(i):
    calls.append(i)
    return polaris[i]
sync(h, ["a", "b", "c", "d"], tracking, NOW, "T4")
assert "past" not in calls and h["past"]["status"] == "active"

# Past event still listed (current-year listing): not re-fetched either.
calls.clear()
sync(h, ["past", "a", "b", "c", "d"], tracking, NOW, "T4b")
assert "past" not in calls and calls == ["a", "b", "c", "d"]

# Ended within the last month: still refreshed, even when no longer listed. Older: frozen.
polaris["recent"] = event("recent", "20261030T190000")
sync(h, ["recent", "a", "b", "c", "d"], polaris.get, NOW, "T4c")
calls.clear()
sync(h, ["a", "b", "c", "d"], tracking, NOW, "T4d")
assert "recent" in calls and "past" not in calls, calls

# Upcoming event drops off the listing but still exists (listing glitch): kept active.
sync(h, ["a", "c", "d"], polaris.get, NOW, "T5")
assert h["b"]["status"] == "active" and h["b"]["sequence"] == 0

# Polaris unreachable for one event: left untouched, error reported.
def flaky(i):
    if i == "b":
        raise OSError("timeout")
    return polaris[i]
errors = sync(h, ["a", "c", "d"], flaky, NOW, "T6")
assert errors and h["b"]["status"] == "active"

# Upcoming event really gone: cancelled.
polaris["b"] = None
sync(h, ["a", "c", "d"], polaris.get, NOW, "T7")
assert h["b"]["status"] == "cancelled" and h["b"]["sequence"] == 1

# Comes back: active again.
polaris["b"] = event("b", "20261210T190000")
sync(h, ["a", "b", "c", "d"], polaris.get, NOW, "T8")
assert h["b"]["status"] == "active" and h["b"]["sequence"] == 2

# Mass disappearance (Polaris broken): refused, history untouched.
before = copy.deepcopy(h)
try:
    sync(h, [], lambda i: None, NOW, "T9")
    raise AssertionError("mass cancellation must be refused")
except RuntimeError:
    pass
assert h == before

# The brake also counts the upcoming events alone: a source that keeps its past events (the Rotary lists) can only lose
# upcoming ones, so a month of past events must not dilute an empty list into "under half".
rh = {f"p{n}": {"status": "active", "vevent": event(f"p{n}", "20261101T190000"), "sequence": 0, "modified": "T"} for n in range(10)}
rh |= {f"u{n}": {"status": "active", "vevent": event(f"u{n}", "20261201T190000"), "sequence": 0, "modified": "T"} for n in range(8)}
before = copy.deepcopy(rh)
try:
    sync(rh, [], lambda i: rh[i]["vevent"] if i.startswith("p") else None, NOW, "T9b")
    raise AssertionError("8 of 8 upcoming events gone must be refused, whatever the past holds")
except RuntimeError as e:
    assert "8 of 8 upcoming" in str(e), e
assert rh == before

# --- building the feed
polaris["c"] = None
sync(h, ["a", "b", "d"], polaris.get, NOW, "T10")
h["old-cancelled"] = {**h["past"], "status": "cancelled"}
h["ancient"] = {**h["past"], "vevent": event("ancient", "20240101T190000")}
cal = build_calendar({"name": "Test", "lang": "de"}, h, NOW)
events = unfold(cal)
assert "SUMMARY:Abgesagt: Event" in events and events.count("STATUS:CANCELLED") == 1, "only the upcoming cancelled one"
assert cal.count("BEGIN:VEVENT") == 6, "past + recent + a + b + d + cancelled c"
assert "polaris-ancient@" not in cal, "older than 24 months: kept in data, not published"
assert cal.index("polaris-past@") < cal.index("polaris-a@") < cal.index("polaris-d@"), "sorted by start"
assert "SEQUENCE:1" in events and "DTSTAMP:T3" in events

# --- event page details
PAGE = ('<meta property="og:image" content="https://x.ch/media/cache/a.png?v=1"/>'
        '<div class="col ct-block-type-primary-code"><p>Erster Absatz &amp; mehr.</p><p>Zweiter<br/>Zeile</p></div>'
        '<div class="event-participant-container"><h2>Anmeldung</h2><small> Anmeldung bis: Freitag <br/><br/> Max: 20 </small><div id="x">')
d = parse_detail(PAGE)
assert d["image"] == "https://x.ch/media/cache/a.png?v=1", d
assert d["description"] == "Erster Absatz & mehr.\n\nZweiter\nZeile", repr(d["description"])
assert d["registration"] == "Anmeldung bis: Freitag\n\nMax: 20", repr(d["registration"])
assert html_text("a\r\nb<br>c\r") == "a\nb\nc", "no carriage return survives: a bare CR breaks an ICS line"
assert "\r" not in build_calendar({"name": "T", "lang": "de"}, {"x": {"status": "active", "sequence": 0, "modified": "T",
    "vevent": stub_vevent("9", {"url": "u", "title": "T", "teaser": html_text("Earlybird\r\nJeden Donnerstag"), "location": "", "when": "19. November 2026 19:00"})}}, NOW).replace("\r\n", "")
assert parse_detail("<html></html>") == {"image": "", "description": "", "registration": ""}
assert deadline("Anmeldung bis: Freitag, 13. November 2026 um 23:55\n\nMax 20") == "2026-11-13T23:55"
assert deadline("Date limite d'inscription: lundi 9 novembre 2026 à 19:00") == "2026-11-09T19:00"
assert deadline("Chiusura delle iscrizioni: mercoledì 14 aprile 2027 alle ore 23:55") == "2027-04-14T23:55"
assert deadline("Registration until: Friday, December 11, 2026 at 9:00\u202fAM") == "2026-12-11T09:00"
assert deadline("Registration until: Friday, December 11, 2026 at 1:30 PM") == "2026-12-11T13:30"
assert deadline("Die Anmeldefrist ist abgelaufen") == ""

# --- site data
assert ics_text(["LOCATION:Inseliquai\\, 6005 Luzern", "DESCRIPTION:a\\nb\\; c"], "LOCATION") == "Inseliquai, 6005 Luzern"
assert ics_text(["DESCRIPTION:a\\nb\\; c"], "DESCRIPTION") == "a\nb; c"
assert ics_text([], "LOCATION") == ""

# Location fallback: full text, then comma parts from the end, then club city. Pre-filled cache = no network.
cache = {"Rudolfs Weihnachtsmarkt, Inseliquai, 6005 Luzern": None, "6005 Luzern": [47.05, 8.31], "Nowhere": None, "Luzern": [47.0, 8.0]}
assert locate("Rudolfs Weihnachtsmarkt, Inseliquai, 6005 Luzern", "Bern", cache) == [47.05, 8.31]
assert locate("Nowhere", "Luzern", cache) == [47.0, 8.0]
assert locate("", "Luzern", cache) == [47.0, 8.0]

joint = {"status": "active", "vevent": event("j", "20261201T190000", "Joint"), "sequence": 0, "modified": "T",
         "detail": {"image": "https://x.ch/a.png", "description": "Full text", "registration": "until Friday"}}
histories = {"luzern": {**h, "j": joint}, "bern": {"j": joint}}
clubs = [{"id": "luzern", "name": "L", "base_url": "u", "city": "Luzern"}, {"id": "bern", "name": "B", "base_url": "u", "city": "Luzern"}]
site = site_data(clubs, histories, NOW, cache)
ids = [e["id"] for e in site["events"]]
j = next(e for e in site["events"] if e["id"] == "j")
assert ids.count("j") == 1 and j["clubs"] == ["luzern", "bern"]
assert j["image"] == "https://x.ch/a.png" and j["description"] == "Full text" and j["registration"] == "until Friday"
assert next(e for e in site["events"] if e["id"] == "a")["image"] == "", "no detail yet -> empty, not missing"
assert site["clubs"][0]["color"] == "#d41367" and site["clubs"][0]["short"] == "L" and site["clubs"][0]["district"] == "", "defaults"
assert site["clubs"][0]["coords"] == [47.0, 8.0], "club city geocoded for the onboarding guess"
assert "old-cancelled" not in ids and "ancient" not in ids and "c" in ids, "same visibility rule as the feed"
assert next(e for e in site["events"] if e["id"] == "c")["cancelled"] is True
assert ids == sorted(ids, key=lambda i: next(e["start"] for e in site["events"] if e["id"] == i)), "sorted by start"
# the browser tests run on web/e2e/fixture/events.json: it must have the fields site_data() writes, or they would test a shape
# the app never gets (web/src/lib/types.ts describes the same fields for the app)
fixture = json.loads(Path(__file__).with_name("web").joinpath("e2e", "fixture", "events.json").read_text())
assert set(fixture) == set(site), "events.json: top-level keys"
for kind in ("events", "clubs"):
    for row in fixture[kind] + fixture["rotary"][kind]:
        assert set(row) | {"about"} == set(site[kind][0]) | {"about"}, f"fixture {kind} {row['id']}: {sorted(set(row) ^ set(site[kind][0]))}"

# --- share pages: HTML-safe, in the lead club's language, absolute picture/URL, redirect into the app
pg = share_page({"id": "1", "title": 'Stamm "<Test>"', "start": "2026-12-10T19:00", "allday": False, "location": "Luzern",
                 "description": "A & B\n\nC", "image": "https://x.ch/a.png?v=1"}, "Rotaract Luzern")
assert 'content="Stamm &quot;&lt;Test&gt;&quot; · 10.12.2026 19:00"' in pg and "<Test>" not in pg.split("<title>")[1].split("</title>")[0]
assert 'og:image" content="https://x.ch/a.png?v=1"' in pg and "Rotaract Luzern · Luzern. A &amp; B C" in pg and '<html lang="de">' in pg
assert 'url=../#/event/1"' in pg and 'location.replace("../#/event/1")' in pg and '<a href="../#/event/1">' in pg
for tag in ('og:url" content="https://neyxo.github.io/rotaract-events/e/1.html"', 'og:site_name" content="Rotaract Events"', 'twitter:card"',
            'name="description"', 'rel="canonical" href="https://neyxo.github.io/rotaract-events/e/1.html"', 'og:type"'):
    assert tag in pg, tag
en = share_page({"id": "2", "title": "Xmas", "start": "2026-12-12T09:00", "allday": False, "location": "", "description": "", "image": "", "members": True}, "RAC ZI", "en")
assert '<html lang="en">' in en and "Xmas · Saturday, December 12, 2026, 09:00" in en and 'content="RAC ZI · members only."' in en, en
assert 'og:image" content="https://neyxo.github.io/rotaract-events/screenshot-wide.png"' in en, "no picture: the site's"
fr = share_page({"id": "3", "title": "Gala", "start": "2027-02-20T00:00", "allday": True, "location": "", "description": "", "image": "", "members": True}, "RAC GE", "fr")
assert "Gala · 20.02.2027<" in fr and "RAC GE · réservé aux membres." in fr
evs = [{"id": "p", "clubs": ["luzern"], "start": "2026-10-01T19:00", "end": "2026-10-01T21:00", "cancelled": False, "image": "https://x/old.jpg"},
       {"id": "q", "clubs": ["luzern"], "start": "2026-10-20T19:00", "end": "2026-10-20T21:00", "cancelled": False, "image": "https://x/new.jpg"},
       {"id": "u", "clubs": ["bern", "luzern"], "start": "2026-12-01T19:00", "end": "2026-12-01T21:00", "cancelled": False, "image": "https://x/up.jpg"},
       {"id": "v", "clubs": ["luzern"], "start": "2026-12-02T19:00", "end": "2026-12-02T21:00", "cancelled": True, "image": ""}]
cp = polaris_feed.club_share_page({"id": "luzern", "name": "Rotaract <Luzern>", "lang": "de", "city": "Luzern"}, evs, NOW)
assert "<title>Rotaract &lt;Luzern&gt;</title>" in cp and 'content="Anlässe, News und wie man mitmacht · Luzern · 1 kommender Anlass"' in cp, cp
assert 'og:image" content="https://x/new.jpg"' in cp and 'location.replace("../#/club/luzern")' in cp and "c/luzern.html" in cp, "newest past picture"
cp = polaris_feed.club_share_page({"id": "luzern", "name": "L", "lang": "it", "about": "Ciao.", "photos": ["https://x/p.jpg"]}, evs, NOW)
assert 'content="Ciao. · 1 evento in programma"' in cp and 'og:image" content="https://x/p.jpg"' in cp and '<html lang="it">' in cp
cp = polaris_feed.club_share_page({"id": "zi", "name": "ZI", "lang": "en", "city": "Zürich"}, evs, NOW)
assert 'content="Events, news and how to join · Zürich · 0 upcoming events"' in cp and "screenshot-wide.png" in cp

long = {"x": {"status": "active", "vevent": event("x", "20261210T190000", "ä" * 100), "sequence": 0, "modified": "T"}}
cal = build_calendar({"name": "Test", "lang": "de"}, long, NOW)
assert all(len(l.encode()) <= 75 for l in cal.split("\r\n")), "line longer than 75 octets"
assert unfold(cal).count("SUMMARY:" + "ä" * 100) == 1, "folding must round-trip"
assert cal.endswith("END:VCALENDAR\r\n")

# club news list page (shape of a real Polaris page): link, title, date, picture; relative links get the club's base
page = ('<ul class="overview"> <li> <a class="r-transfer-link" href="https://rotaract-luzern.ch/de/content/news/show/29657"> '
        '<img src="https://x/a.jpg?v=1" alt="" title=""> <h2>Austausch &amp; Reise</h2> <small>Samstag, 1. August 2026</small> '
        '<p class="ct-media-description"> Text </p> </a> </li><li><a class="r-transfer-link" href="/de/content/news/show/1"><h2>Programm</h2>'
        '<small>Donnerstag, 29. August 2024</small></a></li><li><a class="r-transfer-link" href="/x">no title</a></li></ul>')
news = parse_news(page, "https://rotaract-luzern.ch")
assert news[0] == {"url": "https://rotaract-luzern.ch/de/content/news/show/29657", "title": "Austausch & Reise", "date": "2026-08-01", "image": "https://x/a.jpg?v=1"}
assert news[1] == {"url": "https://rotaract-luzern.ch/de/content/news/show/1", "title": "Programm", "date": "2024-08-29", "image": ""}
assert len(news) == 2, "items without a title are skipped"
assert site_data(clubs, histories, NOW, cache, {clubs[0]["id"]: news})["clubs"][0]["news"] == news
assert site_data(clubs, histories, NOW, cache)["clubs"][0]["projects"] == [], "no projects by default"

# club projects list page: the same markup as the news list; a project may have no date or picture
page = ('<ul class="overview"><li><a class="r-transfer-link" href="https://rotaract-ticino.ch/it/content/projects/show/2316"> '
        '<img src="https://x/p.jpg?v=1" alt=""> <h2>Progetto Giovani artisti</h2> <small>mercoledì 1 dicembre 2021</small> </a></li>'
        '<li><a class="r-transfer-link" href="/it/content/projects/show/7"><h2>Senza data</h2></a></li></ul>')
projects = parse_news(page, "https://rotaract-ticino.ch")
assert projects == [{"url": "https://rotaract-ticino.ch/it/content/projects/show/2316", "title": "Progetto Giovani artisti", "date": "2021-12-01", "image": "https://x/p.jpg?v=1"},
                    {"url": "https://rotaract-ticino.ch/it/content/projects/show/7", "title": "Senza data", "date": "", "image": ""}]
assert site_data(clubs, histories, NOW, cache, None, {clubs[0]["id"]: projects})["clubs"][0]["projects"] == projects

# --- members-only events: built from the public agenda list (shape of a real Polaris list item)
LIST = ('<ul class="overview"> <li> <a class="r-transfer-link" href="https://rotaract-luzern.ch/de/agenda/show/218599"> '
        '<div class="list-picture" style="background-image: url(https://x/grid/a.png); background-size: contain;"></div> <h2>\n Skitag, Melchsee-Frutt\n </h2> '
        '<small class="mt-1"> <a href="https://rotaract-luzern.ch/de/agenda/ical/218599" target="_blank">\n   Samstag, 20. Februar 2027 08:00-17:00\n '
        '<i class="far fa-calendar-plus"></i> </a> </small> <p class="ct-media-description">\n  Lust auf Schnee &amp; Sonne? ...\n </p> </a> '
        '<span class="button grey"><i\n class="fa fa-calendar-alt"></i> Anmeldung bis: 19.02.2027 13:00</span> '
        '<span class="button grey"><i class="fa fa-map-marker-alt"></i> Talstation Stöckalp; Melchsee-Frutt</span> </li>'
        '<li><a href="/de/somewhere">not an event</a></li></ul>')
items = parse_list(LIST)
assert list(items) == ["218599"], items
item = items["218599"]
assert item["image"] == "https://x/grid/a.png" and item["teaser"] == "Lust auf Schnee & Sonne? ...", item
stub = stub_vevent("218599", item)
assert stub[0] == "UID:polaris-218599@rotary.ch" and MEMBERS_ONLY in stub and "SUMMARY:Skitag\\, Melchsee-Frutt" in stub, stub
assert "DTSTART;TZID=Europe/Zurich:20270220T080000" in stub and "DTEND;TZID=Europe/Zurich:20270220T170000" in stub, stub
assert ics_text(stub, "LOCATION") == "Talstation Stöckalp; Melchsee-Frutt" and ics_text(stub, "URL").endswith("/agenda/show/218599")
assert deadline(item["registration"]) == "2027-02-19T13:00"
assert "DTEND;TZID=Europe/Zurich:20261119T210000" in stub_vevent("1", {**item, "when": "Donnerstag, 19. November 2026 19:00"}), "no end time: default duration"
allday = stub_vevent("1", {**item, "when": "samedi 20 février 2027"})
assert "DTSTART;VALUE=DATE:20270220" in allday and "DTEND;VALUE=DATE:20270221" in allday, allday
assert stub_vevent("1", {**item, "when": ""}) is None, "unreadable date: skipped, as before"
# list dates as Polaris writes them (real strings from the de/fr/it/en agenda lists), English month-before-day included
for when, start, end in [
        ("Saturday, December 12, 2026 09:00 - Friday, December 18, 2026 18:00", "20261212T090000", "20261218T180000"),  # zurich-international
        ("Sunday, November 22, 2026 11:00-13:00", "20261122T110000", "20261122T130000"),
        ("Monday, June 29, 2026 19:00", "20260629T190000", "20260629T210000"),
        ("Friday, December 11, 2026 7:30\u202fPM", "20261211T193000", "20261211T213000"),  # 12h, in case a site writes it
        ("Friday, December 11, 2026 7:30pm - 11:00pm", "20261211T193000", "20261211T230000"),
        ("Friday, December 11, 2026 12:00 Amsterdam", "20261211T120000", "20261211T140000"),  # "am" of a word is no am
        ("Mittwoch, 29. April 2026 18:00 - Sonntag, 3. Mai 2026 10:00", "20260429T180000", "20260503T100000"),
        ("venerdì 27 marzo 2026 10:00 - domenica 29 marzo 2026 19:00", "20260327T100000", "20260329T190000"),
        ("mercredi 16 décembre 2026 18:00-20:00", "20261216T180000", "20261216T200000")]:
    s = stub_vevent("1", {**item, "when": when})
    assert s and f"DTSTART;TZID=Europe/Zurich:{start}" in s and f"DTEND;TZID=Europe/Zurich:{end}" in s, (when, s)
assert "DTEND;VALUE=DATE:20261213" in stub_vevent("1", {**item, "when": "Saturday, December 12, 2026"}), "English all-day"
# a list whose markup changed (event links, but neither title nor date readable) raises instead of reading blanks
try:
    parse_list(LIST.replace("<h2>", "<h3>").replace("<small", "<div"))
    raise AssertionError("a changed list layout must raise")
except RuntimeError as e:
    assert "layout seems to have changed" in str(e), e
assert parse_list("<html><ul></ul><p>Keine Anlässe</p></html>") == {}, "an empty list is not a layout change"
mo = {"m": {"status": "active", "vevent": stub, "sequence": 0, "modified": "T"}}
assert sync({}, ["m"], {"m": stub}.get, NOW, "T") == [], "a stub goes through the sync like any event"
assert "SUMMARY:Skitag\\, Melchsee-Frutt (nur für Mitglieder)" in unfold(build_calendar({"name": "Test", "lang": "de"}, mo, NOW))
flags = {e["id"]: e["members"] for e in site_data(clubs, {"luzern": {**h, **mo}, "bern": {}}, NOW, cache)["events"]}
assert flags["m"] is True and flags["a"] is False

# --- international events: Rotaract Europe's events API (shape of a real entry) and hand-entered ones
api = {"id": 2069, "title": "REM Cluj Napoca &#8211; REMSYLVANIA", "all_day": True, "start_date": "2027-01-28 00:00:00", "end_date": "2027-01-31 23:59:59",
       "description": "<p>Four days &amp; nights</p>", "venue": [], "image": False, "url": "https://rotaracteurope.eu/event/rem-cluj/"}
ev, detail = europe_event(api)
assert ev[0] == "UID:rotaract-europe-2069@rotaracteurope.eu" and "SUMMARY:REM Cluj Napoca – REMSYLVANIA" in ev, ev
assert "DTSTART;VALUE=DATE:20270128" in ev and "DTEND;VALUE=DATE:20270201" in ev, "all-day end is exclusive"
assert ics_text(ev, "DESCRIPTION") == "Four days & nights" and not any(l.startswith("LOCATION") for l in ev) and detail["image"] == ""
timed, d2 = europe_event({**api, "all_day": False, "utc_start_date": "2026-06-08 17:00:00", "utc_end_date": "2026-06-08 18:00:00",
                          "venue": {"venue": "Hall", "city": "Napoli", "country": "Italy"}, "image": {"url": "https://x/i.jpg"}})
assert "DTSTART;TZID=Europe/Zurich:20260608T190000" in timed and ics_text(timed, "LOCATION") == "Hall, Napoli, Italy" and d2["image"] == "https://x/i.jpg"
man, _ = manual_event({"id": "conv-2027", "title": "Convention", "start": dt.date(2027, 6, 5), "end": dt.date(2027, 6, 9), "url": "https://x"})
assert "DTSTART;VALUE=DATE:20270605" in man and "DTEND;VALUE=DATE:20270610" in man and "URL:https://x" in man
try:
    manual_event({"id": "x", "title": "No link", "start": dt.date(2027, 6, 5)})
    raise AssertionError("a hand-entered event needs a url: the event page's main button links to it")
except KeyError:
    pass
intl = {}
assert sync(intl, ["eu2069"], {"eu2069": ev}.get, NOW, "T") == [] and intl["eu2069"]["status"] == "active"
c2 = site_data([{"id": "international", "name": "I", "base_url": "u", "source": "international", "how": "a\n\nb", "partners": [{"name": "RC X", "url": "https://x"}]}], {"international": intl}, NOW, cache)
assert c2["clubs"][0]["source"] == "international" and c2["clubs"][0]["partners"][0]["name"] == "RC X" and c2["events"][0]["members"] is False
assert site["clubs"][0]["how"] == "" and site["clubs"][0]["about"] == "" and site["clubs"][0]["partners"] == [], "defaults"

# --- the Rotary layer: a district's list items minus Polaris' own notices and the Rotaract clubs, built from the list item alone
rc = [{"id": "luzern", "name": "L", "base_url": "https://rotaract-luzern.ch", "city": "Luzern"},
      {"id": "rotary1980", "name": "Rotary Distrikt 1980", "base_url": "https://rotary1980.ch", "source": "rotary", "district": "1980"}]
skip = skip_hosts(rc)
assert skip == {"polaris.rotary.ch", "team.polaris.rotary.ch", "rotaract-luzern.ch"}, "the district's own host is not skipped"
listed = {"1": {**item, "url": "https://rotary-baden.ch/de/agenda/show/1"}, "2": {**item, "url": "https://team.polaris.rotary.ch/de/agenda/show/2"},
          "3": {**item, "url": "https://polaris.rotary.ch/de/agenda/show/3"}, "218599": item, "5": {**item, "url": "https://rotary1980.ch/de/agenda/show/5"}}
kept = rotary_items(listed, skip)
assert list(kept) == ["1", "5"], kept
rstub = stub_vevent("1", kept["1"], members=False)
assert MEMBERS_ONLY not in rstub and rstub == [l for l in stub_vevent("1", kept["1"]) if l != MEMBERS_ONLY], "a Rotary stub is public: no members marker"
assert site_name("<head><title>Einstiegsseite\n     |\n\tRotary Baden</title></head>") == "Rotary Baden" and site_name("<html></html>") == ""
rot = {"1": {"status": "active", "vevent": rstub, "sequence": 0, "modified": "T", "detail": {"image": "", "description": "", "registration": "", "organiser": "Rotary Baden"}},
       "j": {**joint, "detail": {**joint["detail"], "organiser": "Rotary Baden"}}}
rh = {"luzern": {"j": joint, "a": h["a"]}, "rotary1980": rot}
for order in (rc, rc[::-1]):  # the Rotaract club wins a joint event wherever the district stands in clubs.toml
    sd = site_data(order, rh, NOW, cache)
    assert [c["id"] for c in sd["clubs"]] == ["luzern"] and sorted(e["id"] for e in sd["events"]) == ["a", "j"], "clubs/events never carry the layer"
    assert [c["id"] for c in sd["rotary"]["clubs"]] == ["rotary1980"] and [e["id"] for e in sd["rotary"]["events"]] == ["1"], "it has its own key"
    rs = {e["id"]: e for e in sd["events"] + sd["rotary"]["events"]}
    assert rs["1"]["clubs"] == ["rotary1980"] and rs["1"]["layer"] == "rotary" and rs["1"]["organiser"] == "Rotary Baden" and rs["1"]["members"] is False
    assert rs["j"]["clubs"] == ["luzern"] and rs["j"]["layer"] == "" and rs["j"]["organiser"] == "", "joint event: not duplicated, not relabelled"
    assert rs["a"]["layer"] == "" and rs["a"]["organiser"] == ""
assert set(merged_history(rc, rh)) == {"j", "a"} and merged_history(rc, rh)["j"] is joint, "all.ics carries no Rotary events"
assert "polaris-1@" in build_calendar(rc[1], rot, NOW), "the district has its own feed"
assert site["rotary"] == {"clubs": [], "events": []}, "no districts: an empty layer"

# sync_rotary / sync_polaris against a faked Polaris: the list shows two events of one Rotary club whose own site is down
real = polaris_feed.get, polaris_feed.time.sleep, polaris_feed.listed_events, polaris_feed.fetch_event
asked = []
def fake_get(url, attempts=3):
    asked.append((url, attempts))
    if "/agenda" not in url:
        raise OSError("down")
    return (LIST + LIST.replace("218599", "218600")).replace("rotaract-luzern.ch", "rotary-baden.ch")
polaris_feed.get, polaris_feed.time.sleep = fake_get, lambda s: None
started = {"url": "https://rotary-baden.ch/de/agenda/show/7", "title": "Meeting", "teaser": "", "location": "", "when": "Samstag, 7. November 2026 11:30"}
dist = {"7": {"status": "active", "vevent": stub_vevent("7", started, members=False), "sequence": 0, "modified": "T"},  # 11:30 to 13:30 (our default), now is 12:00
        "8": {"status": "active", "vevent": stub_vevent("8", {**started, "when": "Sonntag, 8. November 2026 11:30"}, members=False), "sequence": 0, "modified": "T"}}
names = {}
assert polaris_feed.sync_rotary({**rc[1], "lang": "de"}, dist, NOW, "T2", skip, names) == []
assert dist["7"]["status"] == "active" and dist["7"]["sequence"] == 0, "started and off the list: kept, even before our guessed end"
assert dist["8"]["status"] == "cancelled", "still ahead and off the list: cancelled"
assert dist["218599"]["detail"]["organiser"] == dist["218600"]["detail"]["organiser"] == "rotary-baden.ch" and names == {}, "unreadable club site: the host, not cached"
assert [a for a in asked if "/agenda" not in a[0]] == [("https://rotary-baden.ch/de/", 1)], "one lookup per host and run, without retries"
# listed_events reads the list items only: a link in some teaser text (here another club's event) is not one
TEASER = LIST.replace("Lust auf Schnee &amp; Sonne? ...", 'Anmeldung: <a href="https://bern.rotaract.ch/de/agenda/show/202042">hier</a>')
polaris_feed.get = lambda url, attempts=3: TEASER if url.endswith("page=1") else TEASER.replace("218599", "218600")
assert sorted(real[2]({**rc[0], "lang": "de"})) == ["218599", "218600"], "202042 is a teaser link, not a list item"
polaris_feed.get = fake_get
polaris_feed.listed_events, polaris_feed.fetch_event = lambda club, backfill=False: {"9": item}, lambda club, i, item=None: None
own = {**started, "url": "https://rotaract-luzern.ch/de/agenda/show/7"}
mem = {"7": {"status": "active", "vevent": stub_vevent("7", own), "sequence": 0, "modified": "T"},
       "8": {"status": "active", "vevent": stub_vevent("8", {**own, "when": "Sonntag, 8. November 2026 11:30"}), "sequence": 0, "modified": "T"}}
assert polaris_feed.sync_polaris(rc[0], mem, NOW, "T2") == []
assert mem["7"]["status"] == "active" and mem["8"]["status"] == "cancelled", "members-only: the same rule, by the start"
# another site's event that a teaser link brought into this history: dropped while live, never cancelled; frozen history stays
stray = [l.replace("rotary-baden.ch", "rcbaselinternational.ch") for l in dist["7"]["vevent"]]
old_stray = [l.replace("20261107", "20260901") for l in stray]
polaris_feed.fetch_event = lambda club, i, item=None: stray if i == "7" else stub_vevent(i, item)  # its own page still exists
mem = {"7": {"status": "active", "vevent": stray, "sequence": 0, "modified": "T"}, "6": {"status": "active", "vevent": old_stray, "sequence": 0, "modified": "T", "detail": {}},
       "9": {"status": "active", "vevent": stub_vevent("9", item), "sequence": 0, "modified": "T", "detail": {}}}
assert polaris_feed.sync_polaris(rc[0], mem, NOW, "T2") == []
assert "7" not in mem and mem["6"]["vevent"] == old_stray and mem["9"]["status"] == "active", mem.keys()
polaris_feed.fetch_event = lambda club, i, item=None: None
# list items whose date can't be read are counted per club
rep = polaris_feed.new_report()
polaris_feed.listed_events = lambda club, backfill=False: {"9": {**item, "when": "soon"}, "10": item}
assert polaris_feed.sync_polaris(rc[0], {}, NOW, "T2", rep) == [] and rep["unreadable"] == {"luzern": 1} and "luzern: 1 agenda list item" in rep["warnings"][0], rep
# an empty list while upcoming events are known: a warning, nothing cancelled (Polaris clubs and Rotary districts alike)
rep, polaris_feed.listed_events = polaris_feed.new_report(), lambda club, backfill=False: {}
kept = {"8": {"status": "active", "vevent": stub_vevent("8", {**started, "when": "Sonntag, 8. November 2026 11:30"}), "sequence": 0, "modified": "T"}}
before = copy.deepcopy(kept)
assert polaris_feed.sync_polaris(rc[0], kept, NOW, "T2", rep) == [] and kept == before and "list is empty but 1 upcoming" in rep["warnings"][0], rep
assert polaris_feed.sync_polaris(rc[0], {}, NOW, "T2", rep) == [] and len(rep["warnings"]) == 1, "nothing known: an empty list is fine"
polaris_feed.get = lambda url, attempts=3: "<html><ul></ul></html>"
rep, dist2 = polaris_feed.new_report(), copy.deepcopy(dist)
dist2["8"]["status"] = "active"
before = copy.deepcopy(dist2)
assert polaris_feed.sync_rotary({**rc[1], "lang": "de"}, dist2, NOW, "T3", skip, {}, rep) == [] and dist2 == before and "rotary1980: the agenda list is empty" in rep["warnings"][0]
polaris_feed.get, polaris_feed.time.sleep, polaris_feed.listed_events, polaris_feed.fetch_event = real

# --- Instagram layer: off without credentials, one Business Discovery call per club with a link, the token never printed or returned
import contextlib, io, json, tempfile
from pathlib import Path
from polaris_feed import fetch_instagram, instagram_user, parse_instagram
assert instagram_user("https://www.instagram.com/racluzern/") == "racluzern" and instagram_user("https://instagram.com/rac.bern_1?hl=de") == "rac.bern_1"
assert instagram_user("") == "" and instagram_user("https://www.instagram.com/") == "" and instagram_user("https://x/a){evil") == ""
media = [{"id": "11", "media_type": "IMAGE", "media_url": "https://cdn/i.jpg", "permalink": "https://www.instagram.com/p/A/", "caption": "Skitag\n im  Schnee " + "x" * 200, "timestamp": "2026-10-31T18:00:00+0000"},
         {"id": "12", "media_type": "VIDEO", "media_url": "https://cdn/v.mp4", "thumbnail_url": "https://cdn/v.jpg", "permalink": "https://www.instagram.com/reel/B/", "timestamp": "2026-10-30T18:00:00+0000"},
         {"id": "13", "media_type": "CAROUSEL_ALBUM", "permalink": "https://www.instagram.com/p/C/", "children": {"data": [{"media_type": "VIDEO", "thumbnail_url": "https://cdn/c1.jpg"}, {"media_type": "IMAGE", "media_url": "https://cdn/c2.jpg"}]}},
         {"id": "14", "media_type": "VIDEO", "permalink": "https://www.instagram.com/reel/D/"},  # reel without thumbnail: skipped
         {"id": "../x", "media_type": "IMAGE", "media_url": "https://cdn/e.jpg", "permalink": "https://www.instagram.com/p/E/"}]  # an id that is no file name: skipped
answer = {"business_discovery": {"media": {"data": media + [{**media[0], "id": str(20 + n)} for n in range(10)]}}, "id": "1"}
posts = parse_instagram(answer)
assert [p["id"] for p in posts[:3]] == ["11", "12", "13"] and len(posts) == 8, posts
assert posts[0] == {"id": "11", "url": "https://www.instagram.com/p/A/", "image": "https://cdn/i.jpg", "caption": ("Skitag im Schnee " + "x" * 200)[:140], "date": "2026-10-31"}
assert posts[1]["image"] == "https://cdn/v.jpg" and posts[1]["caption"] == "" and posts[2]["image"] == "https://cdn/c1.jpg" and posts[2]["date"] == ""
assert parse_instagram({}) == [] and parse_instagram({"business_discovery": {"id": "1"}}) == []
SECRET, calls, saved = "EAAsecret123", [], []
ig_clubs = [{"id": "luzern", "instagram": "https://www.instagram.com/racluzern/"}, {"id": "bern"}, {"id": "zug", "instagram": "https://www.instagram.com/raczug/"}]
def fake_fetch(url):
    calls.append(url)
    if "raczug" in url:
        return {"error": {"code": 100, "type": "OAuthException", "message": f"not a business account, token {SECRET}"}}
    return answer
def fake_download(url, path):
    saved.append(path)
    return url != "https://cdn/v.jpg"  # one picture too big / unreachable
with tempfile.TemporaryDirectory() as tmp:
    for token, user in (("", ""), (None, None), (SECRET, ""), ("", "178"), (" ", "178")):
        r = polaris_feed.new_report()
        assert fetch_instagram(ig_clubs, Path(tmp), token, user, fake_fetch, fake_download, r) == {} and not calls, "no credentials: no calls"
        assert r["instagram"] == {"state": "off", "note": "the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set", "clubs": {}}
    log, r = io.StringIO(), polaris_feed.new_report()
    with contextlib.redirect_stdout(log):
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "17x", fake_fetch, fake_download, r) == {} and not calls, "bad user id: no calls"
        assert r["instagram"]["state"] == "error" and "numeric" in r["instagram"]["note"]
        r = polaris_feed.new_report()
        ig = fetch_instagram(ig_clubs, Path(tmp), SECRET + "\n", "178", fake_fetch, fake_download, r)
    assert r["instagram"]["state"] == "on" and r["instagram"]["clubs"]["luzern"] == 7 and r["instagram"]["clubs"]["zug"].startswith("Graph error 100 (OAuthException)")
    assert SECRET not in json.dumps(r), "the token never reaches status.json"
    assert len(calls) == 2 and calls[0].startswith("https://graph.facebook.com/v27.0/178?fields=business_discovery.username%28racluzern%29"), calls
    assert list(ig) == ["luzern"] and len(ig["luzern"]) == 7, "a failing club is left out, a failed download drops that post"
    assert ig["luzern"][0] == {"url": "https://www.instagram.com/p/A/", "image": "ig/luzern/11.jpg", "caption": posts[0]["caption"], "date": "2026-10-31"}
    assert saved[0] == Path(tmp) / "ig/luzern/11.jpg"
    assert "zug instagram: Graph error 100" in log.getvalue() and SECRET not in log.getvalue() + str(ig), log.getvalue()
    calls.clear()
    with contextlib.redirect_stdout(log):
        r = polaris_feed.new_report()
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "178", lambda u: calls.append(u) or {"error": {"code": 190}}, fake_download, r) == {}
        assert r["instagram"]["state"] == "error" and "INSTAGRAM_TOKEN" in r["instagram"]["note"]
        def boom(url):
            raise RuntimeError("failed: " + url)
        r = polaris_feed.new_report()
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "178", boom, fake_download, r) == {}, "an exception never fails the run"
        assert SECRET not in json.dumps(r) and r["instagram"]["clubs"]["luzern"].startswith("failed: "), r
    assert len(calls) == 1 and "token is expired or invalid" in log.getvalue() and SECRET not in log.getvalue(), "expired token: one call, one clear warning"
assert site_data(clubs, histories, NOW, cache)["clubs"][0]["instagram"] == [], "no Instagram posts by default"
assert site_data(clubs, histories, NOW, cache, None, None, ig)["clubs"][0]["instagram"] == ig["luzern"]

# --- the run-wide brake: more than max(5, 30%) of all upcoming events cancelled in one run
up = lambda n, status="active": {f"e{k}": {"status": status, "vevent": event(f"e{k}", "20261201T190000"), "sequence": 0, "modified": "T"} for k in range(n)}
cut = lambda h, n: {i: {**r, "status": "cancelled"} if k < n else r for k, (i, r) in enumerate(h.items())}
b = {"x": up(4), "y": up(4), "z": up(4)}
assert polaris_feed.global_brake(b, {c: cut(h, 2) for c, h in b.items()}, NOW).startswith("this run would cancel 6 of 12"), "2 of 4 per club passes each club's brake"
assert polaris_feed.global_brake(b, {"x": cut(b["x"], 2), "y": cut(b["y"], 2), "z": cut(b["z"], 1)}, NOW) == "", "5 is the floor"
b = {f"c{n}": up(10) for n in range(5)}
assert polaris_feed.global_brake(b, {c: cut(h, 3) for c, h in b.items()}, NOW) == "" and polaris_feed.global_brake(b, {**b, "c0": cut(b["c0"], 16)}, NOW) == ""
assert polaris_feed.global_brake(b, {c: cut(h, 4) for c, h in b.items()}, NOW), "20 of 50 is over 30%"
assert polaris_feed.global_brake({"x": up(9, "cancelled")}, {"x": up(9, "cancelled")}, NOW) == "", "already cancelled events don't count"

# --- a whole run (main) against faked Polaris in a temp dir: dist/ copied, data/ written or left alone, warnings, share pages
import json, sys
def run_main(tmp, listed, fetched):
    polaris_feed.listed_events = lambda club, backfill=False: listed[club["id"]]
    polaris_feed.fetch_event = lambda club, i, item=None: fetched.get(i)
    polaris_feed.fetch_detail = lambda club, i: {"image": "", "description": "", "registration": ""}
    polaris_feed.fetch_news = lambda club, page="news": [] if club["id"] != "z" or page == "news" else (_ for _ in ()).throw(OSError("HTTP 500"))
    polaris_feed.get = lambda url, attempts=3: (_ for _ in ()).throw(OSError("offline"))  # the geocoder
    sys.argv, log = ["x", str(tmp / "clubs.toml"), str(tmp / "out"), str(tmp / "data")], io.StringIO()
    with contextlib.redirect_stdout(log):
        try:
            polaris_feed.main()
        except SystemExit as e:
            code = e.code
    return code, json.loads((tmp / "out" / "status.json").read_text()), log.getvalue()
saved = polaris_feed.__file__, polaris_feed.get, polaris_feed.listed_events, polaris_feed.fetch_event, polaris_feed.fetch_detail, polaris_feed.fetch_news, polaris_feed.time.sleep
polaris_feed.time.sleep = lambda s: None
with tempfile.TemporaryDirectory() as tmp:
    tmp = Path(tmp)
    polaris_feed.__file__ = str(tmp / "polaris_feed.py")
    (tmp / "clubs.toml").write_text("".join(f'[[clubs]]\nid = "{c}"\nname = "RAC {c}"\nbase_url = "https://{c}.ch"\nlang = "{l}"\ncity = "X"\n'
                                            for c, l in (("x", "de"), ("y", "en"), ("z", "fr"))))
    sys.argv = ["x", str(tmp / "clubs.toml"), str(tmp / "out"), str(tmp / "data")]
    try:
        polaris_feed.main()
        raise AssertionError("no dist/: stop before any request")
    except SystemExit as e:
        assert "npm ci && npm run build" in str(e.code), e.code
    (tmp / "dist").mkdir()
    (tmp / "dist" / "index.html").write_text("app")
    (tmp / "data").mkdir()
    future = lambda c, n: {f"{c}{k}": {"status": "active", "vevent": event(f"{c}{k}", f"2030010{k + 1}T190000"), "sequence": 0, "modified": "T"} for k in range(n)}
    for c in "xyz":
        (tmp / "data" / f"{c}.json").write_text(json.dumps(future(c, 4)))
    stored = {c: (tmp / "data" / f"{c}.json").read_text() for c in "xyz"}
    (tmp / "out" / "e").mkdir(parents=True)
    (tmp / "out" / "e" / "stale.html").write_text("old")
    # each club loses 2 of its 4 upcoming events (its own brake lets that pass); 6 of 12 overall: the run is refused
    alive = {i: r["vevent"] for c in "xyz" for i, r in future(c, 4).items() if i[1] in "01"}
    code, st, log = run_main(tmp, {c: {f"{c}{k}": item for k in range(2)} for c in "xyz"}, alive)
    assert code == 1 and any("would cancel 6 of 12" in f for f in st["failures"]), st
    assert st["instagram"] == {"state": "off", "note": "the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set", "clubs": {}} and st["notes"] == ["z projects: HTTP 500 (kept the last list)"], st["notes"]
    assert {c: (tmp / "data" / f"{c}.json").read_text() for c in "xyz"} == stored, "refused: nothing written to data/"
    assert not (tmp / "data" / "news.json").exists() and "STATUS:CANCELLED" not in (tmp / "out" / "x.ics").read_text(), "the last histories are published"
    assert (tmp / "out" / "index.html").read_text() == "app" and not (tmp / "out" / "e" / "stale.html").exists(), "dist/ copied, stale share pages gone"
    assert (tmp / "out" / "e" / "x0.html").exists() and '<html lang="en">' in (tmp / "out" / "e" / "y0.html").read_text() and (tmp / "out" / "c" / "z.html").exists()
    # a normal run: x lists nothing (kept, warned), y loses everything upcoming but one unreadable item, z unchanged
    listed = {"x": {}, "y": {"y9": {**item, "when": "someday"}}, "z": {f"z{k}": item for k in range(4)}}
    alive = {i: r["vevent"] for i, r in future("z", 4).items()} | {"y0": future("y", 1)["y0"]["vevent"]}
    code, st, log = run_main(tmp, listed, alive)
    assert code == 1 and len(st["failures"]) == 1 and "3 of 4" in st["failures"][0], "y's own brake (3 of 4): only y keeps its history"
    listed["y"]["y0"] = item
    alive = {i: r["vevent"] for i, r in future("z", 4).items()}
    (tmp / "data" / "y.json").write_text(json.dumps(future("y", 1)))
    code, st, log = run_main(tmp, listed, alive)
    assert code == 0 and st["failures"] == [], st
    assert json.loads((tmp / "data" / "y.json").read_text())["y0"]["status"] == "cancelled"
    assert json.loads((tmp / "data" / "x.json").read_text()) == json.loads(stored["x"]), "empty list: x's upcoming events kept"
    assert st["unreadable"] == {"y": 1} and "::warning::y: 1 agenda list item" in log, (st, log)
    assert any("x: the agenda list is empty but 4" in w for w in st["warnings"]) and any(w == "y: had upcoming events, now lists none" for w in st["warnings"]), st
    assert not any("no upcoming events at all" in w for w in st["warnings"])
    for c in "xz":
        (tmp / "data" / f"{c}.json").write_text("{}")
    code, st, log = run_main(tmp, {"x": {}, "y": {}, "z": {}}, {})
    assert "the site would publish no upcoming events at all" in st["warnings"] and "::warning::the site would publish no upcoming" in log, st
polaris_feed.__file__, polaris_feed.get, polaris_feed.listed_events, polaris_feed.fetch_event, polaris_feed.fetch_detail, polaris_feed.fetch_news, polaris_feed.time.sleep = saved
print("ok")
