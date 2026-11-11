// The shared components draw the same DOM as common.js did.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { ev } from "../test/ev";
import { getData, loadData, setSettings } from "../lib/data";
import { ClubChip, ClubChips, ClubTiles, CtaBlock, EventCard, NewIds, Footer, HelpLinks, NewsStrip, NextUp, Popup, QaList, Rich, Tabs, TopBar, Toast, toast } from ".";

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => { cleanup(); localStorage.clear(); });

describe("chrome", () => {
  it("top bar: back, brand, Rotaract / info / settings; Dev only in developer mode", () => {
    const { container, rerender } = render(<TopBar active="about" back />);
    const top = container.querySelector("header#top > .wrap.bar")!;
    expect(top.querySelector(".lft > a.hbtn:first-child")?.getAttribute("aria-label")).toBe("‹ Back");
    expect(top.querySelector(".lft > a.hbtn")?.hasAttribute("title")).toBe(false);
    expect(top.querySelector(".brand img")?.getAttribute("src")).toBe("rotaract.svg");
    expect([...top.querySelectorAll(".rgt > a.hbtn")].map(a => [a.getAttribute("href"), a.className])).toEqual([["#/about", "hbtn on"], ["#/public", "hbtn"], ["#/settings", "hbtn"]]);
    act(() => { localStorage.setItem("rac.dev", "true"); window.dispatchEvent(new StorageEvent("storage")); });
    rerender(<TopBar active="dev" />);
    expect(container.querySelector(".rgt > a.hbtn")?.getAttribute("href")).toBe("#/dev");
    expect(container.querySelector(".lft > .hbtn")).toBeNull();
  });
  it("tabs", () => {
    const { container } = render(<Tabs active="calendar" />);
    const tabs = [...container.querySelectorAll("nav#tabs.tabs-bar > a.tab")];
    expect(tabs.map(a => a.getAttribute("href"))).toEqual(["#/", "#/discover", "#/calendar"]);
    expect(tabs[2]!.className).toBe("tab on"); expect(tabs[2]!.getAttribute("aria-current")).toBe("page");
    expect(tabs[0]!.hasAttribute("aria-current")).toBe(false);
  });
});

describe("event card", () => {
  it("draws wash, crest, date pane, meta, chips, status, star", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T12:00"));
    const e = ev({ id: "x", clubs: ["luzern", "nope"], title: "Stamm", start: "2026-11-11T18:00", end: "2026-11-11T21:30", members: true, deadline: "2026-11-11T12:00", image: "p.jpg" });
    const { container } = render(<EventCard e={e} i={20} />);
    vi.useRealTimers();
    const a = container.querySelector("a.event#ev-x")!;
    expect(a.getAttribute("href")).toBe("#/event/x");
    expect(a.getAttribute("style")).toContain("--i: 12");
    expect([...a.children].map(n => n.className)).toEqual(["wm", "date glass", "body", "side"]);
    expect(a.querySelector(".date b")?.textContent).toBe("11");
    expect(a.querySelector(".meta")?.textContent).toBe("Wed 18:00–21:30");
    expect([...a.querySelectorAll(".tags > *")].map(n => n.className)).toEqual(["chip club ", "chip club ", "st ", "st soon"]);
    expect(a.querySelector(".tags a")?.getAttribute("href")).toBe("#/club/luzern");
    expect(a.querySelector(".side .star")?.getAttribute("aria-pressed")).toBe("false");
    expect(a.querySelector(".side img.thumb")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
  it("the star saves and says so; every star of the event follows", () => {
    render(<><EventCard e={ev({ id: "s" })} /><EventCard e={ev({ id: "s" })} /><Toast /></>);
    const [star, twin] = [...document.querySelectorAll(".star")];
    fireEvent.click(star!);
    expect(star!.getAttribute("aria-pressed")).toBe("true");
    expect(twin!.getAttribute("aria-pressed")).toBe("true");
    expect(getData().saved.has("s")).toBe(true);
    expect(document.querySelector("#toast")?.className).toBe("toast show");
    fireEvent.click(twin!);
    expect(star!.getAttribute("aria-pressed")).toBe("false");
  });
});

// The DOM app.css is written against (checked once, element for element, against the el() code of common.js). Screens must not change it.
const kids = (n: Element | null | undefined) => [...(n?.children ?? [])].map(c => c.tagName.toLowerCase() + (c.getAttribute("class") ? "." + c.getAttribute("class")!.trim().split(/\s+/).join(".") : ""));
describe("structure", () => {
  it("event card", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T12:00"));
    const card = <EventCard e={ev({ id: "c", clubs: ["luzern"], cancelled: true, image: "p.jpg", organiser: "RC X", location: "Bern, Hotel" })} i={3} />;
    const { container } = render(<NewIds.Provider value={new Set(["c"])}>{card}</NewIds.Provider>);
    vi.useRealTimers();
    const a = container.querySelector(":scope > a.event.cancelled")!;
    expect(kids(a)).toEqual(["img.wm", "div.date.glass", "div.body", "div.side"]);
    expect(a.querySelector(":scope > img.wm")?.getAttribute("aria-hidden")).toBe("true");
    expect(kids(a.querySelector(".date"))).toEqual(["b", "span"]);
    expect(a.querySelector(".date")?.getAttribute("aria-hidden")).toBe("true");
    expect(kids(a.querySelector(".body"))).toEqual(["h4", "div.meta", "div.tags"]);
    expect(a.querySelector(".meta")?.textContent).toBe("RC X · Sat 18:00–20:00 · Bern");
    expect(kids(a.querySelector(".tags"))).toEqual(["a.chip.club", "span.st.bad", "span.st.new"]);
    expect(kids(a.querySelector(".tags .st.bad"))).toEqual(["i"]);
    expect(kids(a.querySelector(".side"))).toEqual(["button.star", "img.thumb"]);
    expect(a.querySelector(".star")?.getAttribute("aria-label")).toBe("Save event: c");
    expect(a.getAttribute("style")).toMatch(/--c: #0b5cad;.*--on-c: #fff;.*--i: 3/);
  });
  it("top bar and tabs", () => {
    const { container } = render(<><TopBar active="home" back /><Tabs active="home" /></>);
    const bar = container.querySelector(":scope > header#top > div.wrap.bar")!;
    expect(kids(bar)).toEqual(["div.lft", "div.rgt"]);
    expect(kids(bar.querySelector(".lft"))).toEqual(["a.hbtn", "a.brand"]);
    expect(kids(bar.querySelector(".lft > a.hbtn"))).toEqual(["svg"]);
    expect(bar.querySelector(".brand")?.getAttribute("aria-label")).toBe("Rotaract Events");
    expect(kids(bar.querySelector(".rgt"))).toEqual(["a.hbtn", "a.hbtn", "a.hbtn"]);
    for (const b of bar.querySelectorAll(".rgt > a")) { expect(kids(b)).toEqual(["svg", "span"]); expect(b.getAttribute("title")).toBe(b.getAttribute("aria-label")); }
    expect(container.querySelector(":scope > nav#tabs.tabs-bar")?.getAttribute("aria-label")).toBe("Main");
    expect(kids(container.querySelector("#tabs > a.tab.on"))).toEqual(["svg", "span"]);
  });
  it("club chip", () => {
    const { container } = render(<><ClubChip id="luzern" /><ClubChip id="nope" /></>);
    const [a, b] = [...container.querySelectorAll(":scope > a")];
    expect(kids(a)).toEqual(["img"]); expect(a!.textContent).toBe("Luzern"); expect(a!.getAttribute("style")).toBe("--c: #0b5cad; --on-c: #fff;");
    expect(a!.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(kids(b)).toEqual(["span.dot"]); expect(b!.getAttribute("href")).toBe("#/club/nope");
  });
  it("next up", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T12:00"));
    const { container } = render(<NextUp e={ev({ id: "n", start: "2026-11-11T20:00", end: "2026-11-11T22:00", location: "Luzern, X", image: "a.jpg" })} label="L" />);
    vi.useRealTimers();
    const a = container.querySelector(":scope > a.nx.glass")!;
    expect(a.getAttribute("href")).toBe("#/event/n");
    expect(kids(a)).toEqual(["div", "img", "svg.chev"]);
    expect(kids(a.firstElementChild)).toEqual(["div.k", "div.cd", "h4", "div.m"]);
    expect([...a.firstElementChild!.children].map(n => n.textContent)).toEqual(["L", "Tomorrow", "n", "Wed 20:00–22:00 · Luzern"]);
    expect(a.querySelector("img")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });
  it("call to action", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-10T12:00"));
    setSettings({ home: "luzern", also: [] });
    const { container, unmount } = render(<CtaBlock />);
    vi.useRealTimers();
    const c = container.querySelector(":scope > div.cta.glass")!;
    expect(kids(c)).toEqual(["div.k", "div.rc"]);
    expect(kids(c.querySelector(".rc"))).toEqual(["img", "div", "a.go"]);
    expect(kids(c.querySelector(".rc > div"))).toEqual(["b", "span"]);
    unmount(); setSettings({ home: "", also: [] });
    const g = render(<CtaBlock />).container.querySelector(":scope > div.cta.glass.new")!;
    expect(kids(g)).toEqual(["div.k", "div.find", "div.hint", "div.near"]);
    expect(kids(g.querySelector(".find"))).toEqual(["input.in", "button.go"]);
  });
  it("popup", () => {
    render(<Popup title="T" onClose={() => {}}><p>x</p></Popup>);
    const d = document.body.querySelector(":scope > dialog.ob")!;
    expect(kids(d)).toEqual(["div.ob-in"]);
    expect(kids(d.firstElementChild)).toEqual(["h2", "p", "div.nav"]);
    expect(d.querySelector("h2")?.getAttribute("tabindex")).toBe("-1");
    expect(kids(d.querySelector(".nav"))).toEqual(["span", "button.btn"]);
  });
  it("rich text", () => {
    const { container } = render(<Rich text={"## H\nA\nB\n\n1. T: x: y\n2. U\n- p\n\nend"} />);
    const r = container.querySelector(":scope > div.rich")!;
    expect(r.getAttribute("style")).toBe("--p: #d41367;");
    expect(kids(r)).toEqual(["h3", "p", "ol.nsteps", "ul.pts", "p"]);
    expect(r.querySelector("p")?.textContent).toBe("A B");
    expect(kids(r.querySelector("li.step"))).toEqual(["div.ic", "div.tx"]);
    expect(kids(r.querySelector("li.step .tx"))).toEqual(["b", "span"]);
    expect(r.querySelector("li.step .tx span")?.textContent).toBe("x: y");
    expect(kids(r.querySelectorAll("li.step .tx")[1])).toEqual(["b"]);
    expect(kids(r.querySelector("ul.pts li"))).toEqual(["span"]);
  });
  it("club tiles and chips", () => {
    const { container } = render(<><ClubTiles single selected="bern" onPick={() => {}} /><ClubTiles selected={new Set(["bern"])} exclude={["luzern"]} onPick={() => {}} /><ClubChips selected={new Set(["bern"])} only={["bern", "international"]} onPick={() => {}} /></>);
    const [one, many] = [...container.querySelectorAll(":scope > div.tiles")];
    expect(one!.getAttribute("role")).toBe("radiogroup"); expect(many!.getAttribute("role")).toBe("group");
    expect(one!.firstElementChild?.className).toBe("tile none");
    expect(one!.firstElementChild?.getAttribute("aria-checked")).toBe("false");
    expect(kids(one!.firstElementChild)).toEqual(["b"]);
    const bern = one!.querySelector('[aria-checked="true"]')!;
    expect(bern.getAttribute("role")).toBe("radio"); expect(kids(bern)).toEqual(["img", "b", "span"]); expect(bern.querySelector("span")?.textContent).toBe("D" + getData().clubs.bern!.district);
    expect([...one!.querySelectorAll(".tile")].some(b => b.textContent?.includes("International"))).toBe(false);
    expect(many!.querySelector(".tile")?.getAttribute("role")).toBe("checkbox");
    expect([...many!.querySelectorAll(".tile b")].map(b => b.textContent)).not.toContain("Luzern");
    const chips = container.querySelector(":scope > div.chips")!;
    expect(kids(chips)).toEqual(["button.chip.club", "button.chip.club"]);
    expect([...chips.children].map(b => b.getAttribute("aria-pressed"))).toEqual(["true", "false"]);
  });
});

describe("blocks", () => {
  it("toast with an action stays", () => {
    const fn = vi.fn();
    render(<Toast />);
    act(() => toast("Hi", { label: "Undo", fn }));
    fireEvent.click(document.querySelector("#toast button")!);
    expect(fn).toHaveBeenCalled();
  });
  it("club chip with a distance", () => {
    const { container } = render(<ClubChip id="bern" extra="main"><small>3 km</small></ClubChip>);
    const a = container.querySelector("a")!;
    expect(a.className).toBe("chip club main"); expect(a.textContent).toBe("Bern3 km"); expect(a.getAttribute("aria-label")).toBe("Rotaract Bern");
  });
  it("chip picker: single with None, no pseudo-clubs", () => {
    const pick = vi.fn();
    const { container } = render(<ClubChips single selected="bern" onPick={pick} />);
    const bs = [...container.querySelectorAll(".chips > button")];
    expect(bs[0]!.textContent).toBe("None");
    expect(bs.some(b => b.getAttribute("aria-label") === "Rotaract International")).toBe(false);
    expect(bs.find(b => b.getAttribute("aria-pressed") === "true")?.getAttribute("aria-label")).toBe("Rotaract Bern");
    fireEvent.click(bs[0]!); expect(pick).toHaveBeenCalledWith("");
  });
  it("help links, footer, Q&A, news", () => {
    const { container } = render(<><HelpLinks keys={["guide", "intl"]} /><Footer source /><QaList items={[["Q", "A"]]} /><NewsStrip items={[{ url: "https://x", title: "T", date: "2026-01-02", image: "" }]} /></>);
    expect([...container.querySelectorAll("a.more")].map(a => a.getAttribute("href"))).toEqual(["#/guide", "#/intl"]);
    expect(container.querySelector("footer a")?.getAttribute("target")).toBe("_blank");
    expect(container.querySelector("details")?.getAttribute("name")).toBe("qa");
    expect(container.querySelector(".strip.teasers a.nw .t span")?.textContent).toBe("2 Jan 2026");
  });
  it("rich text", () => {
    const { container } = render(<Rich text={"1. Come: to a **Stamm**\n- one"} color="#0b5cad" />);
    expect(container.querySelector(".rich ol.nsteps li.step .tx b")?.textContent).toBe("Come");
    expect(container.querySelector(".rich ol.nsteps li.step .tx span b")?.textContent).toBe("Stamm");
    expect(container.querySelector(".rich ul.pts li span")?.textContent).toBe("one");
  });
  it("call to action for a guest", () => {
    setSettings({ home: "", also: [] });
    const { container } = render(<CtaBlock />);
    expect(container.querySelector(".cta.glass.new .find input.in")).not.toBeNull();
    expect(container.querySelector(".near button.linkbtn")?.textContent).toMatch(/^📍 /);
  });
  it("call to action with a main club", () => {
    setSettings({ home: "bern", also: [] });
    const { container } = render(<CtaBlock />);
    expect(container.querySelector(".cta.glass .rc b")?.textContent).toBe("Rotaract Bern");
    setSettings({ home: "", also: [] });
  });
  it("popup renders into body with title and Done", () => {
    const close = vi.fn();
    render(<Popup title="Clubs" onClose={close}><p>x</p></Popup>);
    const dlg = document.body.querySelector(":scope > dialog.ob > .ob-in")!;
    expect(dlg.querySelector("h2")?.textContent).toBe("Clubs");
    expect(dlg.querySelector(".nav button.btn")?.textContent).toBe("Done");
  });
});
