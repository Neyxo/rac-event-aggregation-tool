import { describe, expect, it } from "vitest";
import { byDay, calendarEvents, monthGrid } from "./calendar";
import { ev } from "../test/ev";
import { fixture } from "../test/fixture";

const days = (r: Record<string, { id: string }[]>, id: string) => Object.entries(r).filter(([, es]) => es.some(e => e.id === id)).map(([k]) => new Date(k).getDate());

describe("monthGrid", () => {
  it("weeks start on Monday; six rows when the month needs them", () => {
    const g = monthGrid(new Date(2026, 10, 20));  // November 2026 starts on a Sunday
    expect(g.lead).toBe(6); expect(g.cells).toBe(42);
    expect(g.gridStart.getDate()).toBe(26); expect(g.gridStart.getMonth()).toBe(9);
    expect(g.days[6]!.getDate()).toBe(1);
    expect(g.days).toHaveLength(42);
  });
  it("five rows otherwise; a month starting on Monday has no lead", () => {
    const g = monthGrid(new Date(2027, 1, 1));  // February 2027
    expect(g.lead).toBe(0); expect(g.cells).toBe(35); expect(g.last.getDate()).toBe(28);
  });
  it("days are whole local days across the DST change", () => {
    const g = monthGrid(new Date(2026, 2, 1));  // March 2026: clocks change on the 29th
    expect(g.days.map(d => d.getHours()).every(h => h === 0)).toBe(true);
    expect(g.days.map(d => d.getDate()).slice(34, 39)).toEqual([29, 30, 31, 1, 2]);
  });
});

describe("byDay", () => {
  const g = monthGrid(new Date(2026, 10, 1));
  it("a timed event sits on its day", () => {
    expect(days(byDay([ev({ id: "a", start: "2026-11-11T18:00", end: "2026-11-11T21:30" })], g), "a")).toEqual([11]);
  });
  it("a multi-day all-day event is on each of its days, not on its end midnight", () => {
    const e = ev({ id: "a", allday: true, start: "2026-11-13T00:00", end: "2026-11-16T00:00" });
    expect(days(byDay([e], g), "a")).toEqual([13, 14, 15]);
  });
  it("an evening ending at midnight is one day; past midnight it reaches the next", () => {
    expect(days(byDay([ev({ id: "a", start: "2026-11-14T20:00", end: "2026-11-15T00:00" })], g), "a")).toEqual([14]);
    expect(days(byDay([ev({ id: "b", start: "2026-11-14T20:00", end: "2026-11-15T00:30" })], g), "b")).toEqual([14, 15]);
  });
  it("a zero-length event still shows", () => {
    expect(days(byDay([ev({ id: "a", start: "2026-11-14T20:00", end: "2026-11-14T20:00" })], g), "a")).toEqual([14]);
  });
  it("an all-day weekend over the DST change", () => {
    const m = monthGrid(new Date(2026, 2, 1));
    expect(days(byDay([ev({ id: "a", allday: true, start: "2026-03-28T00:00", end: "2026-03-30T00:00" })], m), "a")).toEqual([28, 29]);
    expect(days(byDay([ev({ id: "b", allday: true, start: "2026-10-24T00:00", end: "2026-10-26T00:00" })], monthGrid(new Date(2026, 9, 1))), "b")).toEqual([24, 25]);
  });
  it("only days in the grid (and the week after it)", () => {
    const r = byDay([ev({ id: "a", allday: true, start: "2026-10-01T00:00", end: "2026-12-20T00:00" })], g);
    const keys = Object.keys(r).map(k => new Date(k));
    expect(keys[0]!.getTime()).toBe(g.gridStart.getTime());
    expect(keys.at(-1)!.getTime()).toBeLessThanOrEqual(new Date(2026, 11, 7).getTime());
  });
  it("real data: the international multi-day events", () => {
    const r = byDay(fixture.events, monthGrid(new Date(2027, 0, 1)));
    expect(days(r, "eu2069")).toEqual([26, 27, 28]);
    expect(days(r, "eu2067")).toEqual([28, 29, 30, 31]);
  });
});

describe("calendarEvents", () => {
  const a = ev({ id: "a", clubs: ["bern"] }), b = ev({ id: "b", clubs: ["luzern", "bern"] }), c = ev({ id: "c", clubs: ["zuerich"] });
  it("mine: my clubs; all, or no clubs: everything", () => {
    expect(calendarEvents([a, b, c], "mine", ["luzern"]).map(e => e.id)).toEqual(["b"]);
    expect(calendarEvents([a, b, c], "all", ["luzern"])).toHaveLength(3);
    expect(calendarEvents([a, b, c], "mine", [])).toHaveLength(3);
  });
});
