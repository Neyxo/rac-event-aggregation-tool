// Easter eggs on two days of the year: a firework on Home on 1 August, confetti on the Bern club page on Zibelemärit.
// Cheap on purpose: 24 small boxes (33 for the firework), moved by CSS transform and opacity only (no script per frame, no canvas), played once per
// page load and then removed. Nothing under prefers-reduced-motion. Never in the way: pointer-events none, aria-hidden.
// playFestive(kind) plays one right now on any page and date (the developer screen's buttons).
import { useState, useSyncExternalStore, type CSSProperties } from "react";
import { festive } from "../lib/dates";
import { emitter } from "../lib/store";

type Kind = NonNullable<ReturnType<typeof festive>>;
const COLORS = ["#e4002b", "#f7a81b", "#0067c8", "#00a2a0", "#d41367", "#ffffff"];
/** confetti: 24 pieces across the top. Positions from the index, not Math.random(): the same on every render. */
const CONFETTI = Array.from({ length: 24 }, (_, i) => ({ r: false, vars: { "--i": i, "--x": (i * 37) % 100, "--c": COLORS[i % COLORS.length] } }));
/** firework: three rockets from the bottom edge, one after the other, each bursting into ten sparks where it ends.
 *  [left %, top % of the burst, colour]; per rocket the rocket itself (r) and then its sparks (--a: which of the ten directions). */
const ROCKETS = ([[50, 22, "#e4002b"], [22, 36, "#f7a81b"], [78, 30, "#d41367"]] as const).flatMap(([l, t, c], b) =>
  Array.from({ length: 11 }, (_, j) => ({ r: !j, vars: { "--b": b, "--l": l, "--t": t, "--a": j, "--c": j ? c : "#f7a81b" } })));
// forced: asked for by playFestive; played: the day's own one has run; run: counts every start and end, so React re-renders
let forced: Kind | null = null, played = false, run = 0;
const changes = emitter();
const bump = () => { run++; changes.emit(); };
export function playFestive(k: Kind): void { forced = k; bump(); }

export function Festive({ page, id }: { page: string; id: string | undefined }) {
  const [today] = useState(festive);
  const n = useSyncExternalStore(changes.subscribe, () => run);
  const here = today === "aug1" ? page === "home" : today === "zibele" && page === "club" && id === "bern";
  const kind = forced ?? (here && !played ? today : null);
  if (!kind || matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const boxes = kind === "aug1" ? ROCKETS : CONFETTI;
  return (
    // the last box to finish ends it: animationend bubbles, so one handler on the parent sees them all. key: a second play starts over.
    <div key={n} className={"fest " + kind} aria-hidden="true" onAnimationEnd={ev => { if ((ev.target as HTMLElement).dataset.last) { if (!forced) played = true; forced = null; bump(); } }}>
      {boxes.map((x, i) => <i key={i} className={x.r ? "r" : undefined} data-last={i === boxes.length - 1 || undefined} style={x.vars as CSSProperties} />)}
    </div>
  );
}
