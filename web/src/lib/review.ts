// Year in review (screens/Review): the numbers of one Rotaract year, 1 July y to 30 June y + 1, from what the app already has
// (events.json, the clubs' dated news and projects, the saved events). Nothing is recorded for it and nothing leaves the device.
// Pure: the screen only renders what this returns, and leaves out a card whose number is 0, null or empty.
import type { Club, Event, InstaPost } from "./types";
import { km } from "./geo";

export interface Review {
  /** events of my clubs (of all clubs for a guest) that started in the year; cancelled ones never count */
  n: number;
  /** the busiest month (0 = January) and its events; the earlier one on a tie */
  month: { m: number; n: number } | null;
  /** events per month of the year, July first: the bar chart under the busiest month */
  months: number[];
  /** [club id, events], most first, at most three; empty when only one club hosted */
  hosts: [string, number][];
  /** the two events furthest apart; null below 1 km */
  far: { a: Event; b: Event; km: number } | null;
  /** events of the year I starred, of any club */
  saved: number;
  /** dated news and projects of the same clubs within the year */
  news: number;
  projects: number;
  /** the same clubs' Instagram posts of the year, newest first, at most six. The feed only keeps each club's latest posts, so
   *  these are pictures to show, not a number to count. */
  insta: InstaPost[];
}

export function review(
  y: number,
  events: readonly Event[],
  clubs: readonly Club[],
  mine: readonly string[],
  saved: ReadonlySet<string>,
): Review {
  // dates are local "2026-07-01T18:00" / "2026-07-01": comparing the text is exact, with no time zone in the way
  const from = `${y}-07-01`;
  const to = `${y + 1}-07-01`;
  const inYear = (d: string) => d >= from && d < to;
  const all = events.filter((e) => !e.cancelled && inYear(e.start));
  const evs = mine.length ? all.filter((e) => e.clubs.some((c) => mine.includes(c))) : all;
  const count = (keys: (string | number)[]) => {
    const m = new Map<string | number, number>();
    for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  const month = count(evs.map((e) => +e.start.slice(5, 7) - 1))[0];
  const hosts = count(evs.flatMap((e) => e.clubs)) as [string, number][];
  const placed = evs.filter((e) => e.coords);
  let far: Review["far"] = null;
  // ponytail: every pair, O(n²); a year is a few hundred events at most
  for (const [i, a] of placed.entries())
    for (const b of placed.slice(i + 1)) {
      const d = km(a.coords!, b.coords!);
      if (d >= 1 && d > (far?.km ?? 0)) far = { a, b, km: d };
    }
  const cs = clubs.filter((c) => !mine.length || mine.includes(c.id));
  const dated = (k: "news" | "projects") => cs.flatMap((c) => c[k] ?? []).filter((n) => inYear(n.date)).length;
  return {
    n: evs.length,
    month: month ? { m: +month[0], n: month[1] } : null,
    hosts: hosts.length > 1 ? hosts.slice(0, 3) : [],
    months: Array.from({ length: 12 }, (_, i) => evs.filter((e) => (+e.start.slice(5, 7) + 5) % 12 === i).length),
    far,
    saved: all.filter((e) => saved.has(e.id)).length,
    news: dated("news"),
    projects: dated("projects"),
    insta: cs
      .flatMap((c) => c.instagram ?? [])
      .filter((p) => inYear(p.date ?? ""))
      .sort((a, b) => b.date!.localeCompare(a.date!))
      .slice(0, 6),
  };
}
