// Rotary, districts & the world: the three visuals with their lines, the club count, the legend, the two maps, the links below.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { fixture } from "../../test/fixture";
import { t } from "../../i18n";
import { parseHash } from "../../lib/route";
import { getData, isRac, loadData } from "../../lib/data";
import AboutMore from "./AboutMore";

const route = parseHash("#/about-more");

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })),
  );
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(cleanup);

describe("about-more", () => {
  it("draws the three visuals with their lines, then the links, the call to action and the footer", () => {
    const { container } = render(<AboutMore route={route} />);
    screen.getByRole("heading", { level: 1, name: "Rotary, districts & the world" });
    expect(container.querySelector(".vis img.bg")?.getAttribute("src")).toBe("img/help.jpg");
    expect(screen.getByAltText("Rotaract").getAttribute("src")).toBe("rotaract.svg");
    screen.getByText(t("sp_rotary"));
    const n = getData().data.clubs.filter(isRac).length;
    screen.getByText(new RegExp("^" + n + " clubs"));
    expect([...container.querySelectorAll(".leg span")].map((s) => s.textContent)).toEqual(["D1980", "D1990", "D2000"]);
    screen.getByText(t("sp_world"));
    expect(screen.getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["#/intl", "#/family", "#/guide"]);
    screen.getByText(t("ab_find_title"));
    screen.getByText(t("made_by"));
    expect(document.body.classList.contains("wash")).toBe(true);
  });

  it("puts a dot per Rotaract club on the Swiss map and the cities on the world map", async () => {
    const { container } = render(<AboutMore route={route} />);
    const [swiss, world] = container.querySelectorAll(".vis.map .bg");
    const clubs = getData().data.clubs.filter((c) => c.coords && isRac(c)).length;
    await waitFor(() => expect(swiss!.querySelectorAll("path.leaflet-interactive").length).toBe(clubs));
    expect(world!.querySelectorAll("path.leaflet-interactive").length).toBe(30);
    expect(swiss!.querySelector(".leaflet-control-zoom")).toBeNull();
  });
});
