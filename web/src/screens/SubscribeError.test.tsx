// events.json fails: subscribe's main holds only the offline message with its retry button, as the old page did.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Subscribe from "./Subscribe";

beforeAll(() => { vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))); });
afterEach(cleanup);

describe("Subscribe load error", () => {
  it("main.wrap#main holds only the offline message", async () => {
    const { container } = render(<Subscribe route={parseHash("#/subscribe")} />);
    await waitFor(() => expect(container.querySelector("main.wrap#main > div.empty")).not.toBeNull());
    expect(container.querySelector("main")!.children.length).toBe(1);
    expect(container.querySelector("main button.linkbtn")).not.toBeNull();
  });
});
