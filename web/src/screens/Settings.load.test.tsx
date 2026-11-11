// Settings before and without events.json (its own file: useData() loads once per module instance).
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Settings from "./Settings";

window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); });
const $ = (s: string) => document.querySelector(s);
const route = parseHash("#/settings");

describe("Settings loading", () => {  // in this order: a failed load is retried, a pending one is not
  it("events.json fails: <main> holds only the offline note, like the old page", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    await act(async () => { render(<Settings route={route} />); });
    const main = $("main.wrap.settings#main")!;
    expect(main.children).toHaveLength(1);
    expect(main.firstElementChild?.className).toBe("empty");
    expect(main.querySelector("button.linkbtn")).not.toBeNull();
  });
  it("the pickers do nothing until the data is there, so None can't overwrite the saved clubs", () => {
    localStorage.setItem("rac.settings", JSON.stringify({ home: "luzern", also: ["bern"] }));
    vi.stubGlobal("fetch", vi.fn(() => new Promise(() => {})));  // never answers
    render(<Settings route={route} />);
    fireEvent.click($("#homeBtn")!);
    expect($("dialog")).toBeNull();
    fireEvent.click($("#alsoBtn")!);
    expect($("dialog")).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "luzern", also: ["bern"] });
  });

});
