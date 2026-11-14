// The event screen for each kind of event, and what its buttons do.
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { fixture } from "../../test/fixture";
import { getData, initData, loadData } from "../../lib/data";
import { t } from "../../i18n";
import { Toast } from "../../components";
import Event from "./Event";

const at = (id: string) =>
  render(
    <>
      <Event route={{ name: "event", params: { id }, query: new URLSearchParams() }} />
      <Toast />
    </>,
  );
const title = (id: string) => fixture.events.find((e) => e.id === id)!.title;
/** the head's title block: title, meta line, club chips and statuses */
const head = () => within(screen.getByRole("heading", { level: 1 }).parentElement!);
const notes = () => [...document.querySelectorAll("p.desc")].map((n) => n.textContent);

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-11T10:00"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ ok: true, json: async () => structuredClone(fixture) })),
  );
  await loadData();
  vi.unstubAllGlobals();
});
afterAll(() => {
  vi.useRealTimers();
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  initData(fixture);
});

describe("event screen", () => {
  it("an upcoming Polaris event: title, register, calendar and share, facts, more events", () => {
    at("219091");
    expect(screen.getByRole("main").getAttribute("style")).toContain("--c:");
    expect(document.title).toBe(title("219091") + " · Rotaract Events");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(title("219091"));
    const go = screen.getByRole("link", { name: t("register") });
    expect(go.getAttribute("target")).toBe("_blank");
    expect(screen.getByRole("link", { name: t("add_cal") }).getAttribute("href")).toBe(
      "https://rotaract-zuerich.ch/de/agenda/ical/219091",
    );
    screen.getByRole("button", { name: t("share_event") });
    for (const k of ["when", "where", "deadline_h", "registration"] as const) screen.getByText(t(k));
    // the deadline was two days ago: the date alone, in red
    const dl = screen.getByText(t("deadline_h")).nextElementSibling!;
    expect(dl.className).toBe("soon");
    expect(dl.textContent).not.toContain("·");
    expect(
      within(screen.getByText(t("where")).nextElementSibling as HTMLElement)
        .getByRole("link")
        .getAttribute("href"),
    ).toMatch(/maps.*query=/);
    screen.getByRole("heading", { level: 3, name: t("more_events") });
    expect(document.querySelector("a.more")).toBeNull(); // a Polaris event needs no international help link
  });

  it("members-only and past: no calendar link, no deadline, the members note", () => {
    at("202042");
    expect(screen.queryByRole("link", { name: t("add_cal") })).toBeNull();
    screen.getByRole("link", { name: t("open_polaris") });
    head().getByText(t("members_only"));
    expect(head().queryByText(t("cancelled"))).toBeNull();
    expect(screen.queryByText(t("deadline_h"))).toBeNull();
    expect(notes()).toContain(t("members_note"));
  });

  it("cancelled: the status, and the button only opens Polaris", () => {
    at("222796");
    expect(head().getByText(t("cancelled")).className).toBe("st bad");
    screen.getByRole("link", { name: t("open_polaris") });
    expect(screen.queryByText(t("deadline_h"))).toBeNull();
  });

  it("international, all day over several days: first and last day, no calendar link, the international help link", () => {
    at("eu2069");
    screen.getByRole("link", { name: t("register") });
    expect(screen.queryByRole("link", { name: t("add_cal") })).toBeNull();
    expect(document.querySelector("a.more")?.getAttribute("href")).toBe("#/intl");
    expect(screen.getByText(t("when")).nextElementSibling?.textContent).toMatch(/January\s–\s.* January 2027$/);
  });

  it("a Rotary event opens from a shared link with the layer off, without its district", () => {
    at("222831");
    screen.getByRole("heading", { level: 1 });
    expect(head().queryAllByRole("link")).toHaveLength(0);
    screen.getByRole("link", { name: t("open_rotary") });
    expect(notes()).toContain(t("rotary_note"));
  });

  it("an unknown id: the empty state", () => {
    at("nope");
    screen.getByText(t("empty"));
    expect(screen.getByRole("link", { name: t("show_all") }).getAttribute("href")).toBe("#/");
  });

  it("the star saves the event", () => {
    at("219091");
    const star = screen.getByRole("button", { name: t("save") + ": " + title("219091") });
    fireEvent.click(star);
    expect(star.getAttribute("aria-pressed")).toBe("true");
    expect(getData().saved.has("219091")).toBe(true);
    expect(screen.getByRole("status").textContent).toBe(t("saved"));
  });

  it("share: the e/<id>.html page, by the share sheet or copied", async () => {
    const share = vi.fn(async () => {});
    Object.defineProperty(navigator, "share", { value: share, configurable: true });
    const { unmount } = at("219091");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t("share_event") }));
    });
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: new URL("e/219091.html", location.href).href }));
    unmount();
    Reflect.deleteProperty(navigator, "share");
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    at("219091");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: t("share_event") }));
    });
    expect(writeText).toHaveBeenCalledWith(new URL("e/219091.html", location.href).href);
    expect(screen.getByRole("status").textContent).toBe(t("copied"));
  });
});
