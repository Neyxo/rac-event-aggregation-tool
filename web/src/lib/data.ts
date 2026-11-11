// events.json, fetched once per app session, and the state the app derives from it and from this device's storage: clubs by id,
// the settings, the saved events, the Rotary layer. The state is private and never changed in place: the actions below replace it
// and notify subscribers, and useData() / useSaved() (components/hooks) re-render every mounted component that reads it.
import type { Club, Event, EventsJson, Settings } from "./types";
import { store } from "./store";
import { devFlag } from "./dev";

export interface AppData {
  /** events.json, with the Rotary layer merged in while it is switched on */
  readonly data: EventsJson;
  readonly clubs: Readonly<Record<string, Club>>;
  readonly settings: Settings;
  readonly saved: ReadonlySet<string>;
  /** the Rotary layer as published, whether or not it is switched on (eventById() and the dev screen use it) */
  readonly rotary: { clubs: Club[]; events: Event[] };
}

let state: AppData = {
  data: { generated: "", clubs: [], events: [] },
  clubs: {},
  settings: { home: "", also: [] },
  saved: new Set(),
  rotary: { clubs: [], events: [] },
};
/** events.json as fetched: setRotary() merges the layer in or out of it again */
let raw: EventsJson | null = null;
/** the state holds events.json (initData() has run) */
export let loaded = false;
const listeners = new Set<() => void>();

function commit(next: AppData): void {
  state = next;
  listeners.forEach(f => f());
}

/** the current state; components read it through useData() so they re-render when it changes */
export const getData = (): AppData => state;
export function subscribeData(f: () => void): () => void {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

/** The Rotary layer (events Rotary clubs share with other clubs, one pseudo-club per district) has its own key in events.json and
 *  is only added when switched on in Settings: off, no screen ever sees it. Returns a new object; raw is not changed. */
export function mergeRotary(raw: EventsJson, on: boolean): EventsJson {
  const rot = raw.rotary ?? { clubs: [], events: [] };
  if (!on) return { ...raw, clubs: [...raw.clubs], events: [...raw.events] };
  return { ...raw, clubs: [...raw.clubs, ...rot.clubs], events: [...raw.events, ...rot.events].sort((a, b) => a.start.localeCompare(b.start)) };
}

/** rac.settings without the clubs that no longer exist; the guest preview starts with none */
export function resolveSettings(clubs: Readonly<Record<string, Club>>, stored: Settings | null, guest: boolean): Settings {
  if (guest || !stored) return { home: "", also: [] };
  const home = clubs[stored.home] ? stored.home : "";
  return { home, also: (stored.also ?? []).filter(id => clubs[id] && id !== home) };
}

/** The state for events.json and what this device stored: the Rotary switch, the saved events, the settings. loadData() calls it once; setRotary() again, so switching gives what a reload would. */
export function initData(json: EventsJson): void {
  raw = json;
  const data = mergeRotary(json, store.get("rac.rotary", false));
  const clubs = Object.fromEntries(data.clubs.map(c => [c.id, c]));
  const settings = resolveSettings(clubs, store.get("rac.settings", null), !!devFlag("Guest"));
  loaded = true;
  commit({ data, clubs, settings, saved: new Set(store.get("rac.saved", [])), rotary: json.rotary ?? { clubs: [], events: [] } });
}

let pending: Promise<AppData> | null = null;
/** fetches events.json once per session (a failure is retried on the next call) and sets the state from it */
export function loadData(): Promise<AppData> {
  pending ??= (async () => {
    const r = await fetch("events.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(String(r.status));
    initData(await r.json() as EventsJson);
    return state;
  })().catch(e => { pending = null; throw e; });
  return pending;
}

/** the main club and the others to show; stored, except during the guest preview (a look at the app as a new visitor) */
export function setSettings(settings: Settings): void {
  commit({ ...state, settings });
  if (!devFlag("Guest")) store.set("rac.settings", settings);
}

/** save / unsave an event; returns whether it is saved now */
export function toggleSaved(id: string): boolean {
  const saved = new Set(state.saved);
  const on = !saved.has(id);
  if (on) saved.add(id);
  else saved.delete(id);
  store.set("rac.saved", [...saved]);
  commit({ ...state, saved });
  return on;
}

/** The Rotary layer on or off, at once: its districts and events join or leave every screen. The settings are read again, so a
 *  district in "also show" counts only while the layer is on and comes back with it (rac.settings keeps it either way). */
export function setRotary(on: boolean): void {
  store.set("rac.rotary", on);
  if (raw) initData(raw);
}

/** an event by id. A Rotary event with the layer off still opens from a shared link (#/event/<id>), without its district:
 *  it is looked up here and never added to the lists. */
export const eventById = (id: string): Event | undefined => state.data.events.find(e => e.id === id) ?? state.rotary.events.find(e => e.id === id);
/** the main club first, then the others; only clubs that exist */
export const myClubs = (): string[] => [state.settings.home, ...state.settings.also].filter(id => state.clubs[id]);
/** a club by id, or a stand-in with the id as its name */
export const club = (id: string): Club => state.clubs[id] ?? { id, name: id, short: id, color: "#d41367", logo: "", url: "", district: "", coords: null, photos: [], news: [], projects: [], instagram: [], links: {}, source: "", how: "", partners: [] };
/** a real Rotaract club: in a district, and not a pseudo-club ("source": international, or a Rotary district, which has a district too) */
export const isRac = (c: Club): boolean => !!c.district && !c.source;
export const nClubs = (): number => state.data.clubs.filter(isRac).length;
/** news teasers older than a year are not news */
export const freshNews = (c: Club, now = Date.now()) => (c.news || []).filter(n => !n.date || now - new Date(n.date).getTime() < 365 * 864e5);
