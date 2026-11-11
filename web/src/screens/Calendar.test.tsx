// The calendar screen: the month grid, scope, month navigation, the day sheet and fit().
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { useLayoutEffect } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { ev } from "../test/ev";
import type { Event } from "../lib/types";
import { getData, initData, loadData, setSettings } from "../lib/data";
import { parseHash } from "../lib/route";
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
const days = (c: HTMLElement) => [...c.querySelectorAll<HTMLButtonElement>("#grid > button.day")];
/** a day of the shown month by its number */
const day = (c: HTMLElement, n: number) => days(c).filter(b => !b.classList.contains("other"))[n - 1]!;
const titles = (b: HTMLElement) => [...b.querySelectorAll(".ch")].map(s => s.getAttribute("title"));
const sheet = (c: HTMLElement) => c.querySelector<HTMLElement>("#sheet")!;

describe("calendar", () => {
  it("draws the month: header, weekdays, 42 cells from Monday, today, other-month days", () => {
    const c = show();
    expect(c.querySelector("#stale.banner")?.hasAttribute("hidden")).toBe(true);
    expect(c.querySelector("main#main.calwrap > .mhead > h2#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(c.querySelector("#prev")?.getAttribute("aria-label")).toBe(t("prev_month"));
    expect(c.querySelectorAll("#grid > .dow[role=columnheader]")).toHaveLength(7);
    const grid = c.querySelector<HTMLElement>("#grid")!;
    expect(grid.style.getPropertyValue("--rows")).toBe("6");
    expect(days(c)).toHaveLength(42);
    expect(days(c)[0]!.querySelector(".n")?.textContent).toBe("26");
    expect(days(c)[0]!.className).toBe("day other");
    expect(day(c, 11).className).toBe("day today");
    expect(day(c, 11).getAttribute("aria-label")).toBe(fmt.full.format(new Date(2026, 10, 11)) + ", " + t("n_on_day", { n: 1 }));
    expect(day(c, 11).getAttribute("aria-pressed")).toBe("false");
    const chip = day(c, 11).querySelector<HTMLElement>(".ch")!;
    expect(chip.style.getPropertyValue("--c")).toBe("#1f78d1");
    expect(chip.style.getPropertyValue("--crest")).toMatch(/^url\(".*crests\/zuerich\.svg"\)$/);
    expect(chip.querySelector("i")?.textContent).toBe("Informal: Konzert in der Tonhalle Zürich");
    expect(day(c, 11).lastElementChild?.matches("span.more[hidden]")).toBe(true);
  });

  it("scope: my clubs first, all on demand; no switch without clubs", () => {
    const c = show();
    const [mine, all] = [...c.querySelectorAll<HTMLButtonElement>("#scope > button")];
    expect(mine!.getAttribute("aria-pressed")).toBe("true");
    expect(titles(day(c, 7))).toEqual([]);
    fireEvent.click(all!);
    expect(all!.getAttribute("aria-pressed")).toBe("true");
    expect(mine!.getAttribute("aria-pressed")).toBe("false");
    expect(titles(day(c, 7))).toEqual(["Essen für Alle Volunteering 28.11"]);
    cleanup();
    setSettings({ home: "", also: [] });
    const g = show();
    expect(g.querySelector("#scope")?.hasAttribute("hidden")).toBe(true);
    expect(titles(day(g, 7))).toEqual(["Essen für Alle Volunteering 28.11"]);
  });

  it("month navigation and today", () => {
    const c = show();
    fireEvent.click(c.querySelector("#next")!);
    expect(c.querySelector("#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 11, 1)));
    fireEvent.click(c.querySelector("#prev")!);
    fireEvent.click(c.querySelector("#prev")!);
    expect(c.querySelector("#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 9, 1)));
    expect(sheet(c).className).toBe("sheet");
    // today has an event that starts today: back to November, and the sheet opens on it
    fireEvent.click(c.querySelector("#todayBtn")!);
    expect(c.querySelector("#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(sheet(c).className).toBe("sheet open");
    expect(c.querySelector("#sheetTitle")?.textContent).toBe(fmt.full.format(new Date(2026, 10, 11)));
    expect(day(c, 11).getAttribute("aria-pressed")).toBe("true");
  });

  it("today without an event today only moves to the month", () => {
    vi.setSystemTime(new Date("2026-11-12T10:00"));
    const c = show();
    fireEvent.click(c.querySelector("#next")!);
    fireEvent.click(c.querySelector("#todayBtn")!);
    expect(c.querySelector("#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(sheet(c).getAttribute("aria-hidden")).toBe("true");
  });

  it("a day opens the frosted sheet with its events; close, backdrop, Escape and a swipe down close it", () => {
    const c = show();
    const s = sheet(c);
    expect(s.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(day(c, 11));
    expect(s.className).toBe("sheet open");
    expect(s.getAttribute("aria-hidden")).toBe("false");
    expect([...c.querySelectorAll("#sheetBody > a.event")].map(a => a.id)).toEqual(["ev-219091"]);
    expect(day(c, 11).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(c.querySelector("#sheetClose")!);
    expect(s.className).toBe("sheet");
    expect(day(c, 11).getAttribute("aria-pressed")).toBe("false");
    // the content stays while the sheet slides away
    expect(c.querySelector("#sheetBody > a.event")).not.toBeNull();

    fireEvent.click(day(c, 11));
    fireEvent.click(s.querySelector(".sheet-in")!);
    expect(s.className).toBe("sheet open");
    fireEvent.click(s);
    expect(s.className).toBe("sheet");

    fireEvent.click(day(c, 11));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(s.className).toBe("sheet");

    fireEvent.click(day(c, 11));
    const handle = c.querySelector("#sheetHandle")!;
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 120 }] });
    expect(s.className).toBe("sheet open");
    fireEvent.touchStart(handle, { touches: [{ clientY: 100 }] });
    fireEvent.touchEnd(handle, { changedTouches: [{ clientY: 160 }] });
    expect(s.className).toBe("sheet");
  });

  it("an empty day says so", () => {
    const c = show();
    fireEvent.click(day(c, 12));
    expect(c.querySelector("#sheetBody > p.meta")?.textContent).toBe(t("no_events_day"));
  });

  it("multi-day and all-day events are on every day they touch", () => {
    setSettings({ home: "", also: [] });
    addEvents(ev({ id: "m", title: "Weekend", start: "2026-11-20T18:00", end: "2026-11-22T12:00" }));
    const c = show();
    expect([20, 21, 22, 23].map(n => titles(day(c, n)).includes("Weekend"))).toEqual([true, true, true, false]);
    fireEvent.click(c.querySelector("#next")!);
    fireEvent.click(c.querySelector("#next")!);
    // all day 26–28 January (ends at the midnight after the 28th), and 28 January – 31 January
    expect([25, 26, 27, 28, 29].map(n => titles(day(c, n)).length)).toEqual([0, 1, 1, 2, 1]);
    expect(titles(day(c, 31))).toEqual(["REM Cluj Napoca – REMSYLVANIA"]);
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
    const c = show();
    const cell = day(c, 19);
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
    const c = render(<Shell />).container;
    await act(() => new Promise(requestAnimationFrame));
    expect(day(c, 19).style.getPropertyValue("--l")).toBe("1");
    Object.defineProperty(HTMLElement.prototype, "clientHeight", { configurable: true, get(this: HTMLElement) { return this.classList.contains("day") ? H : 0; } });
  });
});
