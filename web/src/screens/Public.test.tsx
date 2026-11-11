// Public: know tiles, what it can't show, your data, questions (one open at a time), links, footer with source.
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { t, tx } from "../i18n";
import { parseHash } from "../lib/route";
import Public from "./Public";

afterEach(() => { cleanup(); document.body.className = ""; document.body.removeAttribute("style"); });

const show = () => render(<Public route={parseHash("#/public")} />);
/** a box: its heading (with an icon beside it) and the section around it */
const box = (name: string) => { const h = screen.getByRole("heading", { name }); return { icon: h.parentElement!.querySelector(".ic svg"), section: h.closest("section")! }; };

describe("Public", () => {
  it("draws its sections", () => {
    const { container } = show();
    screen.getByRole("heading", { level: 1, name: "About this app" });
    screen.getByRole("heading", { name: "Good to know" });
    const tiles = [...container.querySelectorAll<HTMLElement>(".ft")];
    expect(tiles.map(n => n.style.getPropertyValue("--p"))).toEqual(["#d41367", "#0067c8", "#009739", "#d41367"]);
    for (const n of [t("pub_h"), t("app_data_h")]) {
      const b = box(n);
      expect(b.icon).not.toBeNull();
      expect(within(b.section).getAllByRole("listitem").length).toBeGreaterThan(2);
    }
    screen.getByRole("heading", { name: "Questions" });
    expect(screen.getByRole("link", { name: new RegExp(t("sub_title")) }).getAttribute("href")).toBe("#/subscribe");
    expect(screen.getByRole("link", { name: t("source") }).getAttribute("href")).toBe("https://github.com/Neyxo/rac-event-aggregation-tool");
    expect(screen.getByRole("link", { name: t("report") }).getAttribute("target")).toBe("_blank");
  });

  it("puts the why-scrape answer first in the questions, all in one accordion", () => {
    const { container } = show();
    const qa = [...container.querySelectorAll("details")];
    expect(qa).toHaveLength(1 + tx("app_qa").length);
    within(qa[0]!).getByText(t("pub_why_h"));
    within(qa[0]!).getByText(t("pub_why"));
    expect(qa.every(d => d.getAttribute("name") === "qa")).toBe(true);
  });
});
