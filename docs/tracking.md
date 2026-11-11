# How events are tracked

Each run syncs Polaris into `data/<club-id>.json` and builds the feeds and the site from those files. The history lives on the `data` branch (checked out into `data/` by the workflow and committed there), so `main` only has real changes.

## Rules of a run

- **Only the last month and the future are refreshed.** Older events are frozen: kept, never re-downloaded.
- **Changed events** are updated and calendars pick up the change (higher `SEQUENCE`).
- **An event that disappears from Polaris** is checked on its own first. Only when Polaris confirms it is gone is it marked cancelled; it shows as cancelled until its date has passed, then it is dropped. If it reappears it is active again.
- **Safety brake**: a run that would cancel more than half of a club's live events is refused. The club keeps its last good state.
- **Polaris unreachable**: the affected club keeps its last good state, the others still update, and the run is marked failed.
- **Joint events** listed by several clubs appear once (Polaris event ids are global).
- **Event pages** are fetched once per event and again when the event changes, so a run stays at a few hundred requests.
- **News and projects**: each club's list pages are read once per run (title, date, picture link, link; never the article). If a page fails, the last list stays.

History starts with the current year; clubs with `backfill = true` import every past year on their first run. Feeds and the site carry the last 24 months plus the future.

## Why scraping

Polaris has no events API. The public agenda pages and the per-event calendar files are the only source, so the sync reads those, politely and rarely.

## Locations

For the radius search, places are looked up with swisstopo's free geocoder: the event's location text, then its parts, then the club's city. Results are cached in `data/geocode.json`; edit an entry there to fix a wrong place.
