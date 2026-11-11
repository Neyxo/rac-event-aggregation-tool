// Colours: the brand's and the districts', the text colour that reads on a colour, and the CSS variables a club's chip, card or page is
// painted with. And cx().
import type { CSSProperties } from "react";

/** Rotary's azure, a green, Rotaract's cranberry (also any club's colour until it has its own) */
export const BRAND = { azure: "#0067c8", green: "#009739", cranberry: "#d41367" } as const;
/** the three in turn, for rows of boxes and tiles */
export const BRAND3 = [BRAND.cranberry, BRAND.azure, BRAND.green] as const;
/** the Swiss districts: the key of their name and their colour on the maps */
export const DISTRICTS = { "1980": { key: "d1980", color: BRAND.azure }, "1990": { key: "d1990", color: BRAND.cranberry }, "2000": { key: "d2000", color: BRAND.green } } as const;
export type District = keyof typeof DISTRICTS;
export const DISTRICT_IDS = Object.keys(DISTRICTS) as District[];
export const isDistrict = (d: string): d is District => Object.hasOwn(DISTRICTS, d);

/** a className from parts, the falsy ones left out: cx("day", other && "other", today && "today") */
export const cx = (...a: (string | false | null | undefined)[]): string => a.filter(Boolean).join(" ");

/** dark text on light colours, white on dark ones */
export function onColor(hex: string): "#1f1c26" | "#fff" {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.5 ? "#1f1c26" : "#fff";
}
/** CSS custom properties as a React style: vars({ "--p": BRAND.cranberry }) */
export const vars = (v: Record<`--${string}`, string | number>): CSSProperties => v as CSSProperties;
/** --c and --on-c of a club colour: clubVars(club(id).color) */
export const clubVars = (color: string | undefined, extra: Record<`--${string}`, string | number> = {}): CSSProperties => {
  const c = color || BRAND.cranberry;
  return vars({ "--c": c, "--on-c": onColor(c), ...extra });
};
