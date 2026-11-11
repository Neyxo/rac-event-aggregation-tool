// Club colours: the text colour that reads on a colour, and the CSS variables a club's chip, card or page is painted with.
import type { CSSProperties } from "react";

/** dark text on light colours, white on dark ones */
export function onColor(hex: string): "#1f1c26" | "#fff" {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.5 ? "#1f1c26" : "#fff";
}
/** CSS custom properties as a React style: vars({ "--p": "#d41367" }) */
export const vars = (v: Record<`--${string}`, string | number>): CSSProperties => v as CSSProperties;
/** --c and --on-c of a club colour (clubStyle() in common.js, which takes the id: clubVars(club(id).color)) */
export const clubVars = (color: string | undefined, extra: Record<`--${string}`, string | number> = {}): CSSProperties => {
  const c = color || "#d41367";
  return vars({ "--c": c, "--on-c": onColor(c), ...extra });
};
