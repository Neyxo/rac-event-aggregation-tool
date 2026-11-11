// Hooks every screen can use: the data, stored values, the colour wash, the morphing hero, the sticky headings.
import { use, useEffect, useLayoutEffect, useMemo, useRef, useSyncExternalStore, type RefObject } from "react";
import { getData, getFailure, getStatus, loadData, subscribeData, type AppData } from "../lib/data";
import { getInstallPrompt, subscribeInstall, type InstallPrompt } from "../lib/install";
import { store, type StoreKey, type StoreKeys } from "../lib/store";

/** events.json and what the app derives from it (lib/data's state): D.data.events, D.clubs, D.settings, D.saved. Re-renders whenever an
 *  action (setSettings, toggleSaved, setRotary) changes the state. Until events.json is in, the screen suspends (App's DataBoundary
 *  shows a skeleton instead); when it can't be loaded, it throws LoadFailed (the DataBoundary shows the offline note). So a screen
 *  never sees the data missing, and only renders once it is there. */
export function useData(): AppData {
  const D = useSyncExternalStore(subscribeData, getData);
  const status = getStatus();
  if (status === "error") throw getFailure();
  if (status === "loading") use(loadData());
  return D;
}

/** the browser's install prompt while it can be shown (lib/install's install() shows it), null otherwise */
export const useInstallPrompt = (): InstallPrompt | null => useSyncExternalStore(subscribeInstall, getInstallPrompt);

/** whether an event is saved; re-renders this component only when that changes (a star toggled anywhere) */
export const useSaved = (id: string): boolean => useSyncExternalStore(subscribeData, () => getData().saved.has(id));

/** a localStorage value that re-renders when store.set()/remove() changes it */
export function useStored<K extends StoreKey, T>(k: K, d: T): StoreKeys[K] | T {
  const raw = useSyncExternalStore(store.subscribe, () => { try { return localStorage.getItem(k); } catch { return null; } });
  return useMemo(() => store.get(k, d), [k, raw]);
}

/** the colour wash behind a screen: body.wash with radial blobs in up to three colours (--c1..--c3); removed when the screen goes */
export function useWash(...colors: (string | undefined | null | false)[]): void {
  const list = colors.filter((c): c is string => !!c).slice(0, 3), key = list.join(" ");
  useLayoutEffect(() => {
    if (!list.length) return;
    const b = document.body;
    b.classList.add("wash"); list.forEach((c, i) => b.style.setProperty("--c" + (i + 1), c));
    return () => { b.classList.remove("wash"); for (let i = 1; i <= 3; i++) b.style.removeProperty("--c" + i); };
  }, [key]);
}

/** The hero (event head, club head) sticks under the top bar and compacts as you scroll: the CSS reads --m (0 at rest, 1 compact) and .on.
 *  Not scroll-bound: once the head has stuck for 24px it goes compact on its own; below 8px it comes back. Section headings stick under the
 *  compact hero while it is there (--stick). The screen renders, right before the head: <i className="sent" aria-hidden="true" />,
 *  and gives the head a static className that includes "morph" (React must not rewrite it: .on is toggled here). Pass ready=false while
 *  the head is not rendered yet. */
export function useMorphHead(ref: RefObject<HTMLElement | null>, ready = true): void {
  useLayoutEffect(() => {
    const node = ref.current, sent = node?.previousElementSibling, bar = document.getElementById("top");
    if (!ready || !node || !sent || !bar) return;
    const root = document.documentElement, top = bar.offsetHeight;
    node.style.top = top + "px";
    let on = false;
    const tick = () => {
      const d = top - sent.getBoundingClientRect().top;
      if ((d > 24 && !on) || (d < 8 && on)) { on = d > 24; node.style.setProperty("--m", on ? "1" : "0"); node.classList.toggle("on", on); }
      root.style.setProperty("--stick", Math.round(Math.max(top, Math.min(node.getBoundingClientRect().bottom, top + node.offsetHeight))) + "px");
    };
    addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick);
    // first tick next frame: this effect runs before App's, which scrolls the new screen to the top (or back to where it was); measured
    // now, the head would see the previous screen's scroll position and flash compact
    const first = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(first); removeEventListener("scroll", tick); removeEventListener("resize", tick); root.style.setProperty("--stick", bar.offsetHeight + "px"); };
  }, [ref, ready]);
}

/** Sticky headings in two levels. Level 1 (.sh.lv1: the list title, "The clubs") sticks under the bar or the compact hero (--stick);
 *  level 2 (.sh: months, sections) sticks right under the stuck level-1 heading (--stick2). The next heading pushes a stuck one out instead
 *  of piling onto it (a level-1 heading only yields to the next level-1); --ty is that push, kept apart from the measured box so the
 *  measurement doesn't feed back on itself. The frost is one bar behind the whole stack (#frost, rendered by App) that only ever changes
 *  height, so a hand-over between headings never touches it; headings carry no frost of their own. */
export function stickyHeads(): void {
  const root = document.documentElement, s = parseFloat(getComputedStyle(root).getPropertyValue("--stick")) || 63;
  const hs = [...document.querySelectorAll<HTMLElement>(".sh")], lv1 = hs.filter(h => h.classList.contains("lv1"));
  const box = (h: HTMLElement) => { const r = h.getBoundingClientRect(), ty = parseFloat(h.style.getPropertyValue("--ty")) || 0; return { top: r.top - ty, bottom: r.bottom - ty }; };
  const at = (b: { top: number; bottom: number }, pos: number) => b.top <= pos + 1 && b.bottom > pos;  // at its stick line, and not scrolled off with its container
  const cur = lv1.filter(h => at(box(h), s)).at(-1), curH = cur ? cur.getBoundingClientRect().height : 0, s2 = s + curH;
  root.style.setProperty("--stick2", s2.toFixed(2) + "px");
  let capH = 0;
  hs.forEach((h, i) => {
    const b = box(h), one = h.classList.contains("lv1"), next = one ? lv1[lv1.indexOf(h) + 1] : hs[i + 1], nt = next?.getBoundingClientRect().top;
    // a section heading that precedes the stuck title belongs to the section before it: pushed out, never part of this stack
    const stuck = at(b, one ? s : s2) && (one || !cur || i > hs.indexOf(cur)); h.classList.toggle("stuck", stuck);
    if (stuck && !one) capH = Math.max(capH, b.bottom - b.top);
    h.style.setProperty("--ty", (nt != null && nt < b.bottom ? Math.round(nt - b.bottom) : 0) + "px");
  });
  const frost = document.getElementById("frost"); if (!frost) return;
  const depth = curH + capH, prev = +(frost.dataset.depth ?? 0) || 0;
  // growing is quick (.12s), so a fast scroll barely outruns it; shrinking takes its time
  frost.classList.toggle("now", depth > prev); frost.classList.toggle("on", depth > 0); frost.dataset.depth = String(depth);
  frost.style.setProperty("--fh", (depth + 1).toFixed(2) + "px");
}
let headsRaf = 0;
const onScroll = () => { if (!headsRaf) headsRaf = requestAnimationFrame(() => { headsRaf = 0; stickyHeads(); }); };
if (typeof window !== "undefined") addEventListener("scroll", onScroll, { passive: true });
/** call in every screen with .sh headings: re-measures after each render of that screen (scrolling re-measures on its own) */
export function useStickyHeads(): void {
  useLayoutEffect(() => { stickyHeads(); });
}

/** An event listener on window (or on target's element) while the component is mounted. It always calls the latest handler, so the
 *  handler can read current props and state without re-subscribing. */
type EventOf<K extends string> = K extends keyof WindowEventMap ? WindowEventMap[K] : Event;  // "beforeinstallprompt" is no DOM type
export function useEventListener<K extends string>(type: K, handler: (e: EventOf<K>) => void, target?: RefObject<EventTarget | null>): void {
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    const el = target ? target.current : window;
    if (!el) return;
    const h = (e: Event) => latest.current(e as EventOf<K>);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type, target]);
}

/** document.title for this screen ("<title> · Rotaract Events"); App sets the route's default first, this runs after it */
export function useTitle(title: string | null | undefined): void {
  useEffect(() => { if (title) document.title = title + " · Rotaract Events"; }, [title]);
}

/** A <dialog> shown modal while open: focus inside it, the page behind out of reach (Tab included), Escape cancels it. The focus goes
 *  to focus (a title, so a screen reader reads where it is), again whenever refocus changes. When open turns false the dialog closes,
 *  closeAfter ms later when it has an exit transition to play first. */
export function useModal(dlg: RefObject<HTMLDialogElement | null>, open: boolean, { focus, refocus, closeAfter = 0 }: { focus?: RefObject<HTMLElement | null>; refocus?: unknown; closeAfter?: number } = {}): void {
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (open) {
      if (!d.open) d.showModal?.();
      focus?.current?.focus();
      return;
    }
    if (!d.open) return;
    if (!closeAfter) { d.close?.(); return; }
    const id = setTimeout(() => d.close?.(), closeAfter);
    return () => clearTimeout(id);
  }, [open, refocus]);
}

