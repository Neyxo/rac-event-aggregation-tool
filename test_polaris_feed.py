"""Run: python3 test_polaris_feed.py"""
import copy
import datetime as dt

from polaris_feed import build_calendar, clean_vevent, sync, unfold

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

# --- building the feed
polaris["c"] = None
sync(h, ["a", "b", "d"], polaris.get, NOW, "T10")
h["old-cancelled"] = {**h["past"], "status": "cancelled"}
cal = build_calendar({"name": "Test", "lang": "de"}, h, NOW)
events = unfold(cal)
assert "SUMMARY:Abgesagt: Event" in events and events.count("STATUS:CANCELLED") == 1, "only the upcoming cancelled one"
assert cal.count("BEGIN:VEVENT") == 5, "past + a + b + d + cancelled c"
assert cal.index("polaris-past@") < cal.index("polaris-a@") < cal.index("polaris-d@"), "sorted by start"
assert "SEQUENCE:1" in events and "DTSTAMP:T3" in events

long = {"x": {"status": "active", "vevent": event("x", "20261210T190000", "ä" * 100), "sequence": 0, "modified": "T"}}
cal = build_calendar({"name": "Test", "lang": "de"}, long, NOW)
assert all(len(l.encode()) <= 75 for l in cal.split("\r\n")), "line longer than 75 octets"
assert unfold(cal).count("SUMMARY:" + "ä" * 100) == 1, "folding must round-trip"
assert cal.endswith("END:VCALENDAR\r\n")
print("ok")
