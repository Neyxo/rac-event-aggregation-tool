/*
 * The app shell: one page, hash routes (#/, #/discover?..., #/event/<id> ...). #root is display: contents (app.css), so header#top,
 * the screen's main and nav#tabs are styled as children of body.
 *
 * Rendered here, in body order: #frost, the skip link (home/discover/calendar), header#top (TopBar), the screen, nav#tabs (Tabs), #toast, .fest (two days a year).
 * Per route (ROUTE_META below) App sets body[data-page], the body classes calpage / frosted, the default document.title, the active
 * top-bar button and tab and the back button. A new navigation scrolls to the top; back/forward restores the position.
 *
 * How to write a screen: docs/screens.md.
 */
import { lazy, useLayoutEffect, type ComponentType } from "react";
import { t } from "./i18n";
import type { Route, RouteName } from "./lib/route";
import { Tabs, TopBar, type Active } from "./components/Chrome/Chrome";
import { Toast } from "./components/Toast/Toast";
import { Festive } from "./components/Festive/Festive";
import { DataBoundary } from "./components/DataBoundary/DataBoundary";
import { LoadFailed, retryLoad } from "./lib/data";
import { inPageLink, onNav, scrollTarget, useNav, useRoute } from "./router";
import Home from "./screens/Home/Home";
import Discover from "./screens/Discover/Discover";
import Calendar from "./screens/Calendar/Calendar";
import Event from "./screens/Event/Event";
import Club from "./screens/Club/Club";
import Settings from "./screens/Settings/Settings";
import Subscribe from "./screens/Subscribe/Subscribe";
import About, { ShareButton as AboutShare } from "./screens/About/About";
import AboutMore from "./screens/AboutMore/AboutMore";
import Family from "./screens/Family/Family";
import Public from "./screens/Public/Public";
import Guide from "./screens/Guide/Guide";
import Words from "./screens/Words/Words";
import Intl from "./screens/Intl/Intl";

// a screen's code that can't be fetched (offline, or replaced by a newer deploy) is shown like data that can't: the offline note,
// whose Refresh loads the app again
const screen = (load: () => Promise<{ default: ComponentType<ScreenProps> }>) =>
  lazy(() =>
    load().catch((e: unknown) => {
      throw new LoadFailed("screen code: " + String(e), { cause: e });
    }),
  );
const MapScreen = screen(() => import("./screens/Map/Map")); // Leaflet only loads here
const Review = screen(() => import("./screens/Review/Review")); // two weeks a year, or from a shared link
const Dev = screen(() => import("./screens/Dev/Dev")); // only developers ever open it

// a load that failed is tried again by the first screen of the next navigation (the DataBoundary forgets the failure then)
onNav(retryLoad);

export interface ScreenProps {
  route: Route;
}
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
  calendar: {
    screen: Calendar,
    page: "calendar",
    cls: "calpage",
    active: "calendar",
    title: T("Calendar"),
    skip: true,
    main: "calwrap",
  },
  map: {
    screen: MapScreen,
    page: "map",
    cls: "calpage",
    active: "discover",
    back: true,
    title: T("Map"),
    main: "mapwrap",
  },
  event: {
    screen: Event,
    page: "event",
    active: null,
    back: true,
    title: "Rotaract Events",
    main: "wrap evpage",
    skel: 1,
  },
  club: { screen: Club, page: "club", active: null, back: true, title: "Rotaract Club", main: "wrap clubpage" },
  settings: { screen: Settings, page: "settings", active: "settings", title: T("Settings"), main: "wrap settings" },
  subscribe: { screen: Subscribe, page: "subscribe", active: null, back: true, title: T("Subscribe") },
  about: {
    screen: About,
    page: "about",
    active: "about",
    title: T("What is Rotaract?"),
    extra: AboutShare,
    main: "wrap about",
  },
  "about-more": {
    screen: AboutMore,
    page: "about-more",
    cls: "frosted",
    active: "about",
    back: true,
    title: T("Rotary, districts & the world"),
    main: "wrap more",
  },
  family: {
    screen: Family,
    page: "family",
    active: "about",
    back: true,
    title: T("The Rotary family"),
    main: "wrap fam",
  },
  public: { screen: Public, page: "public", active: "app", title: T("About this app") },
  guide: { screen: Guide, page: "guide", active: "about", back: true, title: T("New in the club"), main: "wrap fam" },
  words: { screen: Words, page: "words", active: "about", back: true, title: T("Rotaract words") },
  intl: { screen: Intl, page: "intl", active: "about", back: true, title: T("International events"), main: "wrap fam" },
  review: { screen: Review, page: "review", active: null, back: true, title: T("Year in review") },
  dev: { screen: Dev, page: "dev", active: "dev", title: T("Developer"), main: "wrap settings dev" },
};

/** The page around the screen: body[data-page], the page classes, the default title, and the scroll position (top for a new
 *  navigation, the old one for back/forward, again next frame after images). Rendered before the screen: React runs an earlier
 *  sibling's layout effects first, so the screen's own effects already see the new page and its scroll position. */
function Page({ meta, nav }: { meta: Meta; nav: ReturnType<typeof useNav> }) {
  useLayoutEffect(() => {
    const b = document.body;
    b.dataset.page = meta.page;
    b.classList.toggle("calpage", meta.cls === "calpage");
    b.classList.toggle("frosted", meta.cls === "frosted");
    document.title = meta.title;
  }, [meta]);
  useLayoutEffect(() => {
    const y = scrollTarget(nav);
    scrollTo(0, y);
    if (y) {
      const id = requestAnimationFrame(() => scrollTo(0, y));
      return () => cancelAnimationFrame(id);
    }
  }, [nav.id]);
  return null;
}

export default function App() {
  const route = useRoute();
  const nav = useNav();
  const meta = ROUTE_META[route.name];
  const Screen = meta.screen;
  const Extra = meta.extra;
  return (
    <>
      <Page meta={meta} nav={nav} />
      <div id="frost" aria-hidden="true" />
      {meta.skip && (
        <a className="skip" {...inPageLink("main")}>
          {t("skip_to")}
        </a>
      )}
      <TopBar active={meta.active} back={meta.back} extra={Extra && <Extra />} />
      <DataBoundary
        key={route.name + "/" + route.params.id}
        nav={nav.id}
        main={meta.main ?? "wrap"}
        skel={meta.skel ?? 0}
      >
        <Screen route={route} />
      </DataBoundary>
      <Tabs active={meta.active} />
      <Toast />
      <Festive page={meta.page} id={route.params.id} />
    </>
  );
}
