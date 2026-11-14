# The site

One page app in React 19 and TypeScript, built with Vite. `npm run build` writes it to `dist/`; `polaris_feed.py` copies `dist/` into `public/` and adds `events.json`, the feeds, the share pages of events and clubs (`e/`, `c/`) and `status.json`. The only other library is Leaflet, on the map screens.

## Layout of `web/`

| Path | What it is |
|---|---|
| `index.html` | The one page. |
| `src/App.tsx` | The shell: top bar, screen, tabs, toast; one line per route. Its top comment explains how a screen is built. |
| `src/screens/` | One folder per route: the screen, its stylesheet and its test (`Home/Home.tsx`, `Home.css`, `Home.test.tsx`). |
| `src/components/` | Cards, chips, popup, toast, each in a folder with its stylesheet; the router, the icons and the shared hooks as single files. |
| `src/lib/` | Logic with tests: dates, filters, calendar, changes since the last visit, geo, share links, routes, the device store. |
| `src/i18n/` | The texts, one file per language. |
| `src/app.css` | The list of all stylesheets, in cascade order. Each one sits next to what it styles (`components/Chrome.css`, `screens/Home.css` …); shared looks are in `src/styles/` (see [design rules](design.md)). |
| `static/` | Copied as is: icons, crests, pictures, the manifest, `sw.js`. |
| `e2e/` | The browser tests (Playwright, `npm run e2e`). |

`npm test` runs the unit tests (Vitest), `npm run typecheck` the TypeScript check, `npm run lint` the linters (oxlint for TypeScript; Biome for the formatting, the CSS and a few readability rules, see `biome.jsonc`), `npm run format` rewrites every file in the one format, `npm run dev` the app with the real data from `public/`.

## Routes

Hash routes, so every screen is the same `index.html` and works on GitHub Pages and offline.

| Route | What it is |
|---|---|
| `#/` | **Home**: your main club and the clubs you follow, the next event, deadlines, saved events, news. Includes the international events. Without a club: explore mode. |
| `#/discover?…` | **Discover**: all of Rotaract with search and filters. Filters go into the URL, so a view can be shared. |
| `#/calendar` | **Calendar**: a full-screen month; a day opens a sheet with its events. |
| `#/map` | Events on a map of Switzerland & Liechtenstein. |
| `#/event/<id>` | One event: picture, when, where, deadline, description, register on Polaris, add to calendar, share. |
| `#/club/<id>` | One club: next event, About this club (how to join, partner clubs), news, projects, pictures, more events. |
| `#/settings` | Main club, clubs to also show, Rotary events on or off, language, appearance, install, share. |
| `#/subscribe` | Calendar help: the "Add a calendar" flow, common problems and their fixes, questions. The feeds themselves are listed on the developer page. |
| `#/about`, `#/about-more`, `#/family` | What Rotaract is, Rotary and the districts, the Rotary family. |
| `#/public`, `#/guide`, `#/words`, `#/intl` | This app, New in the club, Rotaract words, International events. |
| `#/dev` | Developer: last build, per-club counts, failures, warnings, preview switches. Ten quick taps on the "made by" line in Settings unlock it. |

An unknown route is Home. `?lang=` before the hash picks the language for that visit.

## Languages

German, French, Italian and English, one file each in `web/src/i18n/`. `en.ts` is the source of truth; the others are typed against it (`Messages`), so a missing or misspelled key in any language fails `npm run typecheck` and `npm run build`. `t("key")` takes only keys with a plain string value, so a typo there fails too.

## Share pages

A shared link opens a tiny page with its own preview (title, text, picture for WhatsApp, iMessage, Slack...) that forwards into the app:

- `e/<id>.html`: an event, in its club's language. Written by `polaris_feed.py`.
- `c/<id>.html`: a club, with its about sentence and number of upcoming events. Written by `polaris_feed.py`.
- `s/<lang>/<page>.html`: the other screens, per language. Written by the Vite build.

All three are the same page, `share.template.html`, filled in by either side.

## Navigation

One top bar (Rotaract, This app, Settings) and three bottom tabs (Home, Discover, Calendar) on every screen. On event and club screens the head sticks under the top bar and compacts as you scroll. Section headings stick in two levels on one frosted bar.

## What the device remembers

Main club, followed clubs, language, theme, starred events, whether Rotary events are shown, what was new at the last visit, whether the welcome steps and the guide were seen, and the developer switches. All in the browser's local storage (`rac.*`); nothing is sent anywhere. The location is only asked of the device after a tap (falling back to the connection's rough position where the device has none) and kept for the open tab.

## Offline and updates

Installable as an app. The service worker (`static/sw.js`) is network-first with the cache as fallback, so a new deploy shows on the next load and the last loaded events stay readable offline. `events.json` and `status.json` are answered from the cache while the cached copy is younger than 30 minutes, so switching screens or reopening the app costs no download. A banner appears when the data is older than 30 hours.

## Club texts

`how` in `clubs.toml` is plain text with a little structure, read by `parseRich()` in `web/src/lib/rich.ts`:

```
## Heading
1. Step title: one line of text
- a point for the check list
**bold**
```
