// What is Rotaract?: the morph words with their pictures, the club count, the call to action only without a main club, the help links,
// the questions, and the top-bar share button.
import { useState, type ReactNode } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { D, isRac, loadData } from "../lib/data";
import { ExtraContext } from "../components/Chrome";
import { Toast } from "../components";
import About from "./About";

const route = parseHash("#/about");

/** the bits of App this screen talks to: the top bar slot and the toast */
function Host() {
  const [extra, setExtra] = useState<ReactNode>(null);
  return (
    <ExtraContext.Provider value={setExtra}>
      <header id="top">{extra}</header>
      <About route={route} />
      <Toast />
    </ExtraContext.Provider>
  );
}

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(() => {
  cleanup();
  D.settings.home = "";
});

describe("about", () => {
  it("draws the morph, the people line, the links, the questions and the footer in the old order", () => {
    const { container } = render(<Host />);
    const main = container.querySelector(":scope > main.wrap.about#main")!;
    expect([...main.querySelector("section.after")!.children].map(n => n.tagName + (n.id ? "#" + n.id : ""))).toEqual(["H2", "P", "DIV#cta", "H3", "DIV#more", "H3", "DIV#qa", "DIV#foot"]);
    expect([...main.querySelectorAll("#words .w .word")].map(w => w.textContent)).toEqual(["Learn.", "Help.", "Celebrate."]);
    expect([...main.querySelectorAll("#words .pic img")].map(i => i.getAttribute("src"))).toEqual(["img/learn.jpg", "img/help.jpg", "img/party.jpg"]);
    expect(main.querySelectorAll("#prog i")).toHaveLength(3);
    // jsdom has no layout: the track has no scroll range, so the last word is open
    expect(main.querySelector("#words")!.className).toBe("words");
    expect(main.querySelector("#words .w:nth-child(3)")!.className).toBe("w on");
    expect(main.querySelector<HTMLElement>("#stage")!.style.getPropertyValue("--p")).toBe("#d41367");
    const n = D.data.clubs.filter(isRac).length;
    expect(main.querySelector("[data-t=ab_people_t]")!.textContent).toMatch(new RegExp("^" + n + " "));
    expect([...main.querySelectorAll("#more a.more")].map(a => a.getAttribute("href"))).toEqual(["#/guide", "#/words", "#/intl", "#/about-more", "#/family"]);
    expect(main.querySelectorAll("#qa details[name=qa]")).toHaveLength(5);
    expect(main.querySelector("#qa summary")!.textContent).toBe("Who can join?");
    expect(main.querySelector("#foot footer")).not.toBeNull();
    expect(document.body.classList.contains("wash")).toBe(true);
  });

  it("asks a visitor without a main club to find one, and leaves that out for a member", () => {
    const guest = render(<Host />);
    expect(guest.container.querySelector("#cta .cta.new")).not.toBeNull();
    guest.unmount();
    D.settings.home = "luzern";
    const member = render(<Host />);
    expect(member.container.querySelector("#cta")!.children).toHaveLength(0);
  });

  it("falls back to an event picture when a pillar picture is missing", () => {
    const { container } = render(<Host />);
    const img = container.querySelector<HTMLImageElement>("#words .pic img")!;
    fireEvent.error(img);
    expect(img.getAttribute("src")).toMatch(/^https:/);
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
  });

  it("shares the about page from the top bar: copies the link and says so without Web Share", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { ...navigator, share: undefined, clipboard: { writeText } });
    const { container } = render(<Host />);
    const btn = container.querySelector<HTMLButtonElement>("#top button.hbtn")!;
    expect(btn.title).toBe("Share this page");
    expect(btn.textContent).toBe("Share");
    await act(async () => { fireEvent.click(btn); });
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/s\/en\/about\.html$/));
    await waitFor(() => expect(container.querySelector("#toast")!.textContent).toBe("Link copied"));
    vi.unstubAllGlobals();
  });

  it("measures the morph where App is about to scroll, not at the previous screen's scroll position", () => {
    // arrived from a screen scrolled to 2500: the track (4000 px, starting at the top) would read the last word open; App then scrolls to 0
    Object.defineProperty(window, "scrollY", { value: 2500, configurable: true });
    const rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: -2500 } as DOMRect);
    const h = vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(4000);
    try {
      const { container } = render(<Host />);
      expect(container.querySelector("#words")!.className).toBe("words closed");
      expect([...container.querySelectorAll("#words .w")].map(w => w.className)).toEqual(["w", "w", "w"]);
    } finally {
      rect.mockRestore(); h.mockRestore();
      Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    }
  });

  it("removes the share button when the screen goes", () => {
    const { container, unmount } = render(<Host />);
    expect(container.querySelector("#top button")).not.toBeNull();
    unmount();
    expect(document.querySelector("#top button")).toBeNull();
  });
});
