// The event screen draws site/event.html's DOM for each kind of event, and its buttons do what the old ones did.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { getData, initData, loadData } from "../lib/data";
import { t } from "../i18n";
import { Toast } from "../components";
import Event from "./Event";

const at = (id: string) => render(<><Event route={{ name: "event", params: { id }, query: new URLSearchParams() }} /><Toast /></>);

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => { cleanup(); localStorage.clear(); initData(fixture); });

describe("event screen", () => {
  it("an upcoming Polaris event: card, head, links, facts, more events", () => {
    const { container } = at("219091");
    const main = container.querySelector("main.wrap.evpage#main")!;
    expect(main.getAttribute("style")).toContain("--c:");
    expect(document.title).toBe(fixture.events.find(e => e.id === "219091")!.title + " · Rotaract Events");
    const card = main.querySelector("article.evdetail.glass")!;
    expect([...card.children].map(n => n.tagName.toLowerCase() + "." + n.className)).toEqual(
      expect.arrayContaining(["i.sent", "div.head morph", "div.links", "dl.kv", "p.desc"]));
    const head = card.querySelector(".head")!;
    expect(head.previousElementSibling?.className).toBe("sent");
    expect(head.querySelector("h1")?.textContent).toBe(fixture.events.find(e => e.id === "219091")!.title);
    const go = head.querySelector("a.go")!;
    expect(go.getAttribute("title")).toBe(t("register"));
    expect(go.getAttribute("target")).toBe("_blank");
    const links = card.querySelector(".links")!;
    expect(links.firstElementChild?.className).toBe("ph");
    expect(links.querySelector("a")?.getAttribute("href")).toBe("https://rotaract-zuerich.ch/de/agenda/ical/219091");
    expect(links.querySelector("button.linkbtn")?.textContent).toBe(t("share_event"));
    const dts = [...card.querySelectorAll(".kv dt")].map(n => n.textContent);
    expect(dts).toEqual([t("when"), t("where"), t("deadline_h"), t("registration")]);
    // the deadline was two days ago: the date alone, in red
    const dl = card.querySelectorAll(".kv dd")[2]!;
    expect(dl.className).toBe("soon");
    expect(dl.textContent).not.toContain("·");
    expect(card.querySelector(".kv dd a")?.getAttribute("href")).toMatch(/maps.*query=/);
    expect(main.querySelector("h3.sh")?.textContent).toBe(t("more_events"));
    expect(main.querySelector("a.more")).toBeNull();
    expect(main.lastElementChild?.tagName).toBe("FOOTER");
  });

  it("members-only and past: no calendar link, no deadline, the members note", () => {
    const { container } = at("202042");
    expect(container.querySelector(".links a")).toBeNull();
    expect(container.querySelector(".head a.go")?.getAttribute("title")).toBe(t("open_polaris"));
    expect([...container.querySelectorAll(".head .tags .st")].map(n => n.className)).toEqual(["st "]);
    expect([...container.querySelectorAll("p.desc")].map(n => n.textContent)).toContain(t("members_note"));
  });

  it("cancelled: the status, and the button only opens Polaris", () => {
    const { container } = at("222796");
    expect(container.querySelector(".head .st.bad")?.textContent).toBe(t("cancelled"));
    expect(container.querySelector(".head a.go")?.getAttribute("title")).toBe(t("open_polaris"));
    expect(container.querySelector(".kv")?.textContent).not.toContain(t("deadline_h"));
  });

  it("international, all day over several days: first and last day, no calendar link, the international help link", () => {
    const { container } = at("eu2069");
    expect(container.querySelector(".head a.go")?.getAttribute("title")).toBe(t("register"));
    expect(container.querySelector(".links a")).toBeNull();
    expect(container.querySelector("a.more")?.getAttribute("href")).toBe("#/intl");
    expect(container.querySelector(".kv dd")?.textContent).toMatch(/2027 – .*2027$/);
  });

  it("a Rotary event opens from a shared link with the layer off, without its district", () => {
    const { container } = at("222831");
    expect(container.querySelector("h1")).not.toBeNull();
    expect(container.querySelector(".head .tags a.chip")).toBeNull();
    expect(container.querySelector(".head a.go")?.getAttribute("title")).toBe(t("open_rotary"));
    expect([...container.querySelectorAll("p.desc")].map(n => n.textContent)).toContain(t("rotary_note"));
  });

  it("an unknown id: the empty state", () => {
    const { container } = at("nope");
    const empty = container.querySelector("main > .empty")!;
    expect(empty.textContent).toBe(t("empty") + t("show_all"));
    expect(empty.querySelector("a.linkbtn")?.getAttribute("href")).toBe("#/");
  });

  it("the star saves the event", () => {
    const { container } = at("219091");
    const star = container.querySelector(".head .star")!;
    fireEvent.click(star);
    expect(star.getAttribute("aria-pressed")).toBe("true");
    expect(getData().saved.has("219091")).toBe(true);
    expect(document.querySelector("#toast")?.textContent).toBe(t("saved"));
  });

  it("share: the e/<id>.html page, by the share sheet or copied", async () => {
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const { container, unmount } = at("219091");
    await act(async () => { fireEvent.click(container.querySelector(".links button")!); });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: new URL("e/219091.html", location.href).href }));
    unmount();
    Reflect.deleteProperty(navigator, "share");
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const second = at("219091");
    await act(async () => { fireEvent.click(second.container.querySelector(".links button")!); });
    expect(writeText).toHaveBeenCalledWith(new URL("e/219091.html", location.href).href);
    expect(document.querySelector("#toast")?.textContent).toBe(t("copied"));
  });
});
