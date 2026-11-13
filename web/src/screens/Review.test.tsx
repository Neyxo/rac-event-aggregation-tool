// Review, with the fixture (clock: 2026-11-11 10:00): the default year, an empty year, the offer on Home in early July.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { initData, loadData } from "../lib/data";
import { review } from "../lib/review";
import { parseHash } from "../lib/route";
import Review from "./Review";
import Home from "./Home";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => { cleanup(); localStorage.clear(); initData(structuredClone(fixture)); document.body.className = ""; document.body.removeAttribute("style"); });

describe("Review", () => {
  it("shows the year asked for, one section per number that says something, and ends with share", () => {
    const y = 2026, r = review(y, fixture.events, fixture.clubs, [], new Set());
    expect(r.n).toBeGreaterThan(0);
    const { container } = render(<Review route={parseHash("#/review?y=" + y)} />);
    screen.getByRole("heading", { level: 1, name: "The Rotaract year 2026/27" });
    expect(container.querySelector(".rv section:nth-child(2) b")!.textContent).toBe(String(r.n));
    expect(container.querySelectorAll(".rv section")).toHaveLength(3 + [r.month, r.hosts.length, r.far, r.saved, r.news + r.projects, r.insta.length].filter(Boolean).length);
    screen.getByRole("button", { name: "Share" });
    screen.getByRole("button", { name: "Next card" });
  });
  it("defaults to the last finished year, as a member's own; an empty year says so", () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "luzern", also: [] })); initData(structuredClone(fixture));
    render(<Review route={parseHash("#/review")} />);
    screen.getByRole("heading", { level: 1, name: "Your Rotaract year 2025/26" });
    cleanup();
    const { container } = render(<Review route={parseHash("#/review?y=2040")} />);
    screen.getByText("Nothing on record for this year.");
    expect(container.querySelectorAll(".rv section")).toHaveLength(3);
  });
  it("Home offers it from 1 to 14 July", () => {
    localStorage.setItem("rac.onboarded", "true");
    const offer = () => screen.queryByRole("link", { name: /Rotaract year 2026\/27/ });
    render(<Home route={parseHash("#/")} />);
    expect(offer()).toBeNull();
    cleanup();
    vi.setSystemTime(new Date("2027-07-14T10:00"));
    try {
      render(<Home route={parseHash("#/")} />);
      expect(offer()!.getAttribute("href")).toBe("#/review");
      cleanup();
      vi.setSystemTime(new Date("2027-07-15T10:00"));
      render(<Home route={parseHash("#/")} />);
      expect(offer()).toBeNull();
    } finally { vi.setSystemTime(new Date("2026-11-11T10:00")); }
  });
});
