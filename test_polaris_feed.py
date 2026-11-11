"""Run: python3 test_polaris_feed.py"""
import copy
import datetime as dt

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

# --- share page: HTML-safe, carries picture + redirect
pg = share_page({"id": "1", "title": 'Stamm "<Test>"', "start": "2026-12-10T19:00", "allday": False, "location": "Luzern",
                 "description": "A & B\n\nC", "image": "https://x.ch/a.png?v=1"}, "Rotaract Luzern")
assert 'content="Stamm &quot;&lt;Test&gt;&quot; · 10.12.2026 19:00"' in pg and "<Test>" not in pg.split("<title>")[1].split("</title>")[0]
assert 'og:image" content="https://x.ch/a.png?v=1"' in pg and 'url=../event.html?id=1' in pg and "Rotaract Luzern · Luzern. A &amp; B C" in pg

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
polaris_feed.listed_events, polaris_feed.fetch_event = lambda club, backfill=False: {}, lambda club, i, item=None: None
mem = {"7": {"status": "active", "vevent": stub_vevent("7", started), "sequence": 0, "modified": "T"},
       "8": {"status": "active", "vevent": stub_vevent("8", {**started, "when": "Sonntag, 8. November 2026 11:30"}), "sequence": 0, "modified": "T"}}
assert polaris_feed.sync_polaris(rc[0], mem, NOW, "T2") == []
assert mem["7"]["status"] == "active" and mem["8"]["status"] == "cancelled", "members-only: the same rule, by the start"
polaris_feed.get, polaris_feed.time.sleep, polaris_feed.listed_events, polaris_feed.fetch_event = real

# --- Instagram layer: off without credentials, one Business Discovery call per club with a link, the token never printed or returned
import contextlib, io, tempfile
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
        assert fetch_instagram(ig_clubs, Path(tmp), token, user, fake_fetch, fake_download) == {} and not calls, "no credentials: no calls"
    log = io.StringIO()
    with contextlib.redirect_stdout(log):
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "17x", fake_fetch, fake_download) == {} and not calls, "bad user id: no calls"
        ig = fetch_instagram(ig_clubs, Path(tmp), SECRET + "\n", "178", fake_fetch, fake_download)
    assert len(calls) == 2 and calls[0].startswith("https://graph.facebook.com/v27.0/178?fields=business_discovery.username%28racluzern%29"), calls
    assert list(ig) == ["luzern"] and len(ig["luzern"]) == 7, "a failing club is left out, a failed download drops that post"
    assert ig["luzern"][0] == {"url": "https://www.instagram.com/p/A/", "image": "ig/luzern/11.jpg", "caption": posts[0]["caption"], "date": "2026-10-31"}
    assert saved[0] == Path(tmp) / "ig/luzern/11.jpg"
    assert "zug instagram: Graph error 100" in log.getvalue() and SECRET not in log.getvalue() + str(ig), log.getvalue()
    calls.clear()
    with contextlib.redirect_stdout(log):
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "178", lambda u: calls.append(u) or {"error": {"code": 190}}, fake_download) == {}
        def boom(url):
            raise RuntimeError("failed: " + url)
        assert fetch_instagram(ig_clubs, Path(tmp), SECRET, "178", boom, fake_download) == {}, "an exception never fails the run"
    assert len(calls) == 1 and "token is expired or invalid" in log.getvalue() and SECRET not in log.getvalue(), "expired token: one call, one clear warning"
assert site_data(clubs, histories, NOW, cache)["clubs"][0]["instagram"] == [], "no Instagram posts by default"
assert site_data(clubs, histories, NOW, cache, None, None, ig)["clubs"][0]["instagram"] == ig["luzern"]
print("ok")
