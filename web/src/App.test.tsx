import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import App from "./App";

window.scrollTo = (() => {}) as typeof window.scrollTo;  // jsdom has no layout
afterEach(() => { cleanup(); location.hash = ""; });
const go = async (h: string) => { await act(async () => { location.hash = h; window.dispatchEvent(new HashChangeEvent("hashchange")); }); };

describe("App shell", () => {
  it("renders the chrome around the screen, in body order, and sets the page per route", async () => {
    render(<App />);
    const root = document.getElementById("root") ?? document.body.firstElementChild!;
    expect([...root.children].map(n => n.id || n.tagName.toLowerCase())).toEqual(["frost", "skip-link", "top", "stale", "main", "ob", "tabs", "toast"].map(x => x === "skip-link" ? "a" : x));
    expect(document.body.dataset.page).toBe("home");
    await go("#/calendar");
    expect(document.body.dataset.page).toBe("calendar");
    expect(document.body.classList.contains("calpage")).toBe(true);
    expect(document.title).toBe("Calendar · Rotaract Events");
    expect(document.querySelector("#tabs a.tab.on")?.getAttribute("href")).toBe("#/calendar");
    await go("#/event/123");
    expect(document.body.dataset.page).toBe("event");
    expect(document.body.classList.contains("calpage")).toBe(false);
    expect(document.querySelector("#top .lft a.hbtn")).not.toBeNull();  // back button
    expect(document.querySelector("a.skip")).toBeNull();
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
