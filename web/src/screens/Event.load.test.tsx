// The event screen before the data is there: a skeleton, then its offline box when events.json fails.
// A file of its own: the data module is loaded once per session, and here it must not be loaded yet.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { t } from "../i18n";
import Event from "./Event";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("event screen while loading", () => {
  it("shows the skeleton, then the offline box when events.json fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));
    const { container } = render(<Event route={{ name: "event", params: { id: "217812" }, query: new URLSearchParams() }} />);
    const main = container.querySelector("main.wrap.evpage#main")!;
    expect(main.querySelector(".skel[aria-hidden=true]")).not.toBeNull();
    await waitFor(() => expect(main.querySelector(".empty")).not.toBeNull());
    expect(main.querySelector(".skel")).toBeNull();
    expect(main.querySelector(".empty")!.textContent).toBe(t("offline") + t("refresh"));
    expect(main.querySelector(".empty button.linkbtn")?.getAttribute("type")).toBe("button");
    // no club colours and no wash: nothing to colour it with
    expect(main.getAttribute("style")).toBeNull();
    expect(document.body.classList.contains("wash")).toBe(false);
  });
});
