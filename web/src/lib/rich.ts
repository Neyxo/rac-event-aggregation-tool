// A club's own text with a little structure and no HTML: "## Heading", "1. Title: text" (numbered step cards), "- point" (check list),
// **bold**; a blank line ends a paragraph. Parsed here into blocks; components/Rich.tsx draws them.

/** text runs; { b } is bold */
export type Inline = (string | { b: string })[];
export type RichBlock =
  | { kind: "p"; text: Inline }
  | { kind: "h3"; text: string }
  | { kind: "steps"; items: { n: string; title: Inline; text: Inline | null }[] }
  | { kind: "points"; items: Inline[] };

export const inline = (s: string): Inline => s.split(/\*\*(.+?)\*\*/).map((p, i) => i % 2 ? { b: p } : p).filter(p => p !== "");

export function parseRich(text: string): RichBlock[] {
  const out: RichBlock[] = []; let para: string[] = [];
  let group: Extract<RichBlock, { kind: "steps" | "points" }> | null = null;
  const flush = () => { if (para.length) out.push({ kind: "p", text: inline(para.join(" ")) }); para = []; };
  const into = <K extends "steps" | "points">(kind: K) => {
    flush();
    if (group?.kind !== kind) { group = kind === "steps" ? { kind: "steps", items: [] } : { kind: "points", items: [] }; out.push(group); }
    return group as Extract<RichBlock, { kind: K }>;
  };
  for (const line of text.trim().split("\n").map(l => l.trim())) {
    let m: RegExpMatchArray | null;
    if (!line) { flush(); group = null; }
    else if ((m = line.match(/^##\s+(.*)/))) { flush(); group = null; out.push({ kind: "h3", text: m[1]! }); }
    else if ((m = line.match(/^(\d+)\.\s+(.*)/))) { const [title = "", ...rest] = m[2]!.split(": "); into("steps").items.push({ n: m[1]!, title: inline(title), text: rest.length ? inline(rest.join(": ")) : null }); }
    else if ((m = line.match(/^-\s+(.*)/))) into("points").items.push(inline(m[1]!));
    else { group = null; para.push(line); }
  }
  flush();
  return out;
}
