// events.json fails: map and about-more replace their whole main with the offline message (no Leaflet map left).
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { parseHash } from "../lib/route";
import MapScreen from "./Map";
import AboutMore from "./AboutMore";

beforeAll(() => { vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))); });
afterEach(cleanup);

describe("load error", () => {
  it("map: main holds only the offline message", async () => {
    const { container } = render(<MapScreen route={parseHash("#/map")} />);
    await waitFor(() => expect(container.querySelector("main.mapwrap#main > div.empty")).not.toBeNull());
    expect(container.querySelector("main")!.children.length).toBe(1);
    expect(container.querySelector("main button.linkbtn")).not.toBeNull();
    expect(document.querySelector(".leaflet-container")).toBeNull();
  });

  it("about-more: main holds only the offline message", async () => {
    const { container } = render(<AboutMore route={parseHash("#/about-more")} />);
    await waitFor(() => expect(container.querySelector("main.wrap.more > div.empty")).not.toBeNull());
    expect(container.querySelector("main")!.children.length).toBe(1);
    expect(container.querySelector("main")!.id).toBe("");
  });
});
