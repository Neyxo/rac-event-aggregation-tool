// The calendar screen: the month grid, scope, month navigation, the day sheet and fit().
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutEffect } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { ev } from "../test/ev";
import type { Event } from "../lib/types";
import { getData, initData, loadData, setSettings } from "../lib/data";
import { href, parseHash } from "../lib/route";
import { fmt } from "../lib/dates";
import { t } from "../i18n";
import Calendar from "./Calendar";

/** the fixture with more events, keeping the settings */
const addEvents = (...more: Event[]) => {
  const settings = getData().settings;
  initData({ ...fixture, events: [...fixture.events, ...more] });
  setSettings(settings);
};
beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  initData(fixture);
  setSettings({ home: "luzern", also: ["zuerich"] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

const show = () => render(<Calendar route={parseHash("#/calendar")} />).container;
const button = (name: string) => screen.getByRole("button", { name });
const monthTitle = () => screen.getByRole("heading", { level: 2 }).textContent;
const days = () => within(screen.getByRole("grid")).getAllByRole("button");
/** a day button by its label ("Wednesday, 11 November 2026, 1 event"); November 2026 unless told otherwise */
const day = (n: number, m = 10, y = 2026) => {
  const label = fmt.full.format(new Date(y, m, n)) + ", ";
  return screen.getByRole("button", { name: x => x.startsWith(label) });
};
const titles = (b: HTMLElement) => [...b.querySelectorAll(".ch")].map(s => s.getAttribute("title"));
/** the sheet: its own element (the backdrop) for the class that slides it in and the backdrop click */
const sheet = () => document.querySelector<HTMLElement>(".sheet")!;
const isOpen = () => sheet().classList.contains("open");
/** the links of the event cards in the sheet (each card also links its clubs) */
const sheetLinks = () => within(sheet()).queryAllByRole("link", { hidden: true }).map(a => a.getAttribute("href")).filter(h => h?.startsWith(href("event", "")));

describe("calendar", () => {
  it("draws the month: title, weekdays, 42 cells from Monday, today, other-month days", () => {
    show();
    expect(monthTitle()).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(button(t("prev_month"))).toBeTruthy();
    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    expect(screen.getByRole("grid").style.getPropertyValue("--rows")).toBe("6");
    expect(days()).toHaveLength(42);
    expect(days()[0]!.querySelector(".n")?.textContent).toBe("26");
    expect(days()[0]!.classList.contains("other")).toBe(true);
    const today = day(11);
    expect(today.classList.contains("today")).toBe(true);
    expect(today.classList.contains("other")).toBe(false);
    expect(today.getAttribute("aria-label")).toBe(fmt.full.format(new Date(2026, 10, 11)) + ", " + t("n_on_day", { n: 1 }));
    expect(today.getAttribute("aria-pressed")).toBe("false");
    const chip = today.querySelector<HTMLElement>(".ch")!;
    expect(chip.style.getPropertyValue("--c")).toBe("#1f78d1");
    expect(chip.style.getPropertyValue("--crest")).toMatch(/^url\(".*crests\/zuerich\.svg"\)$/);
    expect(within(today).getByText("Informal: Konzert in der Tonhalle Zürich")).toBeTruthy();
    expect(today.querySelector<HTMLElement>(".more")?.hidden).toBe(true);
  });

  it("scope: my clubs first, all on demand; no switch without clubs", () => {
    show();
    const [mine, all] = [button(t("mine_short")), button(t("all_clubs_short"))];
    expect(mine.getAttribute("aria-pressed")).toBe("true");
    expect(titles(day(7))).toEqual([]);
    fireEvent.click(all);
    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(mine.getAttribute("aria-pressed")).toBe("false");
    expect(titles(day(7))).toEqual(["Essen für Alle Volunteering 28.11"]);
    cleanup();
    setSettings({ home: "", also: [] });
    show();
    expect(screen.queryByRole("group")).toBeNull();
    expect(screen.queryByRole("button", { name: t("all_clubs_short") })).toBeNull();
    expect(titles(day(7))).toEqual(["Essen für Alle Volunteering 28.11"]);
  });

  it("month navigation and today", () => {
    show();
    fireEvent.click(button(t("next_month")));
    expect(monthTitle()).toBe(fmt.month.format(new Date(2026, 11, 1)));
    fireEvent.click(button(t("prev_month")));
    fireEvent.click(button(t("prev_month")));
    expect(monthTitle()).toBe(fmt.month.format(new Date(2026, 9, 1)));
    expect(isOpen()).toBe(false);
    // today has an event that starts today: back to November, and the sheet opens on it
    fireEvent.click(button(t("today")));
    expect(monthTitle()).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(isOpen()).toBe(true);
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(fmt.full.format(new Date(2026, 10, 11)));
    expect(day(11).getAttribute("aria-pressed")).toBe("true");
  });

  it("today without an event today only moves to the month", () => {
    vi.setSystemTime(new Date("2026-11-12T10:00"));
    show();
    fireEvent.click(button(t("next_month")));
    fireEvent.click(button(t("today")));
    expect(monthTitle()).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(sheet().getAttribute("aria-hidden")).toBe("true");
  });

  it("a day opens the frosted sheet with its events; close, backdrop, Escape and a swipe down close it", () => {
    show();
    const s = sheet();
    expect(s.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(day(11));
    expect(isOpen()).toBe(true);
    expect(s.getAttribute("aria-hidden")).toBe("false");
    expect(sheetLinks()).toEqual([href("event", "219091")]);
    expect(day(11).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(button(t("close")));
    expect(isOpen()).toBe(false);
    expect(day(11).getAttribute("aria-pressed")).toBe("false");
    // the content stays while the sheet slides away
    expect(sheetLinks()).toEqual([href("event", "219091")]);

    fireEvent.click(day(11));
    fireEvent.click(s.querySelector(".sheet-in")!);
    expect(isOpen()).toBe(true);
    fireEvent.click(s);
    expect(isOpen()).toBe(false);

    fireEvent.click(day(11));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(isOpen()).toBe(false);

    fireEvent.click(day(11));
    const handle = s.querySelector(".handle")!;
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 120 }] });
    expect(isOpen()).toBe(true);
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 160 }] });
    expect(isOpen()).toBe(false);
  });

  it("an empty day says so", () => {
    show();
    fireEvent.click(day(12));
    expect(within(sheet()).getByText(t("no_events_day"))).toBeTruthy();
    expect(sheetLinks()).toEqual([]);
  });

  it("multi-day and all-day events are on every day they touch", () => {
    setSettings({ home: "", also: [] });
    addEvents(ev({ id: "m", title: "Weekend", start: "2026-11-20T18:00", end: "2026-11-22T12:00" }));
    show();
    expect([20, 21, 22, 23].map(n => titles(day(n)).includes("Weekend"))).toEqual([true, true, true, false]);
    fireEvent.click(button(t("next_month")));
    fireEvent.click(button(t("next_month")));
    // all day 26–28 January (ends at the midnight after the 28th), and 28 January – 31 January
    expect([25, 26, 27, 28, 29].map(n => titles(day(n, 0, 2027)).length)).toEqual([0, 1, 1, 2, 1]);
    expect(titles(day(31, 0, 2027))).toEqual(["REM Cluj Napoca – REMSYLVANIA"]);
  });
});

// jsdom has no layout: a day is H high, its content 20 + (lines × 12 per shown chip) + 12 for "+n"
describe("fit", () => {
  let H = 200;
  const h = (el: HTMLElement) => {
    const chips = [...el.querySelectorAll<HTMLElement>(".ch")].filter(x => !x.hidden).length;
    const more = el.querySelector<HTMLElement>(".more")?.hidden === false ? 12 : 0;
    return 20 + chips * 12 * Number(el.style.getPropertyValue("--l") || 3) + more;
  };
  const sh = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
  const ch = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get(this: HTMLElement) { return this.classList.contains("day") ? h(this) : 0; } });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get(this: HTMLElement) { return this.classList.contains("day") ? H : 0; } });
  });
  afterAll(() => {
    if (sh) Object.defineProperty(HTMLElement.prototype, "scrollHeight", sh);
    if (ch) Object.defineProperty(HTMLElement.prototype, "clientHeight", ch);
  });

  it("gives a day 3, 2, 1 title lines, then hides events from the end with +n; again on resize", () => {
    setSettings({ home: "", also: [] });
    addEvents(...["a", "b", "c"].map(id => ev({ id, start: "2026-11-19T18:00", end: "2026-11-19T20:00" })));
    show();
    const cell = day(19);
    const more = cell.querySelector<HTMLElement>(".more")!;
    const shown = () => [...cell.querySelectorAll<HTMLElement>(".ch")].map(x => !x.hidden);
    expect(cell.style.getPropertyValue("--l")).toBe("3");
    expect(more.hidden).toBe(true);
    const resize = (px: number) => act(() => { H = px; window.dispatchEvent(new Event("resize")); });
    resize(100);
    expect(cell.style.getPropertyValue("--l")).toBe("2");
    resize(70);
    expect(cell.style.getPropertyValue("--l")).toBe("1");
    expect(shown()).toEqual([true, true, true]);
    resize(50);
    expect(shown()).toEqual([true, false, false]);
    expect(more.hidden).toBe(false);
    expect(more.textContent).toBe("+2");
    resize(200);
    expect(shown()).toEqual([true, true, true]);
    expect(more.hidden).toBe(true);
    expect(cell.style.getPropertyValue("--l")).toBe("3");
  });

  it("fits again once App has made body the full-height calpage column (its layout effect runs after the screen's)", async () => {
    setSettings({ home: "", also: [] });
    addEvents(...["a", "b", "c"].map(id => ev({ id, start: "2026-11-19T18:00", end: "2026-11-19T20:00" })));
    const tall = H;
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get(this: HTMLElement) { return this.classList.contains("day") ? (document.body.classList.contains("calpage") ? 70 : tall) : 0; } });
    function Shell() {  // as App: the body class in a parent layout effect
      useLayoutEffect(() => { document.body.classList.add("calpage"); return () => document.body.classList.remove("calpage"); });
      return <Calendar route={parseHash("#/calendar")} />;
    }
    render(<Shell />);
    await act(() => new Promise(requestAnimationFrame));
    expect(day(19).style.getPropertyValue("--l")).toBe("1");
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get(this: HTMLElement) { return this.classList.contains("day") ? H : 0; } });
  });
});
