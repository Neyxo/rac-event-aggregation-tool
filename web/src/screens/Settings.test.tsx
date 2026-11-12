// Settings: club pickers, Rotary / theme / developer switches, install steps.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t } from "../i18n";
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
const $ = (s: string) => document.querySelector<HTMLElement>(s)!;
const show = () => render(<><Settings route={route} /><Toast /></>);
const button = (name: string | RegExp, scope: HTMLElement = document.body) => within(scope).getByRole("button", { name });
const dialog = () => screen.getByRole("dialog");
const pressed = (b: HTMLElement) => b.getAttribute("aria-pressed");
const madeBy = () => screen.getByText(/^Made by/);
const devHeading = () => screen.queryByRole("heading", { name: "Developer" });

describe("Settings", () => {
  it("shows the sections with the chosen clubs, the help links and the share link", () => {
    setSettings({ home: "luzern", also: ["zuerich"] });
    show();
    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual(["Clubs", "App", "Help"]);
    button("Main club Luzern");
    button("Also show Zürich");
    expect(screen.getByRole("link", { name: "Subscribe to calendars" }).getAttribute("href")).toBe("#/subscribe");
    expect(screen.getByRole("link", { name: "Show the welcome steps again" }).getAttribute("href")).toBe("./?welcome");
    expect(screen.getByRole("link", { name: "About this app" }).getAttribute("href")).toBe("#/public");
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe(location.origin + location.pathname.replace(/[^/]*$/, ""));
    expect(devHeading()).toBeNull();  // locked
  });

  it("shows None for an empty pick", () => {
    setSettings({ home: "", also: [] });
    show();
    button("Main club None");
    button("Also show None");
  });

  it("main club picker: single choice, drops it from also show, saves", () => {
    setSettings({ home: "luzern", also: ["zuerich", "bern"] });
    show();
    fireEvent.click(button(/^Main club/));
    within(dialog()).getByRole("heading", { name: "Choose main club" });
    button("None", dialog());
    fireEvent.click(button("Rotaract Bern", dialog()));
    button("Main club Bern");
    button("Also show Zürich");
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "bern", also: ["zuerich"] });
    expect(pressed(button("Rotaract Bern", dialog()))).toBe("true");
    fireEvent.click(button("Close", dialog()));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("also-show picker: toggles, never offers the main club", () => {
    setSettings({ home: "luzern", also: [] });
    show();
    fireEvent.click(button(/^Also show/));
    expect(within(dialog()).queryByRole("button", { name: "Rotaract Luzern" })).toBeNull();
    fireEvent.click(button("Rotaract Bern", dialog()));
    button("Also show Bern");
    fireEvent.click(button("Rotaract Bern", dialog()));
    button("Also show None");
  });

  it("Rotary switch applies at once, without a reload: the districts join the also-show picker and leave it again", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    show();
    const district = () => within(dialog()).queryByRole("button", { name: "Rotary 1980 (Rotary Distrikt 1980)" });
    fireEvent.click(button(/^Also show/));
    expect(district()).toBeNull();
    fireEvent.click(button("Close", dialog()));
    expect(pressed(button("Off", $("#rotarySeg")))).toBe("true");
    fireEvent.click(button("On", $("#rotarySeg")));
    expect(localStorage.getItem("rac.rotary")).toBe("true");
    expect(pressed(button("On", $("#rotarySeg")))).toBe("true");
    fireEvent.click(button(/^Also show/));
    expect(district()).not.toBeNull();
    fireEvent.click(button("Close", dialog()));
    fireEvent.click(button("Off", $("#rotarySeg")));
    expect(getData().clubs.rotary1980).toBeUndefined();
    expect(reload).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("theme switch applies at once, without a reload, and is stored for the next start", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    document.documentElement.dataset.theme = "light";
    show();
    const light = () => button("Light"), dark = () => button("Dark");
    expect(pressed(light())).toBe("true");
    expect(light().querySelector("svg")).not.toBeNull();  // the sun / moon icons
    fireEvent.click(dark());
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(pressed(dark())).toBe("true");
    expect(localStorage.getItem("rac.theme")).toBe('"dark"');
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(light());
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(pressed(light())).toBe("true");
    expect(localStorage.getItem("rac.theme")).toBe('"light"');
    vi.unstubAllGlobals();
  });

  it("language: the shared segmented control", () => {
    show();
    expect(within(screen.getByRole("group", { name: "Language" })).getAllByRole("button").map(b => b.textContent)).toEqual(["DE", "FR", "IT", "EN"]);
  });

  it("install steps: one tab per system, switching the steps", () => {
    show();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map(b => b.textContent)).toEqual(["iPhone / iPad", "Android", "Computer"]);
    expect(tabs[2]!.getAttribute("aria-selected")).toBe("true");  // jsdom is no phone
    const steps = () => screen.getAllByRole("listitem").map(li => li.textContent);
    const before = steps();
    fireEvent.click(tabs[0]!);
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    expect(steps()).not.toEqual(before);
  });

  it("install on Samsung Internet (Play Protect blocks its installs): the prompt is not offered; a link opens the app in Chrome, above the Android steps", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36");
    const ev = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}) });
    dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    show();
    expect(screen.queryByRole("button", { name: "Install app" })).toBeNull();
    expect(screen.getByRole("link", { name: "Open in Chrome" }).getAttribute("href")).toBe("intent://localhost:3000/#Intent;scheme=https;package=com.android.chrome;end");
    expect(screen.getByRole("tab", { name: "Android" }).getAttribute("aria-selected")).toBe("true");
    vi.restoreAllMocks();
  });

  it("install: the browser's prompt, caught before Settings was opened, is one button; dismissed, the steps come back", async () => {
    const ev = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: "dismissed" }) });
    dispatchEvent(ev);  // fires early, on whatever screen the app opened on
    expect(ev.defaultPrevented).toBe(true);
    show();
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    await act(async () => { fireEvent.click(button("Install app")); });
    expect(ev.prompt).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("install (after the one above: installed stays for the session): the prompt accepted, Settings says it is installed instead of showing the steps", async () => {
    const ev = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), { prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: "accepted" }) });
    dispatchEvent(ev);
    show();
    await act(async () => { fireEvent.click(button("Install app")); });
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
    expect(document.getElementById("installBody")!.textContent).toBe(t("inst_done"));
  });

  it("copies the share link", async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    show();
    await act(async () => { fireEvent.click(button("Copy")); });
    expect(writeText).toHaveBeenCalledWith((screen.getByRole("textbox") as HTMLInputElement).value);
    expect(screen.getByRole("status").textContent).toBe("Link copied");
  });

  it("ten quick taps on made-by unlock developer mode; its switch hides the link", () => {
    show();
    for (let i = 0; i < 9; i++) fireEvent.click(madeBy());
    expect(devHeading()).toBeNull();
    fireEvent.click(madeBy());
    expect(devHeading()).not.toBeNull();
    expect(screen.getByRole("link", { name: "Developer page" }).getAttribute("href")).toBe("#/dev");
    expect(localStorage.getItem("rac.devUnlocked")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("Developer mode is on");
    fireEvent.click(button("Off", $("#devSec")));
    expect(localStorage.getItem("rac.dev")).toBe("false");
    expect(screen.queryByRole("link", { name: "Developer page" })).toBeNull();
    expect(devHeading()).not.toBeNull();  // stays once unlocked
  });

  it("switching developer mode reloads only when it changes which preview switches apply", () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...location, reload, hash: "#/settings" });
    localStorage.setItem("rac.devUnlocked", "true");
    localStorage.setItem("rac.dev", "true");
    show();
    fireEvent.click(button("Off", $("#devSec")));  // no preview on: nothing changes
    expect(reload).not.toHaveBeenCalled();
    fireEvent.click(button("On", $("#devSec")));
    localStorage.setItem("rac.devGuest", "true");  // the guest preview is on: turning developer mode off ends it
    fireEvent.click(button("Off", $("#devSec")));
    expect(reload).toHaveBeenCalledTimes(1);
    localStorage.removeItem("rac.devGuest");
    vi.unstubAllGlobals();
  });

  it("slow taps don't unlock", () => {
    vi.useFakeTimers();
    show();
    for (let i = 0; i < 10; i++) { fireEvent.click(madeBy()); vi.advanceTimersByTime(400); }
    expect(devHeading()).toBeNull();
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
