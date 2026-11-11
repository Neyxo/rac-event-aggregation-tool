// Discover: the filters from and to the URL, the panel, chips and picker, search, views, Clear, on the fixture data (today: 11 Nov 2026).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import { useRoute } from "../components";
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
  D.saved = new Set();
  D.settings = { home: "luzern", also: [] };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const show = async (hash = "#/discover") => {
  history.replaceState(null, "", "/" + hash);
  const r = render(<Discover route={parseHash(hash)} />);
  await act(async () => {});
  return r;
};
const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const ids = () => [...document.querySelectorAll("#results a.event")].map(a => a.id.slice(3));

describe("Discover", () => {
  it("every upcoming event, by month; the panel closed, nothing to clear", async () => {
    await show();
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    expect([...document.querySelectorAll("#results h3.sh")].map(h => h.textContent)).toEqual(["November 2026", "January 2027"]);
    expect($("#summary").textContent).toBe("4 events");
    expect($("#clear").hidden).toBe(true);
    expect($("#panel").hidden).toBe(true);
    expect($("#fcount").hidden).toBe(true);
    expect($("#fcount").textContent).toBe("0");
    expect([...document.querySelectorAll("#views button")].map(b => b.getAttribute("aria-pressed"))).toEqual(["true", "false", "false", "false"]);
    expect(document.querySelector("dialog#ob .ob-in#obBody")).not.toBeNull();
    expect($("#foot .meta a").getAttribute("href")).toBe("#/public");
  });

  it("a new navigation (the Discover tab) starts over from its URL; rewriting the query does not", async () => {
    await act(async () => { history.replaceState(null, "", "/#/discover?d=2000&q=konzert"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    const W = () => <Discover route={useRoute()} />;
    render(<W />);
    await act(async () => {});
    fireEvent.click($("#fbtn"));
    expect(ids()).toEqual(["219091"]);
    await act(async () => { history.pushState(null, "", "#/discover"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    expect($<HTMLInputElement>("#q").value).toBe("");
    expect($("#panel").hidden).toBe(true);
    expect(location.hash).toBe("#/discover");
  });

  it("filters from a shared link; unknown clubs are dropped", async () => {
    await show("#/discover?q=konzert&d=2000&clubs=zuerich,nope");
    expect($<HTMLInputElement>("#q").value).toBe("konzert");
    expect(ids()).toEqual(["219091"]);
    expect($("#fcount").textContent).toBe("2");
    expect($("#clear").hidden).toBe(false);
    expect([...document.querySelectorAll("#districts button")].map(b => b.getAttribute("aria-pressed"))).toEqual(["false", "false", "false", "true"]);
    expect([...document.querySelectorAll("#clubs .chip.club")].map(b => b.getAttribute("aria-label"))).toEqual(["Rotaract Zürich"]);
    expect(location.hash).toBe("#/discover?q=konzert&d=2000&clubs=zuerich");
  });

  it("the panel, a district, the club picker, and Clear; the URL follows", async () => {
    await show();
    fireEvent.click($("#fbtn"));
    expect($("#panel").hidden).toBe(false);
    expect($("#fbtn").getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(document.querySelectorAll("#districts button")[3]!);  // D2000
    expect(ids()).toEqual(["219091", "222796"]);
    expect(location.hash).toBe("#/discover?d=2000");
    fireEvent.click([...document.querySelectorAll("#clubs button")].at(-1)!);
    const pop = $("dialog[open]");
    // only the clubs of the chosen district
    expect([...pop.querySelectorAll(".chips button")].map(b => b.textContent)).toEqual(["Zürich", "ZH Intl"]);
    fireEvent.click(pop.querySelectorAll(".chips button")[1]!);
    expect(pop.querySelector(".chips button[aria-pressed=true]")?.textContent).toBe("ZH Intl");
    expect(ids()).toEqual(["222796"]);
    expect($("#fcount").textContent).toBe("2");
    fireEvent.click(pop.querySelector(".nav .btn")!);
    expect(document.querySelector("dialog[open]")).toBeNull();
    fireEvent.click($("#clear"));
    expect(ids()).toHaveLength(4);
    expect(location.hash).toBe("#/discover");
    expect($("#fcount").hidden).toBe(true);
  });

  it("search waits for a pause in typing", async () => {
    await show();
    fireEvent.change($("#q"), { target: { value: "rem" } });
    expect(ids()).toHaveLength(4);
    await act(async () => { await new Promise(r => setTimeout(r, 200)); });
    expect(ids()).toEqual(["eu2069", "eu2067"]);
    expect(location.hash).toBe("#/discover?q=rem");
  });

  it("place and radius: geocoded, 25 km by default, events without a place hidden", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => ({ results: [{ attrs: { lat: 47.37, lon: 8.54, label: "<b>Zürich</b>" } }] }) })));
    await show();
    const place = $<HTMLInputElement>("#place");
    fireEvent.input(place, { target: { value: "Zürich" } });
    await act(async () => { place.dispatchEvent(new Event("change")); });
    expect($("#placeHint").textContent).toBe("📍 Zürich");
    expect($<HTMLSelectElement>("#radius").value).toBe("25");
    expect(ids()).toEqual(["219091", "222796"]);
    expect($("#summary").textContent).toBe("2 events · within 25 km of Zürich · 2 without a known location hidden");
    expect(location.hash).toBe("#/discover?place=Z%C3%BCrich&r=25");
    fireEvent.change($("#radius"), { target: { value: "" } });
    expect(ids()).toHaveLength(4);
  });

  it("near me asks for the position; saved and past views", async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) => ok({ coords: { latitude: 47.05, longitude: 8.3 } } as GeolocationPosition));
    vi.stubGlobal("navigator", { ...navigator, geolocation: { getCurrentPosition } });
    await show();
    fireEvent.click($("#views [data-view=near]"));
    expect(getCurrentPosition).toHaveBeenCalled();
    expect($("#placeHint").textContent).toBe("📍 Your location");
    expect($("#summary").textContent).toContain("within 25 km of you");
    fireEvent.click($("#views [data-view=saved]"));
    expect($("#results .empty").textContent).toContain("Nothing saved yet.");
    fireEvent.click($("#views [data-view=past]"));
    expect(ids()).toEqual(["179502", "179501"]);  // Luzern's, most recent first
    expect(location.hash).toBe("#/discover?r=25&view=past");
  });
});
