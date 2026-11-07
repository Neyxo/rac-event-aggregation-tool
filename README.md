# Rotaract event aggregation tool

Collects the public events of every Rotaract club in Switzerland & Liechtenstein from Polaris. It publishes them as subscribable calendar feeds and as a search site. Plan and background: [PLANNING.md](PLANNING.md).

## Site & feeds

**https://neyxo.github.io/rac-event-aggregation-tool/**

- Quick views: Upcoming, This week, Weekend, Near me, Saved, Past. The Filters button opens district, clubs (any number) and place/radius. List or month calendar layout.
- Each event shows its picture, full description and registration info from Polaris (the picture is only linked, not copied).
- Light theme by default, dark via the toggle. Each club has its canton's coat of arms (the city's for city clubs) and a matching colour, set in `clubs.toml` (`logo`, `color`, `short`, `district`). The crests in `site/crests/` come from Wikimedia Commons; Swiss and Liechtenstein official coats of arms are public domain.
- Districts: D1980 (central & north-west), D1990 (west), D2000 (east), used as a filter and shown in the event details and feed list.
- Installable as an app (PWA): "Install" on the page shows the steps per platform; the last loaded events stay readable offline.
- First visit: a short welcome (your clubs → subscribe → install). The clubs are pre-selected from the connection's approximate location (one lookup at get.geojs.io, fallback ipwho.is; no permission prompt, nothing stored), or from the browser language if that fails. "Show the welcome steps again" is in the Install section.
- Remembers your clubs, place, view and layout on that device. Saved (starred) events are stored on the device too. Nothing is sent anywhere.
- Shareable: filters go into the URL, e.g. `?clubs=bern,luzern`, `?d=1980`, `?place=Luzern&r=50`, `?view=weekend`, `?mode=month`. A shared link overrides the remembered settings, and anyone can open it without installing anything.

- UI in German, French, Italian or English: picked from the device language, switchable in the header, or `?lang=de`. Strings live in `site/i18n.js`.
- Share button per event: the link `e/<id>.html` shows title and picture when pasted into WhatsApp etc., then opens the app on that event (`?event=<id>`).
- Club pages: `club.html?id=bern` (crest, district, next events, subscribe).
- A yellow banner appears when the data is older than 30 hours; a toast offers a refresh when a new version of the app was fetched in the background.
- Hidden pages (not linked from the UI): `dev.html` (last build, per-club counts, failures, this device's service worker/caches/prefs, reset buttons) and `map.html` (events on the swisstopo map, via Leaflet from cdnjs).

Pages: `index.html`, `subscribe.html`, `club.html`, `dev.html`, `map.html`, shared `app.css` and `i18n.js`, all in `site/`. The build copies them to `public/`, adds the per-event share pages under `public/e/` and `status.json` (last run, per-club counts, failures). Plain HTML/CSS/JS, no build step; the only library is Leaflet on the hidden map page.

Feeds, refreshed every 6 hours:
- one per club: `webcal://neyxo.github.io/rac-event-aggregation-tool/<club-id>.ics` (ids in `clubs.toml`)
- all clubs: `webcal://neyxo.github.io/rac-event-aggregation-tool/all.ics`

Members-only events are not included.

## How events are tracked

Each run syncs Polaris into `data/<club-id>.json`, which the workflow commits, and builds the feeds and site from those files:

- **Past events** are kept for good, even after Polaris drops them from its "upcoming" list or deletes them. They're never re-downloaded.
- **Changed events** (moved, renamed, …) are updated, and calendars pick up the change (higher `SEQUENCE`).
- **An upcoming event that disappears from Polaris** is checked on its own first. Only if Polaris confirms it's gone (404 or login page) is it marked cancelled. It then shows as "Abgesagt: …" (in the club's language) until its date has passed, and after that it's dropped. If it reappears, it's active again.
- **Safety brake:** a run that would cancel more than half of a club's upcoming events at once is refused, because that's almost certainly a Polaris problem. The club keeps its last good state.
- **If Polaris is unreachable**, the affected club or event keeps its last good state, the other clubs still update, and the workflow run is marked failed, so GitHub emails you.
- **Joint events** listed by several clubs appear once, because Polaris event ids are global.
- **Event pages** (picture URL, full description, registration deadline) are fetched once per event and again when the event changes, so a normal run stays at a few hundred requests.

History starts with the current year; clubs with `backfill = true` import every past year on their first run.

**Locations** for the radius search come from swisstopo's free geocoder (covers CH + LI). It tries the event's location text, then its parts (e.g. "6005 Luzern"), then the club's `city`. Results are cached in `data/geocode.json`; edit an entry there to fix a wrong location.

## Run locally

```bash
python3 test_polaris_feed.py
python3 polaris_feed.py        # updates data/, writes feeds + site to public/
python3 -m http.server -d public 8000
```

Then open http://localhost:8000. Python 3.11+, no dependencies.

## Add a club

Add a `[[clubs]]` entry to `clubs.toml` (Polaris website, language, city). The club list comes from the club menu on https://rotaract.ch/de/organisation/.

## Hosting (GitHub)

- Settings → Pages → Source: **GitHub Actions**.
- Settings → Actions → General → Workflow permissions: **Read and write** (to commit `data/`).

The workflow `.github/workflows/feeds.yml` runs every 6 hours, and also on every push or manual run.
