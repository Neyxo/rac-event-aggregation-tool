// Run with TZ=Europe/Zurich (npm test): the DST cases are Swiss weekends.
import { afterEach, describe, expect, it, vi } from "vitest";
import { dayN, daysUntil, deadlineState, isPast, lastDay, metaLine, placeShort, sameDay, startOfDay, whenLong, whenShort } from "./dates";
import { ev } from "../test/ev";

const at = (s: string) => vi.setSystemTime(new Date(s));
afterEach(() => { vi.useRealTimers(); });

describe("days", () => {
  it("startOfDay and sameDay", () => {
    expect(startOfDay("2026-11-14T18:30").getHours()).toBe(0);
    expect(sameDay(new Date("2026-11-14T00:00"), new Date("2026-11-14T23:59"))).toBe(true);
    expect(sameDay(new Date("2026-11-14T23:59"), new Date("2026-11-15T00:00"))).toBe(false);
  });
  it("dayN counts calendar days", () => {
    vi.useFakeTimers(); at("2026-11-11T23:59");
    expect(dayN("2026-11-11T00:00")).toBe(0);
    expect(dayN("2026-11-12T00:01")).toBe(1);
    expect(dayN("2026-11-10T23:00")).toBe(-1);
  });
  it("dayN across the DST weekends (23 and 25 hour days)", () => {
    vi.useFakeTimers(); at("2026-03-28T12:00");
    expect(dayN("2026-03-30T00:00")).toBe(2);
    expect(dayN("2026-03-29T23:00")).toBe(1);
    at("2026-10-24T12:00");
    expect(dayN("2026-10-26T00:00")).toBe(2);
    expect(dayN("2026-10-25T01:00")).toBe(1);
  });
  it("lastDay of an all-day event is the day before its end midnight", () => {
    const e = ev({ id: "a", allday: true, start: "2027-01-26T00:00", end: "2027-01-29T00:00" });
    expect(lastDay(e).getDate()).toBe(28);
  });
  it("isPast: an event is past once its end is before now", () => {
    vi.useFakeTimers();
    const e = ev({ id: "a", end: "2026-11-14T20:00" });
    at("2026-11-14T20:00:00"); expect(isPast(e)).toBe(false);
    at("2026-11-14T20:00:01"); expect(isPast(e)).toBe(true);
    at("2026-11-14T19:59"); expect(isPast(e)).toBe(false);
  });
  it("daysUntil never goes below zero", () => {
    vi.useFakeTimers(); at("2026-11-14T21:00");
    expect(daysUntil(ev({ id: "a", start: "2026-11-13T18:00" }))).toBe(0);
    expect(daysUntil(ev({ id: "a", start: "2026-11-16T08:00" }))).toBe(2);
  });
});

describe("when", () => {
  it("timed, same day: weekday, start–end", () => {
    expect(whenShort(ev({ id: "a", start: "2026-11-11T18:00", end: "2026-11-11T21:30" }))).toBe("Wed 18:00–21:30");
  });
  it("timed, ends at midnight or later: no end time", () => {
    expect(whenShort(ev({ id: "a", start: "2026-11-14T20:00", end: "2026-11-15T00:00" }))).toBe("Sat 20:00");
    expect(whenShort(ev({ id: "a", start: "2026-11-14T20:00", end: "2026-11-15T02:00" }))).toBe("Sat 20:00");
  });
  it("all day, one day", () => {
    expect(whenShort(ev({ id: "a", allday: true, start: "2026-11-14T00:00", end: "2026-11-15T00:00" }))).toBe("Saturday · all day");
  });
  it("all day, several days: first – last day (not the end midnight)", () => {
    expect(whenShort(ev({ id: "a", allday: true, start: "2027-01-26T00:00", end: "2027-01-29T00:00" }))).toBe("Tue 26 Jan – Thu 28 Jan");
  });
  it("all day over the DST change", () => {
    expect(whenShort(ev({ id: "a", allday: true, start: "2026-03-28T00:00", end: "2026-03-30T00:00" }))).toBe("Sat 28 Mar – Sun 29 Mar");
  });
  it("whenLong", () => {
    expect(whenLong(ev({ id: "a", start: "2026-11-11T18:00", end: "2026-11-11T21:30" }))).toBe("Wednesday, 11 November 2026, 18:00–21:30");
    expect(whenLong(ev({ id: "a", allday: true, start: "2026-11-14T00:00", end: "2026-11-15T00:00" }))).toBe("Saturday, 14 November 2026");
    expect(whenLong(ev({ id: "a", allday: true, start: "2026-11-14T00:00", end: "2026-11-16T00:00" }))).toBe("Saturday, 14 November 2026 – Sunday, 15 November 2026");
  });
  it("place and meta line", () => {
    const e = ev({ id: "a", start: "2026-11-11T18:00", end: "2026-11-11T21:30", location: "Rudolfs Weihnacht, Inseliquai, 6005 Luzern", organiser: "Rotary Club Bern" });
    expect(placeShort(e)).toBe("Rudolfs Weihnacht");
    expect(metaLine(e)).toBe("Rotary Club Bern · Wed 18:00–21:30 · Rudolfs Weihnacht");
    expect(metaLine({ ...e, organiser: undefined, location: "" })).toBe("Wed 18:00–21:30");
  });
});

describe("deadlineState", () => {
  it("today and tomorrow are soon, three days are not", () => {
    vi.useFakeTimers(); at("2026-11-11T09:00");
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-11T18:00" }))).toEqual({ n: 0, soon: true });
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-11T08:00" }))).toEqual({ n: 0, soon: true });  // earlier today still counts as today
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-12T00:00" }))).toEqual({ n: 1, soon: true });
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-13T23:59" }))).toEqual({ n: 2, soon: true });
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-14T00:00" }))).toEqual({ n: 3, soon: false });
  });
  it("none when past, missing or cancelled", () => {
    vi.useFakeTimers(); at("2026-11-11T09:00");
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-10T23:59" }))).toBeNull();
    expect(deadlineState(ev({ id: "a", deadline: "" }))).toBeNull();
    expect(deadlineState(ev({ id: "a", deadline: "2026-11-20T00:00", cancelled: true }))).toBeNull();
  });
});
