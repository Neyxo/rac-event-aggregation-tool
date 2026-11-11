// The Rotary family: the eight tiles with logo or icon, and the Rotaract clubs per district.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { D, isRac, loadData } from "../lib/data";
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
    const main = container.querySelector(":scope > main.wrap.fam#main")!;
    expect([...main.children].map(n => n.tagName + (n.id ? "#" + n.id : ""))).toEqual(["H1", "P", "DIV#tiles", "H2", "DIV#dist", "DIV#foot"]);
    const tiles = [...main.querySelectorAll("#tiles .ft.glass")];
    expect(tiles).toHaveLength(8);
    expect(tiles.map(t => t.firstElementChild!.tagName + "." + t.firstElementChild!.className)).toEqual([...Array(6).fill("IMG.logo"), "DIV.ic", "DIV.ic"]);
    expect(tiles[0]!.querySelector("b")!.textContent).toBe("Rotary");
    expect(main.querySelector("h2.sh.lv1")!.textContent).toBe("The clubs");
    expect([...main.querySelectorAll("#dist > h3.sh")].map(h => h.textContent!.slice(0, 5))).toEqual(["D1980", "D1990", "D2000"]);
    const links = [...main.querySelectorAll("#dist .tiles a.tile")];
    expect(links).toHaveLength(D.data.clubs.filter(c => c.district && isRac(c)).length);
    expect(main.querySelector("#dist a.tile[href='#/club/luzern'] b")!.textContent).toBe("Luzern");
    expect(main.querySelector("#foot footer")).not.toBeNull();
  });

  it("only links logos that exist in web/static (a missing one is a 404 on every visit)", () => {
    const { container } = render(<Family route={route} />);
    const srcs = [...container.querySelectorAll<HTMLImageElement>("#tiles img.logo")].map(i => i.getAttribute("src")!);
    expect(srcs.length).toBeGreaterThan(0);
    const files = Object.keys(import.meta.glob("../../static/**/*.{svg,png}")).map(f => f.replace("../../static/", ""));
    for (const s of srcs) expect(files, s).toContain(s);
  });

  it("shows the icon when a logo fails to load", () => {
    const { container } = render(<Family route={route} />);
    const tile = container.querySelectorAll("#tiles .ft")[3]!;
    fireEvent.error(tile.querySelector("img.logo")!);
    expect(tile.firstElementChild!.className).toBe("ic");
    expect(tile.querySelector(".ic svg")).not.toBeNull();
  });
});
