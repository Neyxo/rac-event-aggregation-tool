// Calendar help: the one "Add a calendar" button, the common problems (the first asks Yes / No and opens the phone steps or the
// flow), the questions. And the flow it opens (components/Subscribe.tsx), walked per way: which calendar, where, one step per page,
// Done, another one. PHONE / IOS are mocked, so a test can be a computer, an Android phone or an iPhone (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t, tx } from "../i18n";
import { getData, loadData, setSettings } from "../lib/data";
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
/** the step shown: [where it is in the row of steps, where it happens, its sentence (none when its button says it)] */
const step = () => [q(".stepper")?.getAttribute("aria-label"), q(".sfctx")?.textContent, q(".sft")?.textContent];
const of = (i: number, n: number) => S.step.replace("{i}", String(i)).replace("{n}", String(n));
/** the step's drawing: what it says, null without one */
const vis = () => q("figure svg")?.textContent ?? null;
/** the popup's footer: the one button that moves on, if any */
const nav = () => [...document.querySelectorAll("dialog .nav button")].map(b => [b.className, b.textContent]);
/** Android: the same page, opened in Chrome instead of the calendar's app */
/** the helper page that opens the address in this browser, past the calendar app */
const go = (u: string) => "go.html#" + encodeURIComponent(u);
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
    expect(step()).toEqual([of(1, 5), undefined, S.phone_q]);
    expect(vis()).toBeNull();
    expect(dlg().getByRole("button", { name: "Android" }).getAttribute("aria-pressed")).toBe("true");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    btn(t("next"));
    expect(step()).toEqual([of(2, 5), S.ctx_phone, S.sync_a[0]]);
    btn(t("back"));
    btn("iPhone");
    expect(step()[0]).toBe(of(1, 4));
    btn(t("next"));
    expect(dlg().getByRole("link", { name: S.sync_btn }).getAttribute("href")).toBe("https://calendar.google.com/calendar/syncselect");
    dlg().getByText(S.sync_note);
    btn(t("next")); btn(t("next"));
    // the last step: nothing after it, so no footer; the x closes
    expect(step()).toEqual([of(4, 4), S.ctx_browser, S.sync_i[2]]);
    expect(vis()).toContain(S.ui_save);
    expect(q(".nav")).toBeNull();
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
    expect(step()[0]).toBe(of(1, 4));
  });
});

describe("adding a calendar", () => {
  it("which calendar (my clubs, the international events, all clubs, another club), then where: three rows and the small file button, no links", () => {
    setSettings({ home: "zuerich", also: ["luzern"] });
    show();
    fireEvent.click(within(card(t("sub_title"))).getByRole("button", { name: S.add }));
    expect(title()).toBe(S.pick);
    expect(names()).toEqual(["Rotaract Zürich", "Rotaract Luzern", "Rotaract International", t("sp_all_feed")]);
    expect(q(".ways")!.lastElementChild).toBe(q(".sfmore"));
    expect(q(".sfmore")!.textContent).toBe(S.other);
    expect(rows()[1]!.querySelector("img")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    pick("Rotaract Luzern");
    expect(title()).toBe(t("way_pick"));
    expect(q(".sfn")!.textContent).toBe("Rotaract Luzern");
    expect(rows().map(r => [r.tagName, r.querySelector("span")!.textContent])).toEqual((["apple", "google", "outlook"] as const).map(w => ["BUTTON", t(`way_${w}`) + t(`way_${w}_s`)]));
    expect([...document.querySelectorAll("dialog .sfmore")].map(b => [b.tagName, b.textContent])).toEqual([["BUTTON", t("way_ics")]]);
    expect(dlg().queryAllByRole("link")).toEqual([]);
    // nothing to go on with yet: no footer; Back returns to the list, the x closes
    expect(q(".nav")).toBeNull();
    btn(t("back"));
    expect(title()).toBe(S.pick);
    btn(t("close"));
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("Another club: every other club by name, Back returns; picking one goes on to where", () => {
    setSettings({ home: "zuerich", also: ["luzern"] });
    show();
    fireEvent.click(within(card(t("sub_title"))).getByRole("button", { name: S.add }));
    const shown = names();
    btn(S.other);
    expect(title()).toBe(S.other);
    const others = getData().data.clubs.map(c => c.name).filter(n => !shown.includes(n)).sort((a, b) => a.localeCompare(b));
    expect(others).toContain("Rotaract Bern");
    expect(names()).toEqual(others);
    expect(q(".sfmore")).toBeNull();
    expect(q(".nav")).toBeNull();
    btn(t("back"));
    expect(title()).toBe(S.pick);
    expect(names()).toEqual(shown);
    btn(S.other);
    pick("Rotaract Bern");
    expect(title()).toBe(t("way_pick"));
    expect(q(".sfn")!.textContent).toBe("Rotaract Bern");
    pick(t("way_outlook"));
    expect(dlg().getByRole("link", { name: S.o_open }).getAttribute("href")).toMatch(/bern\.ics&name=Rotaract%20Bern$/);
    // Back from where: the list it was picked from
    btn(t("back")); btn(t("back"));
    expect(title()).toBe(S.other);
  });

  it("Google on a computer: open (a new tab), confirm, which phone, its sync steps, Done!, and the added calendar is ticked", () => {
    add();
    pick(t("way_google"));
    expect(title()).toBe(t("way_google"));
    // a step that is just a button: the button is the instruction, no sentence, no drawing
    expect(step()).toEqual([of(1, 7), undefined, undefined]);
    expect(vis()).toBeNull();
    const open = dlg().getByRole("link", { name: S.g_open });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([gcal, "_blank"]);
    // the footer holds only Next: quiet beside the step's own button
    expect(nav()).toEqual([["btn quiet", t("next")]]);
    tap(open);  // the action goes on to the next step
    expect(step()).toEqual([of(2, 7), S.ctx_browser, S.g_confirm]);
    expect(vis()).toContain(S.ui_add);
    expect(nav()).toEqual([["btn", t("next")]]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 7), undefined, S.phone_q]);
    expect(dlg().getByRole("button", { name: "Android" }).getAttribute("aria-pressed")).toBe("true");
    btn(t("next"));
    expect(step()).toEqual([of(4, 7), S.ctx_phone, S.sync_a[0]]);
    // the iPhone has one step less, the first with Google's sync page
    btn(t("back"));
    btn("iPhone");
    expect(step()[0]).toBe(of(3, 6));
    btn(t("next"));
    expect(step()).toEqual([of(4, 6), undefined, S.sync_i[0]]);
    expect(dlg().getByRole("link", { name: S.sync_btn }).getAttribute("href")).toBe("https://calendar.google.com/calendar/syncselect");
    btn(t("next"));
    expect(step()).toEqual([of(5, 6), S.ctx_browser, S.sync_i[1]]);
    btn(t("next"));
    expect(step()).toEqual([of(6, 6), S.ctx_browser, S.sync_i[2]]);
    expect(vis()).toContain(S.ui_save);
    expect(nav()).toEqual([["btn", t("done")]]);
    btn(t("done"));
    expect(title()).toBe(S.done);
    dlg().getByText(S.done_t);
    // nothing to go on to
    expect([vis(), q(".stepper"), q(".nav")]).toEqual(["", null, null]);
    expect(dlg().getByRole("link", { name: S.trouble }).getAttribute("href")).toBe("#/subscribe");
    expect(dlg().queryByRole("button", { name: t("back") })).toBeNull();
    pick(S.another);
    expect(title()).toBe(S.pick);
    expect(rows().map(r => r.querySelector(".sfok")?.textContent ?? "")).toEqual(["", "✓"]);
    expect(names().at(-1)).toBe(t("sp_all_feed"));
  });

  it("the row of steps: one per step, the past ones ticked, the current one marked, named \"Step i of n\"", () => {
    add();
    pick(t("way_google"));
    const lis = () => [...document.querySelectorAll("dialog ol.stepper li")].map(li => [li.className, li.textContent, li.getAttribute("aria-current")]);
    expect(lis()).toEqual([["now", "1", "step"], ...[2, 3, 4, 5, 6, 7].map(k => ["", String(k), null])]);
    btn(t("next")); btn(t("next"));
    expect(q("ol.stepper")!.getAttribute("aria-label")).toBe(of(3, 7));
    expect(lis()).toEqual([["past", "✓", null], ["past", "✓", null], ["now", "3", "step"], ...[4, 5, 6, 7].map(k => ["", String(k), null])]);
    expect(dlg().queryByText(of(3, 7))).toBeNull();  // not also as text
    btn(t("back"));
    expect(lis().map(l => l[0])).toEqual(["past", "now", "", "", "", "", ""]);
  });

  it("Android's four sync steps, each where it happens and with its drawing; Back walks the steps back to the ways", () => {
    add();
    pick(t("way_google"));
    for (let i = 0; i < 3; i++) btn(t("next"));
    const seen = [step()];
    for (let i = 0; i < 3; i++) { btn(t("next")); seen.push(step()); }
    expect(seen).toEqual([[of(4, 7), S.ctx_phone, S.sync_a[0]], [of(5, 7), S.ctx_gcal, S.sync_a[1]], [of(6, 7), S.ctx_gcal, S.sync_a[2]], [of(7, 7), S.ctx_gcal, S.sync_a[3]]]);
    expect(vis()).toContain(S.ui_sync);
    dlg().getByRole("button", { name: t("done") });
    for (let i = 0; i < 6; i++) btn(t("back"));
    dlg().getByRole("link", { name: S.g_open });
    btn(t("back"));
    expect(title()).toBe(t("way_pick"));
  });

  it("Google on an Android phone asks how: on this phone opens the page in this browser (or copies the link), confirm, then this phone's sync steps", async () => {
    ua.phone = true;
    add();
    pick(t("way_google"));
    expect(title()).toBe(S.how);
    expect(rows().map(r => r.textContent)).toEqual([S.on_phone + S.on_phone_s, S.on_pc + S.on_pc_s]);
    pick(S.on_phone);
    expect(step()).toEqual([of(1, 6), undefined, undefined]);
    // not the plain link, which the Google Calendar app would take: the helper page, in a new tab
    const open = dlg().getByRole("link", { name: S.g_open });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([go(gcal), "_blank"]);
    tap(open);
    expect(step()).toEqual([of(2, 6), S.ctx_browser, S.g_confirm]);
    // the quiet second way: the plain link, copied, and on
    btn(t("back"));
    expect(q(".sfmore")!.textContent).toBe(S.copy_alt);
    await act(async () => { btn(S.copy_alt); });
    expect(writeText).toHaveBeenCalledWith(gcal);
    expect(screen.getByRole("status").textContent).toBe(t("copied"));
    expect(step()).toEqual([of(2, 6), S.ctx_browser, S.g_confirm]);
    expect(vis()).toContain(S.ui_add);
    dlg().getByText(S.g_desktop);  // the phone's Google page may hide the button
    // an Android phone: no question, its four steps
    btn(t("next"));
    expect(step()).toEqual([of(3, 6), S.ctx_phone, S.sync_a[0]]);
    expect(dlg().queryByRole("button", { name: "iPhone" })).toBeNull();
    // Back: the steps, then how, then the ways
    for (let i = 0; i < 3; i++) btn(t("back"));
    expect(title()).toBe(S.how);
    btn(t("back"));
    expect(title()).toBe(t("way_pick"));
  });

  it("Google on an iPhone, on this phone: the same helper page, confirm, the iPhone's sync steps", async () => {
    ua.phone = true; ua.ios = true;
    add();
    pick(t("way_google"));
    pick(S.on_phone);
    expect(step()).toEqual([of(1, 5), undefined, undefined]);
    expect(dlg().getByRole("link", { name: S.g_open }).getAttribute("href")).toBe(go(gcal));
    await act(async () => { btn(S.copy_alt); });
    expect(writeText).toHaveBeenCalledWith(gcal);
    expect(screen.getByRole("status").textContent).toBe(t("copied"));
    expect(step()).toEqual([of(2, 5), S.ctx_browser, S.g_confirm]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 5), undefined, S.sync_i[0]]);
    dlg().getByRole("link", { name: S.sync_btn });
  });

  it("Google on an iPhone through a computer: send the link, open it there, confirm, the iPhone's sync steps", async () => {
    ua.phone = true; ua.ios = true;
    add();
    pick(t("way_google"));
    pick(S.on_pc);
    expect(step()).toEqual([of(1, 6), undefined, undefined]);
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(gcal);
    expect(step()).toEqual([of(2, 6), S.ctx_pc, S.pc]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 6), S.ctx_pc, S.g_confirm]);
    btn(t("next"));
    expect(step()).toEqual([of(4, 6), undefined, S.sync_i[0]]);
    dlg().getByRole("link", { name: S.sync_btn });
  });

  it("Apple on an Apple device: the webcal link opens Apple Calendar, then confirm", () => {
    ua.phone = true; ua.ios = true;
    add();
    pick(t("way_apple"));
    expect(step()).toEqual([of(1, 2), undefined, undefined]);
    const open = dlg().getByRole("link", { name: S.a_open });
    expect([open.getAttribute("href"), open.hasAttribute("target")]).toEqual([webcal, false]);
    tap(open);
    expect(step()).toEqual([of(2, 2), undefined, S.a_confirm]);
    expect(vis()).toContain(S.ui_sub);
    btn(t("done"));
    expect(title()).toBe(S.done);
  });

  it("not an Apple device: Apple says so instead of a dead webcal link, and sends the link", async () => {
    add();
    pick(t("way_apple"));
    expect(q(".alertline")!.textContent).toBe(t("apple_na"));
    expect(dlg().queryAllByRole("link")).toEqual([]);
    expect(q(".stepper")).toBeNull();  // a single page: no row of steps
    expect(q(".nav")).toBeNull();  // nothing was added: no Done
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(base + "all.ics");
    expect(q(".alertline")!.textContent).toBe(t("apple_na"));
  });

  it("Outlook on a computer: open and confirm", () => {
    add();
    pick(t("way_outlook"));
    expect(step()).toEqual([of(1, 2), undefined, undefined]);
    const open = dlg().getByRole("link", { name: S.o_open });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([outlook, "_blank"]);
    tap(open);
    expect(step()).toEqual([of(2, 2), S.ctx_browser, S.o_confirm]);
    expect(vis()).toContain(S.ui_import);
  });

  it("Outlook on a phone asks how too; on this phone: the helper page (or the copied link) on Android and iPhone alike; no sync steps", async () => {
    ua.phone = true;
    add();
    pick(t("way_outlook"));
    expect(title()).toBe(S.how);
    expect(names()).toEqual([S.on_phone, S.on_pc]);
    pick(S.on_phone);
    expect(step()).toEqual([of(1, 2), undefined, undefined]);
    const open = dlg().getByRole("link", { name: S.o_open });
    expect([open.getAttribute("href"), open.getAttribute("target")]).toEqual([go(outlook), "_blank"]);
    await act(async () => { btn(S.copy_alt); });
    expect(writeText).toHaveBeenCalledWith(outlook);
    expect(step()).toEqual([of(2, 2), S.ctx_browser, S.o_confirm]);
    btn(t("back"));
    tap(dlg().getByRole("link", { name: S.o_open }));
    expect(step()).toEqual([of(2, 2), S.ctx_browser, S.o_confirm]);
    btn(t("done"));
    expect(title()).toBe(S.done);
    cleanup();
    writeText.mockClear();

    ua.ios = true;
    add();
    pick(t("way_outlook"));
    pick(S.on_phone);
    expect(step()).toEqual([of(1, 2), undefined, undefined]);
    expect(dlg().getByRole("link", { name: S.o_open }).getAttribute("href")).toBe(go(outlook));
    await act(async () => { btn(S.copy_alt); });
    expect(writeText).toHaveBeenCalledWith(outlook);
    expect(step()).toEqual([of(2, 2), S.ctx_browser, S.o_confirm]);
    dlg().getByRole("button", { name: t("done") });
  });

  it("Outlook on a phone, on a computer: send the link, open it there and sign in, confirm", async () => {
    ua.phone = true;
    add();
    pick(t("way_outlook"));
    pick(S.on_pc);
    expect(step()).toEqual([of(1, 3), undefined, undefined]);
    await act(async () => { btn(t("sp_g_send")); });
    expect(writeText).toHaveBeenCalledWith(outlook);
    expect(step()).toEqual([of(2, 3), S.ctx_pc, S.o_pc]);
    btn(t("next"));
    expect(step()).toEqual([of(3, 3), S.ctx_pc, S.o_confirm]);
    expect(vis()).toContain(S.ui_import);
    // Back: the steps, then how
    btn(t("back")); btn(t("back")); btn(t("back"));
    expect(title()).toBe(S.how);
  });

  it("the file first warns that it is a copy that won't update, then downloads, opens, confirms", () => {
    add();
    btn(t("way_ics"));
    expect(title()).toBe(t("way_ics"));
    expect(step()).toEqual([of(1, 3), undefined, undefined]);
    expect(q(".alertline")!.textContent).toBe(t("ics_stale_feed"));
    const dl = dlg().getByRole("link", { name: t("ics_dl") });
    expect(dl.getAttribute("href")).toBe(base + "all.ics");
    tap(dl);
    expect(step()).toEqual([of(2, 3), undefined, tx("ics_steps")[1]]);
    expect(vis()).toBe(".ics");
    btn(t("next"));
    expect(step()).toEqual([of(3, 3), undefined, tx("ics_steps")[2]]);
    expect(vis()).toContain(S.ui_add);
    btn(t("done"));
    expect(title()).toBe(S.done);
  });
});
