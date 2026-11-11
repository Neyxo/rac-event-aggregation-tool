// Before and without events.json: App renders every screen inside a DataBoundary, which shows a skeleton while the data loads and
// the offline note when it can't be loaded. A file of its own: the data module loads once per module instance, and here it must
// not have loaded yet. The tests run in order: first the failures, then the load that works.
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { fixture } from "../test/fixture";
import { t } from "../i18n";
import { parseHash, type RouteName } from "../lib/route";
import type { ScreenProps } from "../App";
import { DataBoundary } from "./Blocks";
import Home from "../screens/Home";
import Discover from "../screens/Discover";
import Calendar from "../screens/Calendar";
import Event from "../screens/Event";
import Club from "../screens/Club";
import Settings from "../screens/Settings";
import Subscribe from "../screens/Subscribe";
import About from "../screens/About";
import AboutMore from "../screens/AboutMore";
import Family from "../screens/Family";
import Guide from "../screens/Guide";
import Intl from "../screens/Intl";
import Dev from "../screens/Dev";
import MapScreen from "../screens/Map";

window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); document.body.className = ""; document.body.removeAttribute("style"); });

const failing = () => vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }));
/** a fetch that answers when told to */
function held(ok: boolean) {
  let answer!: () => void;
  const f = vi.fn(() => new Promise(res => { answer = () => res(ok ? { ok: true, json: async () => structuredClone(fixture) } : { ok: false, status: 500, json: async () => ({}) }); }));
  return { f, answer: () => answer() };
}
/** each screen shown as a navigation of its own (App passes useNav().id) */
let nav = 0;
const boundary = (Screen: ComponentType<ScreenProps>, hash: string, n: number) => (
  <DataBoundary nav={n} main="wrap evpage" skel={3}><Screen route={parseHash(hash)} /></DataBoundary>
);
const show = (Screen: ComponentType<ScreenProps>, hash: string) => render(boundary(Screen, hash, ++nav));
const offlineOnly = async () => {
  await screen.findByText(t("offline"));  // React shows what a boundary waited for a little later (its fallback throttle)
  expect(screen.getByRole("main").textContent).toBe(t("offline") + t("refresh"));
  screen.getByRole("button", { name: t("refresh") });
};

const SCREENS: [RouteName, ComponentType<ScreenProps>, string][] = [
  ["home", Home, "#/"], ["discover", Discover, "#/discover"], ["calendar", Calendar, "#/calendar"], ["map", MapScreen, "#/map"],
  ["event", Event, "#/event/217812"], ["club", Club, "#/club/luzern"], ["settings", Settings, "#/settings"], ["subscribe", Subscribe, "#/subscribe"],
  ["about", About, "#/about"], ["about-more", AboutMore, "#/about-more"], ["family", Family, "#/family"], ["guide", Guide, "#/guide"],
  ["intl", Intl, "#/intl"], ["dev", Dev, "#/dev"],
];

describe("DataBoundary", () => {
  it("while events.json loads: a skeleton in place of the screen; when it fails: the offline note, and nothing of the screen", async () => {
    const { f, answer } = held(false);
    vi.stubGlobal("fetch", f);
    await act(async () => { show(Event, "#/event/217812"); });  // an awaited act: React only retries a suspension started in one
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    expect(screen.getByRole("main").querySelectorAll(".skel")).toHaveLength(3);
    expect(screen.getByRole("main").className).toBe("wrap evpage");  // where the screen's own content would sit
    await act(async () => { answer(); });
    await offlineOnly();
    // the screen never ran: no club colours, no wash
    expect(document.body.classList.contains("wash")).toBe(false);
  });

  it("a failed load is not tried again while the screen stays, nor when its boundary is built anew: one fetch, the note stays", async () => {
    const f = failing();
    vi.stubGlobal("fetch", f);
    await act(async () => { show(Home, "#/"); });
    await offlineOnly();
    await act(async () => { await new Promise(r => setTimeout(r, 30)); });
    expect(f).toHaveBeenCalledTimes(1);
    cleanup();
    await act(async () => { render(boundary(Home, "#/", nav)); });  // same navigation
    await offlineOnly();
    expect(f).toHaveBeenCalledTimes(1);
  });

  it.each(SCREENS)("%s: main holds only the offline note", async (_name, Screen, hash) => {
    vi.stubGlobal("fetch", failing());
    await act(async () => { show(Screen, hash); });
    await offlineOnly();
    expect(document.querySelector(".leaflet-container")).toBeNull();
  });

  it("a shared filter link to Home goes to Discover at once, without waiting for (or counting on) the data", async () => {
    const f = failing();
    vi.stubGlobal("fetch", f);
    history.replaceState(null, "", "/#/?clubs=bern");
    await act(async () => { show(Home, "#/?clubs=bern"); });
    expect(location.hash).toBe("#/discover?clubs=bern");
    expect(f).not.toHaveBeenCalled();
    history.replaceState(null, "", "/");
  });

  it("a new navigation to the same screen (#/discover?clubs=x to #/discover) tries again", async () => {
    vi.stubGlobal("fetch", failing());
    let r!: ReturnType<typeof render>;
    await act(async () => { r = show(Calendar, "#/calendar"); });
    await offlineOnly();
    const { f, answer } = held(true);
    vi.stubGlobal("fetch", f);
    await act(async () => { r.rerender(boundary(Calendar, "#/calendar", ++nav)); });  // same key in App: the boundary stays
    expect(f).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("main").getAttribute("aria-busy")).toBe("true");
    await act(async () => { answer(); });
    await screen.findByRole("button", { name: t("prev_month") });  // the calendar itself
  });
});
