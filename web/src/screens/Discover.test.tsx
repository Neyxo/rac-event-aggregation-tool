// Discover: the filters from and to the URL, the panel, chips and picker, search, views, Clear, on the fixture data (today: 11 Nov 2026).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { initData, loadData, setSettings } from "../lib/data";
import { navigate, useRoute } from "../components";
import Discover from "./Discover";

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  localStorage.clear();
  initData(fixture);
  setSettings({ home: "luzern", also: [] });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Discover as App renders it: its route follows the URL (the list reads its filters from there) */
const Routed = () => <Discover route={useRoute()} />;
const show = async (hash = "#/discover") => {
  history.replaceState(null, "", "/");
  navigate(hash, { replace: true });
  const r = render(<Routed />);
  await act(async () => {});
  return r;
};
// the event cards, as the ids their links open
const ids = () => screen.queryAllByRole("link").map(a => a.getAttribute("href")!).filter(h => h.startsWith("#/event/")).map(h => h.slice(8));
const btn = (name: string | RegExp) => screen.getByRole("button", { name });
const filters = () => btn(/^Filters/);
const view = (name: string) => within(screen.getByRole("group", { name: "Filters" })).getByRole("button", { name });
const pressed = (group: string) => within(screen.getByRole("group", { name: group })).getAllByRole("button").map(b => b.getAttribute("aria-pressed"));
const search = () => screen.getByRole<HTMLInputElement>("searchbox", { name: "Search" });

describe("Discover", () => {
  it("every upcoming event, by month; the panel closed, nothing to clear", async () => {
    await show();
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    expect(screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent)).toEqual(["Events", "November 2026", "January 2027"]);
    expect(screen.getByText("4 events")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
    expect(filters().getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("group", { name: "District" })).toBeNull();
    expect(filters()).toHaveProperty("textContent", "Filters0");
    expect(filters().querySelector(".n")).toHaveProperty("hidden", true);
    expect(pressed("Filters")).toEqual(["true", "false", "false", "false"]);
    expect(screen.getByRole("link", { name: /Polaris/ }).getAttribute("href")).toBe("#/public");
  });

  it("a new navigation (the Discover tab) starts over from its URL; rewriting the query does not", async () => {
    await act(async () => { history.replaceState(null, "", "/#/discover?d=2000&q=konzert"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    const W = () => <Discover route={useRoute()} />;
    render(<W />);
    await act(async () => {});
    fireEvent.click(filters());
    expect(ids()).toEqual(["219091"]);
    await act(async () => { history.pushState(null, "", "#/discover"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    expect(search().value).toBe("");
    expect(filters().getAttribute("aria-expanded")).toBe("false");
    expect(location.hash).toBe("#/discover");
  });

  it("filters from a shared link; unknown clubs are dropped", async () => {
    await show("#/discover?q=konzert&d=2000&clubs=zuerich,nope");
    expect(search().value).toBe("konzert");
    expect(ids()).toEqual(["219091"]);
    expect(filters().textContent).toBe("Filters2");
    expect(btn("Clear")).toBeTruthy();
    fireEvent.click(filters());
    expect(pressed("District")).toEqual(["false", "false", "false", "true"]);
    // the chosen club's chip, pressed; "All" is not
    expect(within(screen.getByRole("group", { name: "Clubs" })).getAllByRole("button", { pressed: true }).map(b => b.getAttribute("aria-label"))).toEqual(["Rotaract Zürich"]);
    expect(location.hash).toBe("#/discover?q=konzert&d=2000&clubs=zuerich");
  });

  it("the panel, a district, the club picker, and Clear; the URL follows", async () => {
    await show();
    fireEvent.click(filters());
    expect(filters().getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(within(screen.getByRole("group", { name: "District" })).getByRole("button", { name: /^D2000/ }));
    expect(ids()).toEqual(["219091", "222796"]);
    expect(location.hash).toBe("#/discover?d=2000");
    fireEvent.click(btn("Choose clubs"));
    const pop = within(screen.getByRole("dialog"));
    const chips = () => pop.getAllByRole("button").filter(b => !b.classList.contains("obx"));
    // only the clubs of the chosen district
    expect(chips().map(b => b.textContent)).toEqual(["Zürich", "ZH Intl"]);
    fireEvent.click(chips()[1]!);
    expect(chips().filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.textContent)).toEqual(["ZH Intl"]);
    expect(ids()).toEqual(["222796"]);
    expect(filters().textContent).toBe("Filters2");
    fireEvent.click(pop.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(btn("Clear"));
    expect(ids()).toHaveLength(4);
    expect(location.hash).toBe("#/discover");
    expect(filters().querySelector(".n")).toHaveProperty("hidden", true);
  });

  it("search waits for a pause in typing", async () => {
    await show();
    fireEvent.change(search(), { target: { value: "rem" } });
    expect(ids()).toHaveLength(4);
    await act(async () => { await new Promise(r => setTimeout(r, 200)); });
    expect(ids()).toEqual(["eu2069", "eu2067"]);
    expect(location.hash).toBe("#/discover?q=rem");
  });

  it("place and radius: geocoded, 25 km by default, events without a place hidden", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ results: [{ attrs: { lat: 47.37, lon: 8.54, label: "<b>Zürich</b>" } }] }) })));
    await show();
    fireEvent.click(filters());
    const place = screen.getByRole("textbox", { name: "Near a place or postcode" });
    const radius = () => screen.getByRole<HTMLSelectElement>("combobox", { name: "Radius" });
    fireEvent.input(place, { target: { value: "Zürich" } });
    await act(async () => { place.dispatchEvent(new Event("change")); });
    expect(screen.getByText("📍 Zürich")).toBeTruthy();
    expect(radius().value).toBe("25");
    expect(ids()).toEqual(["219091", "222796"]);
    expect(screen.getByText("2 events · within 25 km of Zürich · 2 without a known location hidden")).toBeTruthy();
    expect(location.hash).toBe("#/discover?place=Z%C3%BCrich&r=25");
    fireEvent.change(radius(), { target: { value: "" } });
    expect(ids()).toHaveLength(4);
  });

  it("a place geocoded after leaving Discover doesn't write its filters into the next screen's URL", async () => {
    let answer!: () => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(res => { answer = () => res({ json: async () => ({ results: [{ attrs: { lat: 47.37, lon: 8.54, label: "Zürich" } }] }) }); })));
    const { unmount } = await show();
    fireEvent.click(filters());
    const place = screen.getByRole("textbox", { name: "Near a place or postcode" });
    fireEvent.input(place, { target: { value: "Zürich" } });
    await act(async () => { place.dispatchEvent(new Event("change")); });
    unmount();
    history.replaceState(null, "", "/#/");  // somewhere else now
    await act(async () => { answer(); });
    expect(location.hash).toBe("#/");
  });

  it("near me asks for the position; saved and past views", async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 47.05, longitude: 8.3 } } as GeolocationPosition));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    await show();
    fireEvent.click(view("Near me"));
    expect(getCurrentPosition).toHaveBeenCalled();
    fireEvent.click(filters());
    expect(screen.getByText("📍 Your location")).toBeTruthy();
    expect(screen.getByText(/within 25 km of you/)).toBeTruthy();
    fireEvent.click(view("Saved ★"));
    expect(screen.getByText(/Nothing saved yet\./)).toBeTruthy();
    expect(btn("Show all upcoming")).toBeTruthy();
    fireEvent.click(view("Past"));
    expect(ids()).toEqual(["179502", "179501"]);  // Luzern's, most recent first
    expect(location.hash).toBe("#/discover?r=25&view=past");
  });
});
