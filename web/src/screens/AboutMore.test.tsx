// Rotary, districts & the world: the three visuals with their lines, the club count, the legend, the two maps, the links below.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { D, isRac, loadData } from "../lib/data";
import AboutMore from "./AboutMore";

const route = parseHash("#/about-more");

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(cleanup);

describe("about-more", () => {
  it("draws the sections in the old order", () => {
    const { container } = render(<AboutMore route={route} />);
    const main = container.querySelector(":scope > main.wrap.more")!;
    expect(main.id).toBe("");  // the old page had no id on this main
    expect([...main.children].map(n => n.tagName + (n.id ? "#" + n.id : "") + "." + n.className)).toEqual(["H1.", "SECTION#rotary.vis", "SECTION.vis map", "SECTION.vis map", "DIV#more.", "DIV#cta.", "DIV#foot."]);
    expect(main.querySelector("h1")?.textContent).toBe("Rotary, districts & the world");
    expect(main.querySelector("#rotary img.bg")?.getAttribute("src")).toBe("img/help.jpg");
    expect(main.querySelector("#rotary .pane img.wheel")?.getAttribute("src")).toBe("rotaract.svg");
    const n = D.data.clubs.filter(isRac).length;
    expect(main.querySelector("[data-t=sp_dist]")?.textContent).toMatch(new RegExp("^" + n + " "));
    expect([...main.querySelectorAll("#leg span")].map(s => s.textContent)).toEqual(["D1980", "D1990", "D2000"]);
    expect([...main.querySelectorAll("#more a.more")].map(a => a.getAttribute("href"))).toEqual(["#/intl", "#/family", "#/guide"]);
    expect(main.querySelector("#cta .cta")).not.toBeNull();
    expect(main.querySelector("#foot footer")).not.toBeNull();
    expect(document.body.classList.contains("wash")).toBe(true);
  });

  it("puts a dot per Rotaract club on the Swiss map and the cities on the world map", async () => {
    const { container } = render(<AboutMore route={route} />);
    const clubs = D.data.clubs.filter(c => c.coords && isRac(c)).length;
    await waitFor(() => expect(container.querySelectorAll("#swiss path.leaflet-interactive").length).toBe(clubs));
    expect(container.querySelectorAll("#world path.leaflet-interactive").length).toBe(30);
    expect(container.querySelector("#swiss .leaflet-control-zoom")).toBeNull();
  });
});
