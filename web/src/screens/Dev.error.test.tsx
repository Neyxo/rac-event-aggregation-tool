// events.json fails (offline on a first visit): main holds only the offline message and Retry.
// A file of its own, so events.json was never loaded in this module instance.
import { expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { parseHash } from "../lib/route";
import Dev from "./Dev";

it("shows the offline state in main when events.json fails", async () => {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "status.json" ? { ok: true, json: async () => ({ clubs: {}, failures: [] }) } : { ok: false, status: 500 })));
  render(<Dev route={parseHash("#/dev")} />);
  await act(async () => { await new Promise(res => setTimeout(res, 0)); });
  const main = screen.getByRole("main");
  expect(main.textContent).toMatch(/^Couldn't load events\. Are you online\?Refresh$/);
  expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Developer" })).toBeNull();
  vi.unstubAllGlobals();
});
