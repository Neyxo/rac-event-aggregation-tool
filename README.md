# Rotaract event aggregation tool

Collects the public events of every Rotaract club in Switzerland & Liechtenstein from Polaris. It publishes them as subscribable calendar feeds and as a search site. Plan and background: [PLANNING.md](PLANNING.md).

## Site & feeds

**https://neyxo.github.io/rac-event-aggregation-tool/**

- Quick views: Upcoming, This week, Weekend, Near me, Saved, Past. Plus search, any number of clubs, place/radius, and a list or month calendar layout.
- Each event shows its picture, full description and registration info from Polaris (the picture is only linked, not copied).
- Light and dark theme (follows the system, with a toggle). Club colours and chip labels come from `clubs.toml` (`color`, `short`; optional `logo` URL for a crest).
- Installable as an app (PWA): "Install" on the page shows the steps per platform; the last loaded events stay readable offline.
- Remembers your clubs, place, view and layout on that device. Saved (starred) events are stored on the device too. Nothing is sent anywhere.
- Shareable: filters go into the URL, e.g. `?clubs=bern,luzern`, `?place=Luzern&r=50`, `?view=weekend`, `?mode=month`. A shared link overrides the remembered settings, and anyone can open it without installing anything.

The site is in `site/`; the build copies it to `public/` next to the feeds and `events.json`. Plain HTML/CSS/JS, no build step, no libraries.

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
