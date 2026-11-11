import { describe, expect, it } from "vitest";
import { SEEN_WINDOW, whatChanged } from "./changes";
import { ev } from "../test/ev";

const a = ev({ id: "a", start: "2026-11-14T18:00" }), b = ev({ id: "b", start: "2026-11-20T18:00" }), c = ev({ id: "c", start: "2026-12-01T18:00" });
const T0 = 1_800_000_000_000;

describe("whatChanged", () => {
  it("first visit: nothing new, remembers what it saw", () => {
    const r = whatChanged([a, b], null, null, T0);
    expect([...r.newIds]).toEqual([]);
    expect(r.moved).toBe(0);
    expect(r.seen).toEqual({ at: T0, map: { a: a.start, b: b.start } });
    expect(r.seenPrev).toBeNull();
  });
  it("a later visit: new ids and moved events against the last visit", () => {
    const seen = { at: T0, map: { a: "2026-11-13T18:00", b: b.start } };
    const r = whatChanged([a, b, c], seen, null, T0 + SEEN_WINDOW + 1);
    expect([...r.newIds]).toEqual(["c"]);
    expect(r.moved).toBe(1);
    expect(r.seenPrev).toEqual(seen.map);
    expect(r.seen?.at).toBe(T0 + SEEN_WINDOW + 1);
  });
  it("within the hour it compares with the visit before (a reload keeps the news) and stores nothing", () => {
    const seen = { at: T0, map: { a: a.start, b: b.start, c: c.start } }, prev = { a: a.start };
    const r = whatChanged([a, b, c], seen, prev, T0 + SEEN_WINDOW);  // exactly one hour: still the same visit
    expect([...r.newIds].sort()).toEqual(["b", "c"]);
    expect(r.seen).toBeNull();
    expect(r.seenPrev).toBeNull();
  });
  it("within the hour without an earlier visit: nothing new", () => {
    const r = whatChanged([a, b], { at: T0, map: {} }, null, T0 + 1000);
    expect(r.newIds.size).toBe(0);
  });
  it("the preview switch marks the second to fourth event as new", () => {
    const d = ev({ id: "d" }), e = ev({ id: "e" });
    expect([...whatChanged([a, b, c, d, e], null, null, T0, true).newIds]).toEqual(["b", "c", "d"]);
  });
});
