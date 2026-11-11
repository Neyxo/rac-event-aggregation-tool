// Distances, place search (swisstopo), and the approximate position of the connection: no permission prompt, only ever after a tap.
import type { Club, Coords } from "./types";
import { here } from "./store";
import { isRac } from "./data";
import { LANG, type Lang } from "../i18n";

/** great-circle distance in km */
export function km(a: Coords, b: Coords): number {
  const rad = (x: number) => x * Math.PI / 180, dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/** a town or address via swisstopo's search; null when nothing is found, throws when offline */
export async function geocode(text: string): Promise<{ coords: Coords; label: string } | null> {
  const url = "https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&sr=4326&limit=1&searchText=" + encodeURIComponent(text);
  const j = await (await fetch(url)).json() as { results?: { attrs: { lat: number; lon: number; label: string } }[] };
  const r = j.results?.[0];
  return r ? { coords: [r.attrs.lat, r.attrs.lon], label: r.attrs.label.replace(/<[^>]+>/g, "") } : null;
}

/** approximate position from the IP (geojs, then ipwho), only inside CH/LI; kept for this tab in sessionStorage rac.here */
export async function guessPosition(): Promise<Coords | null> {
  const known = here.get(); if (known) return known;
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 3500);
    type Geo = { latitude?: string | number; longitude?: string | number; country_code?: string } | null;
    const get = (u: string): Promise<Geo> => fetch(u, { signal: ctl.signal }).then(r => r.json() as Promise<Geo>).catch(() => null);
    let r = await get("https://get.geojs.io/v1/ip/geo.json");
    if (!r?.latitude) r = await get("https://ipwho.is/");
    const pos: Coords = [Number(r?.latitude), Number(r?.longitude)];
    if (pos[0] && ["CH", "LI"].includes(r?.country_code ?? "")) { here.set(pos); return pos; }
  } catch { /* offline */ }
  return null;
}

/** the real Rotaract clubs nearest to pos, at most n, within maxKm */
export function nearestClubs(clubs: Club[], pos: Coords, n = 3, maxKm = 1e9): { c: Club; d: number }[] {
  return clubs.filter(c => c.coords && isRac(c)).map(c => ({ c, d: km(pos, c.coords!) })).filter(x => x.d <= maxKm).sort((a, b) => a.d - b.d).slice(0, n);
}

/** a first guess at someone's clubs: the two nearest within 35 km, else a default per language */
export const LANG_CLUBS: Partial<Record<Lang, string[]>> = { fr: ["fribourg", "geneve-international"], it: ["ticino"], en: ["zurich-international", "geneve-international"] };
export async function guessClubs(clubs: Club[], lang: Lang = LANG): Promise<string[]> {
  const pos = await guessPosition();
  if (pos) { const near = nearestClubs(clubs, pos, 2, 35); if (near.length) return near.map(x => x.c.id); }
  return LANG_CLUBS[lang] ?? [];
}

/** Apple Maps on iOS (opens the app), Google Maps elsewhere */
export const IOS = typeof navigator !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);
export const PHONE = IOS || (typeof navigator !== "undefined" && /Android/.test(navigator.userAgent));
export const mapsUrl = (place: string, ios = IOS): string => (ios ? "https://maps.apple.com/?q=" : "https://www.google.com/maps/search/?api=1&query=") + encodeURIComponent(place);

/** swisstopo's grey national map tiles (free, no key), for Leaflet: the Map screen and Rotary, districts & the world */
export const SWISSTOPO_GREY = "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-grau/default/current/3857/{z}/{x}/{y}.jpeg";
