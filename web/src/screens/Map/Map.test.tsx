// The map screen: markers for upcoming events with coordinates, the "past" switch, the count, the popup link, the bunker Easter egg.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { fixture } from "../../test/fixture";
import { parseHash } from "../../lib/route";
import { getData, loadData } from "../../lib/data";
import { isPast } from "../../lib/dates";
import { nEvents } from "../../i18n";
import MapScreen, { archive } from "./Map";

const route = parseHash("#/map");

beforeAll(async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })),
  );
  await loadData();
  vi.unstubAllGlobals();
});
afterEach(cleanup);

const past = () => screen.getByRole<HTMLInputElement>("checkbox", { name: /^Past/ });
const withCoords = () => getData().data.events.filter((e) => e.coords);

describe("map", () => {
  it("draws the map, then the past switch with the count of upcoming events", async () => {
    const { container } = render(<MapScreen route={route} />);
    expect(container.querySelector(".leaflet-container")).not.toBeNull();
    expect(past().checked).toBe(false);
    const upcoming = withCoords().filter((e) => !isPast(e)).length;
    await waitFor(() => expect(past().labels![0]!.textContent).toBe(" Past · " + nEvents(upcoming)));
    expect(container.querySelectorAll(".mapdot").length).toBe(upcoming);
  });

  it("past shows every event with coordinates; markers carry the club colour and the popup links to the event", async () => {
    const { container } = render(<MapScreen route={route} />);
    const all = withCoords();
    act(() => {
      fireEvent.click(past());
    });
    await waitFor(() => expect(screen.getByText(nEvents(all.length))).toBeTruthy());
    expect(container.querySelectorAll(".mapdot").length).toBe(all.length);
    const dot = container.querySelector<HTMLElement>(".mapdot")!;
    const e = all.find((x) => x.title === dot.title)!;
    expect(dot.querySelector("span")?.getAttribute("style")).toMatch(/^--c:#[0-9a-f]{6};--on-c:(#fff|#1f1c26)$/);
    act(() => {
      fireEvent.click(dot);
    });
    const pop = screen.getByRole("link", { name: new RegExp("^" + e.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) });
    expect(pop.getAttribute("href")).toBe("#/event/" + e.id);
  });

  it("past is kept in the history entry, so back/forward restores it", async () => {
    history.replaceState({ k: 7 }, "");
    const first = render(<MapScreen route={route} />);
    act(() => {
      fireEvent.click(past());
    });
    expect(history.state).toEqual({ k: 7, past: true });
    first.unmount();
    render(<MapScreen route={route} />); // remounted on the same entry, as after "back"
    expect(past().checked).toBe(true);
    await waitFor(() => expect(screen.getByText(nEvents(withCoords().length))).toBeTruthy());
    history.replaceState(null, "");
  });

  it("the bunker only shows once zoomed in; its door opens the archive of past events, newest first, each linking to its event", () => {
    const first = render(<MapScreen route={route} />);
    expect(first.container.querySelector(".mapbunker")).toBeNull();
    expect(document.querySelector("dialog.bunker")).toBeNull();
    first.unmount();
    // #/map?bunker starts zoomed in at the Gotthard with the archive open; close it (jsdom has no dialog.close(), so by its event) and open it again through the door
    const { container } = render(<MapScreen route={parseHash("#/map?bunker")} />);
    act(() => {
      document.querySelector("dialog.bunker")?.dispatchEvent(new Event("close"));
    });
    expect(document.querySelector("dialog.bunker")).toBeNull();
    act(() => {
      fireEvent.click(container.querySelector(".mapbunker")!);
    });
    const files = archive(getData().data.events);
    expect(files.length).toBeGreaterThan(1);
    expect(files.every(isPast)).toBe(true);
    expect(files[0]!.start >= files[1]!.start).toBe(true);
    const links = [...document.querySelectorAll<HTMLAnchorElement>("dialog.bunker a.event")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual(files.slice(0, 30).map((e) => "#/event/" + e.id));
    expect(document.querySelector("dialog.bunker p")!.textContent).toContain(String(files.length));
  });
});
