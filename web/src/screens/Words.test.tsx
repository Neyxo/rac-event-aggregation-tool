// Words, the glossary: sorted words, a letter before each new initial, a search that filters as you type.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Words from "./Words";

afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = () => render(<Words route={parseHash("#/words")} />);
const search = () => screen.getByRole("searchbox", { name: "Search a word" });
const type = (value: string) => fireEvent.change(search(), { target: { value } });
/** the words shown (hidden ones leave the accessibility tree) */
const visible = () => screen.queryAllByRole("term").map(d => d.textContent);
/** the letter headings shown: decoration, hidden from screen readers, so found by class */
const letterEls = () => [...document.querySelectorAll<HTMLElement>(".gloss .ltr")];
const letters = () => letterEls().filter(l => !l.hidden).map(l => l.textContent).join("");
const none = () => screen.getByText("No such word here yet.");

describe("Words", () => {
  it("lists every word sorted, with a letter before each new initial", () => {
    show();
    const words = visible();
    expect(words.length).toBeGreaterThan(40);
    expect(words).toEqual([...words].sort((a, b) => a!.localeCompare(b!, "en-GB")));
    expect(letters().startsWith("ABCD")).toBe(true);
    expect(letterEls()[0]!.getAttribute("aria-hidden")).toBe("true");
    expect(search().getAttribute("placeholder")).toBe("Search a word");
    expect(search().hasAttribute("value")).toBe(false);
    expect(none().hidden).toBe(true);
    expect(document.body.classList.contains("wash")).toBe(true);
    expect(screen.getAllByRole("link").map(a => a.getAttribute("href"))).toEqual(["#/guide", "#/family"]);
  });

  it("filters on word and meaning, case and accents folded, and hides the letters meanwhile", () => {
    show();
    type("STÄMM");
    expect(visible()).toEqual(["Stamm"]);
    expect(letters()).toBe("");
    type("chicago");
    expect(visible()).toEqual(["Paul Harris"]);
  });

  it("says so when nothing matches, and comes back when cleared", () => {
    const { container } = show();
    type("zzzz");
    expect(container.querySelector<HTMLElement>(".gloss")!.hidden).toBe(true);
    expect(none().hidden).toBe(false);
    type("  ");
    expect(container.querySelector<HTMLElement>(".gloss")!.hidden).toBe(false);
    expect(none().hidden).toBe(true);
    expect(letters().length).toBeGreaterThan(10);
  });
});
