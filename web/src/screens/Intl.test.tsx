// Intl, with the fixture (clock: 2026-11-11 10:00): kinds, the international entry's upcoming events, why, questions.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { tx } from "../i18n";
import { initData, loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import Intl from "./Intl";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = () => render(<Intl route={parseHash("#/intl")} />);
const hrefs = () => screen.getAllByRole("link").map(a => a.getAttribute("href")!);
const follow = () => screen.queryByRole("link", { name: /Follow international events/ });

describe("Intl", () => {
  it("draws the static sections", () => {
    const { container } = show();
    screen.getByRole("heading", { level: 1, name: "International events" });
    expect(container.querySelectorAll(".ft .ic svg")).toHaveLength(4);
    expect(screen.getByRole("heading", { name: tx("intl").why_h }).parentElement!.querySelector(".ic svg")).not.toBeNull();
    expect(container.querySelectorAll("details[name=qa]").length).toBeGreaterThan(2);
    expect(hrefs().slice(-3)).toEqual(["#/about-more", "#/family", "#/guide"]);
  });

  it("lists the international events still to come, then the way to follow them", () => {
    show();
    const upcoming = fixture.events.filter(e => e.clubs.includes("international") && new Date(e.end) > new Date()).map(e => "#/event/" + e.id);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(hrefs().filter(h => h.startsWith("#/event/"))).toEqual(upcoming);
    expect(follow()!.getAttribute("href")).toBe("#/club/international");
  });

  it("says so when nothing is announced, and leaves out the follow link without the international entry", () => {
    initData({
      ...fixture,
      clubs: fixture.clubs.filter(c => c.id !== "international"),
      events: fixture.events.filter(e => !e.clubs.includes("international")),
    });
    try {
      show();
      screen.getByText("No dates announced right now.");
      expect(hrefs().filter(h => h.startsWith("#/event/"))).toEqual([]);
      expect(follow()).toBeNull();
    } finally {
      initData(fixture);
    }
  });
});
