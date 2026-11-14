// The hash router: useRoute() re-renders on navigation, navigate() goes somewhere, replaceQuery() rewrites the current route's
// query without a navigation (Discover keeps its filters in the URL like it did with history.replaceState).
// Scroll: a new navigation starts at the top; back/forward returns to where that entry was left (App.tsx applies it).
import { useMemo, useSyncExternalStore } from "react";
import { parseHash, type Route } from "./lib/route";
import { emitter } from "./lib/store";

// depth: how many in-app navigations led to this entry (kept in history.state, so it survives a reload): 0 is where the app was opened
interface Nav {
  hash: string;
  id: number;
  pop: boolean;
  key: number;
  depth: number;
}
let keys = 0;
const positions = new Map<number, number>();
const { subscribe, emit } = emitter();
const state = () => history.state as { k?: number; d?: number } | null;
const stateKey = (): number | undefined => state()?.k;

// every history entry gets a key, so back/forward can find its scroll position, and its depth
function stamp(d: number): number {
  const k = ++keys;
  history.replaceState({ ...state(), k, d }, "");
  return k;
}
let nav: Nav = { hash: location.hash, id: 0, pop: false, key: stateKey() ?? stamp(0), depth: state()?.d ?? 0 };
keys = Math.max(keys, nav.key);

if (typeof window !== "undefined") {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  addEventListener("hashchange", () => {
    const k = stateKey();
    const depth = k != null ? (state()?.d ?? 0) : nav.depth + 1;
    nav = { hash: location.hash, id: nav.id + 1, pop: k != null, key: k ?? stamp(depth), depth };
    keys = Math.max(keys, nav.key);
    emit();
  });
  addEventListener(
    "scroll",
    () => {
      positions.set(nav.key, scrollY);
    },
    { passive: true },
  );
}

/** f runs on every navigation (and replaceQuery), outside React */
export const onNav = subscribe;
const getNav = () => nav;
/** the navigation state: id changes on every navigation (not on replaceQuery), pop is true for back/forward */
export const useNav = (): Nav => useSyncExternalStore(subscribe, getNav);
/** { name, params: { id }, query } of the current hash */
export function useRoute(): Route {
  const { hash } = useNav();
  return useMemo(() => parseHash(hash), [hash]);
}
/** go to a hash route ("#/event/123", or lib/route href()); replace: true swaps the current entry */
export function navigate(to: string, { replace = false } = {}): void {
  const h = to.startsWith("#") ? to : "#" + to;
  if (!replace) {
    location.hash = h;
    return;
  }
  history.replaceState(history.state, "", h);
  nav = { ...nav, hash: location.hash, id: nav.id + 1, pop: false };
  emit();
}
/** rewrite the current route's query (no navigation, no scroll); an empty query drops the "?" */
export function replaceQuery(q: URLSearchParams): void {
  const path = location.hash.split("?")[0] || "#/";
  const s = q.toString();
  history.replaceState(history.state, "", path + (s ? "?" + s : ""));
  nav = { ...nav, hash: location.hash };
  emit();
}
/** the back button's question: is there an earlier entry of this app to go back to? (history.length also counts other sites: a shared
 *  link opened in a tab that was somewhere else before would leave the app) */
export const canGoBack = (): boolean => nav.depth > 0;
/** where to scroll after a navigation: 0 for a new one, the remembered position for back/forward */
export const scrollTarget = (n: Pick<Nav, "pop" | "key">): number => (n.pop ? (positions.get(n.key) ?? 0) : 0);

/** an in-page link (#main, #results): hash hrefs are routes here, so it scrolls instead of navigating */
export function inPageLink(id: string) {
  return {
    href: "#" + id,
    onClick: (ev: { preventDefault(): void }) => {
      ev.preventDefault();
      const n = document.getElementById(id);
      n?.scrollIntoView({ behavior: "smooth" });
      if (n instanceof HTMLElement && n.tabIndex >= 0) n.focus({ preventScroll: true });
    },
  };
}
