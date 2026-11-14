// Hooks every screen can use: the data, stored values, the colour wash, the morphing hero, the sticky headings.
import { use, useEffect, useEffectEvent, useLayoutEffect, useSyncExternalStore, type RefObject } from "react";
import { getData, loadData, loaded, subscribeData, type AppData } from "./lib/data";
import { getInstallPrompt, subscribeInstall, type InstallPrompt } from "./lib/install";
import { store, type StoreKey, type StoreKeys } from "./lib/store";

/** events.json and what the app derives from it (lib/data's state): D.data.events, D.clubs, D.settings, D.saved. Re-renders whenever an
 *  action (setSettings, toggleSaved, setRotary) changes the state. Until events.json is in, the screen suspends (App's DataBoundary
 *  shows a skeleton instead); when it can't be loaded, it throws LoadFailed (the DataBoundary shows the offline note). So a screen
 *  never sees the data missing, and only renders once it is there. */
export function useData(): AppData {
  // once the data is in, not even use(): it suspends once for a promise React hasn't seen settle
  if (!loaded) use(loadData());
  return useSyncExternalStore(subscribeData, getData);
}

/** the browser's install prompt while it can be shown (lib/install's install() shows it), null otherwise */
export const useInstallPrompt = (): InstallPrompt | null => useSyncExternalStore(subscribeInstall, getInstallPrompt);

/** whether an event is saved; re-renders this component only when that changes (a star toggled anywhere) */
export const useSaved = (id: string): boolean => useSyncExternalStore(subscribeData, () => getData().saved.has(id));

/** a localStorage value that re-renders when store.set()/remove() changes it */
export function useStored<K extends StoreKey, T>(k: K, d: T): StoreKeys[K] | T {
  // subscribed to the stored text (a string compares by value); the value is parsed from it on each render
  useSyncExternalStore(store.subscribe, () => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  });
  return store.get(k, d);
}

/** the colour wash behind a screen: body.wash with radial blobs in up to three colours (--c1..--c3); removed when the screen goes */
export function useWash(...colors: (string | undefined | null | false)[]): void {
  const key = colors
    .filter((c): c is string => !!c)
    .slice(0, 3)
    .join("|");
  useLayoutEffect(() => {
    if (!key) return;
    const list = key.split("|");
    const b = document.body;
    b.classList.add("wash");
    list.forEach((c, i) => b.style.setProperty("--c" + (i + 1), c));
    return () => {
      b.classList.remove("wash");
      for (let i = 1; i <= 3; i++) b.style.removeProperty("--c" + i);
    };
  }, [key]);
}

/** The hero (event head, club head) sticks under the top bar and compacts as you scroll: the CSS reads --m (0 at rest, 1 compact) and .on.
 *  Not scroll-bound: once the head has stuck for 24px it goes compact on its own; below 8px it comes back. Section headings stick under the
 *  compact hero while it is there (--stick). Used through components/Sticky's MorphHead, which renders the sentinel right before
 *  the head and the "morph" class (React must not rewrite the className: .on is toggled here).
 *  The head is a fixed-height sticky box whose content overflows below it at rest, so nothing jumps while it sticks. Measured once, at
 *  rest: --bt (on the head's parent, for the CSS of the head's .go and of what follows the head) is 12px below the head's content, where
 *  its .go button sits at rest; the parent's .ph keeps that button's place in the row below. */
export function useMorphHead(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const node = ref.current;
    const sent = node?.previousElementSibling;
    const bar = document.getElementById("top");
    const parent = node?.parentElement;
    if (!node || !sent || !bar || !parent) return;
    const parts = [...node.children].filter((n) => !n.matches(".go, .wm"));
    const bt =
      Math.round(Math.max(...parts.map((n) => n.getBoundingClientRect().bottom)) - node.getBoundingClientRect().top) +
      12;
    parent.style.setProperty("--bt", bt + "px");
    const go = node.querySelector<HTMLElement>(".go");
    const ph = parent.querySelector<HTMLElement>(".ph");
    if (go && ph) {
      ph.style.width = go.offsetWidth + "px";
      ph.style.height = go.offsetHeight + "px";
    }
    const root = document.documentElement;
    const top = bar.offsetHeight;
    node.style.top = top + "px";
    let on = false;
    const tick = () => {
      const d = top - sent.getBoundingClientRect().top;
      if ((d > 24 && !on) || (d < 8 && on)) {
        on = d > 24;
        node.style.setProperty("--m", on ? "1" : "0");
        node.classList.toggle("on", on);
      }
      root.style.setProperty(
        "--stick",
        Math.round(Math.max(top, Math.min(node.getBoundingClientRect().bottom, top + node.offsetHeight))) + "px",
      );
    };
    addEventListener("scroll", tick, { passive: true });
    addEventListener("resize", tick);
    tick();
    return () => {
      removeEventListener("scroll", tick);
      removeEventListener("resize", tick);
      root.style.removeProperty("--stick");
    };
  }, [ref]);
}

/** Sticky headings in two levels. Level 1 (.sh.lv1: the list title, "The clubs") sticks under the bar or the compact hero (--stick);
 *  level 2 (.sh: months, sections) sticks right under the stuck level-1 heading (--stick2). The next heading pushes a stuck one out instead
 *  of piling onto it (a level-1 heading only yields to the next level-1); --ty is that push, kept apart from the measured box so the
 *  measurement doesn't feed back on itself. The frost is one bar behind the whole stack (#frost, rendered by App) that only ever changes
 *  height, so a hand-over between headings never touches it; headings carry no frost of their own. */
export function stickyHeads(): void {
  const root = document.documentElement;
  const s = parseFloat(getComputedStyle(root).getPropertyValue("--stick")) || 64;
  const hs = [...document.querySelectorAll<HTMLElement>(".sh")];
  const lv1 = hs.filter((h) => h.classList.contains("lv1"));
  const ty = (h: HTMLElement) => parseFloat(h.style.getPropertyValue("--ty")) || 0;
  // the box without the push (--ty). lift: how far below its new stick line a level-2 heading still reports itself (see below)
  let lift = (_top: number) => 0;
  const box = (h: HTMLElement) => {
    const r = h.getBoundingClientRect();
    const t = ty(h);
    const up = h.classList.contains("lv1") ? 0 : lift(r.top - t);
    return { top: r.top - t + up, bottom: r.bottom - t + up };
  };
  const at = (b: { top: number; bottom: number }, pos: number) => b.top <= pos + 1 && b.bottom > pos; // at its stick line, and not scrolled off with its container
  const cur = lv1.filter((h) => at(box(h), s)).at(-1);
  const curH = cur ? cur.getBoundingClientRect().height : 0;
  const s2 = s + curH;
  // The browser only moves the level-2 headings to a new --stick2 with the next frame: the boxes read below still sit at the old line.
  // When the line went down (a title just stuck, after a jump such as back/forward restoring the scroll position) every heading
  // above it will be on it, so that is where it counts as being; when it went up there is no telling, so measure again next frame.
  // Without this the stuck heading stayed unmarked, and without frost, until the next scroll.
  const s2px = s2.toFixed(2) + "px";
  const old = parseFloat(root.style.getPropertyValue("--stick2"));
  if (root.style.getPropertyValue("--stick2") !== s2px) {
    root.style.setProperty("--stick2", s2px);
    if (s2 > old) lift = (top) => Math.max(0, s2 - top);
    else onScroll();
  }
  let capH = 0;
  hs.forEach((h, i) => {
    const b = box(h);
    const one = h.classList.contains("lv1");
    const next = one ? lv1[lv1.indexOf(h) + 1] : hs[i + 1];
    const nt = next ? box(next).top + ty(next) : undefined;
    // a section heading that precedes the stuck title belongs to the section before it: pushed out, never part of this stack
    const stuck = at(b, one ? s : s2) && (one || !cur || i > hs.indexOf(cur));
    h.classList.toggle("stuck", stuck);
    if (stuck && !one) capH = Math.max(capH, b.bottom - b.top);
    h.style.setProperty("--ty", (nt != null && nt < b.bottom ? Math.round(nt - b.bottom) : 0) + "px");
  });
  const frost = document.getElementById("frost");
  if (!frost) return;
  const depth = curH + capH;
  const prev = +(frost.dataset.depth ?? 0) || 0;
  // growing is quick (.12s), so a fast scroll barely outruns it; shrinking takes its time
  frost.classList.toggle("now", depth > prev);
  frost.classList.toggle("on", depth > 0);
  frost.dataset.depth = String(depth);
  frost.style.setProperty("--fh", (depth + 1).toFixed(2) + "px");
}
let headsRaf = 0;
function onScroll() {
  if (!headsRaf)
    headsRaf = requestAnimationFrame(() => {
      headsRaf = 0;
      stickyHeads();
    });
}
if (typeof window !== "undefined") addEventListener("scroll", onScroll, { passive: true });
let headsDue = false;
/** For a component that renders a .sh heading (components/Sticky's Sh, the list head): re-measures after each of its renders and when
 *  it goes (scrolling re-measures on its own). Once per commit however many headings rendered: the microtask runs before the paint. */
export function useStickyHeads(): void {
  useLayoutEffect(() => {
    const due = () => {
      if (!headsDue) {
        headsDue = true;
        queueMicrotask(() => {
          headsDue = false;
          stickyHeads();
        });
      }
    };
    due();
    return due;
  });
}

/** An event listener on window (or on target's element) while the component is mounted. It always calls the latest handler, so the
 *  handler can read current props and state without re-subscribing. */
type EventOf<K extends string> = K extends keyof WindowEventMap ? WindowEventMap[K] : Event; // "beforeinstallprompt" is no DOM type
export function useEventListener<K extends string>(
  type: K,
  handler: (e: EventOf<K>) => void,
  target?: RefObject<EventTarget | null>,
): void {
  const latest = useEffectEvent(handler);
  useEffect(() => {
    const el = target ? target.current : window;
    if (!el) return;
    const h = (e: Event) => latest(e as EventOf<K>);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type, target]);
}

/** fn runs when the element's size changes, and once when it is first watched. Calls the latest fn. (Not under jsdom, which has
 *  no ResizeObserver.) */
export function useResize(ref: RefObject<Element | null>, fn: () => void): void {
  const latest = useEffectEvent(fn);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => latest());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
}

/** document.title for this screen ("<title> · Rotaract Events"); App sets the route's default first, this runs after it */
export function useTitle(title: string | null | undefined): void {
  useEffect(() => {
    if (title) document.title = title + " · Rotaract Events";
  }, [title]);
}

/** A <dialog> shown modal while open: focus inside it, the page behind out of reach (Tab included), Escape cancels it. The focus goes
 *  to focus (a title, so a screen reader reads where it is), again whenever refocus changes. When open turns false the dialog closes,
 *  closeAfter ms later when it has an exit transition to play first. */
export function useModal(
  dlg: RefObject<HTMLDialogElement | null>,
  open: boolean,
  {
    focus,
    refocus,
    closeAfter = 0,
  }: { focus?: RefObject<HTMLElement | null>; refocus?: unknown; closeAfter?: number } = {},
): void {
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal?.();
      focus?.current?.focus();
      return;
    }
    if (!d.open) return;
    if (!closeAfter) {
      d.close?.();
      return;
    }
    const id = setTimeout(() => d.close?.(), closeAfter);
    return () => clearTimeout(id);
  }, [dlg, open, focus, refocus, closeAfter]);
}
