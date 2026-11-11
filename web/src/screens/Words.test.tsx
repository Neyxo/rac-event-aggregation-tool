// Words draws the old words.html glossary: sorted words, a letter before each new initial, a search that filters as you type.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Words from "./Words";

afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = () => render(<Words route={parseHash("#/words")} />);
const $ = <T extends Element = HTMLElement>(s: string) => document.querySelector(s) as T;
const visible = () => [...document.querySelectorAll<HTMLElement>("#gloss > div:not(.ltr)")].filter(r => !r.hidden).map(r => r.querySelector("dt")!.textContent);
const letters = () => [...document.querySelectorAll<HTMLElement>("#gloss > .ltr")].filter(l => !l.hidden).map(l => l.textContent).join("");

describe("Words", () => {
  it("lists every word sorted, with a letter before each new initial", () => {
    show();
    const words = visible();
    expect(words.length).toBeGreaterThan(40);
    expect(words).toEqual([...words].sort((a, b) => a!.localeCompare(b!, "en-GB")));
    expect(letters().startsWith("ABCD")).toBe(true);
    expect($("#gloss > .ltr").getAttribute("aria-hidden")).toBe("true");
    expect($("#q").getAttribute("placeholder")).toBe("Search a word");
    expect($("#q").getAttribute("aria-label")).toBe("Search a word");
    expect($("#q").hasAttribute("value")).toBe(false);
    expect($("#gloss").hidden).toBe(false);
    expect($("#none").hidden).toBe(true);
    expect(document.body.classList.contains("wash")).toBe(true);
    expect([...document.querySelectorAll("#more a")].map(a => a.getAttribute("href"))).toEqual(["#/guide", "#/family"]);
  });

  it("filters on word and meaning, case and accents folded, and hides the letters meanwhile", () => {
    show();
    fireEvent.change($("#q"), { target: { value: "STÄMM" } });
    expect(visible()).toEqual(["Stamm"]);
    expect(letters()).toBe("");
    fireEvent.change($("#q"), { target: { value: "chicago" } });
    expect(visible()).toEqual(["Paul Harris"]);
  });

  it("says so when nothing matches, and comes back when cleared", () => {
    show();
    fireEvent.change($("#q"), { target: { value: "zzzz" } });
    expect($("#gloss").hidden).toBe(true);
    expect($("#none").hidden).toBe(false);
    expect($("#none").textContent).toBe("No such word here yet.");
    fireEvent.change($("#q"), { target: { value: "  " } });
    expect($("#gloss").hidden).toBe(false);
    expect($("#none").hidden).toBe(true);
    expect(letters().length).toBeGreaterThan(10);
  });
});
