// The Rotary family: the eight tiles with logo or icon, and the Rotaract clubs per district.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { t } from "../i18n";
import { parseHash } from "../lib/route";
import { getData, isRac, loadData } from "../lib/data";
import Family from "./Family";

const route = parseHash("#/family");

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(cleanup);

describe("family", () => {
  it("draws the tiles, then a heading and the club tiles per district", () => {
    const { container } = render(<Family route={route} />);
    screen.getByRole("heading", { level: 1, name: t("fam_h") });
    screen.getByText(t("fam_lead"));
    // a tile shows the logo where there is one, else the icon
    const tiles = [...container.querySelectorAll(".ft")];
    expect(tiles).toHaveLength(8);
    expect(tiles.map(n => n.firstElementChild!.className)).toEqual([...Array(6).fill("logo"), "ic", "ic"]);
    within(tiles[0] as HTMLElement).getByText("Rotary");
    screen.getByRole("heading", { level: 2, name: "The clubs" });
    expect(screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent!.slice(0, 5))).toEqual(["D1980", "D1990", "D2000"]);
    const links = screen.getAllByRole("link").filter(a => a.getAttribute("href")!.startsWith("#/club/"));
    expect(links).toHaveLength(getData().data.clubs.filter(c => c.district && isRac(c)).length);
    within(links.find(a => a.getAttribute("href") === "#/club/luzern")!).getByText("Luzern");
    screen.getByText(t("made_by"));
  });

  it("only links logos that exist in web/static (a missing one is a 404 on every visit)", () => {
    const { container } = render(<Family route={route} />);
    const srcs = [...container.querySelectorAll<HTMLImageElement>(".ft img.logo")].map(i => i.getAttribute("src")!);
    expect(srcs.length).toBeGreaterThan(0);
    const files = Object.keys(import.meta.glob("../../static/**/*.{svg,png}")).map(f => f.replace("../../static/", ""));
    for (const s of srcs) expect(files, s).toContain(s);
  });

  it("shows the icon when a logo fails to load", () => {
    const { container } = render(<Family route={route} />);
    const tile = container.querySelectorAll(".ft")[3]!;
    fireEvent.error(tile.querySelector("img.logo")!);
    expect(tile.querySelector("img")).toBeNull();
    expect(tile.querySelector(".ic svg")).not.toBeNull();
  });
});
