// What is Rotaract?: the morph words with their pictures, the club count, the call to action only without a main club, the help links,
// the questions, and the top-bar share button.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t } from "../i18n";
import { parseHash } from "../lib/route";
import { getData, isRac, loadData, setSettings } from "../lib/data";
import { Toast } from "../components";
import About, { ShareButton } from "./About";

const route = parseHash("#/about");

/** the bits of App around this screen: its top-bar button (ROUTE_META extra) and the toast */
function Host() {
  return (
    <>
      <header><ShareButton /></header>
      <About route={route} />
      <Toast />
    </>
  );
}

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => {
  cleanup();
  setSettings({ ...getData().settings, home: "" });
});

describe("about", () => {
  /** the morph's words, in order; their box carries .on while open (the CSS reveals it) */
  const word = (w: string) => screen.getByText(w).parentElement!;
  const WORDS = ["Learn.", "Help.", "Celebrate."];

  it("draws the morph, the people line, the links, the questions and the footer", () => {
    const { container } = render(<Host />);
    expect(WORDS.map(w => word(w).querySelector("img")!.getAttribute("src"))).toEqual(["img/learn.jpg", "img/help.jpg", "img/party.jpg"]);
    expect(container.querySelectorAll(".prog i")).toHaveLength(3);
    // jsdom has no layout: the track has no scroll range, so the last word is open
    expect(container.querySelector(".words")!.className).toBe("words");
    expect(word("Celebrate.").className).toBe("w on");
    expect(container.querySelector<HTMLElement>(".stage")!.style.getPropertyValue("--p")).toBe("#d41367");
    const n = getData().data.clubs.filter(isRac).length;
    screen.getByText(new RegExp("^" + n + " clubs between"));
    expect(screen.getAllByRole("link").map(a => a.getAttribute("href"))).toEqual(["#/guide", "#/words", "#/intl", "#/about-more", "#/family"]);
    const qa = container.querySelectorAll("details[name=qa]");
    expect(qa).toHaveLength(5);
    expect(within(qa[0] as HTMLElement).getByText("Who can join?").tagName).toBe("SUMMARY");
    screen.getByText(t("made_by"));
    expect(document.body.classList.contains("wash")).toBe(true);
  });

  it("asks a visitor without a main club to find one, and leaves that out for a member", () => {
    const guest = render(<Host />);
    screen.getByText(t("ab_find_title"));
    screen.getByRole("textbox", { name: t("ab_find_ph") });
    guest.unmount();
    setSettings({ ...getData().settings, home: "luzern" });
    render(<Host />);
    expect(screen.queryByText(t("ab_find_title"))).toBeNull();
    expect(screen.queryByText(t("your_club"))).toBeNull();
  });

  it("falls back to an event picture when a pillar picture is missing", () => {
    render(<Host />);
    const img = word("Learn.").querySelector("img")!;
    fireEvent.error(img);
    expect(img.getAttribute("src")).toMatch(/^https:/);
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("shares the about page from the top bar: copies the link and says so without Web Share", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    render(<Host />);
    const btn = screen.getByRole("button", { name: "Share" });
    expect(btn.title).toBe("Share this page");
    await act(async () => { fireEvent.click(btn); });
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/s\/en\/about\.html$/));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("Link copied"));
    vi.unstubAllGlobals();
  });

  it("measures the morph where App is about to scroll, not at the previous screen's scroll position", () => {
    // arrived from a screen scrolled to 2500: the track (4000 px, starting at the top) would read the last word open; App then scrolls to 0
    Object.defineProperty(window, "scrollY", { value: 2500, configurable: true });
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: -2500 } as DOMRect);
    const h = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(4000);
    try {
      const { container } = render(<Host />);
      expect(container.querySelector(".words")!.className).toBe("words closed");
      expect(WORDS.map(w => word(w).className)).toEqual(["w", "w", "w"]);
    } finally {
      rect.mockRestore(); h.mockRestore();
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    }
  });

  it("removes the share button when the screen goes", () => {
    const { unmount } = render(<Host />);
    screen.getByRole("button", { name: "Share" });
    unmount();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });
});
