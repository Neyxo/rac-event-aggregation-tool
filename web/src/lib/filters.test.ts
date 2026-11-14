import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  activeCount,
  baseMatches,
  emptyFilters,
  fold,
  fromParams,
  hasFilters,
  isFilterLink,
  radiusOf,
  scopeClubs,
  selectEvents,
  toParams,
  withinRadius,
  type Filters,
  type ListCtx,
} from "./filters";
import type { Club, Coords } from "./types";
import { ev } from "../test/ev";

const clubs: Record<string, Partial<Club>> = {
  luzern: { name: "Rotaract Luzern", district: "1980" },
  bern: { name: "Rotaract Bern", district: "1990" },
  geneve: { name: "Rotaract Genève", district: "1990" },
  international: { name: "Rotaract International", district: "" },
};
const club = (id: string) => ({ id, ...(clubs[id] ?? { name: id, district: "" }) }) as Club;
const F = (o: Partial<Filters> = {}): Filters => ({ ...emptyFilters(), ...o });
const LUZERN: Coords = [47.05, 8.31];
const BERN: Coords = [46.95, 7.45];
const ZURICH: Coords = [47.37, 8.54];
const ctx = (o: Partial<ListCtx> = {}): ListCtx => ({
  page: "discover",
  mine: [],
  saved: new Set(),
  scope: null,
  club,
  ...o,
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T12:00"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("text search", () => {
  it("folds accents and case", () => {
    expect(fold("Zürich Genève ÉTÉ")).toBe("zurich geneve ete");
    expect(fold(null)).toBe("");
  });
  it("every word must appear somewhere: title, description, place, organiser, club names", () => {
    const e = ev({ id: "a", title: "Stamm im Löwen", location: "Bern", clubs: ["geneve"] });
    expect(baseMatches(e, F({ q: "stamm loewen" }), ctx())).toBe(false);
    expect(baseMatches(e, F({ q: "STAMM löwen" }), ctx())).toBe(true);
    expect(baseMatches(e, F({ q: "  lowen   geneve " }), ctx())).toBe(true);
    expect(baseMatches(e, F({ q: "stamm zürich" }), ctx())).toBe(false);
  });
});

describe("clubs, districts, scope", () => {
  const e = ev({ id: "a", clubs: ["bern", "luzern"] });
  it("district and club chips", () => {
    expect(baseMatches(e, F({ d: new Set(["1980"]) }), ctx())).toBe(true);
    expect(baseMatches(e, F({ d: new Set(["2000"]) }), ctx())).toBe(false);
    expect(baseMatches(e, F({ clubs: new Set(["geneve"]) }), ctx())).toBe(false);
    expect(baseMatches(e, F({ clubs: new Set(["geneve", "bern"]) }), ctx())).toBe(true);
  });
  it("Home shows my clubs plus international; the saved view shows saved events from any club", () => {
    expect(scopeClubs("home", ["geneve"])).toEqual(["geneve", "international"]);
    expect(scopeClubs("home", [])).toEqual([]);
    expect(scopeClubs("discover", ["geneve"])).toBeNull();
    const scope = scopeClubs("home", ["geneve"]);
    expect(baseMatches(e, F(), ctx({ scope }))).toBe(false);
    expect(baseMatches(ev({ id: "i", clubs: ["international"] }), F(), ctx({ scope }))).toBe(true);
    expect(baseMatches(e, F({ view: "saved" }), ctx({ scope }))).toBe(true);
    expect(baseMatches(e, F(), ctx({ scope: [] }))).toBe(true); // a guest: no scope
  });
});

describe("radius", () => {
  const inLuzern = ev({ id: "l", coords: LUZERN });
  const inBern = ev({ id: "b", coords: BERN });
  const nowhere = ev({ id: "n" });
  it("no center or no radius: everything", () => {
    expect(withinRadius(nowhere, F({ r: "25" }))).toBe(true);
    expect(withinRadius(nowhere, F({ center: LUZERN }))).toBe(true);
  });
  it("chosen radius around the center; no place, no match", () => {
    expect(withinRadius(inLuzern, F({ center: ZURICH, r: "50" }))).toBe(true);
    expect(withinRadius(inLuzern, F({ center: ZURICH, r: "25" }))).toBe(false);
    expect(withinRadius(nowhere, F({ center: ZURICH, r: "100" }))).toBe(false);
  });
  it("the near view uses 25 km by default", () => {
    expect(radiusOf(F({ view: "near" }))).toBe(25);
    expect(radiusOf(F({ view: "near", r: "100" }))).toBe(100);
    expect(radiusOf(F())).toBeNull();
    expect(withinRadius(inLuzern, F({ center: LUZERN, view: "near" }))).toBe(true);
    expect(withinRadius(inBern, F({ center: LUZERN, view: "near" }))).toBe(false);
  });
});

describe("selectEvents", () => {
  const past = ev({ id: "p1", start: "2026-11-01T18:00", end: "2026-11-01T20:00" });
  const past2 = ev({ id: "p2", start: "2026-11-05T18:00", end: "2026-11-05T20:00" });
  const now = ev({ id: "now", start: "2026-11-11T10:00", end: "2026-11-11T14:00" }); // running: not past
  const next = ev({ id: "n1", start: "2026-11-14T18:00", end: "2026-11-14T20:00", coords: LUZERN });
  const later = ev({ id: "n2", start: "2026-11-20T18:00", end: "2026-11-20T20:00" });
  const rot = ev({
    id: "r",
    start: "2026-11-21T18:00",
    end: "2026-11-21T20:00",
    layer: "rotary",
    clubs: ["rotary1980"],
  });
  const all = [past, past2, now, next, later, rot];
  it("all: upcoming and running, in order", () => {
    expect(selectEvents(all, F(), ctx()).matches.map((e) => e.id)).toEqual(["now", "n1", "n2", "r"]);
  });
  it("past: newest first", () => {
    expect(selectEvents(all, F({ view: "past" }), ctx()).matches.map((e) => e.id)).toEqual(["p2", "p1"]);
  });
  it("saved", () => {
    expect(
      selectEvents(all, F({ view: "saved" }), ctx({ saved: new Set(["n2", "p1"]) })).matches.map((e) => e.id),
    ).toEqual(["n2"]);
  });
  it("Home skips its next-up event in the all view only", () => {
    expect(
      selectEvents(all, F(), ctx({ page: "home", mine: ["luzern"], scope: ["luzern"], skip: "now" })).matches.map(
        (e) => e.id,
      ),
    ).toEqual(["n1", "n2"]);
    expect(
      selectEvents(
        all,
        F({ view: "saved" }),
        ctx({ page: "home", mine: ["luzern"], scope: ["luzern"], skip: "now", saved: new Set(["now"]) }),
      ).matches.map((e) => e.id),
    ).toEqual(["now"]);
  });
  it("counts events left out for having no place", () => {
    const r = selectEvents(all, F({ center: LUZERN, r: "10" }), ctx());
    expect(r.matches.map((e) => e.id)).toEqual(["n1"]);
    expect(r.noLocation).toBe(3);
  });
  it("a guest's Home: no Rotary layer, nearby events first when a place is known, at most 12", () => {
    const g = selectEvents(all, F(), ctx({ page: "home", scope: [] }));
    expect(g.explore).toBe(true);
    expect(g.matches.map((e) => e.id)).toEqual(["now", "n1", "n2"]);
    expect(g.title).toBe("home_soon");
    const near = selectEvents(all, F({ center: ZURICH }), ctx({ page: "home", scope: [] }));
    expect(near.matches.map((e) => e.id)).toEqual(["n1"]);
    expect(near.title).toBe("explore_near");
    const far = selectEvents(all, F({ center: [46.2, 6.15] }), ctx({ page: "home", scope: [] })); // Geneva: nothing within 50 km
    expect(far.matches).toHaveLength(3);
    const many = Array.from({ length: 20 }, (_, i) =>
      ev({ id: "m" + i, start: "2026-12-01T18:00", end: "2026-12-01T20:00" }),
    );
    const r = selectEvents(many, F(), ctx({ page: "home", scope: [] }));
    expect(r.shown).toHaveLength(12);
    expect(r.matches).toHaveLength(20);
    expect(selectEvents(many, F(), ctx()).shown).toHaveLength(20);
  });
});

describe("URL", () => {
  it("reads a shared link, dropping unknown clubs, districts and views", () => {
    const f = fromParams(
      new URLSearchParams("q=stamm&d=1980,1234&clubs=bern,nope&place=Luzern&r=25&view=past"),
      (id) => id in clubs,
    );
    expect(f.q).toBe("stamm");
    expect([...f.d]).toEqual(["1980"]);
    expect([...f.clubs]).toEqual(["bern"]);
    expect(f.place).toBe("Luzern");
    expect(f.r).toBe("25");
    expect(f.view).toBe("past");
    expect(fromParams(new URLSearchParams("view=bogus"), () => true).view).toBe("all");
  });
  it("writes only what is set, and round-trips", () => {
    expect(toParams(F()).toString()).toBe("");
    const f = F({
      q: "a b",
      d: new Set(["1990"]),
      clubs: new Set(["bern", "luzern"]),
      place: "Bern",
      r: "10",
      view: "saved",
    });
    expect(toParams(f).toString()).toBe("q=a+b&d=1990&clubs=bern%2Cluzern&place=Bern&r=10&view=saved");
    expect(fromParams(toParams(f), () => true)).toEqual({ ...f, center: null, centerLabel: "" });
  });
  it("counts and flags", () => {
    expect(activeCount(F({ d: new Set(["1980", "1990"]), clubs: new Set(["a", "b"]), place: "x", r: "10" }))).toBe(5);
    expect(hasFilters(F())).toBe(false);
    expect(hasFilters(F({ view: "past" }))).toBe(true);
    expect(isFilterLink(new URLSearchParams("lang=de&welcome"))).toBe(false);
    expect(isFilterLink(new URLSearchParams("clubs=bern"))).toBe(true);
  });
});
