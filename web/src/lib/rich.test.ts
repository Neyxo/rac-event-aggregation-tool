import { describe, expect, it } from "vitest";
import { inline, parseRich } from "./rich";
import { fixture } from "../test/fixture";

describe("inline", () => {
  it("bold runs", () => {
    expect(inline("a **b** c **d**")).toEqual(["a ", { b: "b" }, " c ", { b: "d" }]);
    expect(inline("no bold")).toEqual(["no bold"]);
    expect(inline("**only**")).toEqual([{ b: "only" }]);
    expect(inline("**unclosed")).toEqual(["**unclosed"]);
  });
});

describe("parseRich", () => {
  it("headings, paragraphs joined until a blank line, steps, points", () => {
    const r = parseRich(`
## Who
We are a club.
Still the same paragraph.

1. Come along: to a **Stamm**: any time
2. Join
- one
- **two**
After the list.`);
    expect(r).toEqual([
      { kind: "h3", text: "Who" },
      { kind: "p", text: ["We are a club. Still the same paragraph."] },
      { kind: "steps", items: [{ n: "1", title: ["Come along"], text: ["to a ", { b: "Stamm" }, ": any time"] }, { n: "2", title: ["Join"], text: null }] },
      { kind: "points", items: [["one"], [{ b: "two" }]] },
      { kind: "p", text: ["After the list."] },
    ]);
  });
  it("a blank line or a paragraph line starts a new list", () => {
    const r = parseRich("1. a\n\n2. b\ntext\n3. c");
    expect(r.map(b => b.kind)).toEqual(["steps", "steps", "p", "steps"]);
  });
  it("a paragraph before a step ends at the step", () => {
    expect(parseRich("intro\n1. a").map(b => b.kind)).toEqual(["p", "steps"]);
  });
  it("empty text, and a real club text", () => {
    expect(parseRich("   ")).toEqual([]);
    const how = fixture.clubs.find(c => c.how)?.how;
    if (how) expect(parseRich(how).length).toBeGreaterThan(0);
  });
});
