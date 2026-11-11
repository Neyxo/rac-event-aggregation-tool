# The site

Plain HTML, CSS and JavaScript in `site/`. The build copies it to `public/` and adds `events.json`, the feeds, one share page per event (`e/<id>.html`) and `status.json`. The only library is Leaflet, on the map pages.

## Pages

| Page | What it is |
|---|---|
| `index.html` | **Home**: your main club and the clubs you follow, the next event, deadlines, saved events, news. Includes the international events. Without a club: explore mode. |
| `discover.html` | **Discover**: all of Rotaract with search and filters. Filters go into the URL, so a view can be shared. |
| `calendar.html` | **Calendar**: a full-screen month; a day opens a sheet with its events. |
| `map.html` | Events on a map of Switzerland & Liechtenstein. |
| `event.html?id=…` | One event: picture, when, where, deadline, description, register on Polaris, add to calendar, share. |
| `club.html?id=…` | One club: next event, About this club (how to join, partner clubs), news, projects, pictures, more events. |
| `settings.html` | Main club, clubs to also show, Rotary events on or off, language, appearance, install, share. |
| `subscribe.html` | The calendar feeds and how to subscribe per platform. |
| `about.html`, `about-more.html`, `family.html` | What Rotaract is, Rotary and the districts, the Rotary family. |
| `public.html`, `guide.html`, `words.html`, `intl.html` | This app, New in the club, Rotaract words, International events. |
| `dev.html` | Not linked: last build, per-club counts, failures, reset buttons. |

Shared code: `app.css`, `i18n.js` (all texts, four languages), `common.js` (helpers, cards, chips, settings), `app.js` (Home and Discover), `calendar.js`.

## Navigation

One top bar (Rotaract, This app, Settings) and three bottom tabs (Home, Discover, Calendar) on every page. On event and club pages the head sticks under the top bar and compacts as you scroll. Section headings stick in two levels on one frosted bar.

## What the device remembers

Main club, followed clubs, language, theme, starred events, whether Rotary events are shown, and what was new at the last visit. All in the browser's local storage; nothing is sent anywhere. The approximate location is only looked up after a tap and kept for the open tab.

## Offline and updates

Installable as an app. The service worker is network-first with the cache as fallback, so a new deploy shows on the next load and the last loaded events stay readable offline. A banner appears when the data is older than 30 hours.

## Club texts

`how` in `clubs.toml` is plain text with a little structure, drawn by `rich()` in `common.js`:

```
## Heading
1. Step title: one line of text
- a point for the check list
**bold**
```
