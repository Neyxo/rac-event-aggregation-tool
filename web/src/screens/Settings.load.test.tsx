// Settings before and without events.json (its own file: useData() loads once per module instance).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Settings from "./Settings";

window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });
const route = parseHash("#/settings");

describe("Settings loading", () => {  // in this order: a failed load is retried, a pending one is not
  it("events.json fails: the offline note with a refresh button in place of the settings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await act(async () => { render(<Settings route={route} />); });
    expect(screen.getByRole("main").textContent).toBe("Couldn't load events. Are you online?Refresh");
    screen.getByRole("button", { name: "Refresh" });
  });
  it("the pickers do nothing until the data is there, so None can't overwrite the saved clubs", () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "luzern", also: ["bern"] }));
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));  // never answers
    render(<Settings route={route} />);
    fireEvent.click(screen.getByRole("button", { name: /^Main club/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Also show/ }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "luzern", also: ["bern"] });
  });
});
