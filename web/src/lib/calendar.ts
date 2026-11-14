// The month grid of the calendar screen: weeks start on Monday, five or six rows, and each day's events.
import type { Event } from "./types";
import { sameDay, startOfDay } from "./dates";

const DAYMS = 864e5;
export interface MonthGrid {
  /** the 1st of the month */
  first: Date;
  /** the last day of the month */
  last: Date;
  /** days of the previous month before the 1st (0 when the month starts on a Monday) */
  lead: number;
  gridStart: Date;
  /** 35 or 42 */
  cells: number;
  days: Date[];
}
export function monthGrid(month: Date): MonthGrid {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const lead = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(1 - lead);
  const cells = lead + last.getDate() > 35 ? 42 : 35;
  const days = Array.from({ length: cells }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  return { first, last, lead, gridStart, cells, days };
}
/** the events of each day in (and a week after) the grid, keyed by date.toDateString(). A multi-day event is on every day it touches;
 *  an all-day event's end is the midnight after its last day, so it stops there; one that ends at midnight is not on the next day. */
export function byDay(events: Event[], g: Pick<MonthGrid, "gridStart" | "last">): Record<string, Event[]> {
  const out: Record<string, Event[]> = {};
  const limit = new Date(g.last.getTime() + 7 * DAYMS);
  for (const e of events) {
    const s = startOfDay(new Date(e.start));
    const end = new Date(e.end);
    for (let d = new Date(s); d < end || sameDay(d, s); d.setDate(d.getDate() + 1)) {
      if (d < g.gridStart || d > limit) continue;
      (out[d.toDateString()] ||= []).push(e);
      if (e.allday && d >= end) break;
    }
  }
  return out;
}
/** "mine": my clubs' events when I have clubs, everything otherwise */
export const calendarEvents = (events: Event[], scope: "mine" | "all", mine: string[]): Event[] => {
  const m = scope === "mine" ? mine : [];
  return events.filter((e) => !m.length || e.clubs.some((c) => m.includes(c)));
};
