// Event bingo: an Easter egg, for now only opened from the developer screen. A 4 × 4 card dealt from tx("bingo"); tap what happens
// at an event, and a full row, column or diagonal wins. The card lives as long as the page: closing the popup keeps it.
import { useState } from "react";
import { t, tx } from "../i18n";
import { Popup } from "./Popup";

const N = 4, IDX = [...Array(N).keys()];
/** the rows, columns and two diagonals of the card, as square numbers */
const LINES = [...IDX.flatMap(i => [IDX.map(j => i * N + j), IDX.map(j => j * N + i)]), IDX.map(i => i * (N + 1)), IDX.map(i => (i + 1) * (N - 1))];
export const won = (hit: ReadonlySet<number>): boolean => LINES.some(l => l.every(i => hit.has(i)));
/** N × N of the phrases (their numbers in tx("bingo")), shuffled */
function deal(): number[] {
  const a = tx("bingo").map((_, i) => i);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a.slice(0, N * N);
}
interface Card { card: number[]; hit: Set<number> }
let kept: Card | null = null;

export default function Bingo({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(() => kept ??= { card: deal(), hit: new Set<number>() });
  const set = (n: Card) => { kept = n; setS(n); };
  const toggle = (i: number) => { const hit = new Set(s.hit); if (!hit.delete(i)) hit.add(i); set({ ...s, hit }); };
  const words = tx("bingo");
  return (
    <Popup title={t("bingo_title")} onClose={onClose} className="ob bingo" action={<button className="skip" type="button" onClick={() => set({ card: deal(), hit: new Set() })}>{t("bingo_new")}</button>}>
      <p aria-live="polite">{won(s.hit) ? <b>{t("bingo_win")}</b> : t("bingo_lead")}</p>
      <div className="grid">{s.card.map((w, i) => <button key={w} type="button" aria-pressed={s.hit.has(i)} onClick={() => toggle(i)}>{words[w]}</button>)}</div>
    </Popup>
  );
}
