// Home: the member overview, explore mode for a guest, the list, and the welcome steps, on the fixture data (today: 11 Nov 2026, 10:00).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast, useRoute } from "../components";
import Home from "./Home";

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
  // jsdom has no layout, no media queries and no modal dialogs
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  window.matchMedia = ((q: string) => ({ matches: false, media: q })) as unknown as typeof window.matchMedia;
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
});
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  history.replaceState(null, "", "/#/");
  D.saved = new Set();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  document.body.className = "";
});

const show = async () => {
  const r = render(<><Home route={parseHash(location.hash)} /><Toast /></>);
  await act(async () => {});
  return r;
};
const ids = () => [...document.querySelectorAll("#results a.event")].map(a => a.id.slice(3));

describe("Home, member", () => {
  beforeEach(() => { D.settings = { home: "zuerich", also: ["luzern"] }; });

  it("greets, shows the next event, the panes, and lists the rest of my clubs' events plus the international ones", async () => {
    await show();
    expect(document.querySelector(".hello h1")?.textContent).toBe("Good morning 👋");
    expect(document.querySelector(".hello .sub")?.textContent).toBe("1 event this week");
    expect([...document.querySelectorAll(".hello .chips a")].map(a => [a.getAttribute("href"), a.className])).toEqual([["#/club/zuerich", "chip club main"], ["#/club/luzern", "chip club "]]);
    expect(document.querySelector("a.nx")?.getAttribute("href")).toBe("#/event/219091");
    expect(document.querySelector("a.nx .k")?.textContent).toBe("Next event · Zürich");
    expect(document.querySelector("#listTitle")?.textContent).toBe("Coming up");
    // the next event is not repeated; Zurich International is not one of my clubs
    expect(ids()).toEqual(["eu2069", "eu2067"]);
    expect(document.querySelector("#summary")?.textContent).toBe("2 events");
    expect(document.querySelector("#results")?.hasAttribute("aria-busy")).toBe(false);
    expect([...document.querySelectorAll("#views button")].map(b => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
    expect(document.body.classList.contains("wash")).toBe(true);
    expect(document.querySelector(".panes .pane .m")?.textContent).toBe("Nothing open.");
    expect(document.querySelector("a.more")?.getAttribute("href")).toBe("#/guide");
  });

  it("news since the last visit: new events get the tag, the line jumps to the list", async () => {
    D.settings = { home: "zuerich", also: ["zurich-international"] };
    localStorage.setItem("rac.seen", JSON.stringify({ at: Date.now() - 2 * 36e5, map: { "219091": "2026-11-11T19:00" } }));
    await show();
    expect(document.querySelector("a.news")?.getAttribute("href")).toBe("#results");
    expect(document.querySelector("a.news b")?.textContent).toBe("1 new");
    expect(document.querySelector("a.news span")?.textContent).toBe(" since your last visit · 1 moved");
    expect(document.querySelector("#ev-222796 .st.new")).not.toBeNull();
    expect(document.querySelector("#ev-eu2069 .st.new")).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.seen")!).at).toBe(Date.now());
    // the tags are Home's: the next screen's cards (Discover, a club) get none
    expect(D.newIds.size).toBe(0);
  });

  it("a star redraws the saved pane; the saved view lists saved events of any club", async () => {
    await show();
    fireEvent.click(document.querySelector("#ev-eu2069 .star")!);
    expect([...document.querySelectorAll(".panes .pane:nth-child(2) a.r span")].map(s => s.textContent)).toEqual(["Pre-REM Satu Mare"]);
    expect(document.querySelector("#toast")?.textContent).toBe("Saved ★");
    fireEvent.click(document.querySelector("#views [data-view=saved]")!);
    expect(ids()).toEqual(["eu2069"]);
    expect(location.hash).toBe("#/?view=saved");
    expect(document.querySelector("#clear")?.hasAttribute("hidden")).toBe(false);
    // unsaving in the saved view takes it off the list
    fireEvent.click(document.querySelector("#ev-eu2069 .star")!);
    expect(document.querySelector("#results .empty")?.textContent).toContain("Nothing saved yet.");
    fireEvent.click(document.querySelector("#results .empty .linkbtn")!);
    expect(location.hash).toBe("#/");
  });
});

describe("a new navigation to Home", () => {
  it("starts over from the URL, as a page load did (the Home tab from the saved view)", async () => {
    D.settings = { home: "zuerich", also: ["luzern"] };
    D.saved = new Set(["eu2069"]);
    await act(async () => { history.replaceState(null, "", "/#/?view=saved"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    const W = () => <Home route={useRoute()} />;
    render(<W />);
    await act(async () => {});
    expect(document.querySelector("#views [aria-pressed=true]")?.getAttribute("data-view")).toBe("saved");
    await act(async () => { history.pushState(null, "", "#/"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(document.querySelector("#views [aria-pressed=true]")?.getAttribute("data-view")).toBe("all");
    expect(ids()).toEqual(["eu2069", "eu2067"]);
  });
});

describe("Home, guest", () => {
  beforeEach(() => { D.settings = { home: "", also: [] }; });

  it("explore mode: the invitation, the club finder, every Rotaract event", async () => {
    await show();
    expect(document.querySelector(".explore .k")?.textContent).toBe("New here?");
    expect(document.querySelector(".cta.new input.in")).not.toBeNull();
    expect(document.querySelector(".hello")).toBeNull();
    expect(document.body.classList.contains("wash")).toBe(false);
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    expect(document.querySelector("#listTitle")?.textContent).toBe("Coming up");
  });

  it("with a position known in this tab, the events within 50 km come first", async () => {
    sessionStorage.setItem("rac.here", JSON.stringify([47.37, 8.54]));  // Zurich
    await show();
    expect(document.querySelector("#listTitle")?.textContent).toBe("Events near you");
    expect(ids()).toEqual(["219091", "222796"]);
    expect(document.querySelectorAll(".cta .near a.chip").length).toBe(3);
  });

  it("a filter link is Discover's", async () => {
    history.replaceState(null, "", "/#/?q=stamm");
    await show();
    expect(location.hash).toBe("#/discover?q=stamm");
  });
});

describe("welcome steps", () => {
  beforeEach(() => {
    D.settings = { home: "", also: [] };
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));  // no position: the guess is per language
  });
  afterEach(() => vi.unstubAllGlobals());

  const dlg = () => document.querySelector<HTMLDialogElement>("dialog#ob")!;
  const next = () => fireEvent.click(dlg().querySelector(".nav .btn")!);
  const title = () => dlg().querySelector("h2#obTitle");

  it("as a guest: three slides, clubs near, install; finishing saves the clubs and shows them", async () => {
    await show();
    expect(dlg().open).toBe(false);
    fireEvent.click(document.querySelector(".explore .primary")!);
    await act(async () => {});
    expect(dlg().open).toBe(true);
    expect(title()?.textContent).toBe("Welcome 👋");
    expect(document.activeElement).toBe(title());
    await act(async () => { fireEvent.click(dlg().querySelector(".choice .alt")!); });
    expect(dlg().className).toBe("ob full");
    expect(dlg().querySelectorAll(".bar2 i").length).toBe(6);
    expect(dlg().querySelector(".slide h2")?.textContent).toBe("Who we are");
    expect(document.activeElement).toBe(title());
    next();
    expect(dlg().querySelectorAll(".slide .pill p").length).toBe(3);
    next();
    next();
    expect(title()?.textContent).toBe("Clubs near you");
    fireEvent.click(dlg().querySelector(".chips button")!);
    next();
    expect(title()?.textContent).toBe("Install as an app?");
    expect(dlg().querySelector("p.meta a")?.getAttribute("href")).toBe("#/settings#install");
    next();
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
    // the guess for English without a position: the international clubs of Zurich and Geneva (only Zurich's is in the fixture)
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "", also: ["zurich-international"] });
    expect(document.querySelector("#toast")?.textContent).toBe("Showing ZH Intl");
    expect(document.querySelector(".hello")).not.toBeNull();
  });

  it("as a member: main club and others, the calendar feeds, install", async () => {
    await show();
    fireEvent.click(document.querySelector(".explore .primary")!);
    await act(async () => {});
    await act(async () => { fireEvent.click(dlg().querySelector(".choice .btn:not(.alt)")!); });
    expect(dlg().className).toBe("ob");
    expect(dlg().querySelectorAll(".bar2 i.on").length).toBe(2);
    expect(title()?.textContent).toBe("Which clubs are you interested in?");
    const [main, also] = [...dlg().querySelectorAll(".chips")];
    fireEvent.click([...main!.querySelectorAll("button")].find(b => b.textContent === "Bern")!);
    fireEvent.click([...also!.querySelectorAll("button")].find(b => b.textContent === "Luzern")!);
    expect(dlg().querySelector(".chips button[aria-pressed=true]")?.textContent).toBe("Bern");
    expect(document.activeElement).toBe(title());
    next();
    expect([...dlg().querySelectorAll(".feed .name")].map(n => n.textContent)).toEqual(["Rotaract Bern", "Rotaract Luzern", "All Rotaract events CH & LI"]);
    expect(dlg().querySelector(".feed .l a")?.getAttribute("href")).toMatch(/^webcal:.*\/bern\.ics$/);
    next();
    expect(dlg().querySelector(".credit")).not.toBeNull();
    next();
    expect(D.settings).toEqual({ home: "bern", also: ["geneve-international", "luzern"] });
    expect(document.querySelector(".hello .chips a.main")?.getAttribute("href")).toBe("#/club/bern");
  });

  it("Esc finishes like Skip", async () => {
    await show();
    fireEvent.click(document.querySelector(".explore .primary")!);
    await act(async () => {});
    fireEvent(dlg(), new Event("cancel", { cancelable: true }));
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
  });
});
