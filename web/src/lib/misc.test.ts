// geo, color, pillars, route, share, store, dev
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clubVars, onColor, vars } from "./color";
import { guessClubs, km, mapsUrl, nearestClubs } from "./geo";
import { PILLAR_RE, pillarFallback } from "./pillars";
import { href, parseHash } from "./route";
import { shareUrl } from "./share";
import { here, store } from "./store";
import { devFlag, installPretendDate } from "./dev";
import { fixture } from "../test/fixture";
import { ev } from "../test/ev";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("geo", () => {
  it("km", () => {
    expect(km([47.05, 8.31], [47.05, 8.31])).toBe(0);
    expect(km([47.0502, 8.3093], [46.948, 7.4474])).toBeGreaterThan(65);
    expect(km([47.0502, 8.3093], [46.948, 7.4474])).toBeLessThan(67);
  });
  it("nearestClubs: real clubs only, by distance, within maxKm", () => {
    const pos: [number, number] = [47.05, 8.3]; // Luzern
    const near = nearestClubs(fixture.clubs, pos, 3);
    expect(near[0]!.c.id).toBe("luzern");
    expect(near.map((x) => x.d)).toEqual([...near.map((x) => x.d)].sort((a, b) => a - b));
    expect(near.some((x) => x.c.id === "international")).toBe(false);
    expect(nearestClubs(fixture.clubs, pos, 5, 10).map((x) => x.c.id)).toEqual(["luzern"]);
  });
  it("guessClubs: the language default when the position is outside CH/LI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ json: async () => ({ latitude: "48.1", longitude: "11.5", country_code: "DE" }) })),
    );
    expect(await guessClubs(fixture.clubs, "it")).toEqual(["ticino"]);
    expect(await guessClubs(fixture.clubs, "de")).toEqual([]);
  });
  it("guessClubs: the two nearest within 35 km, remembered for the tab", async () => {
    const f = vi.fn(async () => ({ json: async () => ({ latitude: "47.05", longitude: "8.3", country_code: "CH" }) }));
    vi.stubGlobal("fetch", f);
    expect((await guessClubs(fixture.clubs, "en"))[0]).toBe("luzern");
    expect(here.get()).toEqual([47.05, 8.3]);
    await guessClubs(fixture.clubs, "en");
    expect(f).toHaveBeenCalledTimes(1);
  });
  it("mapsUrl", () => {
    expect(mapsUrl("Bern, Bahnhof", true)).toBe("https://maps.apple.com/?q=Bern%2C%20Bahnhof");
    expect(mapsUrl("Bern", false)).toBe("https://www.google.com/maps/search/?api=1&query=Bern");
  });
});

describe("color", () => {
  it("dark text on light colours, white on dark", () => {
    expect(onColor("#ffffff")).toBe("#1f1c26");
    expect(onColor("#f7a81b")).toBe("#1f1c26");
    expect(onColor("#d41367")).toBe("#fff");
    expect(onColor("#0b5cad")).toBe("#fff");
  });
  it("club variables, with a default colour", () => {
    expect(clubVars("#0b5cad", { "--i": 3 })).toEqual({ "--c": "#0b5cad", "--on-c": "#fff", "--i": 3 });
    expect(clubVars("")).toEqual({ "--c": "#d41367", "--on-c": "#fff" });
    expect(vars({ "--p": "#000" })).toEqual({ "--p": "#000" });
  });
});

describe("pillars", () => {
  it("matches titles in every language", () => {
    expect(PILLAR_RE.party.test("Weihnachtsapéro")).toBe(true);
    expect(PILLAR_RE.learn.test("Firmenbesuch")).toBe(true);
    expect(PILLAR_RE.help.test("Bénévolat")).toBe(true);
  });
  it("falls back to the last fitting picture, then the last picture", () => {
    const es = [
      ev({ id: "a", title: "Stamm", image: "a.jpg" }),
      ev({ id: "b", title: "Workshop", image: "b.jpg" }),
      ev({ id: "c", title: "Stamm 2", image: "c.jpg" }),
      ev({ id: "d", title: "Party" }),
    ];
    expect(pillarFallback(es, "party")).toBe("c.jpg");
    expect(pillarFallback(es, "learn")).toBe("b.jpg");
    expect(pillarFallback(es, "help")).toBe("c.jpg");
    expect(pillarFallback([], "help")).toBeUndefined();
  });
});

describe("route", () => {
  it("parses hashes", () => {
    expect(parseHash("").name).toBe("home");
    expect(parseHash("#/").name).toBe("home");
    expect(parseHash("#/nope").name).toBe("home");
    expect(parseHash("#main").name).toBe("home");
    const e = parseHash("#/event/a%20b?x=1");
    expect(e.name).toBe("event");
    expect(e.params.id).toBe("a b");
    expect(e.query.get("x")).toBe("1");
    const d = parseHash("#/discover?clubs=bern,luzern&view=past");
    expect(d.name).toBe("discover");
    expect(d.params.id).toBe("");
    expect(d.query.get("clubs")).toBe("bern,luzern");
    expect(parseHash("#/about-more").name).toBe("about-more");
  });
  it("builds hrefs", () => {
    expect(href("home")).toBe("#/");
    expect(href("event", "179501")).toBe("#/event/179501");
    expect(href("club", "zurich-international")).toBe("#/club/zurich-international");
    expect(href("discover", null, "?clubs=bern")).toBe("#/discover?clubs=bern");
    expect(href("discover", null, new URLSearchParams())).toBe("#/discover");
  });
  it("?welcome counts once and leaves the URL; ?lang stays", async () => {
    history.replaceState(null, "", "/?lang=de&welcome#/");
    vi.resetModules();
    const { takeWelcome } = await import("./route");
    expect(takeWelcome()).toBe(true);
    expect(location.search + location.hash).toBe("?lang=de#/");
    expect(takeWelcome()).toBe(false);
    history.replaceState(null, "", "/");
  });
});

describe("share", () => {
  const base = "https://neyxo.github.io/rotaract-events/?lang=de#/event/1";
  it("events, clubs and static screens", () => {
    expect(shareUrl({ event: "179501" }, base)).toBe("https://neyxo.github.io/rotaract-events/e/179501.html");
    expect(shareUrl({ club: "bern" }, base)).toBe("https://neyxo.github.io/rotaract-events/c/bern.html");
    expect(shareUrl("about", base, "fr")).toBe("https://neyxo.github.io/rotaract-events/s/fr/about.html");
  });
});

describe("store", () => {
  it("JSON values, defaults on missing or broken values, change notifications", () => {
    expect(store.get("rac.saved", [])).toEqual([]);
    localStorage.setItem("rac.saved", "{broken");
    expect(store.get("rac.saved", ["d"])).toEqual(["d"]);
    const f = vi.fn();
    const off = store.subscribe(f);
    store.set("rac.theme", "dark");
    expect(localStorage.getItem("rac.theme")).toBe('"dark"');
    store.remove("rac.theme");
    expect(f).toHaveBeenCalledTimes(2);
    off();
    store.set("rac.rotary", true);
    expect(f).toHaveBeenCalledTimes(2);
  });
});

describe("dev", () => {
  it("preview flags only count while developer mode is on", () => {
    store.set("rac.devGuest", true);
    store.set("rac.devDate", "2026-12-24");
    expect(devFlag("Guest")).toBeNull();
    store.set("rac.dev", true);
    expect(devFlag("Guest")).toBe(true);
    expect(devFlag("Date")).toBe("2026-12-24");
    expect(devFlag("Stale")).toBeNull();
  });
  it("pretend date: now moves to that day, explicit dates stay", () => {
    const Real = Date;
    try {
      store.set("rac.dev", true);
      store.set("rac.devDate", "2030-01-15");
      installPretendDate();
      const now = new Date();
      expect([now.getFullYear(), now.getMonth(), now.getDate()]).toEqual([2030, 0, 15]);
      expect(Math.abs(Date.now() - now.getTime())).toBeLessThan(1000);
      expect(new Date("2026-11-11T18:00").getFullYear()).toBe(2026);
      expect(new Date(2020, 1, 2).getMonth()).toBe(1);
    } finally {
      globalThis.Date = Real;
    }
  });
  it("pretend date off, or invalid: Date untouched", () => {
    const Real = Date;
    installPretendDate();
    expect(globalThis.Date).toBe(Real);
    store.set("rac.dev", true);
    store.set("rac.devDate", "nonsense");
    installPretendDate();
    expect(globalThis.Date).toBe(Real);
  });
});
