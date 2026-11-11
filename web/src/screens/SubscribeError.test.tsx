// events.json fails: subscribe's main holds only the offline message with its retry button.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { parseHash } from "../lib/route";
import { t } from "../i18n";
import Subscribe from "./Subscribe";

beforeAll(() => { vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))); });
afterEach(cleanup);

describe("Subscribe load error", () => {
  it("main holds only the offline message", async () => {
    render(<Subscribe route={parseHash("#/subscribe")} />);
    await screen.findByText(t("offline"));
    expect(screen.getByRole("main").textContent).toBe(t("offline") + t("refresh"));
    screen.getByRole("button", { name: t("refresh") });
  });
});
