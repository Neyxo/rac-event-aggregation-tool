// Pictures for Learn / Help / Celebrate: static/img/<k>.jpg when present, otherwise an event picture whose title fits
// (people doing things, not a poster).
import type { Event } from "./types";

export type Pillar = "learn" | "help" | "party";
export const PILLAR_RE: Record<Pillar, RegExp> = {
  learn: /vortrag|talk|referat|besuch|visit|workshop|firm|company|entreprise|azienda|exkursion|führung/i,
  help: /hands.?on|projekt|project|projet|progetto|charity|spende|clean|sammel|freiwillig|volunt|bénévol|volontar|helfen/i,
  party: /stamm|party|fest|ap[ée]ro|weihnacht|christmas|noël|natale|dinner|grill|ball|gala|sommer|summer|été|estate/i,
};
/** the picture used when img/<k>.jpg fails: the last event picture whose title fits, else the last event picture */
export function pillarFallback(events: Event[], k: Pillar): string | undefined {
  const withPic = events.filter((e) => e.image);
  return (withPic.filter((e) => PILLAR_RE[k].test(e.title)).at(-1) ?? withPic.at(-1))?.image;
}
