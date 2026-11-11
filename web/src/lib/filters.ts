// Home and Discover lists: which events match the filters, the view (all / near / saved / past), and the filter state <-> URL query.
import type { Club, Coords, Event } from "./types";
import { isPast } from "./dates";
import { km } from "./geo";
import { isDistrict } from "./color";

export type View = "all" | "near" | "saved" | "past";
export const VIEWS: View[] = ["all", "near", "saved", "past"];

export interface Filters {
  q: string;
  /** districts */
  d: Set<string>;
  clubs: Set<string>;
  /** the place as typed; center is what it was geocoded to (or the device position) */
  place: string;
  /** radius in km as the select holds it: "" | "10" | "25" | "50" | "100" */
  r: string;
  view: View;
  center: Coords | null;
  centerLabel: string;
}
export const emptyFilters = (): Filters => ({ q: "", d: new Set(), clubs: new Set(), place: "", r: "", view: "all", center: null, centerLabel: "" });

/** accents and case folded away: "Zürich" matches "zurich" */
export const fold = (s: string | null | undefined): string => (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

export interface MatchCtx {
  /** Home: my clubs plus "international" (null on Discover, [] for a guest) */
  scope: string[] | null;
  club: (id: string) => Club;
}
/** Home scope: your clubs, plus the international events (REM, EUCO, the Convention), which concern every member */
export const scopeClubs = (page: "home" | "discover", mine: string[]): string[] | null => page !== "home" ? null : mine.length ? [...mine, "international"] : mine;

export function baseMatches(e: Event, f: Filters, ctx: MatchCtx): boolean {
  const mine = ctx.scope;
  if (mine && mine.length && f.view !== "saved" && !e.clubs.some(c => mine.includes(c))) return false;
  if (f.d.size && !e.clubs.some(c => f.d.has(ctx.club(c).district))) return false;
  if (f.clubs.size && !e.clubs.some(c => f.clubs.has(c))) return false;
  const q = fold(f.q.trim());
  if (q) {
    const hay = fold([e.title, e.description, e.location, e.organiser, ...e.clubs.map(c => ctx.club(c).name)].join(" "));
    if (!q.split(/\s+/).every(w => hay.includes(w))) return false;
  }
  return true;
}
/** the radius in use: the chosen one, or 25 km in the "near" view; null when none */
export const radiusOf = (f: Filters): number | null => Number(f.r) || (f.view === "near" ? 25 : null);
export const distanceOf = (e: Event, f: Filters): number | null => f.center && e.coords ? km(f.center, e.coords) : null;
export function withinRadius(e: Event, f: Filters): boolean {
  const radius = Number(f.r) || null, use = f.center && (radius || f.view === "near");
  if (!use) return true;
  if (!e.coords) return false;
  return (distanceOf(e, f) ?? Infinity) <= (radius || 25);
}

export interface ListCtx extends MatchCtx {
  page: "home" | "discover";
  /** my clubs (myClubs()) */
  mine: string[];
  saved: ReadonlySet<string>;
  /** Home's next-up event, not repeated in the list */
  skip?: string;
}
export interface ListResult {
  matches: Event[];
  /** what is drawn: a guest's Home shows at most 12 */
  shown: Event[];
  /** events left out by the radius because they have no place */
  noLocation: number;
  explore: boolean;
  /** a guest's Home: "explore_near" when nearby events were found, else "home_soon"; null elsewhere */
  title: "explore_near" | "home_soon" | null;
}
/** the events a list shows for these filters, and what its title and summary line need */
export function selectEvents(events: Event[], f: Filters, ctx: ListCtx): ListResult {
  let noLocation = 0; let matches: Event[] = [];
  const explore = ctx.page === "home" && !ctx.mine.length;
  for (const e of events) {
    const past = isPast(e);
    if (f.view === "past" ? !past : past) continue;
    if (f.view === "saved" && !ctx.saved.has(e.id)) continue;
    if (!baseMatches(e, f, ctx)) continue;
    if (explore && e.layer === "rotary") continue;  // a guest's Home stays Rotaract; Discover, Calendar and Map show the layer
    if (f.view === "all" && e.id === ctx.skip) continue;
    if (!withinRadius(e, f)) { if (!e.coords) noLocation++; continue; }
    matches.push(e);
  }
  let title: ListResult["title"] = null;
  if (explore && f.view === "all") {
    const near = f.center ? matches.filter(e => e.coords && km(f.center!, e.coords) <= 50) : [];
    if (near.length) matches = near;
    title = near.length ? "explore_near" : "home_soon";
  }
  if (f.view === "past") matches.reverse();
  return { matches, shown: explore && f.view === "all" ? matches.slice(0, 12) : matches, noLocation, explore, title };
}

/** filters from a shared link (?q=&d=&clubs=&place=&r=&view=); unknown clubs, districts and views are dropped. center is left to geocoding. */
export function fromParams(p: URLSearchParams, isClub: (id: string) => boolean): Filters {
  const view = p.get("view") as View | null;
  return {
    ...emptyFilters(),
    q: p.get("q") || "", place: p.get("place") || "", r: p.get("r") || "",
    clubs: new Set((p.get("clubs") || "").split(",").filter(c => c && isClub(c))),
    d: new Set((p.get("d") || "").split(",").filter(isDistrict)),
    view: view && VIEWS.includes(view) ? view : "all",
  };
}
export function toParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q); if (f.d.size) p.set("d", [...f.d].join(",")); if (f.clubs.size) p.set("clubs", [...f.clubs].join(","));
  if (f.place) p.set("place", f.place); if (f.r) p.set("r", f.r); if (f.view !== "all") p.set("view", f.view);
  return p;
}
/** the number on the Filters button: districts, clubs (one), place, radius */
export const activeCount = (f: Filters): number => f.d.size + (f.clubs.size ? 1 : 0) + (f.place ? 1 : 0) + (f.r ? 1 : 0);
/** the Clear button shows */
export const hasFilters = (f: Filters): boolean => !!(f.q || f.clubs.size || f.d.size || f.place || f.r || f.view !== "all");
/** a shared Home link with filters belongs on Discover */
export const isFilterLink = (p: URLSearchParams): boolean => ["q", "clubs", "d", "place", "r"].some(k => p.has(k));
