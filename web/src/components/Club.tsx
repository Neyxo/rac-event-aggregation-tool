// Clubs: the crest, a club as a plain value, the chip that opens the club, and the chip picker.
import type { ReactNode } from "react";
import { t } from "../i18n";
import { club } from "../lib/data";
import { clubVars, cx } from "../lib/color";
import { href } from "../lib/route";
import type { Club } from "../lib/types";
import { useData } from "./hooks";

/** the crest, or a dot in the club colour */
export function ClubMark({ c }: { c: Club }) {
  return c.logo ? <img src={c.logo} alt="" loading="lazy" /> : <span className="dot" />;
}
/** a club as a plain value (a Settings row), not a link */
export function ClubLabel({ id }: { id: string }) {
  const c = club(id);
  return <span className="cl" style={clubVars(c.color)}><ClubMark c={c} />{c.short}</span>;
}
/** the club chip: crest and name, always opens the club; the same on cards, the event screen, Home and in "we work with".
 *  extra: more classes ("main" on Home); children go after the name (<small>12 km</small>). */
export function ClubChip({ id, extra = "", children }: { id: string; extra?: string; children?: ReactNode }) {
  const c = club(id);
  return <a className={cx("chip club", extra)} href={href("club", id)} style={clubVars(c.color)} aria-label={c.name}><ClubMark c={c} />{c.short}{children}</a>;
}

type Pick = { onPick: (id: string) => void; exclude?: string[] } & ({ single: true; selected: string } | { single?: false; selected: Set<string> });
const isOn = (p: Pick, id: string) => p.single ? p.selected === id : p.selected.has(id);

/** chip picker (flows, popups): wraps, no inner scrolling. only: limit to these ids. */
export function ClubChips(p: Pick & { only?: string[] | null }) {
  const { single = false, exclude = [], only = null, onPick } = p;
  const D = useData();
  return (
    <div className="chips">
      {single && <button className="chip" type="button" aria-pressed={!p.selected} onClick={() => onPick("")}>{t("none")}</button>}
      {D.data.clubs.filter(c => !exclude.includes(c.id) && !(only && !only.includes(c.id)) && !(single && c.source)).map(c => (
        <button key={c.id} className="chip club" type="button" style={clubVars(c.color)} aria-pressed={isOn(p, c.id)} aria-label={c.name} onClick={() => onPick(c.id)}>
          <ClubMark c={c} />{c.short}
        </button>
      ))}
    </div>
  );
}
