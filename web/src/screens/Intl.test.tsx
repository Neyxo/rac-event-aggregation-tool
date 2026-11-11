// Intl draws the old intl.html with the fixture (clock: 2026-11-11 10:00): kinds, the international entry's upcoming events, why, questions.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import type { Club } from "../lib/types";
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
const hrefs = (s: string) => [...document.querySelectorAll(s)].map(a => a.getAttribute("href"));

describe("Intl", () => {
  it("draws the static sections", () => {
    show();
    expect(document.querySelector("#h")!.textContent).toBe("International events");
    expect(document.querySelectorAll("#kinds > .ft.glass > .ic > svg")).toHaveLength(4);
    expect(document.querySelectorAll("#whyH > .ic > svg")).toHaveLength(1);
    expect(document.querySelectorAll("#qa > details[name=qa]").length).toBeGreaterThan(2);
    expect(hrefs("#more a")).toEqual(["#/about-more", "#/family", "#/guide"]);
  });

  it("lists the international events still to come, then the way to follow them", () => {
    show();
    const upcoming = fixture.events.filter(e => e.clubs.includes("international") && new Date(e.end) > new Date()).map(e => "#/event/" + e.id);
    expect(upcoming.length).toBeGreaterThan(0);
    expect(hrefs("#next > a.event")).toEqual(upcoming);
    expect(hrefs("#next > a.more")).toEqual(["#/club/international"]);
    expect(document.querySelector("#next > a.more b")!.textContent).toBe("Follow international events");
  });

  it("says so when nothing is announced, and leaves out the follow link without the international entry", () => {
    const events = D.data.events, intl = D.clubs.international as Club;
    D.data.events = events.filter(e => !e.clubs.includes("international"));
    delete D.clubs.international;
    try {
      show();
      expect(document.querySelector("#next > p.fine")!.textContent).toBe("No dates announced right now.");
      expect(document.querySelector("#next > a")).toBeNull();
    } finally {
      D.data.events = events;
      D.clubs.international = intl;
    }
  });
});
