// Subscribe: platform steps, the all-clubs feed, per-club feeds by district, international, Rotary,
// questions; on a phone the Google link explains itself in a popup and copies the link (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t, tx } from "../i18n";
import { loadData, setRotary } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast } from "../components";
import Subscribe from "./Subscribe";

// the subscribe sheet reads PHONE / IOS from lib/geo; getters let a test be an iPhone or an Android phone
const ua = vi.hoisted(() => ({ phone: false, ios: false }));
vi.mock("../lib/geo", async orig => ({
  ...await orig<typeof import("../lib/geo")>(),
  get PHONE() { return ua.phone; },
  get IOS() { return ua.ios; },
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
  ua.phone = false; ua.ios = false;
});

const route = parseHash("#/subscribe");
const show = () => render(<><Subscribe route={route} /><Toast /></>);
const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
const webcal = (base + "all.ics").replace(/^https?:/, "webcal:");
/** a card, by its heading */
const card = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("section")!;
/** taps a feed's Subscribe button and returns the sheet */
const sheet = (el: HTMLElement, i = 0) => {
  fireEvent.click(within(el).getAllByRole("button", { name: t("subscribe") }).at(i)!);
  return within(document.querySelector("dialog")!);
};
const gcal = (w: string) => "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(w);
/** one way in of the open sheet, by its title */
const way = (_dlg: unknown, k: "way_apple" | "way_google" | "way_outlook" | "way_ics") =>
  [...document.querySelectorAll<HTMLElement>("dialog .way")].find(x => x.textContent!.startsWith(t(k)))!;

describe("Subscribe", () => {
  it("draws the four cards with their headings, what a subscription does and the platform steps", () => {
    show();
    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual(["Subscribe to a calendar", "Everything", "Per club", "Questions"]);
    expect(card("Subscribe to a calendar").querySelectorAll(".facts2 li")).toHaveLength(4);
    const how = [...card("Subscribe to a calendar").querySelectorAll("details")];
    expect(how.map(d => d.querySelector("summary")!.textContent)).toEqual(["iPhone / iPad (Apple Calendar)", "Google Calendar", "Android (Samsung or other calendar apps)", "Outlook / Windows / Mac"]);
    expect(how.map(d => d.querySelectorAll("details > ol > li").length)).toEqual([3, 3, 2, 2]);
    // Google and Android say what is left to do on the phone; Google lets you pick the phone, Android is Android
    expect(how.map(d => d.querySelectorAll(".phonefix").length)).toEqual([0, 1, 1, 0]);
    expect(how.map(d => d.querySelectorAll(".phonefix .seg button").length)).toEqual([0, 2, 0, 0]);
    expect(card("Questions").querySelectorAll("details[name=qa]").length).toBeGreaterThan(0);
    screen.getByText(t("made_by"));
  });

  it("the everything feed: upcoming count, then one Subscribe button whose sheet offers Apple, Google, Outlook and the file", () => {
    show();
    const all = card("Everything");
    const name = within(all).getByText(/^All Rotaract events/);
    expect(name.textContent).toBe("All Rotaract events in Switzerland & Liechtenstein4 upcoming");
    expect(name.hasAttribute("style")).toBe(false);
    const dlg = sheet(all);
    dlg.getByRole("heading", { name: t("sp_all_feed") });
    expect(way(dlg, "way_google").getAttribute("href")).toBe(gcal(webcal));
    expect(way(dlg, "way_google").getAttribute("target")).toBe("_blank");
    expect(way(dlg, "way_outlook").getAttribute("href")).toBe(`https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(t("sp_all_feed"))}`);
    expect(dlg.getByRole("link", { name: t("sub_more") }).getAttribute("href")).toBe("#/subscribe");
  });

  it("computer: Google opens in a new tab and the sheet left behind says how to switch it on on the phone", () => {
    show();
    const dlg = sheet(card("Everything"));
    fireEvent.click(way(dlg, "way_google"));
    dlg.getByRole("heading", { name: t("way_google") });
    dlg.getByText(t("sp_g_tab"));
    // "On your phone": Android's steps first, iPhone's with Google's sync page on a tap
    dlg.getByText(t("sp_g_sync_h"));
    dlg.getByText(tx("sp_g_sync_a")[3]!);
    expect(dlg.queryByRole("link", { name: t("sp_g_sync_btn") })).toBeNull();
    fireEvent.click(dlg.getByRole("button", { name: "iPhone" }));
    expect(dlg.getByRole("link", { name: t("sp_g_sync_btn") }).getAttribute("href")).toBe("https://calendar.google.com/calendar/syncselect");
    expect(dlg.queryByText(tx("sp_g_sync_a")[3]!)).toBeNull();
    expect(dlg.queryByText(t("sp_g_no"))).toBeNull();
  });

  it("the file first warns that it is a copy that won't update, then downloads", () => {
    show();
    const dlg = sheet(card("Everything"));
    fireEvent.click(way(dlg, "way_ics"));
    dlg.getByText(t("ics_stale_feed"));
    expect(dlg.getAllByRole("listitem")).toHaveLength(3);
    expect(dlg.getByRole("link", { name: t("ics_dl") }).getAttribute("href")).toBe(base + "all.ics");
    fireEvent.click(dlg.getByRole("button", { name: t("back") }));
    dlg.getByText(t("way_ics_s"));
  });

  it("not an Apple device: Apple says so instead of a dead webcal link", () => {
    show();
    const dlg = sheet(card("Everything"));
    expect(way(dlg, "way_apple").tagName).toBe("BUTTON");
    fireEvent.click(way(dlg, "way_apple"));
    dlg.getByText(t("apple_na"));
  });

  it("per club: districts with clubs sorted by name, international under its own heading, no empty National", () => {
    show();
    const feeds = card("Per club");
    expect(within(feeds).getAllByRole("heading", { level: 3 }).map(h => h.textContent)).toEqual(["D1980 · Central & North-West", "D1990 · West", "D2000 · East", "International events"]);
    const clubs = within(feeds).getAllByRole("link").filter(a => a.getAttribute("href")!.startsWith("#/club/"));
    expect(clubs.map(a => a.textContent)).toEqual(["Rotaract Luzern", "Rotaract Bern", "Rotaract Zürich", "Rotaract Zurich International", "Rotaract International"]);
    expect(clubs.map(a => a.nextElementSibling!.textContent)).toEqual(["0 upcoming", "0 upcoming", "1 upcoming", "1 upcoming", "2 upcoming"]);
    const luzern = clubs[0]!.closest<HTMLElement>(".name")!;
    expect(luzern.querySelector("img")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(clubs[0]!.getAttribute("href")).toBe("#/club/luzern");
    expect(luzern.style.getPropertyValue("--c")).toBe("#0b5cad");
  });

  it("Rotary layer on: its district feeds under their own heading", () => {
    act(() => { setRotary(true); });
    show();
    const feeds = card("Per club");
    expect(within(feeds).getAllByRole("heading", { level: 3 }).at(-1)?.textContent).toBe("Rotary, by district");
    const dlg = sheet(feeds, -1);
    expect(way(dlg, "way_google").getAttribute("href")).toBe(gcal((base + "rotary1980.ics").replace(/^https?:/, "webcal:")));
    act(() => { setRotary(false); });
  });

  it("iPhone: Apple subscribes right away; Google explains computer then phone, and send copies its link", async () => {
    ua.phone = true; ua.ios = true;
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    show();
    const dlg = sheet(card("Everything"));
    expect(way(dlg, "way_apple").getAttribute("href")).toBe(webcal);
    fireEvent.click(way(dlg, "way_google"));
    dlg.getByRole("heading", { name: t("way_google") });
    dlg.getByText(t("sp_g_both"));
    // on an iPhone the box opens on the iPhone's steps
    dlg.getByText(t("sp_g_sync_h"));
    expect(dlg.getByRole("button", { name: "iPhone" }).getAttribute("aria-pressed")).toBe("true");
    await act(async () => { fireEvent.click(dlg.getByRole("button", { name: t("sp_g_send") })); });
    expect(writeText).toHaveBeenCalledWith(gcal(webcal));
    expect(screen.getByRole("status").textContent).toBe("Link copied");
  });
});
