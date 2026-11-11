# How events are tracked

Each run syncs Polaris into `data/<club-id>.json` and builds the feeds and the site from those files. The history lives on the `data` branch (checked out into `data/` by the workflow and committed there), so `main` only has real changes.

## Rules of a run

- **Only the last month and the future are refreshed.** Older events are frozen: kept, never re-downloaded.
- **Changed events** are updated and calendars pick up the change (higher `SEQUENCE`).
- **An event that disappears from Polaris** is checked on its own first. Only when Polaris confirms it is gone is it marked cancelled; it shows as cancelled until its date has passed, then it is dropped. If it reappears it is active again.
- **Safety brake**: a run that would cancel more than half of a club's live events is refused. The club keeps its last good state.
- **Global brake**: a run that would cancel more than 30% (at least 5) of all upcoming events across all clubs is dropped whole: nothing is written to `data/`, every club keeps its last history. It catches a Polaris change that empties each club a little at a time.
- **Empty list**: an agenda list with no events while the club still has upcoming ones is taken for a Polaris glitch. Nothing is cancelled that run, and a warning is noted.
- **Layout check**: a list page with event links but not one readable title or date means Polaris changed its markup. The club fails and keeps its last good state instead of syncing blanks.
- **Only real list items count.** An event is the club's when its own list item links to it. A link to an event in some teaser text ("Anmeldung hier: …") is often another club's event and is ignored. Another site's event that came in that way earlier (the event's Polaris address is on a different site, and it is no longer listed) is removed from the club's history while it is in the refresh window, never cancelled: it is still someone else's real event.
- **Polaris unreachable**: the affected club keeps its last good state, the others still update, and the run is marked failed.
- **Joint events** listed by several clubs appear once (Polaris event ids are global).
- **List dates** are read in all four languages: day before month (de, fr, it: "Samstag, 20. Februar 2027") and English month before day ("Saturday, December 12, 2026"). A list item whose date can't be read is left out (it only matters for members-only events) and counted.
- **Event pages** are fetched once per event and again when the event changes, so a run stays at a few hundred requests.
- **News and projects**: each club's list pages are read once per run (title, date, picture link, link; never the article). If a page fails, the last list stays.

## status.json

Each run writes `status.json` next to the site: when it ran, event counts per club, `failures` (the run is marked failed), `warnings` (worth a look, not a failure: an empty list, a club that had upcoming events and now lists none, a site with no upcoming events at all, unreadable list dates), `unreadable` (per club, the number of list items without a readable date), and the commit and Actions run that built it. The developer screen shows it.

History starts with the current year; clubs with `backfill = true` import every past year on their first run. Feeds and the site carry the last 24 months plus the future.

## Why scraping

Polaris has no events API. The public agenda pages and the per-event calendar files are the only source, so the sync reads those, politely and rarely.

## Locations

For the radius search, places are looked up with swisstopo's free geocoder: the event's location text, then its parts, then the club's city. Results are cached in `data/geocode.json`; edit an entry there to fix a wrong place.
