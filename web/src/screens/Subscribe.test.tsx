// Subscribe draws the old subscribe.html DOM: platform steps, the all-clubs feed, per-club feeds by district, international, Rotary,
// questions; on a phone the Google link explains itself in a popup and copies the link (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData, mergeRotary } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast } from "../components";
import Subscribe from "./Subscribe";

// GoogleLink reads PHONE / IOS from lib/geo; a getter lets one test be an iPhone
const ua = vi.hoisted(() => ({ phone: false }));
vi.mock("../lib/geo", async orig => ({
  ...await orig<typeof import("../lib/geo")>(),
  get PHONE() { return ua.phone; },
  get IOS() { return ua.phone; },
}));

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => {
  cleanup();
  ua.phone = false;
});

const route = parseHash("#/subscribe");
const $ = (s: string) => document.querySelector(s);
const texts = (s: string) => [...document.querySelectorAll(s)].map(n => n.textContent);
const show = () => render(<><Subscribe route={route} /><Toast /></>);
const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");

describe("Subscribe", () => {
  it("draws the four cards with the old data-t headings and the platform steps", () => {
    show();
    expect([...document.querySelectorAll("main.wrap#main > section.card > h2")].map(h => h.getAttribute("data-t"))).toEqual(["sub_title", "sp_all", "sp_club", "faq"]);
    expect(texts("#how > details > summary")).toEqual(["iPhone / iPad (Apple Calendar)", "Google Calendar", "Android (Samsung or other calendar apps)", "Outlook / Windows / Mac"]);
    expect([...document.querySelectorAll("#how > details")].map(d => d.querySelectorAll("ol > li").length)).toEqual([3, 3, 2, 2]);
    expect(document.querySelectorAll("#qa > details[name=qa] > summary").length).toBeGreaterThan(0);
    expect($("#foot > footer")).not.toBeNull();
  });

  it("the everything feed: Rotaract upcoming count, webcal / Google / .ics links", () => {
    show();
    const row = $("#feedAll > .feed")!;
    expect(row.querySelector(".name")?.textContent).toBe("All Rotaract events in Switzerland & Liechtenstein · 4 upcoming");
    expect(row.querySelector(".name")?.hasAttribute("style")).toBe(false);
    const links = [...row.querySelectorAll(".l > a")].map(a => a.getAttribute("href"));
    const webcal = (base + "all.ics").replace(/^https?:/, "webcal:");
    expect(links).toEqual([webcal, "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal), base + "all.ics"]);
  });

  it("per club: districts with clubs sorted by name, international under its own heading, no empty National", () => {
    show();
    expect(texts("#feeds > h3")).toEqual(["D1980 · Central & North-West", "D1990 · West", "D2000 · East", "International events"]);
    expect(texts("#feeds .name > a")).toEqual(["Rotaract Luzern", "Rotaract Bern", "Rotaract Zürich", "Rotaract Zurich International", "Rotaract International"]);
    expect(texts("#feeds .name > .meta")).toEqual([" · 0 upcoming", " · 0 upcoming", " · 1 upcoming", " · 1 upcoming", " · 2 upcoming"]);
    const luzern = $("#feeds > .feed .name")!;
    expect(luzern.querySelector("img")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(luzern.querySelector("a")?.getAttribute("href")).toBe("#/club/luzern");
    expect((luzern as HTMLElement).style.getPropertyValue("--c")).toBe("#0b5cad");
  });

  it("Rotary layer on: its district feeds under their own heading", () => {
    const off = D.data;
    D.data = mergeRotary(structuredClone(fixture), true);
    show();
    expect(texts("#feeds > h3").at(-1)).toBe("Rotary, by district");
    expect([...document.querySelectorAll("#feeds > .feed")].at(-1)?.querySelector(".l > a:last-child")?.getAttribute("href")).toBe(base + "rotary1980.ics");
    D.data = off;
  });

  it("desktop: Google is a plain new-tab link", () => {
    show();
    const g = $("#feedAll .l > a:nth-child(2)") as HTMLAnchorElement;
    expect(g.target).toBe("_blank");
    expect(fireEvent.click(g)).toBe(true);
    expect($("dialog")).toBeNull();
  });

  it("iPhone: Google opens the popup with the Apple link; send copies the Google link and toasts", async () => {
    ua.phone = true;
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    show();
    const g = $("#feedAll .l > a:nth-child(2)") as HTMLAnchorElement;
    expect(fireEvent.click(g)).toBe(false);
    expect($("dialog h2")?.textContent).toBe("Google Calendar");
    const webcal = (base + "all.ics").replace(/^https?:/, "webcal:");
    expect($("dialog p:last-child > a")?.getAttribute("href")).toBe(webcal);
    await act(async () => { fireEvent.click($("dialog button.primary")!); });
    expect(writeText).toHaveBeenCalledWith(g.href);
    expect($("#toast")?.textContent).toBe("Link copied");
  });
});
