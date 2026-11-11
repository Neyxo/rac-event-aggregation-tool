// A minimal event for tests: ev({ id: "a", start: "2026-11-14T18:00" })
import type { Event } from "../lib/types";

export const ev = (o: Partial<Event> & { id: string }): Event => ({
  clubs: ["luzern"], title: o.id, start: "2026-11-14T18:00", end: "2026-11-14T20:00", allday: false, location: "", coords: null, url: "",
  description: "", image: "", registration: "", deadline: "", cancelled: false, members: false, ...o,
});
