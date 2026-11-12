// Home: the member overview, explore mode for a guest, the list, and the welcome steps, on the fixture data (today: 11 Nov 2026, 10:00).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { eventById, getData, initData, loadData, setSettings, toggleSaved } from "../lib/data";
import { EventCard, Toast, navigate, useRoute } from "../components";
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
  localStorage.clear();
  initData(fixture);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.useRealTimers();
  document.body.className = "";
});

/** Home as App renders it: its route follows the URL (the list reads its filters from there) */
const Routed = () => <Home route={useRoute()} />;
const show = async () => {
  navigate(location.hash, { replace: true });
  const r = render(<><Routed /><Toast /></>);
  await act(async () => {});
  return r;
};
const href = (a: Element) => a.getAttribute("href");
// the list has no accessible name; #results is what the "new since your last visit" line jumps to
const results = () => document.getElementById("results")!;
const cards = () => within(results()).queryAllByRole("link").filter(a => href(a)!.startsWith("#/event/"));
const ids = () => cards().map(a => href(a)!.slice("#/event/".length));
const card = (id: string) => cards().find(a => href(a) === "#/event/" + id)!;
const toastText = () => document.getElementById("toast")?.textContent;
const views = () => within(screen.getByRole("group", { name: "Filters" }));
const hello = () => within(screen.getByRole("heading", { level: 1 }).parentElement!);
const savedPane = () => within(screen.getByText("Saved").parentElement!);
const star = (title: string) => within(results()).getByRole("button", { name: "Save event: " + title });

describe("Home, member", () => {
  beforeEach(() => { setSettings({ home: "zuerich", also: ["luzern"] }); });

  it("greets, shows the next event, the panes, and lists the rest of my clubs' events plus the international ones", async () => {
    await show();
    screen.getByRole("heading", { level: 1, name: "Good morning 👋" });
    screen.getByText("1 event this week");
    // the main club's chip comes first and is marked (the CSS highlights .main)
    expect(hello().getAllByRole("link").map(a => [href(a), a.classList.contains("main")])).toEqual([["#/club/zuerich", true], ["#/club/luzern", false]]);
    expect(href(screen.getByRole("link", { name: /^Next event · Zürich/ }))).toBe("#/event/219091");
    screen.getByRole("heading", { name: "Coming up" });
    // the next event is not repeated; Zurich International is not one of my clubs
    expect(ids()).toEqual(["eu2069", "eu2067"]);
    screen.getByText("2 events");
    expect(results().hasAttribute("aria-busy")).toBe(false);
    expect(views().getByRole("button", { pressed: true }).textContent).toBe("Upcoming");
    expect(document.body.classList.contains("wash")).toBe(true);
    screen.getByText("Nothing open.");
    expect(screen.getAllByRole("link").some(a => href(a) === "#/guide")).toBe(true);
  });

  it("offers the main club's calendar until the sheet was opened once", async () => {
    HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
    localStorage.removeItem("rac.subSeen");
    await show();
    fireEvent.click(screen.getByRole("link", { name: /^Get your club's events in your calendar/ }));
    const dlg = within(document.querySelector<HTMLElement>("dialog[open]")!);
    dlg.getByRole("heading", { name: "Rotaract Zürich" });
    fireEvent.click(dlg.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("link", { name: /^Get your club's events/ })).toBeNull();
    localStorage.removeItem("rac.subSeen");
  });

  it("news since the last visit: new events get the tag, the line jumps to the list", async () => {
    setSettings({ home: "zuerich", also: ["zurich-international"] });
    localStorage.setItem("rac.seen", JSON.stringify({ at: Date.now() - 2 * 36e5, map: { "219091": "2026-11-11T19:00" } }));
    await show();
    expect(href(screen.getByRole("link", { name: "1 new since your last visit · 1 moved" }))).toBe("#results");
    expect(within(card("222796")).queryByText("NEW")).not.toBeNull();
    expect(within(card("eu2069")).queryByText("NEW")).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.seen")!).at).toBe(Date.now());
    // the tags are Home's: a card anywhere else (Discover, a club) gets none
    const other = render(<EventCard e={eventById("222796")!} />).container;
    expect(within(other).queryByText("NEW")).toBeNull();
  });

  it("a star redraws the saved pane; the saved view lists saved events of any club", async () => {
    await show();
    fireEvent.click(star("Pre-REM Satu Mare"));
    expect(savedPane().getAllByRole("link").map(href)).toEqual(["#/event/eu2069"]);
    savedPane().getByText("Pre-REM Satu Mare");
    expect(toastText()).toBe("Saved ★");
    fireEvent.click(views().getByRole("button", { name: "Saved ★" }));
    expect(ids()).toEqual(["eu2069"]);
    expect(location.hash).toBe("#/?view=saved");
    screen.getByRole("button", { name: "Clear" });
    // unsaving in the saved view takes it off the list
    fireEvent.click(star("Pre-REM Satu Mare"));
    within(results()).getByText(/^Nothing saved yet\./);
    fireEvent.click(within(results()).getByRole("button", { name: "Show all upcoming" }));
    expect(location.hash).toBe("#/");
  });
});

describe("Home follows the shared state", () => {
  beforeEach(() => { setSettings({ home: "zuerich", also: ["luzern"] }); });

  it("a star on a card mounted elsewhere updates Home's saved pane and the card's own star", async () => {
    await show();
    expect(savedPane().queryAllByRole("link")).toEqual([]);
    const elsewhere = render(<EventCard e={eventById("eu2069")!} />).container;
    fireEvent.click(within(elsewhere).getByRole("button", { name: "Save event: Pre-REM Satu Mare" }));
    expect(savedPane().getAllByRole("link").map(href)).toEqual(["#/event/eu2069"]);
    expect(star("Pre-REM Satu Mare").getAttribute("aria-pressed")).toBe("true");
    expect(JSON.parse(localStorage.getItem("rac.saved")!)).toEqual(["eu2069"]);
  });

  it("changing the settings redraws Home: greeting chips, wash and next event follow the new main club", async () => {
    await show();
    expect(hello().getAllByRole("link").map(href)).toEqual(["#/club/zuerich", "#/club/luzern"]);
    act(() => { setSettings({ home: "luzern", also: [] }); });
    expect(hello().getAllByRole("link").map(href)).toEqual(["#/club/luzern"]);
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "luzern", also: [] });
  });
});

describe("a new navigation to Home", () => {
  it("starts over from the URL (the Home tab from the saved view shows the upcoming events)", async () => {
    setSettings({ home: "zuerich", also: ["luzern"] });
    toggleSaved("eu2069");
    await act(async () => { history.replaceState(null, "", "/#/?view=saved"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    const W = () => <Home route={useRoute()} />;
    render(<W />);
    await act(async () => {});
    expect(views().getByRole("button", { pressed: true }).textContent).toBe("Saved ★");
    await act(async () => { history.pushState(null, "", "#/"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(views().getByRole("button", { pressed: true }).textContent).toBe("Upcoming");
    expect(ids()).toEqual(["eu2069", "eu2067"]);
  });
});

describe("Home, guest", () => {
  beforeEach(() => { setSettings({ home: "", also: [] }); });

  it("explore mode: the invitation, the club finder, every Rotaract event", async () => {
    await show();
    screen.getByText("New here?");
    screen.getByRole("textbox", { name: "Your town or postcode" });
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(document.body.classList.contains("wash")).toBe(false);
    expect(ids()).toEqual(["219091", "222796", "eu2069", "eu2067"]);
    screen.getByRole("heading", { name: "Coming up" });
  });

  it("with a position known in this tab, the events within 50 km come first", async () => {
    sessionStorage.setItem("rac.here", JSON.stringify([47.37, 8.54]));  // Zurich
    await show();
    screen.getByRole("heading", { name: "Events near you" });
    expect(ids()).toEqual(["219091", "222796"]);
    // the club finder shows the three nearest clubs with their distance
    expect(screen.getAllByText(/^\d+ km$/).length).toBe(3);
  });

  it("a filter link is Discover's", async () => {
    history.replaceState(null, "", "/#/?q=stamm");
    await show();
    expect(location.hash).toBe("#/discover?q=stamm");
  });
});

describe("welcome steps", () => {
  beforeEach(() => {
    setSettings({ home: "", also: [] });
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));  // no position: the guess is per language
  });
  afterEach(() => vi.unstubAllGlobals());

  const dlg = () => screen.getByRole<HTMLDialogElement>("dialog", { hidden: true });
  const inDlg = () => within(dlg());
  const click = (name: string | RegExp) => fireEvent.click(inDlg().getByRole("button", { name }));
  const title = () => inDlg().getByRole("heading", { level: 2 });
  const start = async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    await act(async () => {});
  };
  // the progress dots are decoration (aria-hidden): only the CSS reads them
  const dots = (sel: string) => dlg().querySelectorAll(".bar2 " + sel).length;

  it("as a guest: three slides, clubs near, install; finishing saves the clubs and shows them", async () => {
    await show();
    expect(dlg().open).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    await act(async () => {});
    expect(dlg().open).toBe(true);
    screen.getByRole("dialog", { name: "Welcome 👋" });
    expect(document.activeElement).toBe(title());
    await act(async () => { click("Not (yet)"); });
    // a guest's welcome is the full-screen one (CSS: .ob.full)
    expect(dlg().classList.contains("full")).toBe(true);
    expect(dots("i")).toBe(6);
    expect(title().textContent).toBe("Who we are");
    expect(document.activeElement).toBe(title());
    click("Next");
    expect(title().textContent).toBe("What we do");
    for (const p of ["Learn.", "Help.", "Celebrate."]) inDlg().getByText(p);
    click("Next");
    click("Next");
    expect(title().textContent).toBe("Clubs near you");
    click("ZH Intl (Rotaract Zurich International)");
    click("Next");
    expect(title().textContent).toBe("Install as an app?");
    expect(href(inDlg().getByRole("link", { name: "Settings" }))).toBe("#/settings#install");
    click("Done");
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
    // the guess for English without a position: the international clubs of Zurich and Geneva (only Zurich's is in the fixture)
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "", also: ["zurich-international"] });
    expect(toastText()).toBe("Showing ZH Intl");
    screen.getByRole("heading", { level: 1 });
  });

  it("as a member: main club and others, the calendar feeds, install", async () => {
    await start();
    await act(async () => { click("Yes, I'm a member"); });
    expect(dlg().classList.contains("full")).toBe(false);
    expect(dots("i.on")).toBe(2);
    expect(title().textContent).toBe("Which clubs are you interested in?");
    // a club is in both pickers: the main one first, then the others
    fireEvent.click(inDlg().getAllByRole("button", { name: "Rotaract Bern" })[0]!);
    fireEvent.click(inDlg().getAllByRole("button", { name: "Rotaract Luzern" }).at(-1)!);
    // the main club is no longer offered among the others
    expect(inDlg().getByRole("button", { name: "Rotaract Bern" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(title());
    click("Next");
    for (const n of ["Rotaract Bern", "Rotaract Luzern", "All Rotaract events CH & LI"]) inDlg().getByText(n);
    expect(inDlg().getAllByRole("button", { name: "Subscribe" })).toHaveLength(3);
    click("Next");
    inDlg().getByText("Made by Jean-Michel Carrel · Rotaract Club Luzern");
    click("Done");
    expect(getData().settings).toEqual({ home: "bern", also: ["geneve-international", "luzern"] });
    const main = hello().getAllByRole("link")[0]!;
    expect([href(main), main.classList.contains("main")]).toEqual(["#/club/bern", true]);
  });

  it("Esc finishes like Skip", async () => {
    await start();
    fireEvent(dlg(), new Event("cancel", { cancelable: true }));
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
  });
});
