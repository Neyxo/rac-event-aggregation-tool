// events.json, fetched once per app session, and what the app derives from it: clubs by id, the settings, saved events.
// D is module state shared by every screen; read it after loadData() resolved (components/useData.ts does that for React).
import type { Club, Event, EventsJson, Settings } from "./types";
import { store } from "./store";
import { devFlag } from "./dev";

export interface AppData {
  data: EventsJson;
  clubs: Record<string, Club>;
  settings: Settings;
  saved: Set<string>;
  /** set by Home (changes.ts): events new since the last visit, tagged NEW on the cards */
  newIds: Set<string>;
  /** the Rotary layer as published, whether or not it is switched on (eventById() and the dev screen use it) */
  rotary: { clubs: Club[]; events: Event[] };
}
export const D: AppData = { data: { generated: "", clubs: [], events: [] }, clubs: {}, settings: { home: "", also: [] }, saved: new Set(), newIds: new Set(), rotary: { clubs: [], events: [] } };
export let loaded = false;

/** The Rotary layer (events Rotary clubs share with other clubs, one pseudo-club per district) has its own key in events.json and
 *  is only added when switched on in Settings: off, no screen ever sees it. Returns a new object; raw is not changed. */
export function mergeRotary(raw: EventsJson, on: boolean): EventsJson {
  const rot = raw.rotary ?? { clubs: [], events: [] };
  if (!on) return { ...raw, clubs: [...raw.clubs], events: [...raw.events] };
  return { ...raw, clubs: [...raw.clubs, ...rot.clubs], events: [...raw.events, ...rot.events].sort((a, b) => a.start.localeCompare(b.start)) };
}

/** rac.settings, or the older rac.prefs ({clubs: [...]}) turned into it; clubs that no longer exist are dropped.
 *  migrated: rac.prefs was there (the caller removes it and saves real). Guest preview: settings empty, in memory only
 *  (the old code saved the empty guest settings when migrating during a preview; real is saved instead). */
export function resolveSettings(clubs: Record<string, Club>, stored: Settings | null, old: { clubs?: string[] } | null, guest: boolean): { settings: Settings; real: Settings; migrated: boolean } {
  const s: Settings = stored ? { home: stored.home ?? "", also: [...(stored.also ?? [])] } : old?.clubs?.length ? { home: old.clubs[0]!, also: old.clubs.slice(1) } : { home: "", also: [] };
  s.also = s.also.filter(id => clubs[id] && id !== s.home);
  if (!clubs[s.home]) s.home = "";
  return { settings: guest ? { home: "", also: [] } : s, real: s, migrated: !!old };
}

let pending: Promise<EventsJson> | null = null;
/** fetches events.json once per session (a failure is retried on the next call) and fills D */
export function loadData(): Promise<EventsJson> {
  pending ??= (async () => {
    const r = await fetch("events.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(String(r.status));
    const raw = await r.json() as EventsJson;
    D.rotary = raw.rotary ?? { clubs: [], events: [] };
    D.data = mergeRotary(raw, store.get("rac.rotary", false));
    D.clubs = Object.fromEntries(D.data.clubs.map(c => [c.id, c]));
    D.saved = new Set(store.get("rac.saved", []));
    const old = store.get("rac.prefs", null);
    const { settings, real, migrated } = resolveSettings(D.clubs, store.get("rac.settings", null), old, !!devFlag("Guest"));
    D.settings = settings;
    if (migrated) { store.remove("rac.prefs"); store.set("rac.settings", real); }
    loaded = true;
    return D.data;
  })().catch(e => { pending = null; throw e; });
  return pending;
}

/** an event by id. A Rotary event with the layer off still opens from a shared link (#/event/<id>), without its district:
 *  it is looked up here and never added to the lists. */
export const eventById = (id: string): Event | undefined => D.data.events.find(e => e.id === id) ?? D.rotary.events.find(e => e.id === id);

/** off while the guest preview is on */
export function saveSettings(): void { if (!devFlag("Guest")) store.set("rac.settings", D.settings); }
export function toggleSaved(id: string): boolean {
  if (D.saved.has(id)) D.saved.delete(id); else D.saved.add(id);
  store.set("rac.saved", [...D.saved]);
  return D.saved.has(id);
}
/** the main club first, then the others; only clubs that exist */
export const myClubs = (): string[] => [D.settings.home, ...D.settings.also].filter(id => D.clubs[id]);
/** a club by id, or a stand-in with the id as its name */
export const club = (id: string): Club => D.clubs[id] ?? { id, name: id, short: id, color: "#d41367", logo: "", url: "", district: "", coords: null, photos: [], news: [], projects: [], instagram: [], links: {}, source: "", how: "", partners: [] };
/** a real Rotaract club: in a district, and not a pseudo-club ("source": international, or a Rotary district, which has a district too) */
export const isRac = (c: Club): boolean => !!c.district && !c.source;
export const nClubs = (): number => D.data.clubs.filter(isRac).length;
/** news teasers older than a year are not news */
export const freshNews = (c: Club, now = Date.now()) => (c.news || []).filter(n => !n.date || now - new Date(n.date).getTime() < 365 * 864e5);
