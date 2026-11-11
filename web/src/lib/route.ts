// Hash routes: #/ (home), #/discover?q=..., #/event/<id>, #/club/<id>, #/settings ... Parsing and links only; the hook is in components/router.ts.

export const ROUTES = ["home", "discover", "calendar", "map", "event", "club", "settings", "subscribe", "about", "about-more", "family", "public", "guide", "words", "intl", "dev"] as const;
export type RouteName = typeof ROUTES[number];
export interface Route {
  name: RouteName;
  /** the second path segment: #/event/<id>, #/club/<id> ("" otherwise) */
  params: { id: string };
  query: URLSearchParams;
}

/** "#/event/abc?x=1" -> { name: "event", params: { id: "abc" }, query }; anything unknown is home */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "").replace(/#.*$/, ""), qi = raw.indexOf("?");  // "#/settings#install": an in-screen anchor after the route
  const path = qi < 0 ? raw : raw.slice(0, qi), query = new URLSearchParams(qi < 0 ? "" : raw.slice(qi + 1));
  const [name = "", id = ""] = path.split("/");
  const known = (ROUTES as readonly string[]).includes(name) ? name as RouteName : "home";
  return { name: known, params: { id: safeDecode(id) }, query };
}
const safeDecode = (s: string) => { try { return decodeURIComponent(s); } catch { return s; } };

/** the href of a screen: href("event", id), href("discover", "?clubs=bern"), href("home") */
export function href(name: RouteName, id?: string | null, query?: string | URLSearchParams): string {
  const q = query ? (typeof query === "string" ? query.replace(/^\?/, "") : query.toString()) : "";
  return "#/" + (name === "home" ? "" : name) + (id ? "/" + encodeURIComponent(id) : "") + (q ? "?" + q : "");
}

/** Old links that must land on a route: index.html?event=X, and a Home link with filters (it belongs on Discover).
 *  Returns the hash to go to, or null. ?lang= and ?welcome stay in the search part. */
export function legacyRedirect(search: string, hash: string): string | null {
  const p = new URLSearchParams(search);
  const ev = p.get("event");
  if (ev) return href("event", ev);
  if ((!hash || hash === "#" || hash === "#/") && ["q", "clubs", "d", "place", "r"].some(k => p.has(k))) {
    const q = new URLSearchParams([...p].filter(([k]) => k !== "lang" && k !== "welcome"));
    return href("discover", null, q);
  }
  return null;
}
/** the search part kept after a legacy redirect: only lang and welcome */
export function keptSearch(search: string): string {
  const p = new URLSearchParams([...new URLSearchParams(search)].filter(([k]) => k === "lang" || k === "welcome"));
  const s = p.toString().replace(/=(&|$)/g, "$1");  // "?welcome", not "?welcome="
  return s ? "?" + s : "";
}

/** ?welcome (index.html?welcome, Settings' "run the welcome steps"): true once per page load, for Home's onboarding. Taking it also
 *  drops it from the URL, so a reload doesn't start the welcome steps again. */
let welcome = typeof location !== "undefined" && new URLSearchParams(location.search).has("welcome");
export function takeWelcome(): boolean {
  const w = welcome; welcome = false;
  if (w) {
    const p = new URLSearchParams(location.search); p.delete("welcome");
    const s = p.toString();
    history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }
  return w;
}
