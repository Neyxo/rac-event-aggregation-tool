/*
 * The app shell: one page, hash routes (#/, #/discover?..., #/event/<id> ...). #root is display: contents (app.css), so header#top,
 * the screen's main and nav#tabs are styled as children of body.
 *
 * Rendered here, in body order: #frost, the skip link (home/discover/calendar), header#top (TopBar), the screen, nav#tabs (Tabs), #toast, .fest (two days a year).
 * Per route (ROUTE_META below) App sets body[data-page], the body classes calpage / frosted, the default document.title, the active
 * top-bar button and tab and the back button. A new navigation scrolls to the top; back/forward restores the position.
 *
 * HOW A SCREEN WORKS (web/src/screens/<Name>.tsx):
 * - export default function Name({ route }: ScreenProps). route.params.id is the id of #/event/<id> and #/club/<id>; route.query is
 *   the URLSearchParams after "?" in the hash (Discover's filters). The screen (and its DataBoundary) is remounted when the route name or id changes.
 * - Render what sits between </header> and <nav>: usually <main className="..."> (id="main" on the skip-link screens), plus siblings such as the stale banner
 *   before main, the calendar sheet or the onboarding <dialog>.
 *   No wrapper elements: app.css has child selectors. Never render header, nav, #frost or #toast: App does.
 * - Data: const D = useData(). The screen only renders once events.json is in: until then App's DataBoundary shows a skeleton, and
 *   the offline note when it can't be loaded (no loading or error states in a screen). D is a read-only snapshot:
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
 *   useTitle(text) for a title of its own; useStored(key, default) for a localStorage value that re-renders; a top-bar button of
 *   the screen's own is ROUTE_META's extra (About's share). toast(msg, action?) from components/Toast; <Popup title onClose> for a popup.
 * - Share buttons: shareUrl({ event: id }), shareUrl({ club: id }) or shareUrl("about") (lib/share).
 * - Settings: setTheme() (lib/store) and setRotary() (lib/data) apply at once; setLang() (i18n) reloads the page (every text is
 *   read once, at start).
 * - Map and AboutMore use Leaflet from npm: import L from "leaflet" and "leaflet/dist/leaflet.css" inside the screen (Map is lazy-loaded
 *   here, so Leaflet is only fetched there; AboutMore should import("leaflet") in an effect for the same reason).
 * - Home: takeWelcome() (lib/route) is true once when the app was opened with ?welcome.
 */
import { lazy, useLayoutEffect, type ComponentType } from "react";
import { t } from "./i18n";
import type { Route, RouteName } from "./lib/route";
import { Tabs, TopBar, type Active } from "./components/Chrome";
import { Toast } from "./components/Toast";
import { Festive } from "./components/Festive";
import { DataBoundary } from "./components/Blocks";
import { LoadFailed } from "./lib/data";
import { inPageLink, scrollTarget, useNav, useRoute } from "./components/router";
import Home from "./screens/Home";
import Discover from "./screens/Discover";
import Calendar from "./screens/Calendar";
import Event from "./screens/Event";
import Club from "./screens/Club";
import Settings from "./screens/Settings";
import Subscribe from "./screens/Subscribe";
import About, { ShareButton as AboutShare } from "./screens/About";
import AboutMore from "./screens/AboutMore";
import Family from "./screens/Family";
import Public from "./screens/Public";
import Guide from "./screens/Guide";
import Words from "./screens/Words";
import Intl from "./screens/Intl";

// a screen's code that can't be fetched (offline, or replaced by a newer deploy) is shown like data that can't: the offline note,
// whose Refresh loads the app again
const screen = (load: () => Promise<{ default: ComponentType<ScreenProps> }>) => lazy(() => load().catch((e: unknown) => { throw new LoadFailed("screen code: " + String(e), { cause: e }); }));
const MapScreen = screen(() => import("./screens/Map"));  // Leaflet only loads here
const Dev = screen(() => import("./screens/Dev"));  // only developers ever open it

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
  /** a button of the screen's own at the start of the top bar's right side */
  extra?: ComponentType;
  /** the class of the screen's <main> (default "wrap"), for the skeleton and the offline note App shows in place of the screen */
  main?: string;
  /** skeleton rows while the data loads (the lists, an event); none otherwise */
  skel?: number;
}
const T = (s: string) => s + " · Rotaract Events";
export const ROUTE_META: Record<RouteName, Meta> = {
  home: { screen: Home, page: "home", active: "home", title: "Rotaract Events", skip: true, skel: 3 },
  discover: { screen: Discover, page: "discover", active: "discover", title: T("Discover"), skip: true, skel: 3 },
  calendar: { screen: Calendar, page: "calendar", cls: "calpage", active: "calendar", title: T("Calendar"), skip: true, main: "calwrap" },
  map: { screen: MapScreen, page: "map", cls: "calpage", active: "discover", back: true, title: T("Map"), main: "mapwrap" },
  event: { screen: Event, page: "event", active: null, back: true, title: "Rotaract Events", main: "wrap evpage", skel: 1 },
  club: { screen: Club, page: "club", active: null, back: true, title: "Rotaract Club", main: "wrap clubpage" },
  settings: { screen: Settings, page: "settings", active: "settings", title: T("Settings"), main: "wrap settings" },
  subscribe: { screen: Subscribe, page: "subscribe", active: null, back: true, title: T("Subscribe") },
  about: { screen: About, page: "about", active: "about", title: T("What is Rotaract?"), extra: AboutShare, main: "wrap about" },
  "about-more": { screen: AboutMore, page: "about-more", cls: "frosted", active: "about", back: true, title: T("Rotary, districts & the world"), main: "wrap more" },
  family: { screen: Family, page: "family", active: "about", back: true, title: T("The Rotary family"), main: "wrap fam" },
  public: { screen: Public, page: "public", active: "app", title: T("About this app") },
  guide: { screen: Guide, page: "guide", active: "about", back: true, title: T("New in the club"), main: "wrap fam" },
  words: { screen: Words, page: "words", active: "about", back: true, title: T("Rotaract words") },
  intl: { screen: Intl, page: "intl", active: "about", back: true, title: T("International events"), main: "wrap fam" },
  dev: { screen: Dev, page: "dev", active: "dev", title: T("Developer"), main: "wrap settings dev" },
};

/** The page around the screen: body[data-page], the page classes, the default title, and the scroll position (top for a new
 *  navigation, the old one for back/forward, again next frame after images). Rendered before the screen: React runs an earlier
 *  sibling's layout effects first, so the screen's own effects already see the new page and its scroll position. */
function Page({ meta, nav }: { meta: Meta; nav: ReturnType<typeof useNav> }) {
  useLayoutEffect(() => {
    const b = document.body;
    b.dataset.page = meta.page;
    b.classList.toggle("calpage", meta.cls === "calpage"); b.classList.toggle("frosted", meta.cls === "frosted");
    document.title = meta.title;
  }, [meta]);
  useLayoutEffect(() => {
    const y = scrollTarget(nav);
    scrollTo(0, y);
    if (y) { const id = requestAnimationFrame(() => scrollTo(0, y)); return () => cancelAnimationFrame(id); }
  }, [nav.id]);
  return null;
}

export default function App() {
  const route = useRoute(), nav = useNav(), meta = ROUTE_META[route.name], Screen = meta.screen, Extra = meta.extra;
  return (
    <>
      <Page meta={meta} nav={nav} />
      <div id="frost" aria-hidden="true" />
      {meta.skip && <a className="skip" {...inPageLink("main")}>{t("skip_to")}</a>}
      <TopBar active={meta.active} back={meta.back} extra={Extra && <Extra />} />
      <DataBoundary key={route.name + "/" + route.params.id} nav={nav.id} main={meta.main ?? "wrap"} skel={meta.skel ?? 0}>
        <Screen route={route} />
      </DataBoundary>
      <Tabs active={meta.active} />
      <Toast />
      <Festive page={meta.page} id={route.params.id} />
    </>
  );
}
