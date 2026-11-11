/*
 * The app shell: one page, hash routes (#/, #/discover?..., #/event/<id> ...). #root is display: contents (app.css), so header#top,
 * the screen's main and nav#tabs are styled as children of body.
 *
 * Rendered here, in body order: #frost, the skip link (home/discover/calendar), header#top (TopBar), the screen, nav#tabs (Tabs), #toast.
 * Per route (ROUTE_META below) App sets body[data-page], the body classes calpage / frosted, the default document.title, the active
 * top-bar button and tab and the back button. A new navigation scrolls to the top; back/forward restores the position.
 *
 * HOW A SCREEN WORKS (web/src/screens/<Name>.tsx):
 * - export default function Name({ route }: ScreenProps). route.params.id is the id of #/event/<id> and #/club/<id>; route.query is
 *   the URLSearchParams after "?" in the hash (Discover's filters). The screen is remounted when the route name or id changes.
 * - Render what sits between </header> and <nav>: usually <main className="..."> (id="main" on the skip-link screens), plus siblings such as the stale banner
 *   before main, the calendar sheet or the onboarding <dialog>.
 *   No wrapper elements: app.css has child selectors. Never render header, nav, #frost or #toast: App does.
 * - Data: const { ready, error, D } = useData(); render <Skel/>s until ready, <LoadError/> on error. D is a read-only snapshot:
 *   D.data.events / D.data.clubs / D.clubs / D.settings / D.saved, with myClubs(), club(id), isRac(), nClubs(), eventById(id) (keeps
 *   the shared-link exception for a Rotary event) from lib/data. Change it only through lib/data's actions: setSettings(s),
 *   toggleSaved(id), setRotary(on); every component that called useData() (or useSaved(id) for one star) re-renders.
 *   Cards tag NEW only below <NewIds.Provider> (Home). Status for the dev screen: fetch("status.json") yourself (types: lib/types Status).
 * - Logic is in lib/ (dates, filters, calendar, changes, geo, rich, pillars, color, share, route) with tests; reuse it, don't re-port.
 * - Text: t("key", vars) for strings, tx("key") for lists/pairs/nm/intl, nEvents(n), LANG, LOCALE (i18n/index.ts). A key built at
 *   run time needs a literal type: t(`ab_${k}` as const) with k a union, or a lookup table.
 * - Links are hashes: href("event", id), href("club", id), href("discover", null, "clubs=bern") (lib/route). In-page anchors (#main,
 *   #results, settings #install) would change the route: use inPageLink("results") (components/router). Leave the URL with navigate().
 *   Discover writes its filters back with replaceQuery(params) instead of history.replaceState.
 * - Hooks (components/hooks): useWash(c1, c2, c3) for body.wash; useStickyHeads() in every screen with .sh headings; useMorphHead(ref, ready)
 *   for the event / club head (render <i className="sent" aria-hidden="true" /> right before it, className static incl. "morph");
 *   useTitle(text) for a title of its own; useStored(key, default) for a localStorage value that re-renders; useTopBarExtra(node) for a
 *   top-bar button (About's share). toast(msg, action?) from components/Toast; <Popup title onClose> for a popup.
 * - Share buttons: shareUrl({ event: id }), shareUrl({ club: id }) or shareUrl("about") (lib/share).
 * - Settings: setTheme() (lib/store) and setRotary() (lib/data) apply at once; setLang() (i18n) reloads the page (every text is
 *   read once, at start).
 * - Map and AboutMore use Leaflet from npm: import L from "leaflet" and "leaflet/dist/leaflet.css" inside the screen (Map is lazy-loaded
 *   here, so Leaflet is only fetched there; AboutMore should import("leaflet") in an effect for the same reason).
 * - Home: takeWelcome() (lib/route) is true once when the app was opened with ?welcome.
 */
import { lazy, Suspense, useLayoutEffect, useState, type ComponentType, type ReactNode } from "react";
import { t } from "./i18n";
import type { Route, RouteName } from "./lib/route";
import { ExtraContext, Tabs, TopBar, type Active } from "./components/Chrome";
import { Toast } from "./components/Toast";
import { inPageLink, scrollTarget, useNav, useRoute } from "./components/router";
import Home from "./screens/Home";
import Discover from "./screens/Discover";
import Calendar from "./screens/Calendar";
import Event from "./screens/Event";
import Club from "./screens/Club";
import Settings from "./screens/Settings";
import Subscribe from "./screens/Subscribe";
import About from "./screens/About";
import AboutMore from "./screens/AboutMore";
import Family from "./screens/Family";
import Public from "./screens/Public";
import Guide from "./screens/Guide";
import Words from "./screens/Words";
import Intl from "./screens/Intl";
import Dev from "./screens/Dev";

const MapScreen = lazy(() => import("./screens/Map"));  // Leaflet only loads here

export interface ScreenProps { route: Route }
interface Meta {
  screen: ComponentType<ScreenProps>;
  /** body[data-page] */
  page: string;
  /** body classes ("calpage": the screen is one flex column, no page scroll) */
  cls?: "calpage" | "frosted";
  active: Active;
  back?: boolean;
  /** the default <title>; a screen with a title of its own calls useTitle() */
  title: string;
  /** the "skip to events" link, on the screens that open on a long list */
  skip?: boolean;
}
const T = (s: string) => s + " · Rotaract Events";
export const ROUTE_META: Record<RouteName, Meta> = {
  home: { screen: Home, page: "home", active: "home", title: "Rotaract Events", skip: true },
  discover: { screen: Discover, page: "discover", active: "discover", title: T("Discover"), skip: true },
  calendar: { screen: Calendar, page: "calendar", cls: "calpage", active: "calendar", title: T("Calendar"), skip: true },
  map: { screen: MapScreen, page: "map", cls: "calpage", active: "discover", back: true, title: T("Map") },
  event: { screen: Event, page: "event", active: null, back: true, title: "Rotaract Events" },
  club: { screen: Club, page: "club", active: null, back: true, title: "Rotaract Club" },
  settings: { screen: Settings, page: "settings", active: "settings", title: T("Settings") },
  subscribe: { screen: Subscribe, page: "subscribe", active: null, back: true, title: T("Subscribe") },
  about: { screen: About, page: "about", active: "about", title: T("What is Rotaract?") },
  "about-more": { screen: AboutMore, page: "about-more", cls: "frosted", active: "about", back: true, title: T("Rotary, districts & the world") },
  family: { screen: Family, page: "family", active: "about", back: true, title: T("The Rotary family") },
  public: { screen: Public, page: "public", active: "app", title: T("About this app") },
  guide: { screen: Guide, page: "guide", active: "about", back: true, title: T("New in the club") },
  words: { screen: Words, page: "words", active: "about", back: true, title: T("Rotaract words") },
  intl: { screen: Intl, page: "intl", active: "about", back: true, title: T("International events") },
  dev: { screen: Dev, page: "dev", active: "dev", title: T("Developer") },
};

export default function App() {
  const route = useRoute(), nav = useNav(), meta = ROUTE_META[route.name], Screen = meta.screen;
  const [extra, setExtra] = useState<ReactNode>(null);
  // body[data-page], the page classes and the default title; before the screen's own effects (useTitle) run
  useLayoutEffect(() => {
    const b = document.body;
    b.dataset.page = meta.page;
    b.classList.toggle("calpage", meta.cls === "calpage"); b.classList.toggle("frosted", meta.cls === "frosted");
    document.title = meta.title;
  }, [meta]);
  // after the new screen is in the DOM: top for a new navigation, the old position for back/forward (again next frame, after images)
  useLayoutEffect(() => {
    const y = scrollTarget(nav);
    scrollTo(0, y);
    if (y) { const id = requestAnimationFrame(() => scrollTo(0, y)); return () => cancelAnimationFrame(id); }
  }, [nav.id]);
  return (
    <ExtraContext.Provider value={setExtra}>
      <div id="frost" aria-hidden="true" />
      {meta.skip && <a className="skip" {...inPageLink("main")}>{t("skip_to")}</a>}
      <TopBar active={meta.active} back={meta.back} extra={extra} />
      <Suspense fallback={null}>
        <Screen key={route.name + "/" + route.params.id} route={route} />
      </Suspense>
      <Tabs active={meta.active} />
      <Toast />
    </ExtraContext.Provider>
  );
}
