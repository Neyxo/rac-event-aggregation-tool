// Calendar help: the one "Add a calendar" button, the common problems (the first asks Yes / No and opens the phone steps or the
// flow), the questions. And the flow it opens (components/Subscribe.tsx), walked per way: which calendar, where, one step per page,
// Done, another one. PHONE / IOS are mocked, so a test can be a computer, an Android phone or an iPhone (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t, tx } from "../i18n";
import { loadData, setSettings } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast } from "../components";
import Subscribe from "./Subscribe";

// the flow reads PHONE / IOS from lib/geo; getters let a test be an iPhone or an Android phone
const ua = vi.hoisted(() => ({ phone: false, ios: false }));
vi.mock("../lib/geo", async orig => ({
  ...await orig<typeof import("../lib/geo")>(),
  get PHONE() { return ua.phone; },
  get IOS() { return ua.ios; },
}));

const writeText = vi.fn(async (_text: string) => {});
beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
  // no navigator.share in jsdom: "Send me the link" copies it
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => {
  cleanup();
  writeText.mockClear();
  ua.phone = false; ua.ios = false;
  setSettings({ home: "", also: [] });
});

const S = tx("sf");
const show = () => render(<><Subscribe route={parseHash("#/subscribe")} /><Toast /></>);
const base = location.href.replace(/[#?].*$/, "").replace(/[^/]*$/, "");
const webcal = (base + "all.ics").replace(/^https?:/, "webcal:");
const gcal = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(t("sp_all_feed"))}`;
/** a card, by its heading */
const card = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("section")!;
const fixes = () => [...document.querySelectorAll<HTMLElement>("details[name=fix]")];

// ---- the open sheet
const dlg = () => within(document.querySelector<HTMLElement>("dialog")!);
const q = (sel: string) => document.querySelector<HTMLElement>("dialog " + sel);
const title = () => dlg().getByRole("heading", { level: 2 }).textContent;
/** the rows to tap (calendars, ways), by their bold title */
const rows = () => [...document.querySelectorAll<HTMLElement>("dialog .way")];
const names = () => rows().map(r => r.querySelector("b")!.textContent);
const pick = (name: string) => fireEvent.click(rows().find(r => r.querySelector("b")!.textContent === name)!);
/** follows a link as far as jsdom can: the click arrives, the navigation (which it doesn't have) is left out */
const tap = (a: HTMLElement) => { a.addEventListener("click", ev => ev.preventDefault()); fireEvent.click(a); };
const btn = (name: string) => fireEvent.click(dlg().getByRole("button", { name }));
/** the step shown: [where it is, its sentence, what its drawing says] */
const step = () => [q(".sfn")?.textContent, q(".sft")?.textContent, q("svg.vis")?.textContent ?? null];
const of = (i: number, n: number) => S.step.replace("{i}", String(i)).replace("{n}", String(n));
/** Home's and the help's start: the sheet on the list, then the all-clubs calendar */
const add = () => {
  show();
  fireEvent.click(within(card(t("sub_title"))).getByRole("button", { name: S.add }));
  pick(t("sp_all_feed"));
};

describe("calendar help", () => {
  it("three cards: one Add a calendar button, the problems, the questions; no how-tos, no feed lists", () => {
    show();
    expect(screen.getAllByRole("heading", { level: 2 }).map(h => h.textContent)).toEqual([t("sub_title"), t("sub_fix_h"), t("faq")]);
    expect(within(card(t("sub_title"))).getAllByRole("button").map(b => b.textContent)).toEqual([S.add]);
    expect(fixes().map(d => d.querySelector("summary")!.textContent)).toEqual(tx("sub_fix").map(f => f.q));
    // only the first asks; the others list every cause, some with something to do about it
    expect(fixes().map(d => d.querySelectorAll(".fixask").length)).toEqual([1, 0, 0, 0, 0]);
    expect(fixes().map(d => d.querySelectorAll(".fixcase").length)).toEqual([0, 3, 3, 1, 1]);
    expect(fixes().map(d => [...d.querySelectorAll(".fixcase button")].map(b => b.textContent))).toEqual([[], [S.show, S.add], [S.add], [], [S.add]]);
    expect(card(t("faq")).querySelectorAll("details[name=qa]")).toHaveLength(3);
    expect(document.querySelectorAll(".feed, h3, ol")).toHaveLength(0);
    screen.getByText(t("made_by"));
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("the first problem asks: Yes shows the phone steps, No adds the calendar again", () => {
    show();
    const fix = within(fixes()[0]!), [yes, no] = tx("sub_fix")[0]!.cases;
    fix.getByText(tx("sub_fix")[0]!.ask);
    fireEvent.click(fix.getByRole("button", { name: t("yes") }));
    fix.getByText(yes![0]);
    expect(fix.queryByText(no![0])).toBeNull();
    fireEvent.click(fix.getByRole("button", { name: S.show }));
    // the phone part alone: which phone, then its steps; a computer starts on Android
    expect(title()).toBe(S.sync_h);
    expect(step()).toEqual([of(1, 5), S.phone_q, null]);
    expect(dlg().getByRole("button", { name: "Android" }).getAttribute("aria-pressed")).toBe("true");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    btn(t("next"));
    expect(step()).toEqual([of(2, 5), S.sync_a[0], "31"]);
    btn(t("back"));
    btn("iPhone");
    expect(q(".sfn")!.textContent).toBe(of(1, 4));
    btn(t("next"));
    expect(dlg().getByRole("link", { name: S.sync_btn }).getAttribute("href")).toBe("https://calendar.google.com/calendar/syncselect");
    dlg().getByText(S.sync_note);
    btn(t("next")); btn(t("next"));
    // the last step: nothing after it, only Close
    expect(step()).toEqual([of(4, 4), S.sync_i[2], S.ui_save]);
    expect(dlg().queryByRole("button", { name: t("next") })).toBeNull();
    btn(t("close"));
    expect(document.querySelector("dialog")).toBeNull();

    fireEvent.click(fix.getByRole("button", { name: t("no") }));
    fix.getByText(no![0]);
    expect(fix.queryByText(yes![0])).toBeNull();
    fireEvent.click(fix.getByRole("button", { name: S.add }));
    expect(title()).toBe(S.pick);
  });

  it("on an iPhone the phone steps open on the iPhone's", () => {
    ua.phone = true; ua.ios = true;
    show();
    fireEvent.click(within(fixes()[1]!).getByRole("button", { name: S.show }));
    expect(dlg().getByRole("button", { name: "iPhone" }).getAttribute("aria-pressed")).toBe("true");
    expect(q(".sfn")!.textContent).toBe(of(1, 4));
  });
});

describe("adding a calendar", () => {
  it("which calendar (my clubs, the international events, all clubs), then where: three rows and the quiet file, no links", () => {
    setSettings({ home: "zuerich", also: ["luzern"] });
    show();
    fireEvent.click(within(card(t("sub_title"))).getByRole("button", { name: S.add }));
    expect(title()).toBe(S.pick);
    expect(names()).toEqual(["Rotaract Zürich", "Rotaract Luzern", "Rotaract International", t("sp_all_feed")]);
    expect(rows()[1]!.querySelector("img")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    pick("Rotaract Luzern");
    expect(title()).toBe(t("way_pick"));
    expect(q(".sfn")!.textContent).toBe("Rotaract Luzern");
    expect(rows().map(r => [r.tagName, r.querySelector("span")!.textContent])).toEqual((["apple", "google", "outlook"] as const).map(w => ["BUTTON", t(`way_${w}`) + t(`way_${w}_s`)]));
    expect(q(".sfquiet")!.textContent).toBe(t("way_ics") + " · " + t("way_ics_s"));
    expect(dlg().queryAllByRole("link")).toEqual([]);
    // nothing to go on with yet: Close is the popup's only button, and Back returns to the list
    expect(q(".nav")!.textContent).toBe(t("close"));
    btn(t("back"));
    expect(title()).toBe(S.pick);
    btn(t("close"));
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("Google on a computer: open (a new tab), confirm, which phone, its sync steps, Done!, and the added calendar is ticked", () => {
    add();
    pick(t("way_google"));
    expect(title()).toBe(t("way_google"));
    expect(step()).toEqual([of(1, 7), S.g_open, null]);
    const open = dlg().getByRole("link", { name: t("way_google") });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([gcal, "_blank"]);
    // with an action the footer is a quiet Close on the left, Next on the right: quiet too beside the step's own button
    const nav = () => [...q(".nav")!.children].map(b => [b.className, b.textContent]);
    expect(nav()).toEqual([["skip", t("close")], ["btn quiet", t("next")]]);
    tap(open);  // the action goes on to the next step
    expect(step()).toEqual([of(2, 7), S.g_confirm, S.ui_add]);
    expect(nav()).toEqual([["skip", t("close")], ["btn", t("next")]]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 7), S.phone_q, null]);
    expect(dlg().getByRole("button", { name: "Android" }).getAttribute("aria-pressed")).toBe("true");
    btn(t("next"));
    expect(step()).toEqual([of(4, 7), S.sync_a[0], "31"]);
    // the iPhone has one step less, the first with Google's sync page
    btn(t("back"));
    btn("iPhone");
    expect(q(".sfn")!.textContent).toBe(of(3, 6));
    btn(t("next"));
    expect(step()).toEqual([of(4, 6), S.sync_i[0], null]);
    expect(dlg().getByRole("link", { name: S.sync_btn }).getAttribute("href")).toBe("https://calendar.google.com/calendar/syncselect");
    btn(t("next"));
    expect(step()).toEqual([of(5, 6), S.sync_i[1], ""]);
    btn(t("next"));
    expect(step()).toEqual([of(6, 6), S.sync_i[2], S.ui_save]);
    expect(dlg().queryByRole("button", { name: t("next") })).toBeNull();
    btn(t("done"));
    expect(title()).toBe(S.done);
    dlg().getByText(S.done_t);
    expect(dlg().getByRole("link", { name: S.trouble }).getAttribute("href")).toBe("#/subscribe");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    pick(S.another);
    expect(title()).toBe(S.pick);
    expect(rows().map(r => r.querySelector(".sfok")?.textContent ?? "")).toEqual(["", "✓"]);
    expect(names().at(-1)).toBe(t("sp_all_feed"));
  });

  it("Android's four sync steps, each with its drawing; Back walks the steps back to the ways", () => {
    add();
    pick(t("way_google"));
    for (let i = 0; i < 3; i++) btn(t("next"));
    const seen = [step()];
    for (let i = 0; i < 3; i++) { btn(t("next")); seen.push(step()); }
    expect(seen).toEqual([[of(4, 7), S.sync_a[0], "31"], [of(5, 7), S.sync_a[1], S.ui_settings], [of(6, 7), S.sync_a[2], "Rotaract …" + S.ui_more], [of(7, 7), S.sync_a[3], S.ui_sync]]);
    dlg().getByRole("button", { name: t("done") });
    for (let i = 0; i < 6; i++) btn(t("back"));
    expect(q(".sft")!.textContent).toBe(S.g_open);
    btn(t("back"));
    expect(title()).toBe(t("way_pick"));
  });

  it("Google on a phone asks how: on this phone copies the link for the browser, then this phone's sync steps", async () => {
    ua.phone = true;
    add();
    pick(t("way_google"));
    expect(title()).toBe(S.how);
    expect(rows().map(r => r.textContent)).toEqual([S.on_phone + S.on_phone_s, S.on_pc + S.on_pc_s]);
    pick(S.on_phone);
    expect(step()).toEqual([of(1, 7), S.g_copy, null]);
    await act(async () => { btn(S.copy_btn); });
    expect(writeText).toHaveBeenCalledWith(gcal);
    expect(screen.getByRole("status").textContent).toBe(t("copied"));
    expect(step()).toEqual([of(2, 7), S.g_paste, "calendar.google.com/…"]);
    btn(t("next"));
    expect(q(".sft")!.textContent).toBe(S.g_confirm);
    // an Android phone: no question, its four steps
    btn(t("next"));
    expect(step()).toEqual([of(4, 7), S.sync_a[0], "31"]);
    expect(dlg().queryByRole("button", { name: "iPhone" })).toBeNull();
    // Back: the steps, then how, then the ways
    for (let i = 0; i < 4; i++) btn(t("back"));
    expect(title()).toBe(S.how);
    btn(t("back"));
    expect(title()).toBe(t("way_pick"));
  });

  it("Google on an iPhone through a computer: send the link, open it there, confirm, the iPhone's sync steps", async () => {
    ua.phone = true; ua.ios = true;
    add();
    pick(t("way_google"));
    pick(S.on_pc);
    expect(step()).toEqual([of(1, 6), S.send, null]);
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(gcal);
    expect(q(".sft")!.textContent).toBe(S.pc);
    btn(t("next"));
    expect(q(".sft")!.textContent).toBe(S.g_confirm);
    btn(t("next"));
    expect(step()).toEqual([of(4, 6), S.sync_i[0], null]);
    dlg().getByRole("link", { name: S.sync_btn });
  });

  it("Apple on an Apple device: the webcal link opens Apple Calendar, then confirm", () => {
    ua.phone = true; ua.ios = true;
    add();
    pick(t("way_apple"));
    expect(step()).toEqual([of(1, 2), S.a_open, null]);
    const open = dlg().getByRole("link", { name: t("way_apple") });
    expect([open.getAttribute("href"), open.hasAttribute("target")]).toEqual([webcal, false]);
    tap(open);
    expect(step()).toEqual([of(2, 2), S.a_confirm, S.ui_sub]);
    btn(t("done"));
    expect(title()).toBe(S.done);
  });

  it("not an Apple device: Apple says so instead of a dead webcal link, and sends the link", async () => {
    add();
    pick(t("way_apple"));
    expect(q(".alertline")!.textContent).toBe(t("apple_na"));
    expect(dlg().queryAllByRole("link")).toEqual([]);
    expect(q(".sfn")).toBeNull();  // a single page: no "Step 1 of 1"
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(base + "all.ics");
    expect(q(".alertline")!.textContent).toBe(t("apple_na"));
  });

  it("Outlook: on a computer open and confirm; on a phone send the link to a computer first", async () => {
    add();
    pick(t("way_outlook"));
    expect(step()).toEqual([of(1, 2), S.o_open, null]);
    const open = dlg().getByRole("link", { name: t("way_outlook") });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([outlook, "_blank"]);
    tap(open);
    expect(step()).toEqual([of(2, 2), S.o_confirm, S.ui_import]);
    cleanup();

    ua.phone = true;
    add();
    pick(t("way_outlook"));
    expect(step()).toEqual([of(1, 3), S.send, null]);
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(outlook);
    expect(q(".sft")!.textContent).toBe(S.o_pc);
    btn(t("next"));
    expect(step()).toEqual([of(3, 3), S.o_confirm, S.ui_import]);
  });

  it("the file first warns that it is a copy that won't update, then downloads, opens, confirms", () => {
    add();
    fireEvent.click(q(".sfquiet")!);
    expect(title()).toBe(t("way_ics"));
    expect(q(".sfn")!.textContent).toBe(of(1, 3));
    expect(q(".alertline")!.textContent).toBe(t("ics_stale_feed"));
    const dl = dlg().getByRole("link", { name: t("ics_dl") });
    expect(dl.getAttribute("href")).toBe(base + "all.ics");
    tap(dl);
    expect(step()).toEqual([of(2, 3), tx("ics_steps")[1], ".ics"]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 3), tx("ics_steps")[2], S.ui_add]);
    btn(t("done"));
    expect(title()).toBe(S.done);
  });
});
