// Hash routes: #/ (home), #/discover?q=..., #/event/<id>, #/club/<id>, #/settings ... Parsing and links only; the hook is in components/router.ts.

export const ROUTES = [
  "home",
  "discover",
  "calendar",
  "map",
  "event",
  "club",
  "settings",
  "subscribe",
  "about",
  "about-more",
  "family",
  "public",
  "guide",
  "words",
  "intl",
  "review",
  "dev",
] as const;
export type RouteName = (typeof ROUTES)[number];
export interface Route {
  name: RouteName;
  /** the second path segment: #/event/<id>, #/club/<id> ("" otherwise) */
  params: { id: string };
  query: URLSearchParams;
}

/** "#/event/abc?x=1" -> { name: "event", params: { id: "abc" }, query }; anything unknown is home */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#\/?/, "").replace(/#.*$/, "");
  const qi = raw.indexOf("?"); // "#/settings#install": an in-screen anchor after the route
  const path = qi < 0 ? raw : raw.slice(0, qi);
  const query = new URLSearchParams(qi < 0 ? "" : raw.slice(qi + 1));
  const [name = "", id = ""] = path.split("/");
  const known = (ROUTES as readonly string[]).includes(name) ? (name as RouteName) : "home";
  return { name: known, params: { id: safeDecode(id) }, query };
}
const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** the href of a screen: href("event", id), href("discover", "?clubs=bern"), href("home") */
export function href(name: RouteName, id?: string | null, query?: string | URLSearchParams): string {
  const q = typeof query === "string" ? query.replace(/^\?/, "") : (query?.toString() ?? "");
  return "#/" + (name === "home" ? "" : name) + (id ? "/" + encodeURIComponent(id) : "") + (q ? "?" + q : "");
}

/** ?welcome (index.html?welcome, Settings' "run the welcome steps"): true once per page load, for Home's onboarding. Taking it also
 *  drops it from the URL, so a reload doesn't start the welcome steps again. */
let welcome = typeof location !== "undefined" && new URLSearchParams(location.search).has("welcome");
export function takeWelcome(): boolean {
  const w = welcome;
  welcome = false;
  if (w) {
    const p = new URLSearchParams(location.search);
    p.delete("welcome");
    const s = p.toString();
    history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }
  return w;
}
