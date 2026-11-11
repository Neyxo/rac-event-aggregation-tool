# Layers

Everything beyond the clubs' own public events.

## Members-only events

Taken from the public agenda list, which shows title, date, place, teaser, picture and deadline even for members-only events. They are marked "Members only" in the app and in the feed title. Details, registration and "add to calendar" stay on Polaris behind the login. Events a club hides from its agenda entirely are not visible.

There is no login in the app, by design: a static site cannot log in to Polaris for you, and no credentials are stored anywhere.

## International events

REM, EUCO and their pre- and post-trips come from Rotaract Europe's events API. Events without a feed (such as the Rotary International Convention) are entered by hand as `[[events]]` in `clubs.toml`. They appear as "Rotaract International" (`international.ics`), show on every member's Home, and are explained on `intl.html`.

## Rotary events (off by default)

The events Rotary clubs share with other clubs, from each district site's agenda and "events of other clubs" list. One entry per district in `clubs.toml` (`source = "rotary"`), one feed each (`rotary1980.ics` …).

- Built from the list items only; no event page is fetched.
- Kept under their own key in `events.json` and only loaded when **Settings › Show Rotary events** is on, so Rotaract events are never drowned.
- Never in `all.ics`, never a main club, never on a guest's Home.

## Instagram pictures (off until set up)

With two repository secrets (`INSTAGRAM_TOKEN`, `INSTAGRAM_USER_ID`) the build reads the latest public posts of each club that has an `instagram` link, through one professional Instagram account and Meta's Business Discovery. The pictures replace the picture strip on the club page and each opens its post.

- Without the secrets no request is made and nothing changes.
- A club needs a public, professional Instagram account; otherwise it keeps its normal pictures.
- The token is only sent to `graph.facebook.com`, never printed and never written to a file.
- Ask a club before showing its pictures.
