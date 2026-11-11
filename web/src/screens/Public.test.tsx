// Public: know tiles, what it can't show, your data, questions (one open at a time), links, footer with source.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { t, tx } from "../i18n";
import { parseHash } from "../lib/route";
import Public from "./Public";

afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = () => render(<Public route={parseHash("#/public")} />);
const all = (s: string) => [...document.querySelectorAll<HTMLElement>(s)];

describe("Public", () => {
  it("draws its sections", () => {
    show();
    expect(all("main.wrap.fam > h1")[0]!.textContent).toBe("About this app");
    expect(all("#know > .ft.glass")).toHaveLength(4);
    expect(all("#know .ft").map(n => n.style.getPropertyValue("--p"))).toEqual(["#d41367", "#0067c8", "#009739", "#d41367"]);
    expect(all("#pubH > .ic > svg, #dataH > .ic > svg")).toHaveLength(2);
    expect(all("#no > li").length).toBeGreaterThan(2);
    expect(all("#data > li").length).toBeGreaterThan(2);
    expect(all("h2.sh.lv1").map(h => h.textContent)).toEqual(["Good to know", "Questions"]);
    expect(all("#more > a.more")[0]!.getAttribute("href")).toBe("#/subscribe");
    expect(all("#foot footer a")[0]!.getAttribute("href")).toBe("https://github.com/Neyxo/rac-event-aggregation-tool");
    expect(all("p.fine a")[0]!.getAttribute("target")).toBe("_blank");
  });

  it("puts the why-scrape answer first in the questions, all in one accordion", () => {
    show();
    const qa = all("#qa > details");
    expect(qa).toHaveLength(1 + tx("app_qa").length);
    expect(qa[0]!.querySelector("summary")!.textContent).toBe(t("pub_why_h"));
    expect(qa[0]!.querySelector("p")!.textContent).toBe(t("pub_why"));
    expect(qa.every(d => d.getAttribute("name") === "qa")).toBe(true);
  });
});
