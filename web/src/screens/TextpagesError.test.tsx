// events.json fails: guide and intl replace their whole main with the offline message. The guide still counts as
// seen and keeps its title but gets no wash; intl keeps its wash.
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { parseHash } from "../lib/route";
import { t } from "../i18n";
import { store } from "../lib/store";
import Guide from "./Guide";
import Intl from "./Intl";

beforeAll(() => { vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }))); });
afterEach(() => { cleanup(); localStorage.clear(); document.body.className = ""; document.body.removeAttribute("style"); });

const onlyOffline = async () => {
  await screen.findByText(t("offline"));
  expect(screen.getByRole("main").textContent).toBe(t("offline") + t("refresh"));
  screen.getByRole("button", { name: t("refresh") });
};

describe("load error", () => {
  it("guide: offline message only, still marked seen, titled, no wash", async () => {
    render(<Guide route={parseHash("#/guide")} />);
    await onlyOffline();
    expect(store.get("rac.guideSeen", false)).toBe(true);
    expect(document.title).toBe("New in the club · Rotaract Events");
    expect(document.body.classList.contains("wash")).toBe(false);
  });

  it("intl: offline message only, the wash stays", async () => {
    render(<Intl route={parseHash("#/intl")} />);
    await onlyOffline();
    expect(document.body.classList.contains("wash")).toBe(true);
    expect(document.body.style.getPropertyValue("--c1")).toBe("#d41367");
  });
});
