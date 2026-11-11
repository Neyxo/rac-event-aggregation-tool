# Rotaract event aggregation tool

Collects the events of every Rotaract club in Switzerland & Liechtenstein from their Polaris sites and publishes them as an installable web app and as calendar feeds you can subscribe to.

**https://neyxo.github.io/rotaract-events/**

## What you get

- **The app**: Home (your clubs), Discover (everything, with filters and a map), a month calendar, a page per event and per club. German, French, Italian and English, light and dark, works offline with the last loaded events.
- **Calendar feeds**, refreshed every 6 hours:
  - one per club: `webcal://neyxo.github.io/rotaract-events/<club-id>.ics` (ids in `clubs.toml`)
  - all clubs: `webcal://neyxo.github.io/rotaract-events/all.ics`
- **Extra layers**: international events (REM, EUCO, the Convention), and Rotary clubs' shared events, which are off until switched on in Settings.

Members-only events appear with what the public agenda list shows and are marked "Members only"; details and registration stay on Polaris. Nothing about you leaves your device.

## Run locally

```bash
npm ci
npm test
npm run build                  # the web app, into dist/
python3 test_polaris_feed.py
python3 polaris_feed.py        # updates data/, writes feeds + site (dist/ included) to public/
python3 -m http.server -d public 8000
```

Then open http://localhost:8000. Node 24, Python 3.11+ (no Python dependencies). The app is React + TypeScript in `web/`, built with Vite. To work on the app, `npm ci` and `npm start` are enough: it serves the app with live reload, with the real data from `public/` if `polaris_feed.py` has run, otherwise with the test data.

The event history lives on the `data` branch; check it out once with `git worktree add data data`.

## Add or change a club

Edit its `[[clubs]]` entry in `clubs.toml`: Polaris website, language, city, crest and colour. Optional: `about` (one sentence), `how` (how to join), `partners`, `photos`, `instagram`. The fields are described at the top of that file.

## Hosting

GitHub Pages from GitHub Actions (Settings → Pages → Source: GitHub Actions), with read and write workflow permissions. `.github/workflows/feeds.yml` runs every 6 hours, on every push and by hand.

## More detail

- [The site](docs/site.md): the app, routes, languages, share pages, what is stored on the device
- [How events are tracked](docs/tracking.md): updates, cancellations, safety brake, locations
- [Layers](docs/layers.md): members-only events, international events, Rotary events, Instagram pictures
- [Design rules](docs/design.md): buttons, chips, status, cards, frosted glass
