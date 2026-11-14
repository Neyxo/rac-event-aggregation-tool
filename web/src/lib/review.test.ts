// review(): the numbers of one Rotaract year (1 July to 30 June)
import { describe, expect, it } from "vitest";
import { review } from "./review";
import { club, getData } from "./data";
import { racYear, racYearLabel } from "./dates";
import { ev } from "../test/ev";

const LU: [number, number] = [47.05, 8.31];
const BE: [number, number] = [46.948, 7.447];
const events = [
  ev({ id: "before", start: "2026-06-30T23:00", end: "2026-07-01T01:00" }), // started in the year before
  ev({ id: "first", start: "2026-07-01T00:00", end: "2026-07-02T00:00", allday: true, coords: LU }),
  ev({ id: "camp", clubs: ["bern", "luzern"], start: "2026-09-04T18:00", end: "2026-09-06T16:00", coords: BE }),
  ev({ id: "sep", clubs: ["bern"], start: "2026-09-20T18:00", end: "2026-09-20T20:00", coords: BE }),
  ev({ id: "off", start: "2026-10-01T18:00", end: "2026-10-01T20:00", cancelled: true }),
  ev({ id: "last", clubs: ["bern"], start: "2027-06-30T23:00", end: "2027-07-01T01:00" }),
  ev({ id: "after", start: "2027-07-01T00:00", end: "2027-07-02T00:00", allday: true }),
];
const clubs = [
  {
    ...club(getData(), "luzern"),
    news: [
      { url: "", title: "", image: "", date: "2026-06-30" },
      { url: "", title: "", image: "", date: "2026-07-01" },
      { url: "", title: "", image: "", date: "" },
    ],
  },
  {
    ...club(getData(), "bern"),
    projects: [
      { url: "", title: "", image: "", date: "2027-06-30" },
      { url: "", title: "", image: "", date: "2027-07-01" },
    ],
  },
];

describe("review", () => {
  it("a guest gets all clubs: 1 July to 30 June, cancelled events left out", () => {
    const r = review(2026, events, clubs, [], new Set(["sep", "after", "gone"]));
    expect(r.n).toBe(4); // first, camp, sep, last
    expect(r.month).toEqual({ m: 8, n: 2 });
    expect(r.hosts).toEqual([
      ["bern", 3],
      ["luzern", 2],
    ]);
    expect([r.far!.a.id, r.far!.b.id, Math.round(r.far!.km)]).toEqual(["first", "camp", 66]);
    expect([r.saved, r.news, r.projects]).toEqual([1, 1, 1]);
    expect(review(2025, events, clubs, [], new Set()).n).toBe(1); // "before" belongs to 2025/26
  });
  it("a member gets their clubs only; saved events count from any club", () => {
    const r = review(2026, events, clubs, ["luzern"], new Set(["sep"]));
    expect(r.n).toBe(2); // first, camp (co-hosted)
    expect(r.hosts).toEqual([
      ["luzern", 2],
      ["bern", 1],
    ]);
    expect([r.saved, r.news, r.projects]).toEqual([1, 1, 0]);
  });
  it("an empty year has nothing to show", () => {
    expect(review(2030, events, clubs, [], new Set(["sep"]))).toEqual({
      n: 0,
      month: null,
      months: Array(12).fill(0),
      hosts: [],
      far: null,
      saved: 0,
      news: 0,
      projects: 0,
      insta: [],
    });
  });
});

describe("racYear", () => {
  it("turns over on 1 July", () => {
    expect([racYear(new Date("2027-06-30T23:59")), racYear(new Date("2027-07-01T00:00"))]).toEqual([2026, 2027]);
    expect([racYearLabel(2026), racYearLabel(2099)]).toEqual(["2026/27", "2099/00"]);
  });
});
