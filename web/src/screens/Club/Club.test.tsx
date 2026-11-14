// The club screen, with the fixture's clubs (clock: 2026-11-11 10:00).
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../../test/fixture";
import { t, tx } from "../../i18n";
import { getData, initData, loadData } from "../../lib/data";
import { parseHash } from "../../lib/route";
import type { Club as ClubT, EventsJson } from "../../lib/types";
import { Toast } from "../../components";
import Club from "./Club";

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  // jsdom has no matchMedia (the parallax asks for reduced motion)
  // nor dialog.showModal / close
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
  window.matchMedia ??= (q: string) => ({ matches: false, media: q }) as MediaQueryList;
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })),
  );
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => {
  vi.useRealTimers();
});
afterEach(() => {
  cleanup();
  document.body.className = "";
  document.body.removeAttribute("style");
});

/** the fixture with Luzern changed */
const withLuzern = (patch: Partial<ClubT>): EventsJson => ({
  ...fixture,
  clubs: fixture.clubs.map((c) => (c.id === "luzern" ? { ...c, ...patch } : c)),
});
const show = (id: string) =>
  render(
    <>
      <Club route={parseHash("#/club/" + id)} />
      <Toast />
    </>,
  );
const sections = () => screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);
/** the photo strip has no accessible name of its own */
const pics = () => [...document.querySelectorAll<HTMLAnchorElement>(".strip.pics a")];
/** the open popup (a modal dialog; jsdom does not expose its role while open via showModal) */
const dialog = () => within(document.querySelector("dialog")!);

describe("club screen", () => {
  it("luzern: head, colour block buttons, about, news, photos, links", () => {
    show("luzern");
    expect(screen.getByRole("main").style.getPropertyValue("--c")).toBe("#0b5cad");
    expect(document.title).toBe("Rotaract Luzern · Rotaract Events");
    expect(document.body.classList.contains("wash")).toBe(true);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Rotaract Luzern");
    expect(document.querySelector(".cstick img")?.getAttribute("src")).toBe("crests/luzern.svg");
    screen.getByText("D1980 · Central & North-West");
    expect(screen.getByRole("link", { name: "Subscribe" }).getAttribute("href")).toBe("#/subscribe");
    expect(screen.getByRole("link", { name: "Club website" }).getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: "Instagram" }).getAttribute("target")).toBe("_blank");
    screen.getByRole("button", { name: "Share" });
    // no upcoming event in the fixture
    screen.getByText("No upcoming public events.");
    screen.getByText("About this club");
    screen.getByRole("button", { name: "How to join" });
    // the fixture has no sempachersee: that partner stays a plain chip, a link into the app
    const partners = [...document.querySelectorAll(".with a")].map((a) => [
      a.getAttribute("href"),
      a.getAttribute("target"),
    ]);
    expect(partners).toEqual([
      ["https://eclubzentralschweiz.rotary1980.ch", "_blank"],
      ["https://luzern-wasserturm.rotary1980.ch", "_blank"],
      ["#/club/sempachersee", null],
    ]);
    // only the news of the last year; the club's own photos
    expect(sections()).toEqual(["News", "Pictures"]);
    expect(document.querySelectorAll(".strip.teasers a")).toHaveLength(1);
    expect(pics()[0]!.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: "All events of this club in the app" }).getAttribute("href")).toBe(
      "#/discover?clubs=luzern",
    );
  });

  it("a partner that is a club of this app is its club chip", () => {
    initData(withLuzern({ partners: [{ name: "Bern", url: "#/club/bern" }] }));
    try {
      show("luzern");
      const chip = screen.getByRole("link", { name: "Rotaract Bern" });
      expect(chip.getAttribute("href")).toBe("#/club/bern");
      expect(chip.hasAttribute("target")).toBe(false);
    } finally {
      initData(fixture);
    }
  });

  it("How to join opens the club's text in a popup; the x closes it", () => {
    show("luzern");
    fireEvent.click(screen.getByRole("button", { name: "How to join" }));
    dialog().getByRole("heading", { level: 2, name: "How to join" });
    expect(dialog().getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(document.querySelector("dialog .nav")).toBeNull(); // nothing to go on to: no footer
    fireEvent.click(dialog().getByRole("button", { name: t("close") }));
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("subscribe opens the calendar flow for this club instead of following the link: no list first, no way back until one is added", () => {
    show("luzern");
    expect(fireEvent.click(screen.getByRole("link", { name: "Subscribe" }))).toBe(false); // default prevented
    const ways = () => [...document.querySelectorAll("dialog .way")].map((b) => b.querySelector("b")!.textContent);
    const way = (name: string) =>
      fireEvent.click(
        [...document.querySelectorAll("dialog .way")].find((b) => b.querySelector("b")!.textContent === name)!,
      );
    dialog().getByRole("heading", { level: 2, name: t("way_pick") });
    expect(document.querySelector("dialog .sfn")!.textContent).toBe("Rotaract Luzern");
    expect(ways()).toEqual([t("way_apple"), t("way_google"), t("way_outlook")]);
    expect(dialog().queryByRole("button", { name: t("back") })).toBeNull();
    // Outlook on a computer: the link with this club's calendar, confirm, Done!
    way(t("way_outlook"));
    expect(
      dialog()
        .getByRole("link", { name: tx("sf").o_open })
        .getAttribute("href"),
    ).toMatch(
      /^https:\/\/outlook\.live\.com\/calendar\/0\/addfromweb\?url=webcal.*luzern\.ics&name=Rotaract%20Luzern$/,
    );
    fireEvent.click(dialog().getByRole("button", { name: t("next") }));
    fireEvent.click(dialog().getByRole("button", { name: t("done") }));
    dialog().getByRole("heading", { level: 2, name: tx("sf").done });
    // another one: the list, this club first and ticked, then the international events and all clubs; now there is a way back
    way(tx("sf").another);
    expect(ways()).toEqual(["Rotaract Luzern", "Rotaract International", t("sp_all_feed")]);
    expect([...document.querySelectorAll("dialog .way")].map((b) => !!b.querySelector(".sfok"))).toEqual([
      true,
      false,
      false,
    ]);
    way("Rotaract Luzern");
    fireEvent.click(dialog().getByRole("button", { name: t("back") }));
    dialog().getByRole("heading", { level: 2, name: tx("sf").pick });
    fireEvent.click(dialog().getByRole("button", { name: t("close") }));
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("share: navigator.share with the club's share page, else the clipboard and a toast", async () => {
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    show("luzern");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    expect(share).toHaveBeenCalledWith({ title: "Rotaract Luzern", url: new URL("c/luzern.html", location.href).href });
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Share" }));
    });
    expect(writeText).toHaveBeenCalledWith(new URL("c/luzern.html", location.href).href);
    expect(screen.getByRole("status").textContent).toBe("Link copied");
  });

  it("bern: projects, pictures of its past events when it has no photos of its own", () => {
    show("bern");
    expect(sections()).toEqual(["Projects", "Pictures"]);
    expect(screen.queryByText("About this club")).toBeNull();
    expect(pics().map((a) => a.getAttribute("href"))).toEqual(["#/event/202811", "#/event/202042"]);
    expect(pics()[0]!.hasAttribute("target")).toBe(false);
    expect(pics()[0]!.getAttribute("title")).toBe("Winter-GV (1. Generalversammlung)");
    expect(within(pics()[0]!).getByRole("img").getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("international: next event, the international help link, more events, no district line", () => {
    show("international");
    expect(document.querySelector(".cstick .sub")?.textContent).toBe("");
    expect(document.querySelector("a.nx")?.getAttribute("href")).toBe("#/event/eu2069");
    expect(document.querySelector("a.more")?.getAttribute("href")).toBe("#/intl");
    expect(sections()).toEqual(["More events"]);
    expect([...document.querySelectorAll(".event > a.open")].map((a) => a.getAttribute("href"))).toEqual([
      "#/event/eu2067",
    ]);
  });

  it("Instagram posts replace the photos strip when the club has them", () => {
    initData(
      withLuzern({
        instagram: [{ url: "https://instagram.com/p/1", image: "https://x.invalid/1.jpg", caption: "Eins" }],
      }),
    );
    try {
      show("luzern");
      expect(pics().map((x) => [x.getAttribute("href"), x.getAttribute("target"), x.getAttribute("title")])).toEqual([
        ["https://instagram.com/p/1", "_blank", "Eins"],
      ]);
      screen.getByRole("img", { name: "Eins" });
    } finally {
      initData(fixture);
    }
  });

  it("an unknown id lists the clubs", () => {
    show("nope");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Clubs");
    expect(
      within(screen.getByRole("main"))
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual(getData().data.clubs.map((c) => "#/club/" + c.id));
    expect(document.body.classList.contains("wash")).toBe(false);
  });
});
