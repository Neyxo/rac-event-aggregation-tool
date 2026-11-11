// "What changed since the last visit" on Home: the ids and start times of my clubs' upcoming events, remembered one visit ago.
// Visits closer than an hour count as one, so a reload doesn't swallow the news.
import type { Event, Seen } from "./types";

export const SEEN_WINDOW = 36e5;
export interface Changes {
  newIds: Set<string>;
  /** events whose start time changed */
  moved: number;
  /** values to store (null: leave as is) */
  seen: Seen | null;
  seenPrev: Record<string, string> | null;
}
/** mineEv: my clubs' upcoming events, sorted. seen / seenPrev: rac.seen and rac.seenPrev. devNew: the "mark three as new" preview. */
export function whatChanged(mineEv: Event[], seen: Seen | null, seenPrev: Record<string, string> | null, now: number, devNew = false): Changes {
  const cur = Object.fromEntries(mineEv.map(e => [e.id, e.start]));
  const fresh = !seen || now - seen.at > SEEN_WINDOW;
  const prev = seen && fresh ? seen.map : seenPrev;
  const newIds = new Set(devNew ? mineEv.slice(1, 4).map(e => e.id) : prev ? Object.keys(cur).filter(id => !(id in prev)) : []);
  const moved = prev ? Object.keys(cur).filter(id => id in prev && prev[id] !== cur[id]).length : 0;
  return { newIds, moved, seen: fresh ? { at: now, map: cur } : null, seenPrev: seen && fresh ? seen.map : null };
}
