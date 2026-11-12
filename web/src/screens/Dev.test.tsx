// The developer screen, from events.json and status.json, with the status fields (warnings, unreadable).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import type { Status } from "../lib/types";
import { Toast } from "../components";
import Dev, { nextRun } from "./Dev";

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
    if (url === "https://api.github.com/repos/x/runs/1") return { ok: true, json: async () => ({ event: "schedule", display_title: "Build feeds", status: "completed", conclusion: "failure" }) };
    if (url === "https://api.github.com/repos/x/runs/1/jobs") return { ok: true, json: async () => ({ jobs: [{ html_url: "https://github.com/x/job/9", status: "completed", conclusion: "failure", started_at: "2026-11-11T09:00:00Z", completed_at: "2026-11-11T09:07:00Z",
      steps: [{ name: "Set up job", status: "completed", conclusion: "success" }, { name: "Build the app", status: "completed", conclusion: "success" }, { name: "Feed tests", status: "completed", conclusion: "skipped" }, { name: "Fail if a club failed", status: "completed", conclusion: "failure" }] }] }) };
    if (url.endsWith("/commits?per_page=3")) return { ok: true, json: async () => [{ sha: "abc1234ffff", html_url: "https://github.com/x/commit/abc1234", commit: { message: "Fix the map\n\nbody", author: { date: "2026-11-11T08:00:00Z" } } }] };
    if (url.endsWith("/runs?per_page=3")) return { ok: true, json: async () => ({ workflow_runs: [{ html_url: "https://github.com/x/runs/1", event: "push", status: "completed", conclusion: "success", created_at: "2026-11-11T08:01:00Z", updated_at: "2026-11-11T08:09:00Z", head_sha: "abc1234ffff" }] }) };
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

describe("nextRun", () => {
  it("is the next 02:17 UTC", () => {
    expect(nextRun(new Date("2026-11-12T09:54:00Z")).toISOString()).toBe("2026-11-13T02:17:00.000Z");
    expect(nextRun(new Date("2026-11-12T01:00:00Z")).toISOString()).toBe("2026-11-12T02:17:00.000Z");
  });
});

describe("developer screen", () => {
  it("draws the sections in order with build state, counts and links", async () => {
    await show();
    expect(texts(screen.getAllByRole("heading", { level: 2 }))).toEqual(["Last build", "Preview on this device", "This device", "Content checks", "Clubs and layers"]);
    const build = section("Last build");
    const state = build.getByText("Built 11 Nov, 01:58, 8 h ago · local build");
    expect(state.className).toBe("devstate warn");  // built 01:58, now 10:00: 8 h; the class colours the dot
    build.getByText("✓ No failures in the last run");
    for (const label of ["upcoming", "in the app", "international", "Rotary layer", "members only", "cancelled"]) build.getByText(label);
    expect(build.queryByRole("link", { name: "Open the log on GitHub" })).toBeNull();
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
    // the run's steps from GitHub's API, without its own setup steps, and the job's log
    expect(build.getByText("Run: failure · nightly · 7 min").className).toBe("devstate bad");
    expect(texts([...build.getAllByRole("list")[0]!.querySelectorAll("li")])).toEqual(["✓Build the app", "–Feed tests", "✗Fail if a club failed"]);
    expect(build.getByRole("link", { name: "Open the log on GitHub" }).getAttribute("href")).toBe("https://github.com/x/job/9");
    // the last commits and runs, the run that built this page marked
    expect(build.getByRole("link", { name: "abc1234 Fix the map" }).getAttribute("href")).toBe("https://github.com/x/commit/abc1234");
    build.getByRole("link", { name: "success · push · abc1234 · 8 min" });
    build.getByText(/· this build$/);
  });

  it("Instagram layer and side lists from status.json", async () => {
    status = { ...STATUS, notes: [], instagram: { state: "off", note: "the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set", clubs: {} } };
    await show();
    section("Last build").getByText("Instagram layer: off, the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set.");
    section("Last build").getByText("✓ Side lists not updated: none");
    cleanup();
    status = { ...STATUS, instagram: { state: "error", note: "the token is expired or invalid: renew the INSTAGRAM_TOKEN secret", clubs: {} } };
    await show();
    expect(section("Last build").getByText(/^Instagram layer: failed, the token is expired/).className).toBe("devstate bad");
    cleanup();
    status = { ...STATUS, notes: ["bern news: HTTP 500 (kept the last list)"], instagram: { state: "on", note: "", clubs: { luzern: 6, bern: "Graph error 100 (OAuthException)" } } };
    await show();
    expect(section("Last build").getByText(/^Instagram layer: on, 1 of 2 clubs with pictures, 1 could not be read/).className).toBe("devstate warn");
    section("Last build").getByText("Side lists not updated (1)");
    const clubs = section("Clubs and layers");
    clubs.getByText(/ · 6 Instagram posts$/);
    clubs.getByText(/ · Instagram: Graph error 100 \(OAuthException\)$/);
  });

  it("without the Instagram report (older runs) the line is guessed from the data", async () => {
    await show();
    section("Last build").getByText(/^Instagram layer: (on, \d+ clubs with pictures|off \(no pictures in this build\))\.$/);
    expect(section("Last build").queryByText(/Side lists/)).toBeNull();
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
