// What Home and Discover share: the filter state and its URL, the view switch, the list head,
// the event list with month headings, the stale banner and the footer. The filter logic itself is lib/filters.ts.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { nEvents, t, type StrKey } from "../i18n";
import { getData } from "../lib/data";
import { fmt } from "../lib/dates";
import { devFlag } from "../lib/dev";
import { emptyFilters, fromParams, radiusOf, toParams, type Filters, type ListResult, type View } from "../lib/filters";
import { geocode } from "../lib/geo";
import { href } from "../lib/route";
import type { Event } from "../lib/types";
import { EventCard, Footer, Skel, replaceQuery, toast, useData } from "../components";

export type Page = "home" | "discover";

export interface FilterApi {
  /** the controls: chips, district, place, radius, the pressed view, the place it was geocoded to */
  live: Filters;
  /** the filters the list was last drawn with; null until the first draw (the list shows its skeleton until then) */
  shown: Filters | null;
  /** the controls are set from the URL (no view is pressed before: which one is not known yet) */
  inited: boolean;
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
  setPlace(text: string): Promise<void>;
  clear(): void;
}

/** The controls change at once, but the list (and the URL) only follow on draw(): a place counts once it is geocoded, a search
 *  150 ms after the last key. So the controls (live) and the last drawn state (shown) are kept apart. init adjusts the filters read from the URL
 *  (a guest's Home starts at the position found earlier in this tab). */
export function useFilters(query: URLSearchParams, page: Page, init: (f: Filters) => Filters = f => f): FilterApi {
  const [live, setLive] = useState<Filters>(emptyFilters);
  const [shown, setShown] = useState<Filters | null>(null);
  const [inited, setInited] = useState(false);
  const [hint, setHint] = useState("");
  const [placeText, setPlaceText] = useState("");
  // the latest controls, for handlers that change several things in a row (state would still hold the old ones)
  const cur = useRef(live);
  const timer = useRef(0);

  const update = (patch: Partial<Filters>, draw = false) => {
    const next = { ...cur.current, ...patch };
    cur.current = next;
    setLive(next);
    if (draw) setShown(next);
  };
  // a copy, so drawing the same filters again still redraws (the Home after the welcome steps)
  const draw = () => setShown({ ...cur.current });

  const locate = () => {
    if (!navigator.geolocation) {
      toast(t("loc_none"));
      return;
    }
    setHint(t("locating"));
    navigator.geolocation.getCurrentPosition(pos => {
      setPlaceText("");
      setHint(t("your_location"));
      // Home has no radius control: the "near" view then means 25 km
      const r = page === "discover" ? cur.current.r || "25" : cur.current.r;
      update({ center: [pos.coords.latitude, pos.coords.longitude], centerLabel: t("you"), place: "", r }, true);
    }, () => {
      setHint(t("loc_na"));
      toast(t("loc_na"));
      if (cur.current.view === "near") setView("all");
    });
  };
  const setView = (v: View) => {
    update({ view: v });
    if (v === "near" && !cur.current.center) locate();
    else draw();
  };
  const setPlace = async (text: string) => {
    setHint("");
    update({ center: null });
    if (text.trim()) {
      try {
        const hit = await geocode(text);
        if (hit) {
          update({ center: hit.coords, centerLabel: hit.label });
          setHint("📍 " + hit.label);
        } else {
          setHint(t("place_nf"));
        }
      } catch {
        setHint(t("place_err"));
      }
    }
    // a place without a radius would filter nothing
    if (cur.current.center && !cur.current.r) update({ r: "25" });
    draw();
  };
  const setQ = (q: string) => {
    update({ q });
    clearTimeout(timer.current);
    timer.current = window.setTimeout(draw, 150);
  };
  const clear = () => {
    setPlaceText("");
    setHint("");
    update({ q: "", place: "", r: "", center: null, d: new Set(), clubs: new Set() });
    setView("all");
  };

  // the controls from the URL, the place geocoded, then the first draw
  useLayoutEffect(() => {
    const f = init(fromParams(query, id => !!getData().clubs[id]));
    cur.current = f;
    setLive(f);
    setPlaceText(f.place);
    setInited(true);
    void (async () => {
      if (f.place) await setPlace(f.place);
      if (cur.current.view === "near" && !cur.current.center) locate();
      else draw();
    })();
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  // the URL follows every draw, so a reload or a shared link shows the same list
  useEffect(() => {
    if (!shown) return;
    const q = toParams(shown);
    if (q.toString() !== (location.hash.split("?")[1] ?? "")) replaceQuery(q);
  }, [shown]);

  return { live, shown, inited, hint, placeText, setPlaceText, setQ, update, draw, setView, locate, setPlace, clear };
}

/** "Last updated ..., may be out of date": events.json is more than 30 hours old */
export function StaleBanner() {
  const D = useData();
  const generated = new Date(D.data.generated);
  const stale = Date.now() - generated.getTime() > 30 * 3600e3 || !!devFlag("Stale");
  return <div className="banner" role="status" hidden={!stale}>{stale ? t("stale", { t: fmt.stamp.format(generated) }) : null}</div>;
}

/** the list title, the count line and Clear; sticks under the top bar */
export function ListHead({ titleId, title, summary, clear, onClear }: {
  titleId?: string; title: string; summary: string; clear: boolean; onClear: () => void;
}) {
  return (
    <div className="list-head sh lv1">
      <h3 id={titleId}>{title}</h3>
      <div className="summary">
        <span aria-live="polite">{summary}</span>
        <button type="button" className="clear" hidden={!clear} onClick={onClear}>{t("clear")}</button>
      </div>
    </div>
  );
}

const VIEW_KEY: Record<View, StrKey> = { all: "v_all", near: "v_near", saved: "v_saved", past: "v_past" };
/** the view switch; pressed: the current view, undefined before the controls are set from the URL (none pressed yet) */
export function Views({ views, pressed, onPick }: { views: View[]; pressed?: View; onPick: (v: View) => void }) {
  return (
    <div className="seg views glass" role="group" aria-label={t("filters")}>
      {views.map(v => (
        <button key={v} type="button" aria-pressed={pressed ? pressed === v : undefined} onClick={() => onPick(v)}>{t(VIEW_KEY[v])}</button>
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
        return [<h3 key={"m" + m} className="sh">{m}</h3>, card];
      })}
    </>
  );
}

/** the list: the skeleton until the first draw, "nothing matches" with a way out, or the cards; a guest's Home links to Discover
 *  when it shows only the first 12 */
export function Results({ res, view, onClear }: { res: ListResult | null; view: View; onClear: () => void }) {
  if (!res) return <div id="results" aria-busy="true"><Skel /><Skel /><Skel /></div>;
  return (
    <div id="results">
      {res.matches.length ? null : (
        <div className="empty">
          {view === "saved" ? t("empty_saved") : t("empty")}
          <br />
          <button className="linkbtn" type="button" onClick={onClear}>{t("show_all")}</button>
        </div>
      )}
      <MonthRun events={res.shown} />
      {res.shown.length < res.matches.length ? <div className="links center"><a href={href("discover")}>{t("discover_cta")}</a></div> : null}
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
