import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Club } from "./types";
import { fixture } from "../test/fixture";

// data.ts keeps module state (the once-per-session fetch): a fresh copy per test
const fresh = async () => { vi.resetModules(); return await import("./data"); };
const json = (body: unknown, ok = true) => vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => structuredClone(body) }) as unknown as Response);

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.unstubAllGlobals(); });

describe("mergeRotary", () => {
  it("off: the Rotary layer stays out; the input is not changed", async () => {
    const { mergeRotary } = await fresh();
    const r = mergeRotary(fixture, false);
    expect(r.events).toHaveLength(fixture.events.length);
    expect(r.clubs.some(c => c.source === "rotary")).toBe(false);
  });
  it("on: its clubs and events join, sorted by start", async () => {
    const { mergeRotary } = await fresh();
    const before = fixture.events.length, r = mergeRotary(fixture, true);
    expect(r.events).toHaveLength(before + fixture.rotary!.events.length);
    expect(r.clubs.at(-1)!.id).toBe("rotary1980");
    expect(r.events.map(e => e.start)).toEqual([...r.events.map(e => e.start)].sort());
    expect(fixture.events).toHaveLength(before);
  });
  it("no rotary key at all", async () => {
    const { mergeRotary } = await fresh();
    const { rotary: _, ...plain } = fixture;
    expect(mergeRotary(plain, true).events).toHaveLength(fixture.events.length);
  });
});

describe("resolveSettings", () => {
  const clubs = { bern: {} as Club, luzern: {} as Club, zuerich: {} as Club };
  it("migrates rac.prefs: the first club is the main one", async () => {
    const { resolveSettings } = await fresh();
    expect(resolveSettings(clubs, null, { clubs: ["luzern", "bern", "gone"] }, false)).toEqual({ settings: { home: "luzern", also: ["bern"] }, real: { home: "luzern", also: ["bern"] }, migrated: true });
  });
  it("rac.settings wins over rac.prefs; unknown and duplicate clubs are dropped", async () => {
    const { resolveSettings } = await fresh();
    const r = resolveSettings(clubs, { home: "gone", also: ["bern", "gone", "zuerich"] }, { clubs: ["luzern"] }, false);
    expect(r.settings).toEqual({ home: "", also: ["bern", "zuerich"] });
    expect(resolveSettings(clubs, { home: "bern", also: ["bern", "luzern"] }, null, false).settings).toEqual({ home: "bern", also: ["luzern"] });
  });
  it("nothing stored; empty prefs", async () => {
    const { resolveSettings } = await fresh();
    expect(resolveSettings(clubs, null, null, false)).toEqual({ settings: { home: "", also: [] }, real: { home: "", also: [] }, migrated: false });
    expect(resolveSettings(clubs, null, { clubs: [] }, false).settings).toEqual({ home: "", also: [] });
  });
  it("guest preview: empty in memory, the real settings kept for saving", async () => {
    const { resolveSettings } = await fresh();
    const r = resolveSettings(clubs, { home: "bern", also: [] }, null, true);
    expect(r.settings).toEqual({ home: "", also: [] }); expect(r.real.home).toBe("bern");
  });
});

describe("loadData", () => {
  it("fetches once per session and fills D; migrates rac.prefs", async () => {
    localStorage.setItem("rac.prefs", JSON.stringify({ clubs: ["bern", "luzern"] }));
    localStorage.setItem("rac.saved", JSON.stringify(["202811"]));
    const f = json(fixture); vi.stubGlobal("fetch", f);
    const m = await fresh();
    await m.loadData(); await m.loadData();
    expect(f).toHaveBeenCalledTimes(1);
    expect(m.loaded).toBe(true);
    expect(m.D.settings).toEqual({ home: "bern", also: ["luzern"] });
    expect(localStorage.getItem("rac.prefs")).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "bern", also: ["luzern"] });
    expect(m.D.saved.has("202811")).toBe(true);
    expect(m.myClubs()).toEqual(["bern", "luzern"]);
    expect(m.D.clubs.rotary1980).toBeUndefined();
  });
  it("Rotary layer on: districts are clubs, their events are in the lists", async () => {
    localStorage.setItem("rac.rotary", "true");
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh(); await m.loadData();
    expect(m.D.clubs.rotary1980?.source).toBe("rotary");
    expect(m.D.data.events.some(e => e.layer === "rotary")).toBe(true);
  });
  it("Rotary layer off: a shared link to a Rotary event still opens it, the lists never see it", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh(); await m.loadData();
    const id = fixture.rotary!.events[0]!.id;
    expect(m.D.data.events.some(e => e.id === id)).toBe(false);
    expect(m.eventById(id)?.layer).toBe("rotary");
    expect(m.eventById("nope")).toBeUndefined();
  });
  it("a failed fetch rejects, and the next call tries again", async () => {
    const f = json({}, false); vi.stubGlobal("fetch", f);
    const m = await fresh();
    await expect(m.loadData()).rejects.toThrow("500");
    vi.stubGlobal("fetch", json(fixture));
    await expect(m.loadData()).resolves.toBeTruthy();
  });
  it("guest preview with developer mode on", async () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "bern", also: [] }));
    localStorage.setItem("rac.dev", "true"); localStorage.setItem("rac.devGuest", "true");
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh(); await m.loadData();
    expect(m.myClubs()).toEqual([]);
    m.D.settings.home = "luzern"; m.saveSettings();  // not saved during the preview
    expect(JSON.parse(localStorage.getItem("rac.settings")!).home).toBe("bern");
  });
});

describe("helpers", () => {
  it("club() falls back to a stand-in; isRac; nClubs; toggleSaved; freshNews", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh(); await m.loadData();
    expect(m.club("nope")).toMatchObject({ id: "nope", name: "nope", short: "nope", color: "#d41367", logo: "" });
    expect(m.isRac(m.club("bern"))).toBe(true);
    expect(m.isRac(m.club("international"))).toBe(false);
    expect(m.nClubs()).toBe(fixture.clubs.filter(c => c.district && !c.source).length);
    expect(m.toggleSaved("x")).toBe(true); expect(JSON.parse(localStorage.getItem("rac.saved")!)).toEqual(["x"]);
    expect(m.toggleSaved("x")).toBe(false);
    const now = new Date("2026-11-11").getTime();
    const c = { ...m.club("bern"), news: [{ url: "a", title: "", image: "", date: "2026-01-01" }, { url: "b", title: "", image: "", date: "2025-01-01" }, { url: "c", title: "", image: "", date: "" }] };
    expect(m.freshNews(c, now).map(n => n.url)).toEqual(["a", "c"]);
  });
});
