// Guide, with the fixture (clock: 2026-11-11 10:00): hero in the home club's colour, four steps, three facts.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { loadData, setSettings } from "../lib/data";
import { parseHash } from "../lib/route";
import { store } from "../lib/store";
import Guide from "./Guide";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => {
  cleanup();
  localStorage.clear();
  document.body.className = "";
  document.body.removeAttribute("style");
  setSettings({ home: "", also: [] });
});

const show = () => render(<Guide route={parseHash("#/guide")} />);
/** the hero is the box around the welcome heading */
const hero = () => screen.getByRole("heading", { level: 1 }).parentElement!;
/** each step: a link when it leads somewhere, a plain box when it doesn't */
const steps = () => screen.getAllByRole("listitem").map(li => li.firstElementChild as HTMLElement);

describe("Guide", () => {
  it("marks the guide as seen, so Home stops pointing here", () => {
    expect(store.get("rac.guideSeen", false)).toBe(false);
    show();
    expect(store.get("rac.guideSeen", false)).toBe(true);
  });

  it("a guest: a wave, a plain first step, the next event anywhere", () => {
    show();
    expect(hero().getAttribute("style")).toBeNull();
    within(hero()).getByText("👋");
    screen.getByRole("heading", { level: 1, name: "Welcome to Rotaract" });
    const s = steps();
    expect(s.map(n => n.getAttribute("href"))).toEqual([null, "#/settings", "#/subscribe", "#/event/219091"]);
    expect(s[0]!.tagName).toBe("DIV");
    within(s[3]!).getByText(/· Informal: Konzert in der Tonhalle Zürich$/);
    expect(s[0]!.querySelector("svg.chev")).toBeNull();
    expect(s.map(n => n.style.getPropertyValue("--p"))).toEqual(["#d41367", "#0067c8", "#009739", "#d41367"]);
    expect(document.body.style.getPropertyValue("--c1")).toBe("#d41367");
  });

  it("a member of Luzern: crest, the club's colour, its site in a new tab, Discover when it has nothing coming", () => {
    setSettings({ home: "luzern", also: [] });
    show();
    expect(hero().style.getPropertyValue("--c")).toBe("#0b5cad");
    expect(hero().querySelector("img")!.getAttribute("src")).toBe("crests/luzern.svg");
    screen.getByRole("heading", { level: 1, name: "Welcome to Rotaract Luzern" });
    const s = steps();
    expect(s[0]!.getAttribute("href")).toBe("https://rotaract-luzern.ch");
    expect(s[0]!.getAttribute("target")).toBe("_blank");
    expect(s[0]!.getAttribute("rel")).toBe("noopener");
    expect(s[1]!.hasAttribute("target")).toBe(false);
    expect(s[3]!.getAttribute("href")).toBe("#/discover");
    expect(document.body.style.getPropertyValue("--c1")).toBe("#0b5cad");
  });

  it("three facts, the club count filled in, then the links to read on", () => {
    const { container } = show();
    const facts = [...container.querySelectorAll(".facts b")].map(b => b.textContent);
    expect(facts).toHaveLength(3);
    expect(facts[1]).toMatch(/^\d+$/);
    expect(screen.getAllByRole("link").slice(-3).map(a => a.getAttribute("href"))).toEqual(["#/words", "#/family", "#/about-more"]);
  });
});
