// Settings draws the old settings.html DOM and keeps its behaviour: club pickers, Rotary / theme / developer switches, install steps.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData } from "../lib/data";
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
  D.settings = { home: "luzern", also: ["zuerich"] };
});

const route = parseHash("#/settings");
const $ = (s: string) => document.querySelector(s);
const texts = (s: string) => [...document.querySelectorAll(s)].map(n => n.textContent);
const show = () => render(<><Settings route={route} /><Toast /></>);

describe("Settings", () => {
  it("draws the sections in the old order with the chosen clubs", () => {
    D.settings = { home: "luzern", also: ["zuerich"] };
    show();
    expect(texts("main.wrap.settings > section.glass > h2")).toEqual(["Clubs", "App", "Help", "Developer"]);
    expect(texts("#homeCur .cl")).toEqual(["Luzern"]);
    expect(texts("#alsoCur .cl")).toEqual(["Zürich"]);
    expect(document.querySelectorAll(".setrow.link > svg.chev")).toHaveLength(6);
    expect([...document.querySelectorAll("a.setrow")].map(a => a.getAttribute("href"))).toEqual(["#/subscribe", "./?welcome", "#/public", "#/dev"]);
    expect(($("#link") as HTMLInputElement).value).toBe(location.origin + location.pathname.replace(/[^/]*$/, ""));
    expect($("#link")?.hasAttribute("value")).toBe(false);
    expect(($("#devSec") as HTMLElement).hidden).toBe(true);
  });

  it("shows None for an empty pick", () => {
    D.settings = { home: "", also: [] };
    show();
    expect(texts("#homeCur > span.meta")).toEqual(["None"]);
    expect(texts("#alsoCur > span.meta")).toEqual(["None"]);
  });

  it("main club picker: single choice, drops it from also show, saves", () => {
    D.settings = { home: "luzern", also: ["zuerich", "bern"] };
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
    D.settings = { home: "luzern", also: [] };
    show();
    fireEvent.click($("#alsoBtn")!);
    const chips = () => [...document.querySelectorAll<HTMLElement>("dialog .chip.club")];
    expect(chips().some(b => b.textContent === "Luzern")).toBe(false);
    fireEvent.click(chips().find(b => b.textContent === "Bern")!);
    expect(texts("#alsoCur .cl")).toEqual(["Bern"]);
    fireEvent.click(chips().find(b => b.textContent === "Bern")!);
    expect(texts("#alsoCur > span.meta")).toEqual(["None"]);
  });

  it("Rotary switch saves and reloads", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    show();
    expect($('#rotarySeg [data-k="off"]')?.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click($('#rotarySeg [data-k="on"]')!);
    expect(localStorage.getItem("rac.rotary")).toBe("true");
    expect(reload).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("theme switch sets <html data-theme> and the pressed button", () => {
    document.documentElement.dataset.theme = "light";
    show();
    expect(texts("#themeSeg button")).toEqual(["Light", "Dark"]);
    expect($("#themeSeg button svg")).not.toBeNull();
    fireEvent.click($('#themeSeg [data-k="dark"]')!);
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect($('#themeSeg [data-k="dark"]')?.getAttribute("aria-pressed")).toBe("true");
    expect(localStorage.getItem("rac.theme")).toBe('"dark"');
  });

  it("language: the shared segmented control", () => {
    show();
    expect(texts("#langBox .seg button")).toEqual(["DE", "FR", "IT", "EN"]);
  });

  it("install steps: one tab per system, switching the steps", () => {
    show();
    const tabs = [...document.querySelectorAll("#install #installBody .seg[role=tablist] > button[role=tab]")];
    expect(tabs.map(b => b.getAttribute("data-key"))).toEqual(["ios", "android", "desktop"]);
    expect($("[data-key=desktop]")?.getAttribute("aria-selected")).toBe("true");  // jsdom is no phone
    const before = texts("ol.steps li");
    fireEvent.click($("[data-key=ios]")!);
    expect($("[data-key=ios]")?.getAttribute("aria-selected")).toBe("true");
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
    fireEvent.click($('#devSeg [data-k="off"]')!);
    expect(localStorage.getItem("rac.dev")).toBe("false");
    expect(($("#devLink") as HTMLElement).hidden).toBe(true);
    expect(($("#devSec") as HTMLElement).hidden).toBe(false);  // stays once unlocked
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
