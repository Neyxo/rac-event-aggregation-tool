// Home: the member overview, explore mode for a guest, the list, and the welcome steps, on the fixture data (today: 11 Nov 2026, 10:00).
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t, tx } from "../i18n";
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
  localStorage.setItem("rac.onboarded", "true");  // not the first visit: that one opens the welcome steps (see there)
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

  it("offers the calendar until the sheet was opened once: it asks which, my clubs first", async () => {
    await show();
    fireEvent.click(screen.getByRole("link", { name: /^Get your club's events in your calendar/ }));
    const dlg = within(document.querySelector<HTMLElement>("dialog[open]:not(#ob)")!);
    dlg.getByRole("heading", { name: tx("sf").pick });
    expect(dlg.getAllByRole("button").map(b => b.textContent)).toEqual(["", "Rotaract Zürich", "Rotaract Luzern", "Rotaract International", t("sp_all_feed"), tx("sf").other]);
    fireEvent.click(dlg.getByRole("button", { name: t("close") }));
    expect(screen.queryByRole("link", { name: /^Get your club's events/ })).toBeNull();
    expect(JSON.parse(localStorage.getItem("rac.subSeen")!)).toBe(true);
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

  const dlg = () => document.querySelector<HTMLDialogElement>("dialog#ob")!;
  const inDlg = () => within(dlg());
  const click = (name: string | RegExp) => fireEvent.click(inDlg().getByRole("button", { name }));
  const title = () => inDlg().getByRole("heading", { level: 2 });
  /** "Get started", in the browser: the app is offered first */
  const start = async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    await act(async () => {});
  };
  /** past the app, to "Welcome 👋" */
  const web = async () => { await start(); click(t("ob_web")); };
  // the progress dots are decoration (aria-hidden): only the CSS reads them
  const dots = (sel: string) => dlg().querySelectorAll(".bar2 " + sel).length;
  /** the calendar step's rows, by their title */
  const rows = () => [...dlg().querySelectorAll<HTMLElement>(".way")];
  const row = (name: string) => fireEvent.click(rows().find(r => r.querySelector("b")!.textContent === name)!);

  it("the first visit opens them by itself, in the browser with the app first; not on a shared link, not a second time", async () => {
    localStorage.removeItem("rac.onboarded");
    const first = await show();
    expect(dlg().open).toBe(true);
    screen.getByRole("dialog", { name: t("ob_inst") });
    expect(document.activeElement).toBe(title());
    // no progress yet: the app is not one of the steps
    expect(dots("i")).toBe(0);
    expect(inDlg().getAllByRole("button").map(b => [b.className, b.textContent])).toEqual([["btn big", t("inst_btn")], ["skip web", t("ob_web")]]);
    click(t("ob_web"));
    expect(title().textContent).toBe(t("ob_welcome"));
    expect(document.activeElement).toBe(title());
    expect(dots("i")).toBe(4);
    first.unmount();
    history.replaceState(null, "", "/#/?view=saved");
    await show();
    expect(dlg().open).toBe(false);
    cleanup();
    history.replaceState(null, "", "/#/");
    localStorage.setItem("rac.onboarded", "true");
    await show();
    expect(dlg().open).toBe(false);
  });

  it("Install app: the browser's prompt when it has one, else this system's three steps and the way on to the website", async () => {
    const prompt = vi.fn(async () => {});
    act(() => { window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), { prompt, userChoice: Promise.resolve({ outcome: "dismissed" }) })); });
    await start();
    await act(async () => { click(t("inst_btn")); });
    expect(prompt).toHaveBeenCalledTimes(1);
    // declined: a prompt works once, so the button now explains
    expect(title().textContent).toBe(t("ob_inst"));
    click(t("inst_btn"));
    expect(title().textContent).toBe(t("inst_btn"));
    expect([...dlg().querySelectorAll("ol.qsteps li")].map(li => li.textContent)).toEqual(tx("g_desktop"));
    inDlg().getByText(t("ob_inst_then"));
    // no link to Chrome on a computer; the address to paste into the browser the steps name
    expect(inDlg().queryByRole("link")).toBeNull();
    expect(inDlg().getAllByRole("button").map(b => [b.className, b.textContent])).toEqual([["linkbtn", t("copy_link")], ["skip web", t("ob_web")]]);
    click(t("ob_web"));
    expect(title().textContent).toBe(t("ob_welcome"));
  });

  it("as a guest: three slides, clubs near; Done there saves the clubs and shows them", async () => {
    await show();
    expect(dlg().open).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Get started" }));
    await act(async () => {});
    expect(dlg().open).toBe(true);
    click(t("ob_web"));
    screen.getByRole("dialog", { name: "Welcome 👋" });
    expect(document.activeElement).toBe(title());
    await act(async () => { click("Not (yet)"); });
    // a guest's welcome is the full-screen one (CSS: .ob.full)
    expect(dlg().classList.contains("full")).toBe(true);
    expect([dots("i"), dots("i.on")]).toEqual([5, 2]);
    expect(title().textContent).toBe("Who we are");
    expect(document.activeElement).toBe(title());
    click("Next");
    expect(title().textContent).toBe("What we do");
    for (const p of ["Learn.", "Help.", "Celebrate."]) inDlg().getByText(p);
    click("Next");
    click("Next");
    expect(title().textContent).toBe("Clubs near you");
    expect(dots("i.on")).toBe(5);
    click("ZH Intl (Rotaract Zurich International)");
    inDlg().getByText(t("credit_short"));
    // the last step: no Next, no install step after it
    expect(inDlg().queryByRole("button", { name: "Next" })).toBeNull();
    click("Done");
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
    // the guess for English without a position: the international clubs of Zurich and Geneva (only Zurich's is in the fixture)
    expect(JSON.parse(localStorage.getItem("rac.settings")!)).toEqual({ home: "", also: ["zurich-international"] });
    expect(toastText()).toBe("Showing ZH Intl");
    screen.getByRole("heading", { level: 1 });
  });

  it("a guest's Skip jumps to the clubs", async () => {
    await web();
    await act(async () => { click("Not (yet)"); });
    click("Skip");
    expect(title().textContent).toBe("Clubs near you");
  });

  it("as a member: main club and others, good to know, then the calendar flow for those clubs up to Done", async () => {
    await web();
    await act(async () => { click("Yes, I'm a member"); });
    expect(dlg().classList.contains("full")).toBe(false);
    expect([dots("i"), dots("i.on")]).toEqual([4, 2]);
    expect(title().textContent).toBe("Which clubs are you interested in?");
    // a club is in both pickers: the main one first, then the others
    fireEvent.click(inDlg().getAllByRole("button", { name: "Rotaract Bern" })[0]!);
    fireEvent.click(inDlg().getAllByRole("button", { name: "Rotaract Luzern" }).at(-1)!);
    // the main club is no longer offered among the others
    expect(inDlg().getByRole("button", { name: "Rotaract Bern" }).getAttribute("aria-pressed")).toBe("true");
    expect(document.activeElement).toBe(title());
    click("Next");
    expect(title().textContent).toBe(t("app_know_h"));
    expect([...dlg().querySelectorAll("ul.facts2.big li")].map(li => [li.textContent, !!li.querySelector("svg")])).toEqual(tx("ob_facts").map(f => [f, true]));
    expect(dots("i.on")).toBe(3);
    expect(inDlg().queryByRole("button", { name: "Skip" })).toBeNull();
    click("Next");
    // the calendar: the same flow as everywhere, in the dialog itself, for the clubs just chosen
    expect(title().textContent).toBe(t("ob_sub"));
    expect(dots("i.on")).toBe(4);
    expect(rows().map(r => r.textContent)).toEqual(["Rotaract Bern", "Rotaract Luzern", "Rotaract International", t("sp_all_feed")]);
    expect(dlg().querySelectorAll(".nav button")).toHaveLength(1);
    inDlg().getByRole("button", { name: t("not_now") });
    row("Rotaract Bern");
    expect(title().textContent).toBe(t("way_pick"));
    expect(document.activeElement).toBe(title());
    click(t("back"));
    expect(title().textContent).toBe(t("ob_sub"));
    row("Rotaract Bern");
    row(t("way_outlook"));
    expect(inDlg().getByRole("link", { name: tx("sf").o_open }).getAttribute("href")).toMatch(/bern\.ics&name=Rotaract%20Bern$/);
    inDlg().getByRole("button", { name: t("not_now") });
    click("Next");
    click("Done");
    // the flow's end: Done! with another calendar on offer; nothing is saved before the dialog's own Done
    expect(title().textContent).toBe(tx("sf").done);
    expect(dlg().open).toBe(true);
    expect(inDlg().queryByRole("button", { name: t("not_now") })).toBeNull();
    expect(localStorage.getItem("rac.settings")).toBe(JSON.stringify({ home: "", also: [] }));
    row(tx("sf").another);
    expect(rows().map(r => r.querySelector(".sfok")?.textContent ?? "")).toEqual(["✓", "", "", ""]);
    row("Rotaract Luzern");
    row(t("way_outlook"));
    click("Next");
    click("Done");
    click("Done");
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
    expect(getData().settings).toEqual({ home: "bern", also: ["geneve-international", "luzern"] });
    const main = hello().getAllByRole("link")[0]!;
    expect([href(main), main.classList.contains("main")]).toEqual(["#/club/bern", true]);
  });

  it("a member's Not now at the calendar finishes too", async () => {
    await web();
    await act(async () => { click("Yes, I'm a member"); });
    click("Next");
    click("Next");
    click(t("not_now"));
    expect(dlg().open).toBe(false);
    expect(getData().settings).toEqual({ home: "zurich-international", also: ["geneve-international"] });
    expect(toastText()).toBe("Showing ZH Intl");
  });

  it("Esc finishes like Skip", async () => {
    await start();
    fireEvent(dlg(), new Event("cancel", { cancelable: true }));
    expect(dlg().open).toBe(false);
    expect(JSON.parse(localStorage.getItem("rac.onboarded")!)).toBe(true);
  });

  it("the installed app starts with Welcome: nothing to install", async () => {
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q === "(display-mode: standalone)", media: q })) as unknown as typeof window.matchMedia;
    try {
      localStorage.removeItem("rac.onboarded");
      await show();
      expect(dlg().open).toBe(true);
      expect(title().textContent).toBe(t("ob_welcome"));
      expect(dots("i")).toBe(4);
      expect(inDlg().queryByRole("button", { name: t("ob_web") })).toBeNull();
    } finally { window.matchMedia = mm; }
  });

  // last: an accepted install is remembered for as long as the page lives (lib/install), so no later test would see the install step
  it("installed from the prompt: the website's part is over, with a way to carry on here all the same", async () => {
    const prompt = vi.fn(async () => {});
    act(() => { window.dispatchEvent(Object.assign(new Event("beforeinstallprompt"), { prompt, userChoice: Promise.resolve({ outcome: "accepted" }) })); });
    await start();
    await act(async () => { click(t("inst_btn")); });
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(title().textContent).toBe(t("ob_inst_done"));
    inDlg().getByText(t("ob_inst_done_t"));
    expect(inDlg().getAllByRole("button").map(b => [b.className, b.textContent])).toEqual([["skip web", t("ob_web_back")]]);
    click(t("ob_web_back"));
    expect(title().textContent).toBe(t("ob_welcome"));
  });
});
