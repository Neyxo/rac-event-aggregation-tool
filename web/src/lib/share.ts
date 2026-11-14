// What a share button shares: a small static page with its own preview (og:title, og:image) that forwards into the app.
// Events: e/<id>.html and clubs: c/<id>.html (written by polaris_feed.py); static screens: s/<lang>/<page>.html (written at build, vite.config.ts).
import { LANG } from "../i18n";

export const SHARE_PAGES = [
  "home",
  "discover",
  "calendar",
  "subscribe",
  "about",
  "about-more",
  "family",
  "public",
  "guide",
  "words",
  "intl",
] as const;
export type SharePage = (typeof SHARE_PAGES)[number];
export type ShareTarget = { event: string } | { club: string } | SharePage;

/** the share page of one event or one club (written by polaris_feed.py) */
const itemPath = (item: Exclude<ShareTarget, string>): string =>
  "event" in item ? `e/${encodeURIComponent(item.event)}.html` : `c/${encodeURIComponent(item.club)}.html`;

/** absolute URL to share; base defaults to the current page */
export function shareUrl(target: ShareTarget, base: string = location.href, lang: string = LANG): string {
  const path = typeof target === "string" ? `s/${lang}/${target}.html` : itemPath(target);
  return new URL(path, base).href;
}
