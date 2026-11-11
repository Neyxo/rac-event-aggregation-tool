// localStorage, JSON-encoded, never throwing (private mode, blocked storage). Keys and formats never change: people's clubs,
// saved events and settings are in them. set() and remove() notify subscribers (useStored() re-renders on them).
import type { Seen, Settings } from "./types";

export interface StoreKeys {
  "rac.settings": Settings;
  "rac.saved": string[];
  "rac.theme": "light" | "dark";
  "rac.lang": string;
  "rac.seen": Seen;
  "rac.seenPrev": Record<string, string>;
  "rac.rotary": boolean;
  "rac.onboarded": boolean;
  "rac.guideSeen": boolean;
  /** developer mode switch; rac.dev* preview flags only count while it is on */
  "rac.dev": boolean;
  "rac.devUnlocked": boolean;
  "rac.devGuest": boolean;
  "rac.devNew": boolean;
  "rac.devStale": boolean;
  /** "2026-12-24" or "" */
  "rac.devDate": string;
  /** the format before rac.settings; migrated and removed by loadData() */
  "rac.prefs": { clubs?: string[] };
}
export type StoreKey = keyof StoreKeys;

const listeners = new Set<() => void>();
export const store = {
  get<K extends StoreKey, D>(k: K, d: D): StoreKeys[K] | D {
    try { return (JSON.parse(localStorage.getItem(k) ?? "null") as StoreKeys[K] | null) ?? d; } catch { return d; }
  },
  set<K extends StoreKey>(k: K, v: StoreKeys[K]): void {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage off */ }
    listeners.forEach(f => f());
  },
  remove(k: StoreKey): void {
    try { localStorage.removeItem(k); } catch { /* storage off */ }
    listeners.forEach(f => f());
  },
  subscribe(f: () => void): () => void { listeners.add(f); return () => { listeners.delete(f); }; },
};

/** sessionStorage rac.here: the approximate position found after a tap, kept for this tab */
export const here = {
  get(): [number, number] | null { try { return JSON.parse(sessionStorage.getItem("rac.here") ?? "null") as [number, number] | null; } catch { return null; } },
  set(c: [number, number]): void { try { sessionStorage.setItem("rac.here", JSON.stringify(c)); } catch { /* storage off */ } },
};

/** applies at once (app.css keys on <html data-theme>) and is kept for the next start (index.html's inline script reads rac.theme) */
export function setTheme(next: "light" | "dark"): void {
  store.set("rac.theme", next);
  if (typeof document !== "undefined") document.documentElement.dataset.theme = next;
}
