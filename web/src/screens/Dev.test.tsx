// The developer screen, from events.json and status.json, with the status fields (warnings, unreadable).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import type { Status } from "../lib/types";
import { Toast } from "../components";
import Dev from "./Dev";

const STATUS: Status = {
  generated: "20261111T005856Z", events: 10, rotary_events: 2, with_image: 5, without_location: 1,
  clubs: { luzern: { events: 322, cancelled: 2, without_detail: 1 } },
  failures: [], commit: "", run: "",
};
let status: Status | null = STATUS;  // null: status.json fails

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q }) as MediaQueryList);
  // every switch reloads the page; jsdom can't and says so on the console
  const error = console.error;
  vi.spyOn(console, "error").mockImplementation((...a: unknown[]) => { if (!String(a[0]).includes("Not implemented: navigation")) error(...a); });
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url === "status.json") {
      if (!status) throw new Error("offline");
      return { ok: true, json: async () => structuredClone(status) };
    }
    return { ok: true, json: async () => structuredClone(fixture) };
  }));
  await loadData();
});
afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  status = STATUS;
});

const texts = (els: HTMLElement[]) => els.map(n => n.textContent);
/** a section by its heading: the sections have no accessible name of their own */
const section = (name: string) => within(screen.getByRole("heading", { level: 2, name }).closest("section")!);
async function show() {
  const r = render(<><Dev route={parseHash("#/dev")} /><Toast /></>);
  await act(async () => { await new Promise(res => setTimeout(res, 0)); });
  return r;
}

describe("developer screen", () => {
  it("draws the sections in order with build state, counts and links", async () => {
    await show();
    expect(texts(screen.getAllByRole("heading", { level: 2 }))).toEqual(["Last build", "Preview on this device", "This device", "Content checks", "Clubs and layers"]);
    const build = section("Last build");
    const state = build.getByText("Built 11 Nov, 01:58, 8 h ago · local build");
    expect(state.className).toBe("devstate warn");  // built 01:58, now 10:00: 8 h; the class colours the dot
    build.getByText("✓ No failures in the last run");
    for (const label of ["upcoming", "in the app", "international", "Rotary layer", "members only", "cancelled"]) build.getByText(label);
    expect(build.queryByRole("link", { name: "This run's log" })).toBeNull();
    expect(build.getByRole("link", { name: "All runs" }).getAttribute("target")).toBe("_blank");
    expect(build.getByRole("link", { name: "status.json" }).getAttribute("href")).toBe("status.json");
    expect(build.getByRole("link", { name: "events.json" }).getAttribute("href")).toBe("events.json");
    expect(build.getByRole("link", { name: "Map" }).getAttribute("href")).toBe("#/map");
    expect(screen.getByRole("link", { name: "Source & data on GitHub" })).toBeTruthy();
  });

  it("shows failures, warnings, commit and run link from status.json", async () => {
    status = { ...STATUS, failures: ["bern: 500"], warnings: ["luzern: 2 agenda list item(s) without a readable date"], commit: "abc1234", run: "https://github.com/x/runs/1" };
    await show();
    const build = section("Last build");
    build.getByText("bern: 500");
    expect(build.queryByText(/No failures/)).toBeNull();
    expect(build.getByText("luzern: 2 agenda list item(s) without a readable date").className).toBe("devstate warn");
    build.getByText(/· commit abc1234$/);
    expect(build.getByRole("link", { name: "This run's log" }).getAttribute("href")).toBe("https://github.com/x/runs/1");
  });

  it("falls back when status.json can't be loaded", async () => {
    status = null;
    await show();
    section("Last build").getByText("status.json could not be loaded");
    expect(section("Clubs and layers").getAllByText(/upcoming · \? in history$/).length).toBeGreaterThan(0);
  });

  it("club rows: history, cancelled, missing details and unreadable dates, Rotary districts included", async () => {
    status = { ...STATUS, unreadable: { luzern: 3 } };
    await show();
    const clubs = section("Clubs and layers");
    const chip = clubs.getAllByRole("link").find(a => a.getAttribute("href") === "#/club/luzern")!;
    const row = within(chip.parentElement!);
    row.getByText(/^\d+ upcoming · 322 in history · 2 cancelled · 1 without details · 3 with no readable date$/);
    expect(row.getByRole("link", { name: ".ics" }).getAttribute("href")).toBe("luzern.ics");
    expect(clubs.getAllByRole("link").some(a => a.getAttribute("href")?.startsWith("#/club/") && a.getAttribute("aria-label")?.startsWith("Rotary"))).toBe(true);
  });

  it("preview switches store their key; the date gets a Real date button", async () => {
    localStorage.setItem("rac.devGuest", "true");
    localStorage.setItem("rac.devDate", JSON.stringify("2026-12-20"));
    await show();
    const preview = section("Preview on this device");
    const row = (label: string) => within(preview.getByText(label).parentElement!);
    expect(row("See the app as a guest").getByRole("button", { name: "On" }).getAttribute("aria-pressed")).toBe("true");
    expect(row("See the app as a guest").getByRole("button", { name: "Off" }).getAttribute("aria-pressed")).toBe("false");
    expect(row("Mark three events as new").getByRole("button", { name: "Off" }).getAttribute("aria-pressed")).toBe("true");
    expect((preview.getByLabelText("Pretend date") as HTMLInputElement).value).toBe("2026-12-20");
    fireEvent.click(row("Show the old-data banner").getByRole("button", { name: "On" }));
    expect(localStorage.getItem("rac.devStale")).toBe("true");
    fireEvent.click(preview.getByRole("button", { name: "Real date" }));
    expect(localStorage.getItem("rac.devDate")).toBe('""');
  });

  it("stored keys: listed sorted, guide card reset, delete and clear keep developer mode", async () => {
    localStorage.setItem("rac.lang", '"de"');
    localStorage.setItem("rac.dev", "true");
    localStorage.setItem("rac.guideSeen", "true");
    await show();
    const device = section("This device");
    device.getByRole("heading", { name: "Stored on this device (3)" });
    expect(texts(device.getAllByText(/^rac\./, { selector: "code" }))).toEqual(["rac.dev", "rac.guideSeen", "rac.lang"]);
    fireEvent.click(section("Preview on this device").getByRole("button", { name: "Show the New-in-the-club card again" }));
    expect(localStorage.getItem("rac.guideSeen")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Done: it is back on Home");
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(within(device.getByText("rac.lang").parentElement!).getByRole("button", { name: "Delete" }));
    expect(localStorage.getItem("rac.lang")).toBeNull();
    localStorage.setItem("rac.saved", "[]");
    await act(async () => { fireEvent.click(device.getByRole("button", { name: "Clear all app data" })); });
    expect(localStorage.getItem("rac.dev")).toBe("true");
  });

  it("content checks fold their lists or say none", async () => {
    await show();
    const checks = section("Content checks");
    const titles = ["Upcoming events without a place", "Upcoming events with a place the map can't find", "Upcoming events without a picture",
      "Upcoming events without a description", "Clubs with no upcoming event", "Texts missing in a language"];
    for (const t of titles) expect(checks.getByText(new RegExp(`^(✓ )?${t}`)).textContent).toMatch(/ \(\d+\)$|: none$/);
    const link = checks.queryAllByRole("link").find(a => a.getAttribute("href")?.startsWith("#/event/"));
    if (link) expect(link.textContent).toMatch(/ · .+ · /);
  });
});
