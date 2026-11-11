// Settings draws the old settings.html DOM and keeps its behaviour: club pickers, Rotary / theme / developer switches, install steps.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { getData, loadData, setSettings } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast } from "../components";
import Settings from "./Settings";

window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
Element.prototype.scrollIntoView ??= function () {};
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  setSettings({ home: "luzern", also: ["zuerich"] });
});

const route = parseHash("#/settings");
const $ = (s: string) => document.querySelector(s);
const texts = (s: string) => [...document.querySelectorAll(s)].map(n => n.textContent);
const show = () => render(<><Settings route={route} /><Toast /></>);

describe("Settings", () => {
  it("draws the sections in the old order with the chosen clubs", () => {
    setSettings({ home: "luzern", also: ["zuerich"] });
    show();
    expect(texts("main.wrap.settings > section.glass > h2")).toEqual(["Clubs", "App", "Help", "Developer"]);
    expect(texts("#homeCur .cl")).toEqual(["Luzern"]);
    expect(texts("#alsoCur .cl")).toEqual(["Zürich"]);
    expect(document.querySelectorAll(".setrow.link > svg.chev")).toHaveLength(6);
    expect([...document.querySelectorAll("a.setrow")].map(a => a.getAttribute("href"))).toEqual(["#/subscribe", "./?welcome", "#/public", "#/dev"]);
    expect(($("#link") as HTMLInputElement).value).toBe(location.origin + location.pathname.replace(/[^/]*$/, ""));
    expect(($("#devSec") as HTMLElement).hidden).toBe(true);
  });

  it("shows None for an empty pick", () => {
    setSettings({ home: "", also: [] });
    show();
    expect(texts("#homeCur > span.meta")).toEqual(["None"]);
    expect(texts("#alsoCur > span.meta")).toEqual(["None"]);
  });

  it("main club picker: single choice, drops it from also show, saves", () => {
    setSettings({ home: "luzern", also: ["zuerich", "bern"] });
    show();
    fireEvent.click($("#homeBtn")!);
    expect($("dialog.ob h2")?.textContent).toBe("Choose main club");
    expect($("dialog .chips > .chip:not(.club)")?.textContent).toBe("None");
    fireEvent.click([...document.querySelectorAll("dialog .chip.club")].find(b => b.textContent === "Bern")!);
    expect(texts("#homeCur .cl")).toEqual(["Bern"]);
    expect(texts("#alsoCur .cl")).toEqual(["Zürich"]);
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "bern", also: ["zuerich"] });
    expect($("dialog .chip.club[aria-pressed=true]")?.textContent).toBe("Bern");
    fireEvent.click($("dialog .nav .btn")!);
    expect($("dialog")).toBeNull();
  });

  it("also-show picker: toggles, never offers the main club", () => {
    setSettings({ home: "luzern", also: [] });
    show();
    fireEvent.click($("#alsoBtn")!);
    const chips = () => [...document.querySelectorAll<HTMLElement>("dialog .chip.club")];
    expect(chips().some(b => b.textContent === "Luzern")).toBe(false);
    fireEvent.click(chips().find(b => b.textContent === "Bern")!);
    expect(texts("#alsoCur .cl")).toEqual(["Bern"]);
    fireEvent.click(chips().find(b => b.textContent === "Bern")!);
    expect(texts("#alsoCur > span.meta")).toEqual(["None"]);
  });

  it("Rotary switch applies at once, without a reload: the districts join the also-show picker and leave it again", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    show();
    const offered = () => [...document.querySelectorAll("dialog .chip.club")].map(b => b.getAttribute("aria-label"));
    fireEvent.click($("#alsoBtn")!);
    expect(offered()).not.toContain("Rotary Distrikt 1980");
    fireEvent.click($("dialog .nav .btn")!);
    expect($("#rotarySeg button:nth-child(1)")?.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click($("#rotarySeg button:nth-child(2)")!);
    expect(localStorage.getItem("rac.rotary")).toBe("true");
    expect($("#rotarySeg button:nth-child(2)")?.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click($("#alsoBtn")!);
    expect(offered()).toContain("Rotary Distrikt 1980");
    fireEvent.click($("dialog .nav .btn")!);
    fireEvent.click($("#rotarySeg button:nth-child(1)")!);
    expect(getData().clubs.rotary1980).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("theme switch applies at once, without a reload, and is stored for the next start", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    document.documentElement.dataset.theme = "light";
    show();
    expect($("#themeSeg button:nth-child(1)")?.getAttribute("aria-pressed")).toBe("true");
    expect(texts("#themeSeg button")).toEqual(["Light", "Dark"]);
    expect($("#themeSeg button svg")).not.toBeNull();
    fireEvent.click($("#themeSeg button:nth-child(2)")!);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect($("#themeSeg button:nth-child(2)")?.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("rac.theme")).toBe('"dark"');
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click($("#themeSeg button:nth-child(1)")!);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect($("#themeSeg button:nth-child(1)")?.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("rac.theme")).toBe('"light"');
    vi.unstubAllGlobals();
  });

  it("language: the shared segmented control", () => {
    show();
    expect(texts("#langBox .seg button")).toEqual(["DE", "FR", "IT", "EN"]);
  });

  it("install steps: one tab per system, switching the steps", () => {
    show();
    const tabs = [...document.querySelectorAll("#install #installBody .seg[role=tablist] > button[role=tab]")];
    expect(tabs.map(b => b.textContent)).toEqual(["iPhone / iPad", "Android", "Computer"]);
    expect(tabs[2]!.getAttribute("aria-selected")).toBe("true");  // jsdom is no phone
    const before = texts("ol.steps li");
    fireEvent.click(tabs[0]!);
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    expect(texts("ol.steps li")).not.toEqual(before);
  });

  it("copies the share link", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    show();
    await act(async () => { fireEvent.click($("#copy")!); });
    expect(writeText).toHaveBeenCalledWith(($("#link") as HTMLInputElement).value);
    expect($("#toast")?.textContent).toBe("Link copied");
  });

  it("ten quick taps on made-by unlock developer mode; its switch hides the link", () => {
    show();
    for (let i = 0; i < 9; i++) fireEvent.click($("#foot footer")!);
    expect(($("#devSec") as HTMLElement).hidden).toBe(true);
    fireEvent.click($("#foot footer")!);
    expect(($("#devSec") as HTMLElement).hidden).toBe(false);
    expect(($("#devLink") as HTMLElement).hidden).toBe(false);
    expect(localStorage.getItem("rac.devUnlocked")).toBe("true");
    expect($("#toast")?.textContent).toBe("Developer mode is on");
    fireEvent.click($("#devSeg button:nth-child(1)")!);
    expect(localStorage.getItem("rac.dev")).toBe("false");
    expect(($("#devLink") as HTMLElement).hidden).toBe(true);
    expect(($("#devSec") as HTMLElement).hidden).toBe(false);  // stays once unlocked
  });

  it("switching developer mode reloads only when it changes which preview switches apply", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    localStorage.setItem("rac.devUnlocked", "true");
    localStorage.setItem("rac.dev", "true");
    show();
    fireEvent.click($("#devSeg button:nth-child(1)")!);  // off, no preview on: nothing changes
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click($("#devSeg button:nth-child(2)")!);
    localStorage.setItem("rac.devGuest", "true");  // the guest preview is on: turning developer mode off ends it
    fireEvent.click($("#devSeg button:nth-child(1)")!);
    expect(reload).toHaveBeenCalledTimes(1);
    localStorage.removeItem("rac.devGuest");
    vi.unstubAllGlobals();
  });

  it("slow taps don't unlock", () => {
    vi.useFakeTimers();
    show();
    for (let i = 0; i < 10; i++) { fireEvent.click($("#foot footer")!); vi.advanceTimersByTime(400); }
    expect(($("#devSec") as HTMLElement).hidden).toBe(true);
    vi.useRealTimers();
  });

  it("#/settings#install is the settings route", () => {
    expect(parseHash("#/settings#install").name).toBe("settings");
  });

  it("#/settings#install centres the install row on a new visit, not on back/forward", () => {
    const spy = vi.spyOn(Element.prototype, "scrollIntoView");
    history.replaceState(null, "", "#/settings#install");
    window.dispatchEvent(new HashChangeEvent("hashchange"));  // a new navigation
    show();
    expect(spy.mock.contexts.map(n => (n as Element).id)).toEqual(["install"]);
    cleanup(); spy.mockClear();
    history.replaceState({ k: 1 }, "", "#/settings#install");
    window.dispatchEvent(new HashChangeEvent("hashchange"));  // back/forward: the entry has a key
    show();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
    history.replaceState(null, "", "#/settings");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
});
