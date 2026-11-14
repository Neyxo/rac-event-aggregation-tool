import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Club } from "./types";
import { fixture } from "../test/fixture";

// data.ts keeps module state (the once-per-session fetch): a fresh copy per test
const fresh = async () => {
  vi.resetModules();
  return await import("./data");
};
const json = (body: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 500, json: async () => structuredClone(body) }) as unknown as Response);

beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("mergeRotary", () => {
  it("off: the Rotary layer stays out; the input is not changed", async () => {
    const { mergeRotary } = await fresh();
    const r = mergeRotary(fixture, false);
    expect(r.events).toHaveLength(fixture.events.length);
    expect(r.clubs.some((c) => c.source === "rotary")).toBe(false);
  });
  it("on: its clubs and events join, sorted by start", async () => {
    const { mergeRotary } = await fresh();
    const before = fixture.events.length;
    const r = mergeRotary(fixture, true);
    expect(r.events).toHaveLength(before + fixture.rotary!.events.length);
    expect(r.clubs.at(-1)!.id).toBe("rotary1980");
    expect(r.events.map((e) => e.start)).toEqual([...r.events.map((e) => e.start)].sort());
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
  it("drops unknown clubs and the main club from also show", async () => {
    const { resolveSettings } = await fresh();
    expect(resolveSettings(clubs, { home: "gone", also: ["bern", "gone", "zuerich"] }, false)).toEqual({
      home: "",
      also: ["bern", "zuerich"],
    });
    expect(resolveSettings(clubs, { home: "bern", also: ["bern", "luzern"] }, false)).toEqual({
      home: "bern",
      also: ["luzern"],
    });
  });
  it("nothing stored, or the guest preview: no clubs", async () => {
    const { resolveSettings } = await fresh();
    expect(resolveSettings(clubs, null, false)).toEqual({ home: "", also: [] });
    expect(resolveSettings(clubs, { home: "bern", also: [] }, true)).toEqual({ home: "", also: [] });
  });
});

describe("loadData", () => {
  it("fetches once per session and sets the state", async () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "bern", also: ["luzern"] }));
    localStorage.setItem("rac.saved", JSON.stringify(["202811"]));
    const f = json(fixture);
    vi.stubGlobal("fetch", f);
    const m = await fresh();
    await m.loadData();
    await m.loadData();
    expect(f).toHaveBeenCalledTimes(1);
    expect(m.loaded).toBe(true);
    expect(m.getData().settings).toEqual({ home: "bern", also: ["luzern"] });
    expect(m.getData().saved.has("202811")).toBe(true);
    expect(m.myClubs(m.getData())).toEqual(["bern", "luzern"]);
    expect(m.getData().clubs.rotary1980).toBeUndefined();
  });
  it("Rotary layer on: districts are clubs, their events are in the lists", async () => {
    localStorage.setItem("rac.rotary", "true");
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    expect(m.getData().clubs.rotary1980?.source).toBe("rotary");
    expect(m.getData().data.events.some((e) => e.layer === "rotary")).toBe(true);
  });
  it("Rotary layer off: a shared link to a Rotary event still opens it, the lists never see it", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    const id = fixture.rotary!.events[0]!.id;
    expect(m.getData().data.events.some((e) => e.id === id)).toBe(false);
    expect(m.eventById(m.getData(), id)?.layer).toBe("rotary");
    expect(m.eventById(m.getData(), "nope")).toBeUndefined();
  });
  it("a failed fetch rejects and stays failed until retryLoad() (App: the next navigation)", async () => {
    const f = json({}, false);
    vi.stubGlobal("fetch", f);
    const m = await fresh();
    await expect(m.loadData()).rejects.toThrow("500");
    vi.stubGlobal("fetch", json(fixture));
    await expect(m.loadData()).rejects.toThrow("500");
    m.retryLoad();
    await expect(m.loadData()).resolves.toBeTruthy();
  });
  it("guest preview with developer mode on", async () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "bern", also: [] }));
    localStorage.setItem("rac.dev", "true");
    localStorage.setItem("rac.devGuest", "true");
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    expect(m.myClubs(m.getData())).toEqual([]);
    m.setSettings({ home: "luzern", also: [] }); // not saved during the preview
    expect(JSON.parse(localStorage.getItem("rac.settings")!).home).toBe("bern");
  });
});

describe("actions", () => {
  it("replace the state (never change it in place) and notify subscribers", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    const calls = vi.fn();
    const off = m.subscribeData(calls);
    const before = m.getData();
    expect(m.toggleSaved("a")).toBe(true);
    expect(m.getData()).not.toBe(before);
    expect(before.saved.has("a")).toBe(false);
    m.setSettings({ home: "bern", also: ["luzern"] });
    expect(before.settings).toEqual({ home: "", also: [] });
    expect(m.myClubs(m.getData())).toEqual(["bern", "luzern"]);
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "bern", also: ["luzern"] });
    expect(calls).toHaveBeenCalledTimes(2);
    off();
    m.toggleSaved("a");
    expect(calls).toHaveBeenCalledTimes(2);
  });
  it("setRotary merges the layer in and out at once; a district in also-show counts only while it is on, and stays stored", async () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "bern", also: ["rotary1980", "luzern"] }));
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    expect(m.myClubs(m.getData())).toEqual(["bern", "luzern"]);
    m.setRotary(true);
    expect(localStorage.getItem("rac.rotary")).toBe("true");
    expect(m.getData().clubs.rotary1980?.source).toBe("rotary");
    expect(m.getData().data.events.some((e) => e.layer === "rotary")).toBe(true);
    expect(m.myClubs(m.getData())).toEqual(["bern", "rotary1980", "luzern"]);
    m.setRotary(false);
    expect(m.getData().clubs.rotary1980).toBeUndefined();
    expect(m.getData().data.events.some((e) => e.layer === "rotary")).toBe(false);
    expect(m.myClubs(m.getData())).toEqual(["bern", "luzern"]);
    expect(JSON.parse(localStorage.getItem("rac.settings")!).also).toEqual(["rotary1980", "luzern"]);
  });
  it("setRotary before events.json is in only stores the switch; the load then uses it", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    m.setRotary(true);
    expect(m.loaded).toBe(false);
    await m.loadData();
    expect(m.getData().clubs.rotary1980).toBeDefined();
  });
});

describe("helpers", () => {
  it("club() falls back to a stand-in; isRac; nClubs; toggleSaved; freshNews", async () => {
    vi.stubGlobal("fetch", json(fixture));
    const m = await fresh();
    await m.loadData();
    expect(m.club(m.getData(), "nope")).toMatchObject({
      id: "nope",
      name: "nope",
      short: "nope",
      color: "#d41367",
      logo: "",
    });
    expect(m.isRac(m.club(m.getData(), "bern"))).toBe(true);
    expect(m.isRac(m.club(m.getData(), "international"))).toBe(false);
    expect(m.nClubs(m.getData())).toBe(fixture.clubs.filter((c) => c.district && !c.source).length);
    expect(m.toggleSaved("x")).toBe(true);
    expect(JSON.parse(localStorage.getItem("rac.saved")!)).toEqual(["x"]);
    expect(m.toggleSaved("x")).toBe(false);
    const now = new Date("2026-11-11").getTime();
    const c = {
      ...m.club(m.getData(), "bern"),
      news: [
        { url: "a", title: "", image: "", date: "2026-01-01" },
        { url: "b", title: "", image: "", date: "2025-01-01" },
        { url: "c", title: "", image: "", date: "" },
      ],
    };
    expect(m.freshNews(c, now).map((n) => n.url)).toEqual(["a", "c"]);
  });
});
