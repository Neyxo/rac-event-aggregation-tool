// UI strings. The language is picked once per page load:
// ?lang=, then the saved choice (rac.lang), then the device language, English otherwise.
import en, { type Messages, type Pair } from "./en";
import de from "./de";
import fr from "./fr";
import it from "./it";
import be from "./be";

export type { Messages, Pair };
export const I18N = { en, de, fr, it } satisfies Record<string, Messages>;
export type Lang = keyof typeof I18N;
// the order of the language control in Settings
export const LANGS: Record<Lang, string> = { de: "Deutsch", fr: "Français", it: "Italiano", en: "English" };
export const LOCALES: Record<Lang, string> = { de: "de-CH", fr: "fr-CH", it: "it-CH", en: "en-GB" };

const isLang = (l: unknown): l is Lang => typeof l === "string" && Object.hasOwn(I18N, l); // not "in": ?lang=toString would pick a prototype method
export function pickLang(search: string, saved: unknown, device: string | undefined): Lang {
  const q = new URLSearchParams(search).get("lang");
  return [q, saved, (device || "en").slice(0, 2)].find(isLang) ?? "en";
}
const saved = (k: string): unknown => {
  try {
    return JSON.parse(localStorage.getItem(k) ?? "null");
  } catch {
    return null;
  }
};

export const LANG: Lang =
  typeof location === "undefined" ? "en" : pickLang(location.search, saved("rac.lang"), navigator.language);
export const LOCALE = LOCALES[LANG];
/** Bärndütsch (be.ts): the Easter egg on top of German. rac.be exists (true or false) once it was unlocked; from then on it is
 *  a choice in the language control. */
export const BE_UNLOCKED: boolean = typeof location !== "undefined" && saved("rac.be") !== null;
export const BE: boolean = LANG === "de" && typeof location !== "undefined" && saved("rac.be") === true;
if (typeof document !== "undefined") document.documentElement.lang = BE ? "gsw-CH" : LANG;
const M: Messages = BE ? { ...de, ...be } : I18N[LANG];

/** Keys whose value is a plain string: the only ones t() accepts. */
export type StrKey = { [K in keyof Messages]: Messages[K] extends string ? K : never }[keyof Messages];
/** Keys with structured values (lists, pairs, nm, intl): read them with tx(). */
export type DataKey = Exclude<keyof Messages, StrKey>;

/** t("key", { n: 3 }) fills {n}. */
export function t(key: StrKey, vars?: Record<string, string | number>): string {
  let s: string = M[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
/** Structured values: tx("dow") is string[], tx("fam") is Pair[], tx("nm").words, tx("intl").qa ... */
export function tx<K extends DataKey>(key: K): Messages[K] {
  return M[key];
}

export function nEvents(n: number): string {
  return n === 1 ? t("one_event") : t("n_events", { n });
}

/** Saves the choice (bern: German as Bärndütsch) and reloads without ?lang= (the language is read once per load: every module reads its texts at start). */
export function setLang(l: Lang, bern = false): void {
  try {
    localStorage.setItem("rac.lang", JSON.stringify(l));
    if (bern || BE_UNLOCKED) localStorage.setItem("rac.be", JSON.stringify(bern));
  } catch {
    /* private mode */
  }
  const u = new URL(location.href);
  u.searchParams.delete("lang");
  // with a hash route, assigning the same URL only scrolls: reload when ?lang= was not there
  if (u.href === location.href) location.reload();
  else location.href = u.href;
}
