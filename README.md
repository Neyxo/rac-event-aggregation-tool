# Rotaract event aggregation tool

Collects the public events of every Rotaract club in Switzerland & Liechtenstein from Polaris. It publishes them as subscribable calendar feeds and as a search site. Plan and background: [PLANNING.md](PLANNING.md).

## Site & feeds

**https://neyxo.github.io/rac-event-aggregation-tool/**

- Navigation: one top bar (logo, about, settings) and bottom tabs. On event and club pages the event head or the club hero itself sticks under the top bar and compacts as you scroll (title to one line, chips and buttons fold away, a register or subscribe icon appears); it is the same element, not a second header. On both pages the sticky part is a 64 px box whose height never changes (so nothing below jumps): at rest it is transparent and its content draws big, overflowing onto the card or the club's colour block; as you scroll it compacts into the box within 80 px, title and meta line truncated to one line. The primary button (Register, Subscribe) is part of it and morphs from a labelled pill into the icon at the right, keeping its colour. The club's colour block drifts up a touch faster than the page (subtle parallax). Month and section headings (months in the lists, News · Pictures · More events) stick under whatever is above them and are frosted only while stuck. Bottom tabs are **Home · Discover · Calendar** on every page. **Home** (`index.html`) shows your main club and the clubs you also follow with quick views; without a club it switches to explore mode (intro, tip of the day, find your club, nearby events). **Discover** (`discover.html`) is all of Rotaract with every filter. **Calendar** (`calendar.html`) is a full-screen month; tapping a day opens a sheet with that day's events. **Settings** (`settings.html`) holds main club, also-show clubs (picked in popups), language, appearance, install, share and links.
- Welcome: opens on the first start of the installed app, from "Get started" on the home page or from Settings › Help; a plain visit goes straight to the events. It asks whether you are a member; members pick clubs → subscribe → install, others get three full-screen slides (who we are, what we do, how to start), nearby clubs to follow, install.
- Tapping an event opens its page (`event.html?id=…`: frosted card on the club's colour wash with its crest, picture, details, register, add to calendar (Polaris' own per-event file), share, more events of that club); tapping a club chip opens the club page.
- Each event shows its picture, full description and registration info from Polaris (the picture is only linked, not copied). On the cards the star is always top right, the picture under it.
- Light theme by default, dark via the toggle. Each club has its canton's coat of arms (the city's for city clubs) and a matching colour, set in `clubs.toml` (`logo`, `color`, `short`, `district`). The crests in `site/crests/` come from Wikimedia Commons; Swiss and Liechtenstein official coats of arms are public domain.
- Districts: D1980 (central & north-west), D1990 (west), D2000 (east), used as a filter and shown in the event details and feed list.
- Installable as an app (PWA): "Install" on the page shows the steps per platform; the last loaded events stay readable offline.
- In the welcome the clubs are pre-selected from the connection's approximate location (one lookup at get.geojs.io, fallback ipwho.is; no permission prompt, nothing stored), or from the browser language if that fails.
- Settings (gear in the header): one **main club** plus clubs you **also show**, language, light/dark, install, share; Help links to the subscribe page and the welcome. Those are the only things remembered on the device; searching and filtering never changes them. "My clubs | Everything" switches between your clubs (with a banner in your club's colours) and all of Switzerland. Tapping the Rotaract logo always returns to your "My clubs" view.
- `about.html`: "What is Rotaract?" as a scroll story (Learn · Help · Celebrate), then "your club" or "find your club", FAQ, `about-more.html` (Rotary, districts, the world: frosted panes over a Swiss map of the clubs by district and a world map) and `family.html` (the Rotary family: one tile each for Rotary, Rotaract, Interact, Youth Exchange & Rotex, RYLA, Inner Wheel, the Foundation and districts, logo from `site/img/fam/` (Rotary, Interact and RYLA from Wikimedia Commons, Rotex International and Inner Wheel from their own sites, Rotaract's from the app; the Foundation still shows an icon until `foundation.png` is added from the Brand Center), plus half a sentence, then the clubs by district). Club counts in the texts come from the data. Pictures for Learn · Help · Celebrate are `site/img/learn.jpg`, `help.jpg`, `party.jpg` (Rotaract Luzern photos), with an event picture whose title fits as fallback. All four languages.
- Remembers starred events on that device. Saved (starred) events are stored on the device too. Nothing is sent anywhere.
- Shareable: filters go into the URL, e.g. `?clubs=bern,luzern`, `?d=1980`, `?place=Luzern&r=50`, `?view=weekend`, `?mode=month`. A shared link with filters opens Discover, so it never mixes with your own clubs; anyone can open it without installing anything.

- UI in German, French, Italian or English: picked from the device language, switchable in the header, or `?lang=de`. Strings live in `site/i18n.js`.
- Share button per event: the link `e/<id>.html` shows title and picture when pasted into WhatsApp etc., then opens the app on that event (`?event=<id>`).
- Club pages: `club.html?id=bern` (on the club's colour wash; colour hero with Subscribe plus round icon buttons for the website and the `instagram`/`linkedin` links from `clubs.toml`, next event with countdown, news teasers, picture strip, more events, link to all events in Discover). The strip uses `photos` from `clubs.toml` if set, otherwise pictures of past events.
- A yellow banner appears when the data is older than 30 hours. The service worker is network-first for everything on the site (cache only as the offline or slow-network fallback, 2.5 s), so a new deploy shows on the next load without a hard refresh and there is no "new version" prompt.
- Hidden pages (not linked from the UI): `dev.html` (last build, per-club counts, failures, this device's service worker/caches/prefs, reset buttons) and `map.html` (events on the swisstopo map, via Leaflet from cdnjs).

Pages: `index.html`, `discover.html`, `event.html`, `club.html`, `about.html`, `about-more.html`, `family.html`, `subscribe.html`, `dev.html`, `map.html`; shared `app.css`, `i18n.js`, `common.js` (helpers, settings, cards, call to action) and `app.js` (home/discover), all in `site/`. The build copies them to `public/`, adds the per-event share pages under `public/e/` and `status.json` (last run, per-club counts, failures). Plain HTML/CSS/JS, no build step; the only library is Leaflet on the hidden map page.

Feeds, refreshed every 6 hours:
- one per club: `webcal://neyxo.github.io/rac-event-aggregation-tool/<club-id>.ics` (ids in `clubs.toml`)
- all clubs: `webcal://neyxo.github.io/rac-event-aggregation-tool/all.ics`

Members-only events are not included. Feeds and the site carry the last 24 months plus the future; `data/` keeps the full history.

## How events are tracked

Each run syncs Polaris into `data/<club-id>.json` and builds the feeds and site from those files. The history lives on the **`data` branch** (checked out into `data/` by the workflow and committed there), so `main` only ever has real changes. To work locally:

```bash
git worktree add data data
```

Each run then:

- **Only the last month and the future are refreshed.** Older events are frozen: kept for good and never re-downloaded or re-checked, even after Polaris drops or deletes them.
- **Changed events** (moved, renamed, …) are updated, and calendars pick up the change (higher `SEQUENCE`).
- **An event in that window that disappears from Polaris** is checked on its own first. Only if Polaris confirms it's gone (404 or login page) is it marked cancelled. It then shows as "Abgesagt: …" (in the club's language) until its date has passed, and after that it's dropped. If it reappears, it's active again.
- **Safety brake:** a run that would cancel more than half of a club's live events at once is refused, because that's almost certainly a Polaris problem. The club keeps its last good state.
- **If Polaris is unreachable**, the affected club or event keeps its last good state, the other clubs still update, and the workflow run is marked failed, so GitHub emails you.
- **Joint events** listed by several clubs appear once, because Polaris event ids are global.
- **Event pages** (picture URL, full description, registration deadline) are fetched once per event and again when the event changes, so a normal run stays at a few hundred requests.
- **Club news**: each club's news list page is read once per run into `data/news.json` (title, date, picture URL and link only, never the article) and shown as teasers on the club page and on Home. If that page fails, the last list stays and the run is not marked failed.

History starts with the current year; clubs with `backfill = true` import every past year on their first run.

**Locations** for the radius search come from swisstopo's free geocoder (covers CH + LI). It tries the event's location text, then its parts (e.g. "6005 Luzern"), then the club's `city`. Results are cached in `data/geocode.json`; edit an entry there to fix a wrong location.

## Run locally

```bash
python3 test_polaris_feed.py
python3 polaris_feed.py        # updates data/ (the data branch), writes feeds + site to public/
python3 -m http.server -d public 8000
```

Then open http://localhost:8000. Python 3.11+, no dependencies.

## Add a club

Add a `[[clubs]]` entry to `clubs.toml` (Polaris website, language, city). The club list comes from the club menu on https://rotaract.ch/de/organisation/.

## Hosting (GitHub)

- Settings → Pages → Source: **GitHub Actions**.
- Settings → Actions → General → Workflow permissions: **Read and write** (to commit `data/`).

The workflow `.github/workflows/feeds.yml` runs every 6 hours, and also on every push or manual run.

## Design lab

The side-by-side design variants used to pick the current look live on the local `design-lab` branch (`lab/`), served with `python3 -m http.server 8766` from the repo root at `/lab/events.html` etc. It is not pushed.

## Home

For members the home page is a personal overview: greeting and week line, the next event of your clubs (same pane as the club page), what changed since the last visit (NEU badges in the list), registration deadlines within three weeks (parsed into `deadline` in events.json; the app can't know whether you registered, so it never counts "open registrations"), saved events. Background is a wash of your clubs' colours; panes are frosted. Without a club the page stays in explore mode.
