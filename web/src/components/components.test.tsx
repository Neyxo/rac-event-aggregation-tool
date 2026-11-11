// The shared components: what they show, where they link, and what tapping them does.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { ev } from "../test/ev";
import { t } from "../i18n";
import { getData, loadData, setSettings } from "../lib/data";
import { ClubChip, ClubChips, ClubTiles, CtaBlock, EventCard, NewIds, Footer, HelpLinks, NewsStrip, NextUp, Popup, QaList, Rich, Tabs, TopBar, Toast, toast } from ".";

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => { cleanup(); localStorage.clear(); });
const at = (d: string, f: () => void) => { vi.useFakeTimers(); vi.setSystemTime(new Date(d)); try { f(); } finally { vi.useRealTimers(); } };
const link = (name: string | RegExp) => screen.getByRole("link", { name });

describe("chrome", () => {
  it("top bar: back, brand, Rotaract / info / settings with tooltips; Dev only in developer mode", () => {
    const { rerender } = render(<TopBar active="about" back />);
    const back = link(t("back"));
    expect(back.getAttribute("href")).toBe("#/");
    expect(back.hasAttribute("title")).toBe(false);
    expect(within(link("Rotaract Events")).getByRole("img").getAttribute("src")).toBe("rotaract.svg");
    const right = [link("Rotaract"), link(t("info")), link(t("settings"))];
    expect(right.map(a => a.getAttribute("href"))).toEqual(["#/about", "#/public", "#/settings"]);
    expect(right.map(a => a.classList.contains("on"))).toEqual([true, false, false]);
    for (const a of right) expect(a.getAttribute("title")).toBe(a.getAttribute("aria-label"));
    expect(screen.queryByRole("link", { name: "Dev" })).toBeNull();
    act(() => { localStorage.setItem("rac.dev", "true"); window.dispatchEvent(new StorageEvent("storage")); });
    rerender(<TopBar active="dev" />);
    expect(link("Dev").getAttribute("href")).toBe("#/dev");
    expect(link("Dev").classList.contains("on")).toBe(true);
    expect(screen.queryByRole("link", { name: t("back") })).toBeNull();
  });
  it("tabs: home, discover, calendar; the current one marked", () => {
    render(<Tabs active="calendar" />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(within(nav).getAllByRole("link").map(a => a.getAttribute("href"))).toEqual(["#/", "#/discover", "#/calendar"]);
    expect(within(nav).getByRole("link", { current: "page" })).toHaveProperty("textContent", t("calendar"));
  });
});

describe("event card", () => {
  it("links to the event and shows date, meta, clubs, status and picture", () => {
    let c!: HTMLElement;
    at("2026-11-10T12:00", () => {
      const e = ev({ id: "x", clubs: ["luzern", "nope"], title: "Stamm", start: "2026-11-11T18:00", end: "2026-11-11T21:30", members: true, deadline: "2026-11-11T12:00", image: "p.jpg" });
      c = render(<EventCard e={e} i={20} />).container;
    });
    const a = link(/^Stamm/);
    expect(a.getAttribute("href")).toBe("#/event/x");
    expect(a.getAttribute("style")).toContain("--i: 12");  // the entrance stagger is capped
    expect(within(a).getByText("11")).toBeTruthy();
    expect(within(a).getByText("Wed 18:00–21:30")).toBeTruthy();
    expect(within(a).getByRole("link", { name: "Rotaract Luzern" }).getAttribute("href")).toBe("#/club/luzern");
    expect(within(a).getAllByRole("link").map(l => l.getAttribute("href"))).toContain("#/club/nope");
    expect(within(a).getByText(t("members_only"))).toBeTruthy();
    expect(within(a).getByText(/^Register by/).classList.contains("soon")).toBe(true);  // red in the last two days
    expect(within(a).getByRole("button", { name: t("save") + ": Stamm" }).getAttribute("aria-pressed")).toBe("false");
    expect(c.querySelector("img.thumb")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
  it("cancelled, NEW under NewIds, club colours, decorative crest and date pane", () => {
    let c!: HTMLElement;
    at("2026-11-10T12:00", () => {
      const card = <EventCard e={ev({ id: "c", clubs: ["luzern"], cancelled: true, image: "p.jpg", organiser: "RC X", location: "Bern, Hotel" })} i={3} />;
      c = render(<NewIds.Provider value={new Set(["c"])}>{card}</NewIds.Provider>).container;
    });
    const a = link(/^c/);
    expect(a.classList.contains("cancelled")).toBe(true);
    expect(a.getAttribute("style")).toMatch(/--c: #0b5cad;.*--on-c: #fff;.*--i: 3/);
    expect(within(a).getByText("RC X · Sat 18:00–20:00 · Bern")).toBeTruthy();
    expect(within(a).getByText(t("cancelled"))).toBeTruthy();
    expect(within(a).getByText(t("new_tag"))).toBeTruthy();
    expect(c.querySelector("img.wm")?.getAttribute("aria-hidden")).toBe("true");
    expect(c.querySelector(".date")?.getAttribute("aria-hidden")).toBe("true");
  });
  it("the star saves and says so; every star of the event follows", () => {
    render(<><EventCard e={ev({ id: "s" })} /><EventCard e={ev({ id: "s" })} /><Toast /></>);
    const [star, twin] = screen.getAllByRole("button", { name: t("save") + ": s" });
    fireEvent.click(star!);
    expect(star!.getAttribute("aria-pressed")).toBe("true");
    expect(twin!.getAttribute("aria-pressed")).toBe("true");
    expect(getData().saved.has("s")).toBe(true);
    expect(screen.getByRole("status").textContent).toBe(t("saved"));
    expect(screen.getByRole("status").classList.contains("show")).toBe(true);
    fireEvent.click(twin!);
    expect(star!.getAttribute("aria-pressed")).toBe("false");
  });
  it("next up: countdown, title, time and place, picture", () => {
    at("2026-11-10T12:00", () => { render(<NextUp e={ev({ id: "n", start: "2026-11-11T20:00", end: "2026-11-11T22:00", location: "Luzern, X", image: "a.jpg" })} label="L" />); });
    const a = link(/Tomorrow/);
    expect(a.getAttribute("href")).toBe("#/event/n");
    for (const s of ["L", "Tomorrow", "n", "Wed 20:00–22:00 · Luzern"]) expect(within(a).getByText(s)).toBeTruthy();
    expect(a.querySelector("img")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
});

describe("clubs", () => {
  it("club chip: crest or a dot, club colours, opens the club", () => {
    const { container } = render(<><ClubChip id="luzern" /><ClubChip id="nope" /></>);
    const a = link("Rotaract Luzern");
    expect(a.textContent).toBe("Luzern"); expect(a.getAttribute("style")).toBe("--c: #0b5cad; --on-c: #fff;");
    expect(a.querySelector("img")?.getAttribute("alt")).toBe("");
    const b = container.querySelector('a[href="#/club/nope"]')!;
    expect(b.querySelector("img")).toBeNull(); expect(b.querySelector(".dot")).not.toBeNull();
  });
  it("club chip with a distance", () => {
    render(<ClubChip id="bern" extra="main"><small>3 km</small></ClubChip>);
    const a = link("Rotaract Bern");
    expect(a.classList.contains("main")).toBe(true); expect(a.textContent).toBe("Bern3 km");
  });
  it("tiles: single is a radio group with None and no pseudo-clubs; multi is checkboxes without the excluded", () => {
    render(<><ClubTiles single selected="bern" onPick={() => {}} /><ClubTiles selected={new Set(["bern"])} exclude={["luzern"]} onPick={() => {}} /></>);
    const one = within(screen.getByRole("radiogroup")), radios = one.getAllByRole("radio");
    expect(radios[0]!.textContent).toBe(t("none")); expect(radios[0]!.getAttribute("aria-checked")).toBe("false");
    const bern = one.getByRole("radio", { checked: true });
    expect(bern.textContent).toBe("Bern" + "D" + getData().clubs.bern!.district);
    expect(radios.some(b => b.textContent?.includes("International"))).toBe(false);
    const many = within(screen.getByRole("group")).getAllByRole("checkbox");
    expect(many.length).toBeGreaterThan(0);
    expect(many.map(b => b.querySelector("b")?.textContent)).not.toContain("Luzern");
  });
  it("chips: pressed state per club, limited to only", () => {
    render(<ClubChips selected={new Set(["bern"])} only={["bern", "international"]} onPick={() => {}} />);
    expect(screen.getAllByRole("button").map(b => [b.getAttribute("aria-label"), b.getAttribute("aria-pressed")])).toEqual([["Rotaract Bern", "true"], [getData().clubs.international!.name, "false"]]);
  });
  it("chip picker: single with None, no pseudo-clubs", () => {
    const pick = vi.fn();
    render(<ClubChips single selected="bern" onPick={pick} />);
    expect(screen.queryByRole("button", { name: "Rotaract International" })).toBeNull();
    expect(screen.getByRole("button", { pressed: true })).toHaveProperty("textContent", "Bern");
    fireEvent.click(screen.getByRole("button", { name: t("none") })); expect(pick).toHaveBeenCalledWith("");
  });
});

describe("blocks", () => {
  it("toast with an action stays until tapped", () => {
    const fn = vi.fn();
    render(<Toast />);
    act(() => toast("Hi", { label: "Undo", fn }));
    expect(screen.getByRole("status").textContent).toBe("HiUndo");
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(fn).toHaveBeenCalled();
  });
  it("help links, footer, Q&A, news", () => {
    render(<><HelpLinks keys={["guide", "intl"]} /><Footer source /><QaList items={[["Q", "A"]]} /><NewsStrip items={[{ url: "https://x", title: "T", date: "2026-01-02", image: "" }]} /></>);
    const hrefs = screen.getAllByRole("link").map(a => a.getAttribute("href"));
    expect(hrefs.slice(0, 2)).toEqual(["#/guide", "#/intl"]);
    expect(link(t("source")).getAttribute("target")).toBe("_blank");
    expect(screen.getByText("Q").closest("details")?.getAttribute("name")).toBe("qa");  // one answer open at a time
    expect(within(link(/^T/)).getByText("2 Jan 2026")).toBeTruthy();
  });
  it("rich text: heading, joined paragraph lines, numbered steps, points, bold, the accent colour", () => {
    const { container } = render(<Rich text={"## H\nA\nB\n\n1. T: x: y\n2. U\n- p\n\nend"} />);
    expect(container.querySelector(".rich")?.getAttribute("style")).toBe("--p: #d41367;");
    expect(screen.getByRole("heading", { name: "H" })).toBeTruthy();
    expect(screen.getByText("A B").tagName).toBe("P");
    const [steps, points] = screen.getAllByRole("list");
    const [s1, s2] = within(steps!).getAllByRole("listitem");
    expect(within(s1!).getByText("T").tagName).toBe("B"); expect(within(s1!).getByText("x: y")).toBeTruthy();
    expect(s2!.textContent).toBe("2U");
    expect(within(points!).getByRole("listitem").textContent).toBe("p");
    expect(screen.getByText("end").tagName).toBe("P");
    cleanup();
    render(<Rich text={"1. Come: to a **Stamm**"} color="#0b5cad" />);
    expect(screen.getByText("Stamm").tagName).toBe("B");
  });
  it("call to action for a guest: town search, near me", () => {
    setSettings({ home: "", also: [] });
    render(<CtaBlock />);
    expect(screen.getByRole("textbox", { name: t("ab_find_ph") })).toBeTruthy();
    expect(screen.getByRole("button", { name: t("ab_find_btn") })).toBeTruthy();
    expect(screen.getByRole("button", { name: "📍 " + t("near_btn") })).toBeTruthy();
  });
  it("call to action with a main club: its name and a link to its next event", () => {
    at("2026-11-10T12:00", () => { setSettings({ home: "luzern", also: [] }); render(<CtaBlock />); });
    expect(screen.getByText(t("your_club"))).toBeTruthy();
    expect(screen.getByText("Rotaract Luzern")).toBeTruthy();
    expect(link(t("go")).getAttribute("href")).toMatch(/^#\/(event|club)\//);
    setSettings({ home: "", also: [] });
  });
  it("popup: rendered into body, title focusable, Done closes", () => {
    const close = vi.fn();
    render(<Popup title="Clubs" onClose={close}><p>x</p></Popup>);
    const dlg = document.body.querySelector<HTMLDialogElement>(":scope > dialog.ob")!;
    dlg.close = () => { fireEvent(dlg, new Event("close")); };  // jsdom has no dialog methods
    const h2 = within(dlg).getByRole("heading", { name: "Clubs", hidden: true });
    expect(h2.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(h2);
    expect(within(dlg).getByText("x")).toBeTruthy();
    fireEvent.click(within(dlg).getByRole("button", { name: t("done"), hidden: true }));
    expect(close).toHaveBeenCalled();
  });
});
