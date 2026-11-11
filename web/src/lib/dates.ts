// Dates as the app shows them. Event times are local times without a zone ("2026-11-14T18:00"); "now" is new Date(),
// which the pretend-date switch shifts (dev.ts), so tests set the clock with vi.setSystemTime.
import { LOCALE, t } from "../i18n";
import type { Event } from "./types";

type DateLike = Date | string | number;
export const startOfDay = (d: DateLike): Date => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const sameDay = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** whole days from today (0 today, 1 tomorrow, -1 yesterday); counts calendar days, so DST weekends round right */
export const dayN = (d: DateLike): number => Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 864e5);
/** the day an all-day event ends on (its end is the midnight after) */
export const lastDay = (e: Event): Date => new Date(new Date(e.end).getTime() - 1);
export const isPast = (e: Event): boolean => new Date(e.end) < new Date();

const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(LOCALE, o);
export const fmt = {
  day: f({ day: "numeric" }), mon: f({ month: "short" }), month: f({ month: "long", year: "numeric" }),
  wd: f({ weekday: "short" }), wdl: f({ weekday: "long" }), time: f({ hour: "2-digit", minute: "2-digit" }),
  full: f({ weekday: "long", day: "numeric", month: "long", year: "numeric" }), fullTime: f({ weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }), stamp: f({ day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  dm: f({ weekday: "short", day: "numeric", month: "short" }), dms: f({ day: "numeric", month: "short" }), date: f({ day: "numeric", month: "short", year: "numeric" }),
};

/** "Sat · All day", "Fri 14 Nov – Sun 16 Nov", "Fri 18:00–20:00" (the end time only when it ends the same day) */
export function whenShort(e: Event): string {
  const s = new Date(e.start), en = new Date(e.end);
  if (e.allday) return sameDay(s, lastDay(e)) ? fmt.wdl.format(s) + " · " + t("all_day") : fmt.dm.format(s) + " – " + fmt.dm.format(lastDay(e));
  return `${fmt.wd.format(s)} ${fmt.time.format(s)}` + (sameDay(s, en) ? "–" + fmt.time.format(en) : "");
}
/** the event page's "When": full dates, the time range for a timed event */
export const whenLong = (e: Event): string => e.allday ? fmt.full.formatRange(new Date(e.start), lastDay(e)) : fmt.fullTime.formatRange(new Date(e.start), new Date(e.end));
const rel = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });
/** n days from today in words: "today", "tomorrow", "in 3 days" (and "übermorgen" where the language has a word for it) */
export const relDay = (n: number): string => rel.format(n, "day");
export const placeShort = (e: Event): string => (e.location || "").split(",")[0] ?? "";
/** organiser (Rotary events) · when · place */
export const metaLine = (e: Event): string => [e.organiser, whenShort(e), placeShort(e)].filter(Boolean).join(" · ");

/** registration deadline still ahead: days left and whether it is red (last two days). null when none, past or cancelled. */
export function deadlineState(e: Event): { n: number; soon: boolean } | null {
  const n = e.deadline && !e.cancelled ? dayN(e.deadline) : -1;
  return n < 0 ? null : { n, soon: n <= 2 };
}
/** days until an event starts, never negative (the next-up pane) */
export const daysUntil = (e: Event): number => Math.max(0, dayN(e.start));
