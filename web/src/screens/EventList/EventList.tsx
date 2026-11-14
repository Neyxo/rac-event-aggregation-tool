// What Home and Discover share: the filter state and its URL, the view switch, the list head,
// the event list with month headings, the stale banner and the footer. The filter logic itself is lib/filters.ts.
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { nEvents, t, type StrKey } from "../../i18n";
import { fmt } from "../../lib/dates";
import { devFlag } from "../../lib/dev";
import { fromParams, radiusOf, toParams, type Filters, type ListResult, type View } from "../../lib/filters";
import { geocode } from "../../lib/geo";
import { href } from "../../lib/route";
import type { Coords, Event } from "../../lib/types";
import { EventCard, Footer, Sh, Skel, replaceQuery, toast, useData, useStickyHeads } from "../../components";

export type Page = "home" | "discover";

export interface FilterApi {
  /** the controls: chips, district, place, radius, the pressed view, the place it was geocoded to */
  live: Filters;
  /** what the list shows: the URL's filters, around the place they were drawn at; null while a place from the URL is still being
   *  geocoded or the device position looked up (the list shows its skeleton instead of everything for a moment) */
  shown: Filters | null;
  /** the line under the place field */
  hint: string;
  /** the place field as typed; it only counts once committed (change event) */
  placeText: string;
  setPlaceText(text: string): void;
  /** the search field: the list follows 150 ms after the last key */
  setQ(q: string): void;
  /** change the controls; draw: also redraw the list */
  update(patch: Partial<Filters>, draw?: boolean): void;
  draw(): void;
  setView(v: View): void;
  locate(): void;
  setPlace(text: string): Promise<Coords | null>;
  clear(): void;
}

interface FilterState {
  /** the controls */
  live: Filters;
  /** the controls as the list was last drawn with them: written to the URL; null while the first draw waits for a place */
  drawn: Filters | null;
  hint: string;
  placeText: string;
}
// The steps the state takes, each a plain function of the state before it: a handler that takes several in a row, or one after an
// answer that came later (a geocoded place, the device position), always continues from the latest state.
type Step = (s: FilterState) => FilterState;
const patch =
  (p: Partial<Filters>): Step =>
  (s) => ({ ...s, live: { ...s.live, ...p } });
const draw: Step = (s) => ({ ...s, drawn: s.live });
const say =
  (hint: string): Step =>
  (s) => ({ ...s, hint });
const steps =
  (...list: Step[]): Step =>
  (s) =>
    list.reduce((x, f) => f(x), s);
/** a view picked; "near" without a position is drawn once the position is in (the caller asks for it) */
const view =
  (v: View): Step =>
  (s) =>
    v === "near" && !s.live.center ? patch({ view: v })(s) : steps(patch({ view: v }), draw)(s);
/** the position can't be had: a list waiting for "near me" would wait forever */
const notNear: Step = (s) => (s.live.view === "near" ? view("all")(s) : s);

/** The list follows the URL (#/discover?q=...&view=...), so a reload or a shared link shows the same list. The controls (live) change
 *  at once, but the list only follows on draw(), which has them written to the URL: a place counts once it is geocoded, a search
 *  150 ms after the last key. Where the list is centred (a geocoded place, the device position) is not in the URL: the draw keeps it.
 *  Set up once per navigation (Home and Discover remount on one): the controls start from the URL; init adjusts them (a guest's Home
 *  starts at the position found earlier in this tab). */
export function useFilters(query: URLSearchParams, page: Page, init: (f: Filters) => Filters = (f) => f): FilterApi {
  const D = useData();
  const isClub = (id: string) => !!D.clubs[id];
  const [state, set] = useState<FilterState>(() => {
    const live = init(fromParams(query, isClub));
    const waiting = !!live.place || (live.view === "near" && !live.center);
    return { live, drawn: waiting ? null : live, hint: "", placeText: live.place };
  });
  const { live, drawn } = state;
  const timer = useRef(0);

  // a draw is written to the URL; before the paint, so the list never shows with the filters of the draw before
  useLayoutEffect(() => {
    if (!drawn) return;
    const q = toParams(drawn);
    if (q.toString() !== (location.hash.split("?")[1] ?? "")) replaceQuery(q);
  }, [drawn]);

  const locate = () => {
    if (!navigator.geolocation) {
      toast(t("loc_none"));
      set(notNear);
      return;
    }
    set(say(t("locating")));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        set((s) => {
          // Home has no radius control: the "near" view then means 25 km
          const r = page === "discover" ? s.live.r || "25" : s.live.r;
          const here = {
            center: [pos.coords.latitude, pos.coords.longitude] as Coords,
            centerLabel: t("you"),
            place: "",
            r,
          };
          return steps(patch(here), draw)({ ...s, placeText: "", hint: t("your_location") });
        }),
      () => {
        toast(t("loc_na"));
        set(steps(say(t("loc_na")), notNear));
      },
    );
  };
  const setView = (v: View) => {
    set(view(v));
    if (v === "near" && !live.center) locate();
  };
  /** the place geocoded and the list drawn around it; returns where it is, null when it wasn't found */
  const setPlace = async (text: string): Promise<Coords | null> => {
    set(steps(say(""), patch({ center: null })));
    let hit: Awaited<ReturnType<typeof geocode>> = null;
    let hint = "";
    if (text.trim()) {
      try {
        hit = await geocode(text);
        hint = hit ? "📍 " + hit.label : t("place_nf");
      } catch {
        hint = t("place_err");
      }
    }
    set((s) => {
      // a place without a radius would filter nothing
      const found = hit ? { center: hit.coords, centerLabel: hit.label, r: s.live.r || "25" } : {};
      return steps(say(hint), patch(found), draw)(s);
    });
    return hit ? hit.coords : null;
  };
  const setQ = (q: string) => {
    set(patch({ q }));
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => set(draw), 150);
  };
  const clear = () =>
    set((s) =>
      steps(
        patch({ q: "", place: "", r: "", center: null, d: new Set(), clubs: new Set() }),
        view("all"),
      )({ ...s, placeText: "", hint: "" }),
    );

  // the place from the URL geocoded, or the position looked up for "near me"; the list is drawn once that is in. stale: this
  // screen is gone (or, in development, React set the effect up a second time): the later answer starts nothing more.
  const start = useEffectEvent(async (stale: () => boolean) => {
    const at = live.place ? await setPlace(live.place) : live.center;
    if (!stale() && live.view === "near" && !at) locate();
  });
  useEffect(() => {
    let gone = false;
    void start(() => gone);
    return () => {
      gone = true;
      clearTimeout(timer.current);
    };
  }, []);
  const shown = drawn && { ...fromParams(query, isClub), center: drawn.center, centerLabel: drawn.centerLabel };
  return {
    live,
    shown,
    hint: state.hint,
    placeText: state.placeText,
    setPlaceText: (placeText) => set((s) => ({ ...s, placeText })),
    setQ,
    update: (p, redraw = false) => set(redraw ? steps(patch(p), draw) : patch(p)),
    draw: () => set(draw),
    setView,
    locate,
    setPlace,
    clear,
  };
}

/** "Last updated ..., may be out of date": events.json is more than 30 hours old */
export function StaleBanner() {
  const D = useData();
  const generated = new Date(D.data.generated);
  const stale = Date.now() - generated.getTime() > 30 * 3600e3 || !!devFlag("Stale");
  return (
    <div className="banner" role="status" hidden={!stale}>
      {stale ? t("stale", { t: fmt.stamp.format(generated) }) : null}
    </div>
  );
}

/** the list title, the count line and Clear; sticks under the top bar */
export function ListHead({
  titleId,
  title,
  summary,
  clear,
  onClear,
}: {
  titleId?: string;
  title: string;
  summary: string;
  clear: boolean;
  onClear: () => void;
}) {
  useStickyHeads();
  return (
    <div className="list-head sh lv1">
      <h3 id={titleId}>{title}</h3>
      <div className="summary">
        <span aria-live="polite">{summary}</span>
        <button type="button" className="clear" hidden={!clear} onClick={onClear}>
          {t("clear")}
        </button>
      </div>
    </div>
  );
}

const VIEW_KEY: Record<View, StrKey> = { all: "v_all", near: "v_near", saved: "v_saved", past: "v_past" };
/** the view switch; pressed: the current view */
export function Views({ views, pressed, onPick }: { views: View[]; pressed: View; onPick: (v: View) => void }) {
  return (
    <div className="seg views glass" role="group" aria-label={t("filters")}>
      {views.map((v) => (
        <button key={v} type="button" aria-pressed={pressed === v} onClick={() => onPick(v)}>
          {t(VIEW_KEY[v])}
        </button>
      ))}
    </div>
  );
}

/** "12 events · within 25 km of Luzern · 3 without a known location hidden"; the title and the pressed view already say which events */
export function summaryText(res: ListResult, f: Filters): string {
  const parts = [nEvents(res.matches.length)];
  const radius = radiusOf(f);
  if (f.center && radius) parts.push(t("within", { r: radius, place: f.centerLabel }));
  if (res.noLocation) parts.push(t("no_location", { n: res.noLocation }));
  return parts.join(" · ");
}

/** the cards with a heading per month, in one flat run (the headings stick, each pushing the one before it out) */
function MonthRun({ events }: { events: Event[] }) {
  let month = "";
  return (
    <>
      {events.flatMap((e, i) => {
        const m = fmt.month.format(new Date(e.start));
        const card = <EventCard key={e.id} e={e} i={i} />;
        if (m === month) return [card];
        month = m;
        return [<Sh key={"m" + m}>{m}</Sh>, card];
      })}
    </>
  );
}

/** the list: the skeleton until the first draw, "nothing matches" with a way out, or the cards; a guest's Home links to Discover
 *  when it shows only the first 12 */
export function Results({ res, view, onClear }: { res: ListResult | null; view: View; onClear: () => void }) {
  if (!res)
    return (
      <div id="results" aria-busy="true">
        <Skel />
        <Skel />
        <Skel />
      </div>
    );
  return (
    <div id="results">
      {res.matches.length ? null : (
        <div className="empty">
          {view === "saved" ? t("empty_saved") : t("empty")}
          <br />
          <button className="linkbtn" type="button" onClick={onClear}>
            {t("show_all")}
          </button>
        </div>
      )}
      <MonthRun events={res.shown} />
      {res.shown.length < res.matches.length ? (
        <div className="links center">
          <a href={href("discover")}>{t("discover_cta")}</a>
        </div>
      ) : null}
    </div>
  );
}

/** when the data was fetched, where registration happens, who made the app */
export function Foot() {
  const D = useData();
  return (
    <div id="foot">
      <div className="meta">
        {t("updated", { t: fmt.stamp.format(new Date(D.data.generated)) }) + " · "}
        <a href={href("public")}>{t("foot_polaris")}</a>
      </div>
      <Footer />
    </div>
  );
}
