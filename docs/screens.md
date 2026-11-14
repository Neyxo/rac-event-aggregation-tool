# Writing a screen

How a screen of the web app works: what it renders, where its data, texts and links come from. The app shell is `web/src/App.tsx`.

A screen is `web/src/screens/<Name>/<Name>.tsx`, with `<Name>.css` listed in `app.css` and `<Name>.test.tsx` beside it.

## The screen itself

- `export default function Name({ route }: ScreenProps)`. `route.params.id` is the id of `#/event/<id>` and `#/club/<id>`; `route.query` is the `URLSearchParams` after `?` in the hash (Discover's filters). The screen and its `DataBoundary` are remounted when the route name or id changes.
- Render what sits between `</header>` and `<nav>`: usually `<main className="...">` (`id="main"` on the skip-link screens), plus siblings such as the stale banner before `main`, the calendar sheet or the onboarding `<dialog>`.
- No wrapper elements: `app.css` has child selectors. Never render `header`, `nav`, `#frost` or `#toast`: App does.
- Add the screen to `ROUTE_META` in `App.tsx`: its `body[data-page]`, body class, default title, active tab, back button, and the class of its `<main>` for the skeleton.

## Data

- `const D = useData()`. The screen only renders once `events.json` is in: until then App's `DataBoundary` shows a skeleton, and the offline note when it can't be loaded. A screen has no loading or error states.
- `D` is a read-only snapshot: `D.data.events`, `D.data.clubs`, `D.clubs`, `D.settings`, `D.saved`.
- Read it with the functions of `lib/data`, which take the snapshot: `myClubs(D)`, `club(D, id)`, `nClubs(D)`, `isRac(c)`, `eventById(D, id)` (keeps the shared-link exception for a Rotary event). A component that shows any of it calls `useData()` itself, so it re-renders when the data changes.
- Change it only through `lib/data`'s actions: `setSettings(s)`, `toggleSaved(id)`, `setRotary(on)`. Every component that called `useData()` (or `useSaved(id)` for one star) re-renders.
- Cards tag NEW only below `<NewIds.Provider>` (Home).
- Status for the dev screen: `fetch("status.json")` yourself (type: `lib/types` `Status`).

## Logic, texts, links

- Logic is in `lib/` (dates, filters, calendar, changes, geo, rich, pillars, color, share, route) with tests; reuse it.
- Text: `t("key", vars)` for strings, `tx("key")` for lists, pairs, `nm` and `intl`, `nEvents(n)`, `LANG`, `LOCALE` (`i18n/index.ts`). A key built at run time needs a literal type: ``t(`ab_${k}` as const)`` with `k` a union, or a lookup table.
- Links are hashes: `href("event", id)`, `href("club", id)`, `href("discover", null, "clubs=bern")` (`lib/route`).
- In-page anchors (`#main`, `#results`, settings `#install`) would change the route: use `inPageLink("results")` (`src/router`).
- Leave the URL with `navigate()`. Discover writes its filters back with `replaceQuery(params)`.
- Share buttons: `shareUrl({ event: id })`, `shareUrl({ club: id })` or `shareUrl("about")` (`lib/share`).

## Shared pieces

- Sticky pieces (`components/Sticky`): `<Sh lv1>` and `<Sh>` for section headings, `<MorphHead className>` for the event and club head.
- Hooks (`src/hooks`): `useWash(c1, c2, c3)` for `body.wash`, `useTitle(text)` for a title of its own, `useStored(key, default)` for a `localStorage` value that re-renders, `useResize(ref, fn)` for something that follows an element's size.
- A top-bar button of the screen's own is `ROUTE_META`'s `extra` (About's share).
- `toast(msg, action?)` from `components/Toast`; `<Popup title onClose>` for a popup.
- Settings: `setTheme()` (`lib/store`) and `setRotary()` (`lib/data`) apply at once; `setLang()` (`i18n`) reloads the page, because every text is read once, at start.
- Map and AboutMore use Leaflet from npm. Map is lazy-loaded in `App.tsx`, so Leaflet is only fetched there; AboutMore imports it in an effect for the same reason.
- Home: `takeWelcome()` (`lib/route`) is true once when the app was opened with `?welcome`.
