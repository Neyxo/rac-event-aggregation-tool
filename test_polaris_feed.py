"""Run: python3 test_polaris_feed.py"""
from polaris_feed import build_calendar, clean_vevent, unfold

# Shape of a real Polaris per-event .ics: folded lines, duplicate DTSTART, DTEND == DTSTART.
SAMPLE = (
    "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n"
    "UID:abc\r\nSUMMARY:Stamm am Weihnachtsmarkt\r\n"
    "DESCRIPTION:Wir treffen uns am Weihnachtsmarkt und freuen uns auf euch. Bri\r\n"
    " ngt gerne Freunde mit!\r\n"
    "DTSTART;TZID=Europe/Zurich:20261210T190000\r\n"
    "DTEND;TZID=Europe/Zurich:20261210T190000\r\n"
    "DTSTART:20261210T190000\r\n"
    "END:VEVENT\r\nEND:VCALENDAR\r\n"
)

ev = clean_vevent(SAMPLE, "217808")
assert ev[0] == "UID:polaris-217808@rotary.ch", ev
assert [l for l in ev if l.startswith("DTSTART")] == ["DTSTART;TZID=Europe/Zurich:20261210T190000"], ev
assert [l for l in ev if l.startswith("DTEND")] == ["DTEND;TZID=Europe/Zurich:20261210T210000"], ev
assert "DESCRIPTION:Wir treffen uns am Weihnachtsmarkt und freuen uns auf euch. Bringt gerne Freunde mit!" in ev

# A real end time is kept as is.
ev2 = clean_vevent(SAMPLE.replace("DTEND;TZID=Europe/Zurich:20261210T190000", "DTEND;TZID=Europe/Zurich:20261210T230000"), "217808")
assert "DTEND;TZID=Europe/Zurich:20261210T230000" in ev2

cal = build_calendar("Test", [ev, ["UID:long", "SUMMARY:" + "ä" * 100]])
assert all(len(l.encode()) <= 75 for l in cal.split("\r\n")), "line longer than 75 octets"
assert unfold(cal).count("SUMMARY:" + "ä" * 100) == 1, "folding must round-trip"
assert cal.count("BEGIN:VEVENT") == 2 and cal.endswith("END:VCALENDAR\r\n")
print("ok")
