// The club screen draws the DOM of the old club.html, with the fixture's clubs (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { D, loadData } from "../lib/data";
import { parseHash } from "../lib/route";
import { Toast } from "../components";
import Club from "./Club";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  // jsdom has no matchMedia (the parallax asks for reduced motion)
  // nor dialog.showModal / close
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) { this.open = true; };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event("close")); };
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q }) as MediaQueryList);
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => { vi.useRealTimers(); });
afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = (id: string) => render(<><Club route={parseHash("#/club/" + id)} /><Toast /></>);

describe("club screen", () => {
  it("luzern: head, colour block buttons, about, news, photos, links", () => {
    const { container } = show("luzern");
    const main = container.querySelector("main.wrap.clubpage#main") as HTMLElement;
    expect(main.style.getPropertyValue("--c")).toBe("#0b5cad");
    expect(document.title).toBe("Rotaract Luzern · Rotaract Events");
    expect(document.body.classList.contains("wash")).toBe(true);
    expect([...main.children].slice(0, 3).map(n => n.className)).toEqual(["sent", "cstick morph", "chero"]);
    const head = main.querySelector(".cstick")!;
    expect(head.querySelector("img.c")?.getAttribute("src")).toBe("crests/luzern.svg");
    expect(head.querySelector("h1")?.textContent).toBe("Rotaract Luzern");
    expect(head.querySelector(".sub")?.textContent).toBe("D1980 · Central & North-West");
    expect(head.querySelector("a.go")?.getAttribute("href")).toBe("#/subscribe");
    const btns = [...main.querySelectorAll(".chero .btns > *")];
    expect(btns.map(b => b.tagName + "." + b.className + " " + (b.getAttribute("aria-label") ?? ""))).toEqual(
      ["SPAN.ph ", "A.btn glass ic Club website", "A.btn glass ic Instagram", "BUTTON.btn glass ic Share"]);
    expect(btns[1]!.getAttribute("target")).toBe("_blank");
    // no upcoming event in the fixture
    expect(main.querySelector("p.meta")?.textContent).toBe("No upcoming public events.");
    const about = main.querySelector("section.aboutc.glass")!;
    expect(about.querySelector(".k")?.textContent).toBe("About this club");
    expect(about.querySelector(".links button")?.textContent).toBe("How to join");
    // the fixture has no sempachersee: that partner stays a plain chip, but a club link, not club.html
    expect([...about.querySelectorAll(".with a.chip.club")].map(a => [a.getAttribute("href"), a.getAttribute("target")])).toEqual([
      ["https://eclubzentralschweiz.rotary1980.ch", "_blank"], ["https://luzern-wasserturm.rotary1980.ch", "_blank"], ["#/club/sempachersee", "_blank"]]);
    // only the news of the last year; the club's own photos
    expect([...main.querySelectorAll("h3.sh")].map(h => h.textContent)).toEqual(["News", "Pictures"]);
    expect(main.querySelectorAll(".strip.teasers a.nw")).toHaveLength(1);
    expect(main.querySelector(".strip.pics a")?.getAttribute("target")).toBe("_blank");
    expect(main.querySelector(".links.center a")?.getAttribute("href")).toBe("#/discover?clubs=luzern");
    expect(main.lastElementChild?.tagName).toBe("FOOTER");
  });

  it("a partner that is a club of this app is its club chip", () => {
    const c = D.clubs.luzern!, before = c.partners;
    c.partners = [{ name: "Bern", url: "club.html?id=bern" }];
    const { container } = show("luzern");
    const chip = container.querySelector(".with a.chip.club")!;
    expect(chip.getAttribute("href")).toBe("#/club/bern");
    expect(chip.getAttribute("aria-label")).toBe("Rotaract Bern");
    expect(chip.hasAttribute("target")).toBe(false);
    c.partners = before;
  });

  it("How to join opens the club's text in a popup; Done closes it", () => {
    const { container } = show("luzern");
    fireEvent.click(container.querySelector(".aboutc .links button")!);
    const dlg = document.querySelector("dialog.ob")!;
    expect(dlg.querySelector("h2")?.textContent).toBe("How to join");
    expect(dlg.querySelector(".rich ol.nsteps li.step")).not.toBeNull();
    fireEvent.click(dlg.querySelector(".nav .btn")!);
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("subscribe opens the calendar choices instead of following the link", () => {
    const { container } = show("luzern");
    const go = container.querySelector(".cstick a.go")!;
    expect(fireEvent.click(go)).toBe(false);  // default prevented
    const dlg = document.querySelector("dialog.ob")!;
    expect(dlg.querySelector("h2")?.textContent).toBe("Subscribe to this club's calendar");
    const links = [...dlg.querySelectorAll(".feeds .feed .l a")].map(a => a.getAttribute("href"));
    expect(links[0]).toMatch(/^webcal:\/\/.*\/luzern\.ics$/);
    expect(links[1]).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/r\?cid=webcal/);
    expect(links[2]).toMatch(/^http:\/\/.*\/luzern\.ics$/);
    expect(dlg.querySelector(".feeds p.meta a")?.getAttribute("href")).toBe("#/subscribe");
  });

  it("share: navigator.share with the club's share page, else the clipboard and a toast", async () => {
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const { container } = show("luzern");
    await act(async () => { fireEvent.click(container.querySelector('.btns button[aria-label="Share"]')!); });
    expect(share).toHaveBeenCalledWith({ title: "Rotaract Luzern", url: new URL("c/luzern.html", location.href).href });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await act(async () => { fireEvent.click(container.querySelector('.btns button[aria-label="Share"]')!); });
    expect(writeText).toHaveBeenCalledWith(new URL("c/luzern.html", location.href).href);
    expect(document.querySelector("#toast")?.textContent).toBe("Link copied");
  });

  it("bern: projects, pictures of its past events when it has no photos of its own", () => {
    const { container } = show("bern");
    expect([...container.querySelectorAll("h3.sh")].map(h => h.textContent)).toEqual(["Projects", "Pictures"]);
    expect(container.querySelector("section.aboutc")).toBeNull();
    const pics = [...container.querySelectorAll(".strip.pics a")];
    expect(pics.map(a => a.getAttribute("href"))).toEqual(["#/event/202811", "#/event/202042"]);
    expect(pics[0]!.hasAttribute("target")).toBe(false);
    expect(pics[0]!.getAttribute("title")).toBe("Winter-GV (1. Generalversammlung)");
    expect(pics[0]!.querySelector("img")?.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("international: next event, the international help link, more events, no district line", () => {
    const { container } = show("international");
    expect(container.querySelector(".cstick .sub")?.textContent).toBe("");
    expect(container.querySelector("a.nx.glass")?.getAttribute("href")).toBe("#/event/eu2069");
    expect(container.querySelector("a.more.glass")?.getAttribute("href")).toBe("#/intl");
    expect([...container.querySelectorAll("h3.sh")].map(h => h.textContent)).toEqual(["More events"]);
    expect([...container.querySelectorAll("a.event")].map(a => a.id)).toEqual(["ev-eu2067"]);
  });

  it("Instagram posts replace the photos strip when the club has them", () => {
    const c = D.clubs.luzern!, before = c.instagram;
    c.instagram = [{ url: "https://instagram.com/p/1", image: "https://x.invalid/1.jpg", caption: "Eins" }];
    try {
      const { container } = show("luzern");
      const a = [...container.querySelectorAll(".strip.pics a")];
      expect(a.map(x => [x.getAttribute("href"), x.getAttribute("target"), x.getAttribute("title")])).toEqual([["https://instagram.com/p/1", "_blank", "Eins"]]);
      expect(a[0]!.querySelector("img")?.getAttribute("alt")).toBe("Eins");
    } finally { c.instagram = before; }
  });

  it("an unknown id lists the clubs", () => {
    const { container } = show("nope");
    const main = container.querySelector("main#main")!;
    expect(main.querySelector("h1")?.textContent).toBe("Clubs");
    expect([...main.querySelectorAll("p > a")].map(a => a.getAttribute("href"))).toEqual(D.data.clubs.map(c => "#/club/" + c.id));
    expect(document.body.classList.contains("wash")).toBe(false);
  });
});
