// The calendar before and without events.json (its own file: useData() loads once per module instance).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { fmt } from "../lib/dates";
import { t } from "../i18n";
import Calendar from "./Calendar";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); localStorage.clear(); });
const route = parseHash("#/calendar");
const button = (name: string) => screen.getByRole("button", { name });
const sheet = () => document.querySelector<HTMLDialogElement>("dialog.sheet")!;

describe("Calendar loading", () => {  // in this order: a failed load is retried, a pending one is not
  it("events.json fails: <main> holds only the offline note", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await act(async () => { render(<Calendar route={route} />); });
    const main = screen.getByRole("main");
    expect(within(main).getByText(t("offline"))).toBeTruthy();
    expect(within(main).getAllByRole("button").map(b => b.textContent)).toEqual([t("refresh")]);
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.queryByRole("heading")).toBeNull();
    expect(sheet().open).toBe(false);
  });
  it("month, scope and today buttons do nothing until the data is in", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-11T10:00"));
    localStorage.setItem("rac.settings", JSON.stringify({ home: "luzern", also: ["zuerich"] }));
    let answer!: () => void;
    vi.stubGlobal("fetch", vi.fn(() => new Promise(ok => { answer = () => ok({ ok: true, json: async () => structuredClone(fixture) }); })));
    render(<Calendar route={route} />);
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("");
    for (const n of ["next_month", "next_month", "prev_month", "all_clubs_short", "today"] as const) fireEvent.click(button(t(n)));
    await act(async () => { answer(); });
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(fmt.month.format(new Date(2026, 10, 1)));
    expect(button(t("mine_short")).getAttribute("aria-pressed")).toBe("true");
    expect(sheet().open).toBe(false);
  });
});
