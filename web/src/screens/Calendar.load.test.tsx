// The calendar before and without events.json (its own file: useData() loads once per module instance).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { fmt } from "../lib/dates";
import Calendar from "./Calendar";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });
const $ = (s: string) => document.querySelector(s);
const route = parseHash("#/calendar");

describe("Calendar loading", () => {  // in this order: a failed load is retried, a pending one is not
  it("events.json fails: <main> holds only the offline note, like the old page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await act(async () => { render(<Calendar route={route} />); });
    const main = $("main.calwrap#main")!;
    expect(main.children).toHaveLength(1);
    expect(main.firstElementChild?.className).toBe("empty");
    expect(main.querySelector("button.linkbtn")).not.toBeNull();
    expect($("#sheet")?.getAttribute("aria-hidden")).toBe("true");
  });
  it("month, scope and today buttons do nothing until the data is in (the old page had no listeners yet)", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T10:00"));
    localStorage.setItem("rac.settings", JSON.stringify({ home: "luzern", also: ["zuerich"] }));
    let answer!: () => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(ok => { answer = () => ok({ ok: true, json: async () => structuredClone(fixture) }); })));
    render(<Calendar route={route} />);
    expect($("#mtitle")?.textContent).toBe("");
    for (const s of ["#next", "#next", "#prev", "#scope button:nth-child(2)", "#todayBtn"]) fireEvent.click($(s)!);
    await act(async () => { answer(); });
    expect($("#mtitle")?.textContent).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect($("#scope button:nth-child(1)")?.getAttribute("aria-pressed")).toBe("true");
    expect($("#sheet")?.className).toBe("sheet");
  });
});
