import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { fixture } from "./test/fixture";
import { t } from "./i18n";
import { loadData } from "./lib/data";
import { useLayoutEffect } from "react";
import App, { ROUTE_META } from "./App";

window.scrollTo = (() => {}) as typeof window.scrollTo;  // jsdom has no layout
window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
Element.prototype.scrollIntoView ??= function () {};
beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => { cleanup(); location.hash = ""; });
const go = async (h: string) => { await act(async () => { location.hash = h; window.dispatchEvent(new HashChangeEvent("hashchange")); }); };

describe("App shell", () => {
  it("sets up the page (body, title, scroll) before the screen's own layout effects run, so a screen measures the new page", async () => {
    const log: string[] = [], scroll = window.scrollTo, words = ROUTE_META.words.screen;
    window.scrollTo = (() => { log.push("scroll"); }) as typeof window.scrollTo;
    ROUTE_META.words.screen = function Probe() {
      useLayoutEffect(() => { log.push("screen on " + document.body.dataset.page); }, []);
      return <main />;
    };
    try {
      render(<App />);
      log.length = 0;
      await go("#/words");
      expect(log).toEqual(["scroll", "screen on words"]);
    } finally {
      ROUTE_META.words.screen = words; window.scrollTo = scroll;
      await go("#/");
    }
  });
  it("renders the chrome around the screen, in body order, and sets the page per route", async () => {
    render(<App />);
    const root = document.getElementById("root") ?? document.body.firstElementChild!;
    // body order matters to app.css (sticky #frost first, child selectors): App's chrome around whatever the screen renders
    const kids = [...root.children].map(n => n.id || n.tagName.toLowerCase());
    expect(kids.slice(0, 3)).toEqual(["frost", "a", "top"]);
    expect(kids.slice(-2)).toEqual(["tabs", "toast"]);
    expect(kids).toContain("main");
    expect(document.body.dataset.page).toBe("home");
    await go("#/calendar");
    expect(document.body.dataset.page).toBe("calendar");
    expect(document.body.classList.contains("calpage")).toBe(true);
    expect(document.title).toBe("Calendar · Rotaract Events");
    expect(within(screen.getByRole("navigation", { name: "Main" })).getByRole("link", { current: "page" }).getAttribute("href")).toBe("#/calendar");
    expect(screen.getByRole("link", { name: t("skip_to") }).getAttribute("href")).toBe("#main");
    expect(screen.queryByRole("link", { name: t("back") })).toBeNull();
    await go("#/event/123");
    expect(document.body.dataset.page).toBe("event");
    expect(document.body.classList.contains("calpage")).toBe(false);
    expect(screen.getByRole("link", { name: t("back") })).toBeTruthy();
    expect(screen.queryByRole("link", { name: t("skip_to") })).toBeNull();
    await go("#/about-more");
    expect(document.body.className).toContain("frosted");
  });
  it("a new screen starts at the top; back returns to where the list was left", async () => {
    const to = vi.fn(); window.scrollTo = to as unknown as typeof window.scrollTo;
    const scrollAt = (y: number) => { Object.defineProperty(window, "scrollY", { value: y, configurable: true }); window.dispatchEvent(new Event("scroll")); };
    render(<App />);
    await nav("#/discover"); scrollAt(1400);
    await nav("#/event/179501");
    expect(to).toHaveBeenLastCalledWith(0, 0);
    scrollAt(300);
    await act(async () => { history.back(); await new Promise(r => setTimeout(r, 30)); });
    expect(location.hash).toBe("#/discover");
    expect(to).toHaveBeenLastCalledWith(0, 1400);
    await act(async () => { history.forward(); await new Promise(r => setTimeout(r, 30)); });
    expect(to).toHaveBeenLastCalledWith(0, 300);
    window.scrollTo = (() => {}) as typeof window.scrollTo;
  });
});
// a real navigation: a new history entry (location.hash), the hashchange event arrives on its own
const nav = async (h: string) => { await act(async () => { location.hash = h; await new Promise(r => setTimeout(r, 30)); }); };
