// The developer screen, from events.json and status.json, with the status fields (warnings, unreadable).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
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

const $ = (s: string) => document.querySelector(s);
const texts = (s: string) => [...document.querySelectorAll(s)].map(n => n.textContent);
async function show() {
  const r = render(<><Dev route={parseHash("#/dev")} /><Toast /></>);
  await act(async () => { await new Promise(res => setTimeout(res, 0)); });
  return r;
}

describe("developer screen", () => {
  it("draws the sections in order with build state, counts and links", async () => {
    await show();
    expect(texts("main.wrap.settings.dev > section.glass > h2")).toEqual(["Last build", "Preview on this device", "This device", "Content checks", "Clubs and layers"]);
    expect($("#build .devstate")?.className).toBe("devstate warn");  // built 01:58, now 10:00: 8 h
    expect($("#build .devstate")?.textContent).toBe("Built 11 Nov, 01:58, 8 h ago · local build");
    expect($("#build .devok")?.textContent).toBe("✓ No failures in the last run");
    expect(texts("#build .devfacts span")).toEqual(["upcoming", "in the app", "international", "Rotary layer", "members only", "cancelled"]);
    expect(texts("#build .links a")).toEqual(["All runs", "status.json", "events.json", "Map"]);
    expect($("#build .links a")?.getAttribute("target")).toBe("_blank");
    expect($("#build .links a:last-child")?.getAttribute("href")).toBe("#/map");
    expect($("#foot footer a")).not.toBeNull();
  });

  it("shows failures, warnings, commit and run link from status.json", async () => {
    status = { ...STATUS, failures: ["bern: 500"], warnings: ["luzern: 2 agenda list item(s) without a readable date"], commit: "abc1234", run: "https://github.com/x/runs/1" };
    await show();
    expect($("#build pre.devfail")?.textContent).toBe("bern: 500");
    expect(texts("#build p.devstate.warn")).toContain("luzern: 2 agenda list item(s) without a readable date");
    expect($("#build .devstate")?.textContent).toContain("· commit abc1234");
    expect($("#build .links a")?.textContent).toBe("This run's log");
    expect($("#build .links a")?.getAttribute("href")).toBe("https://github.com/x/runs/1");
  });

  it("falls back when status.json can't be loaded", async () => {
    status = null;
    await show();
    expect($("#build pre.devfail")?.textContent).toBe("status.json could not be loaded");
    expect(texts("#clubs .devclub span")[0]).toMatch(/upcoming · \? in history$/);
  });

  it("club rows: history, cancelled, missing details and unreadable dates, Rotary districts included", async () => {
    status = { ...STATUS, unreadable: { luzern: 3 } };
    await show();
    const row = document.querySelector("#clubs .devclub") as HTMLElement;
    expect(row.querySelector("a.chip.club")?.getAttribute("href")).toBe("#/club/luzern");
    expect(row.querySelector("span")?.textContent).toMatch(/^\d+ upcoming · 322 in history · 2 cancelled · 1 without details · 3 with no readable date$/);
    expect(row.querySelector("a:last-child")?.getAttribute("href")).toBe("luzern.ics");
    expect(texts("#clubs .devclub .chip").some(s => s?.startsWith("Rotary"))).toBe(true);
  });

  it("preview switches store their key; the date gets a Real date button", async () => {
    localStorage.setItem("rac.devGuest", "true");
    localStorage.setItem("rac.devDate", JSON.stringify("2026-12-20"));
    await show();
    const segs = document.querySelectorAll("#preview .seg");
    expect([...segs[0]!.children].map(b => b.getAttribute("aria-pressed"))).toEqual(["false", "true"]);
    expect([...segs[1]!.children].map(b => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(($("#preview input[type=date]") as HTMLInputElement).value).toBe("2026-12-20");
    fireEvent.click(segs[2]!.children[1]!);
    expect(localStorage.getItem("rac.devStale")).toBe("true");
    fireEvent.click([...document.querySelectorAll("#preview .tools button")].find(b => b.textContent === "Real date")!);
    expect(localStorage.getItem("rac.devDate")).toBe('""');
  });

  it("stored keys: listed sorted, guide card reset, delete and clear keep developer mode", async () => {
    localStorage.setItem("rac.lang", '"de"');
    localStorage.setItem("rac.dev", "true");
    localStorage.setItem("rac.guideSeen", "true");
    await show();
    expect(texts(".devkey code")).toEqual(["rac.dev", "rac.guideSeen", "rac.lang"]);
    expect($("#device h3")?.textContent).toBe("Stored on this device (3)");
    fireEvent.click([...document.querySelectorAll("#preview button")].find(b => b.textContent === "Show the New-in-the-club card again")!);
    expect(localStorage.getItem("rac.guideSeen")).toBeNull();
    expect($("#toast")?.textContent).toBe("Done: it is back on Home");
    vi.stubGlobal("confirm", () => true);
    const langRow = [...document.querySelectorAll(".devkey")].find(r => r.textContent?.startsWith("rac.lang"))!;
    fireEvent.click(langRow.querySelectorAll("button")[1]!);
    expect(localStorage.getItem("rac.lang")).toBeNull();
    localStorage.setItem("rac.saved", "[]");
    await act(async () => { fireEvent.click([...document.querySelectorAll("#device button")].find(b => b.textContent === "Clear all app data")!); });
    expect(localStorage.getItem("rac.dev")).toBe("true");
  });

  it("content checks fold their lists or say none", async () => {
    await show();
    for (const n of document.querySelectorAll("#checks > details summary")) expect(n.textContent).toMatch(/\(\d+\)$/);
    for (const n of document.querySelectorAll("#checks > p.devok")) expect(n.textContent).toMatch(/^✓ .*: none$/);
    expect(document.querySelectorAll("#checks > *")).toHaveLength(6);
    const link = $("#checks .devlist a[href^='#/event/']");
    if (link) expect(link.textContent).toMatch(/ · .+ · /);
  });
});
