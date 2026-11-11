// The shapes of events.json and status.json as polaris_feed.py writes them, and of what the app keeps in localStorage.

/** [latitude, longitude] */
export type Coords = [number, number];

export interface Event {
  id: string;
  /** club ids; the first one leads (colour, crest) */
  clubs: string[];
  title: string;
  /** local time without zone: "2026-11-14T18:00" (all-day: "2026-11-14T00:00") */
  start: string;
  /** exclusive: an all-day event ends at the midnight after its last day */
  end: string;
  allday: boolean;
  location: string;
  coords: Coords | null;
  url: string;
  description: string;
  image: string;
  registration: string;
  /** registration deadline, same format as start; "" when none */
  deadline: string;
  cancelled: boolean;
  /** members only: no calendar file, no description */
  members: boolean;
  /** "rotary" for the Rotary layer; absent otherwise */
  layer?: string;
  /** a Rotary event names the club that hosts it */
  organiser?: string;
}

export interface NewsItem { url: string; title: string; date: string; image: string }
export interface InstaPost { url: string; image: string; caption: string }
/** a partner in clubs.toml: url "club.html?id=<id>" means another club of this app */
export interface Partner { name: string; url: string; note?: string }

export interface Club {
  id: string;
  name: string;
  short: string;
  url: string;
  color: string;
  logo: string;
  /** "1980" | "1990" | "2000", "" for national / international */
  district: string;
  city?: string;
  coords: Coords | null;
  photos: string[];
  news: NewsItem[];
  projects: NewsItem[];
  instagram: InstaPost[];
  /** e.g. { instagram: "https://...", linkedin: "https://..." } */
  links: Record<string, string>;
  /** "" for a real club, "international" or "rotary" for a pseudo-club */
  source: string;
  /** "How to join", in the rich() text format */
  how: string;
  partners: Partner[];
  about?: string;
}

export interface EventsJson {
  /** "2026-11-11T01:58" */
  generated: string;
  clubs: Club[];
  events: Event[];
  /** the Rotary layer: only merged in when switched on in Settings (see data.ts) */
  rotary?: { clubs: Club[]; events: Event[] };
}

export interface ClubStatus { events: number; cancelled: number; without_detail: number }
export interface Status {
  /** "20261111T005856Z" */
  generated: string;
  events: number;
  rotary_events: number;
  with_image: number;
  without_location: number;
  clubs: Record<string, ClubStatus>;
  failures: string[];
  /** layout / suspicious-run warnings */
  warnings?: string[];
  /** per club: list items whose date could not be read */
  unreadable?: Record<string, number>;
  commit: string;
  /** link to the workflow run */
  run: string;
}

/** rac.settings: the main club and the other clubs shown on Home */
export interface Settings { home: string; also: string[] }
/** rac.seen: the upcoming events of my clubs at the last visit, id -> start */
export interface Seen { at: number; map: Record<string, string> }
