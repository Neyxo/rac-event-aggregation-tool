// The map screen: markers for upcoming events with coordinates, the "past" switch, the count, the popup link.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { fixture } from "../test/fixture";
import { parseHash } from "../lib/route";
import { getData, loadData } from "../lib/data";
import { isPast } from "../lib/dates";
import { nEvents } from "../i18n";
import MapScreen from "./Map";

const route = parseHash("#/map");

beforeAll(async () => {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })));
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(cleanup);

describe("map", () => {
  it("draws the old DOM: map box, then the past switch with the count", async () => {
    const { container } = render(<MapScreen route={route} />);
    const main = container.querySelector(":scope > main.mapwrap#main")!;
    expect([...main.children].map(n => n.tagName + "#" + n.id)).toEqual(["DIV#map", "LABEL#"]);
    expect(main.querySelector("#map")?.classList.contains("leaflet-container")).toBe(true);
    expect(main.querySelector("label")?.className).toBe("icon-btn mapopt");
    const label = main.querySelector("label")!;
    expect(label.querySelector("input#past[type=checkbox]")).not.toBeNull();
    expect(label.querySelector("input#past + span")?.textContent).toBe("Past");
    const upcoming = getData().data.events.filter(e => e.coords && !isPast(e)).length;
    await waitFor(() => expect(label.querySelector("#summary")?.textContent).toBe(nEvents(upcoming)));
    expect(label.textContent).toBe(" Past · " + nEvents(upcoming));
    expect(main.querySelectorAll(".mapdot").length).toBe(upcoming);
  });

  it("past shows every event with coordinates; markers carry the club colour and the popup links to the event", async () => {
    const { container } = render(<MapScreen route={route} />);
    const all = getData().data.events.filter(e => e.coords);
    act(() => { fireEvent.click(container.querySelector("#past")!); });
    await waitFor(() => expect(container.querySelector("#summary")?.textContent).toBe(nEvents(all.length)));
    expect(container.querySelectorAll(".mapdot").length).toBe(all.length);
    const dot = container.querySelector<HTMLElement>(".mapdot")!;
    const e = all.find(x => x.title === dot.title)!;
    expect(dot.querySelector("span")?.getAttribute("style")).toMatch(/^--c:#[0-9a-f]{6};--on-c:(#fff|#1f1c26)$/);
    act(() => { fireEvent.click(dot); });
    const pop = container.querySelector(".leaflet-popup-content a.mappop")!;
    expect(pop.getAttribute("href")).toBe("#/event/" + e.id);
    expect(pop.querySelector("b")?.textContent).toBe(e.title);
  });

  it("past is kept in the history entry, so back/forward restores it (the old page's restored checkbox)", async () => {
    history.replaceState({ k: 7 }, "");
    const first = render(<MapScreen route={route} />);
    act(() => { fireEvent.click(first.container.querySelector("#past")!); });
    expect(history.state).toEqual({ k: 7, past: true });
    first.unmount();
    const { container } = render(<MapScreen route={route} />);  // remounted on the same entry, as after "back"
    expect(container.querySelector<HTMLInputElement>("#past")!.checked).toBe(true);
    await waitFor(() => expect(container.querySelector("#summary")?.textContent).toBe(nEvents(getData().data.events.filter(e => e.coords).length)));
    history.replaceState(null, "");
  });
});
