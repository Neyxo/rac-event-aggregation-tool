// The developer screen, from events.json and status.json, with the status fields (warnings, unreadable).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import type { Status } from "../lib/types";
import { Toast } from "../components";
import Dev, { nextRun, runHealth } from "./Dev";

const STATUS: Status = {
  generated: "20261111T005856Z", events: 10, rotary_events: 2, with_image: 5, without_location: 1,
  clubs: { luzern: { events: 322, cancelled: 2, without_detail: 1 } },
  failures: [], commit: "", run: "",
};
let status: Status | null = STATUS;
const run = (conclusion: string | null, created_at: string, i = 1) => ({ html_url: "https://github.com/x/runs/" + i, event: "push", status: conclusion ? "completed" : "in_progress", conclusion, created_at, updated_at: created_at.replace(":01:", ":09:"), head_sha: "abc1234ffff" });
const RUNS = [run("success", "2026-11-11T08:01:00Z", 1), run("failure", "2026-11-10T08:01:00Z", 2)];  // null: status.json fails

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
    if (url.endsWith("/commits?per_page=20")) return { ok: true, json: async () => [{ sha: "abc1234ffff", html_url: "https://github.com/x/commit/abc1234", commit: { message: "Fix the map\n\nbody", author: { date: "2026-11-11T08:00:00Z" } } }] };
    if (url.endsWith("/runs?per_page=30")) return { ok: true, json: async () => ({ workflow_runs: RUNS }) };
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
async function show(hash = "#/dev") {
  const r = render(<><Dev route={parseHash(hash)} /><Toast /></>);
  await act(async () => { await new Promise(res => setTimeout(res, 0)); });
  return r;
}
/** a page under #/dev (#/dev itself without id), rendered; queries inside its main */
async function page(id = "") {
  cleanup();
  await show(id ? "#/dev/" + id : "#/dev");
  return within(document.querySelector("main")!);
}

describe("nextRun", () => {
  it("is the next 02:17 UTC", () => {
    expect(nextRun(new Date("2026-11-12T09:54:00Z")).toISOString()).toBe("2026-11-13T02:17:00.000Z");
    expect(nextRun(new Date("2026-11-12T01:00:00Z")).toISOString()).toBe("2026-11-12T02:17:00.000Z");
  });
});

describe("runHealth", () => {
  it("green when every finished run worked, yellow for an older failure, red when the last one failed", () => {
    expect(runHealth([run("success", "2026-11-11T08:01:00Z"), run("cancelled", "2026-11-10T08:01:00Z"), run("success", "2026-11-01T08:01:00Z")]))
      .toEqual({ level: "ok", text: "All 2 runs worked since 1 Nov 2026" });
    expect(runHealth(RUNS)).toEqual({ level: "warn", text: "Last run worked · 1 of 2 failed since 10 Nov 2026" });
    expect(runHealth([run(null, "2026-11-12T08:01:00Z"), ...RUNS.slice(1), RUNS[1]!]).level).toBe("bad");
    expect(runHealth([]).level).toBe("warn");
  });
});

describe("developer screen", () => {
  it("overview: overall state, the runs as dots, the build's age and a card per page", async () => {
    status = { ...STATUS, run: "https://github.com/x/runs/1" };
    const m = await page();
    expect(m.getByText("Working, have a look").className).toBe("devhealth warn");  // an older run failed, built 8 h ago
    expect(document.querySelectorAll(".devstrip i").length).toBe(2);
    expect(m.getByRole("link", { name: "Run history" }).getAttribute("href")).toBe("#/dev/runs");
    // the app (built when the tests started, so its age is not pinned here) apart from the data it shows
    expect(m.getByText(/^App · version \d+\.\d+\.\d+ · updated .+, \d+ (min|h) ago · local build$/).className).toBe("devstate ok");
    expect(m.getByText("Data · read 11 Nov, 01:58, 8 h ago · by a local run").className).toBe("devstate warn");
    m.getByText(/^Next nightly run about /);
    m.getByText("✓ No failures in the last run");
    expect(m.getAllByRole("link").filter(a => a.classList.contains("more")).map(a => a.getAttribute("href")))
      .toEqual(["#/dev/runs", "#/dev/commits", "#/dev/build", "#/dev/preview", "#/dev/device", "#/dev/checks", "#/dev/clubs", "#/dev/feeds"]);
    m.getByRole("link", { name: "Source & data on GitHub" });
  });

  it("overview turns red on failures and lists the warnings", async () => {
    status = { ...STATUS, failures: ["bern: 500"], warnings: ["luzern: 2 agenda list item(s) without a readable date"], commit: "abc1234" };
    const m = await page();
    expect(document.querySelector(".devstrip")).toBeNull();  // a local build: no runs asked from GitHub
    expect(m.getByText("Something is broken").className).toBe("devhealth bad");
    m.getByText("bern: 500");
    expect(m.queryByText(/No failures/)).toBeNull();
    expect(m.getByText("luzern: 2 agenda list item(s) without a readable date").className).toBe("devstate warn");
    m.getByText(/^Data · read .+ · by the run of commit abc1234$/);
  });

  it("runs and commits pages, the run that built this page marked", async () => {
    status = { ...STATUS, run: "https://github.com/x/runs/1" };
    let m = await page("runs");
    m.getByRole("heading", { level: 1, name: "Runs" });
    expect(m.getByRole("link", { name: "‹ Developer" }).getAttribute("href")).toBe("#/dev");
    m.getByRole("link", { name: "success · push · abc1234 · 8 min" });
    m.getByRole("link", { name: "failure · push · abc1234 · 8 min" });
    m.getByText(/· this build$/);
    m = await page("commits");
    expect(m.getByRole("link", { name: "abc1234 Fix the map" }).getAttribute("href")).toBe("https://github.com/x/commit/abc1234");
  });

  it("build page: the run's steps, counts and links", async () => {
    status = { ...STATUS, run: "https://github.com/x/runs/1", commit: "abc1234" };
    const build = await page("build");
    build.getByText(/^App version \d+\.\d+\.\d+ · test build · built .+ ago · local build\.$/);
    build.getByText(/^The events were read 11 Nov, 01:58, 8 h ago by the run of commit abc1234; /);
    expect(build.getByText("Run: failure · nightly · 7 min").className).toBe("devstate bad");
    expect(texts([...build.getAllByRole("list")[0]!.querySelectorAll("li")])).toEqual(["✓Build the app", "–Feed tests", "✗Fail if a club failed"]);
    expect(build.getByRole("link", { name: "Open the log on GitHub" }).getAttribute("href")).toBe("https://github.com/x/job/9");
    for (const label of ["upcoming", "in the app", "international", "Rotary layer", "members only", "cancelled"]) build.getByText(label);
    expect(build.getByRole("link", { name: "status.json" }).getAttribute("href")).toBe("status.json");
    expect(build.getByRole("link", { name: "events.json" }).getAttribute("href")).toBe("events.json");
    expect(build.getByRole("link", { name: "Map" }).getAttribute("href")).toBe("#/map");
  });

  it("Instagram layer and side lists from status.json", async () => {
    status = { ...STATUS, notes: [], instagram: { state: "off", note: "the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set", clubs: {} } };
    let build = await page("build");
    build.getByText("Instagram layer: off, the INSTAGRAM_TOKEN or INSTAGRAM_USER_ID secret is not set.");
    build.getByText("✓ Side lists not updated: none");
    status = { ...STATUS, instagram: { state: "error", note: "the token is expired or invalid: renew the INSTAGRAM_TOKEN secret", clubs: {} } };
    build = await page("build");
    expect(build.getByText(/^Instagram layer: failed, the token is expired/).className).toBe("devstate bad");
    status = { ...STATUS, notes: ["bern news: HTTP 500 (kept the last list)"], instagram: { state: "on", note: "", clubs: { luzern: 6, bern: "Graph error 100 (OAuthException)" } } };
    build = await page("build");
    expect(build.getByText(/^Instagram layer: on, 1 of 2 clubs with pictures, 1 could not be read/).className).toBe("devstate warn");
    build.getByText("Side lists not updated (1)");
    const clubs = await page("clubs");
    clubs.getByText(/ · 6 Instagram posts$/);
    clubs.getByText(/ · Instagram: Graph error 100 \(OAuthException\)$/);
  });

  it("without the Instagram report (older runs) the line is guessed from the data", async () => {
    const build = await page("build");
    build.getByText(/^Instagram layer: (on, \d+ clubs with pictures|off \(no pictures in this build\))\.$/);
    expect(build.queryByText(/Side lists/)).toBeNull();
  });

  it("falls back when status.json can't be loaded", async () => {
    status = null;
    (await page()).getByText("status.json could not be loaded");
    expect((await page("clubs")).getAllByText(/upcoming · \? in history$/).length).toBeGreaterThan(0);
  });

  it("club rows: history, cancelled, missing details and unreadable dates, Rotary districts included", async () => {
    status = { ...STATUS, unreadable: { luzern: 3 } };
    const clubs = await page("clubs");
    const chip = clubs.getAllByRole("link").find(a => a.getAttribute("href") === "#/club/luzern")!;
    const row = within(chip.parentElement!);
    row.getByText(/^\d+ upcoming · 322 in history · 2 cancelled · 1 without details · 3 with no readable date$/);
    expect(row.getByRole("link", { name: ".ics" }).getAttribute("href")).toBe("luzern.ics");
    expect(clubs.getAllByRole("link").some(a => a.getAttribute("href")?.startsWith("#/club/") && a.getAttribute("aria-label")?.startsWith("Rotary"))).toBe(true);
  });

  it("calendar feeds: all clubs first, then a feed per club under its district", async () => {
    const feeds = await page("feeds");
    feeds.getByRole("heading", { level: 1, name: "Calendar feeds" });
    const box = document.querySelector("main .feeds")!;
    expect(box.firstElementChild!.textContent).toMatch(/^All Rotaract events .+\d+ upcoming/);
    expect(box.querySelectorAll("h3").length).toBeGreaterThan(0);
    expect(box.querySelector('a[href="#/club/luzern"]')).not.toBeNull();
  });

  it("preview switches store their key; the date gets a Real date button", async () => {
    localStorage.setItem("rac.devGuest", "true");
    localStorage.setItem("rac.devDate", JSON.stringify("2026-12-20"));
    const preview = await page("preview");
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
    fireEvent.click((await page("preview")).getByRole("button", { name: "Show the New-in-the-club card again" }));
    expect(localStorage.getItem("rac.guideSeen")).toBeNull();
    expect(screen.getByRole("status").textContent).toBe("Done: it is back on Home");
    const device = await page("device");
    device.getByRole("heading", { name: "Stored on this device (2)" });
    expect(texts(device.getAllByText(/^rac\./, { selector: "code" }))).toEqual(["rac.dev", "rac.lang"]);
    vi.stubGlobal("confirm", () => true);
    fireEvent.click(within(device.getByText("rac.lang").parentElement!).getByRole("button", { name: "Delete" }));
    expect(localStorage.getItem("rac.lang")).toBeNull();
    localStorage.setItem("rac.saved", "[]");
    await act(async () => { fireEvent.click(device.getByRole("button", { name: "Clear all app data" })); });
    expect(localStorage.getItem("rac.dev")).toBe("true");
  });

  it("content checks fold their lists or say none", async () => {
    const checks = await page("checks");
    const titles = ["Upcoming events without a place", "Upcoming events with a place the map can't find", "Upcoming events without a picture",
      "Upcoming events without a description", "Clubs with no upcoming event", "Texts missing in a language"];
    for (const t of titles) expect(checks.getByText(new RegExp(`^(✓ )?${t}`)).textContent).toMatch(/ \(\d+\)$|: none$/);
    const link = checks.queryAllByRole("link").find(a => a.getAttribute("href")?.startsWith("#/event/"));
    if (link) expect(link.textContent).toMatch(/ · .+ · /);
  });
});
