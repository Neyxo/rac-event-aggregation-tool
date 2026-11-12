// Subscribe: platform steps, the all-clubs feed, per-club feeds by district, international, Rotary,
// questions; on a phone the Google link explains itself in a popup and copies the link (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t } from "../i18n";
import { loadData, setRotary } from "../lib/data";
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
const show = () => render(<><Subscribe route={route} /><Toast /></>);
const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
const webcal = (base + "all.ics").replace(/^https?:/, "webcal:");
/** a card, by its heading */
const card = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("section")!;
const google = () => within(card("Everything")).getByRole("link", { name: t("google") }) as HTMLAnchorElement;

describe("Subscribe", () => {
  it("draws the four cards with their headings and the platform steps", () => {
    show();
    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual(["Subscribe to a calendar", "Everything", "Per club", "Questions"]);
    const how = [...card("Subscribe to a calendar").querySelectorAll("details")];
    expect(how.map(d => d.querySelector("summary")!.textContent)).toEqual(["iPhone / iPad (Apple Calendar)", "Google Calendar", "Android (Samsung or other calendar apps)", "Outlook / Windows / Mac"]);
    expect(how.map(d => d.querySelectorAll("li").length)).toEqual([3, 3, 2, 2]);
    expect(card("Questions").querySelectorAll("details[name=qa]").length).toBeGreaterThan(0);
    screen.getByText(t("made_by"));
  });

  it("the everything feed: Rotaract upcoming count, webcal / Google / .ics links", () => {
    show();
    const all = card("Everything");
    const name = within(all).getByText(/^All Rotaract events/);
    expect(name.textContent).toBe("All Rotaract events in Switzerland & Liechtenstein4 upcoming");
    expect(name.hasAttribute("style")).toBe(false);
    expect(within(all).getAllByRole("link").map(a => a.getAttribute("href"))).toEqual([webcal, "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal), base + "all.ics"]);
  });

  it(".ics first warns that the file is a copy that won't update, then downloads", () => {
    show();
    fireEvent.click(within(card("Everything")).getByRole("link", { name: ".ics" }));
    const dlg = within(document.querySelector("dialog")!);
    dlg.getByText(t("ics_stale_feed"));
    expect(dlg.getAllByRole("listitem")).toHaveLength(3);
    expect(dlg.getByRole("link", { name: t("ics_dl") }).getAttribute("href")).toBe(base + "all.ics");
  });

  it("per club: districts with clubs sorted by name, international under its own heading, no empty National", () => {
    show();
    const feeds = card("Per club");
    expect(within(feeds).getAllByRole("heading", { level: 3 }).map(h => h.textContent)).toEqual(["D1980 · Central & North-West", "D1990 · West", "D2000 · East", "International events"]);
    const clubs = within(feeds).getAllByRole("link").filter(a => a.getAttribute("href")!.startsWith("#/club/"));
    expect(clubs.map(a => a.textContent)).toEqual(["Rotaract Luzern", "Rotaract Bern", "Rotaract Zürich", "Rotaract Zurich International", "Rotaract International"]);
    expect(clubs.map(a => a.nextElementSibling!.textContent)).toEqual(["0 upcoming", "0 upcoming", "1 upcoming", "1 upcoming", "2 upcoming"]);
    const luzern = clubs[0]!.parentElement!;
    expect(luzern.querySelector("img")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(clubs[0]!.getAttribute("href")).toBe("#/club/luzern");
    expect(luzern.style.getPropertyValue("--c")).toBe("#0b5cad");
  });

  it("Rotary layer on: its district feeds under their own heading", () => {
    act(() => { setRotary(true); });
    show();
    const feeds = card("Per club");
    expect(within(feeds).getAllByRole("heading", { level: 3 }).at(-1)?.textContent).toBe("Rotary, by district");
    expect(within(feeds).getAllByRole("link", { name: ".ics" }).at(-1)?.getAttribute("href")).toBe(base + "rotary1980.ics");
    act(() => { setRotary(false); });
  });

  it("desktop: Google is a plain new-tab link", () => {
    show();
    expect(google().target).toBe("_blank");
    expect(fireEvent.click(google())).toBe(true);
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("iPhone: Google opens the popup with the Apple link; send copies the Google link and toasts", async () => {
    ua.phone = true;
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    show();
    const g = google();
    expect(fireEvent.click(g)).toBe(false);
    const dialog = document.querySelector("dialog")!;
    within(dialog).getByRole("heading", { name: "Google Calendar" });
    expect(within(dialog).getByRole("link", { name: t("apple") }).getAttribute("href")).toBe(webcal);
    await act(async () => { fireEvent.click(within(dialog).getByRole("button", { name: t("sp_g_send") })); });
    expect(writeText).toHaveBeenCalledWith(g.href);
    expect(screen.getByRole("status").textContent).toBe("Link copied");
  });
});
