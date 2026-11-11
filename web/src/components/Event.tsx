// The event card and its parts: colour wash, crest under a frosted date pane, one meta line, chips and status, picture, star.
// The card opens the event screen.
import { createContext, useContext, type MouseEvent } from "react";
import { t } from "../i18n";
import { club, toggleSaved } from "../lib/data";
import { clubVars, cx } from "../lib/color";
import { daysUntil, deadlineState, fmt, isPast, metaLine, placeShort, relDay, whenShort } from "../lib/dates";
import { href } from "../lib/route";
import type { Event } from "../lib/types";
import { Icon, type IconName } from "./Icon";
import { ClubChip } from "./Club";
import { toast } from "./Toast";
import { useSaved } from "./hooks";

/** the events the cards below tag NEW: Home provides the ones new since the last visit; anywhere else nothing is new */
export const NewIds = createContext<ReadonlySet<string>>(new Set());

/** status: an icon (or a dot) and coloured text, never a box, never clickable. kind: "" | "bad" | "new" | "soon" */
export function Status({ kind, ic, text }: { kind: string; ic?: IconName | null; text: string }) {
  return <span className={cx("st", kind)}>{ic ? <Icon name={ic} /> : <i />}{text}</span>;
}

/** "Register by 14 Nov" while the deadline is still ahead; red in the last two days. Nothing otherwise. */
export function DeadlineTag({ e }: { e: Event }) {
  const d = deadlineState(e);
  return d ? <Status kind={d.soon ? "soon" : ""} ic="clock" text={t("reg_by", { d: fmt.dms.format(new Date(e.deadline)) })} /> : null;
}

/** the frosted date pane: day number over the short month */
export function DatePane({ e }: { e: Event }) {
  const s = new Date(e.start);
  return <div className="date glass" aria-hidden="true"><b>{fmt.day.format(s)}</b><span>{fmt.mon.format(s)}</span></div>;
}

/** save / unsave; every star of this event and every list of saved events follow */
export function StarButton({ e }: { e: Event }) {
  const on = useSaved(e.id);
  // the star sits inside the card's link: it must not open the event
  const toggle = (ev: MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    toast(toggleSaved(e.id) ? t("saved") : t("unsaved"));
  };
  return (
    <button className="star" type="button" aria-pressed={on} aria-label={t("save") + ": " + e.title} onClick={toggle}>
      <Icon name="star" />
    </button>
  );
}

/** the "next up" pane on the club screen and Home */
export function NextUp({ e, label = t("next_event") }: { e: Event; label?: string }) {
  return (
    <a className="nx glass" href={href("event", e.id)} style={clubVars(club(e.clubs[0] ?? "").color)}>
      <div>
        <div className="k">{label}</div>
        <div className="cd">{relDay(daysUntil(e))}</div>
        <h4>{e.title}</h4>
        <div className="m">{whenShort(e) + (e.location ? " · " + placeShort(e) : "")}</div>
      </div>
      {e.image ? <img src={e.image} alt="" referrerPolicy="no-referrer" /> : null}
      <Icon name="back" className="chev" />
    </a>
  );
}

/** i: position in the list (staggered entrance, capped at 12) */
export function EventCard({ e, i = 0 }: { e: Event; i?: number }) {
  const lead = club(e.clubs[0] ?? "");
  const newIds = useContext(NewIds);
  return (
    <a className={cx("event", e.cancelled && "cancelled")} href={href("event", e.id)} style={clubVars(lead.color, { "--i": Math.min(i, 12) })} id={"ev-" + e.id}>
      {lead.logo ? <img className="wm" src={lead.logo} alt="" aria-hidden="true" loading="lazy" /> : null}
      <DatePane e={e} />
      <div className="body">
        <h4>{e.title}</h4>
        <div className="meta">{metaLine(e)}</div>
        <div className="tags">
          {e.clubs.map(c => <ClubChip key={c} id={c} />)}
          {e.cancelled ? <Status kind="bad" text={t("cancelled")} /> : null}
          {newIds.has(e.id) ? <Status kind="new" text={t("new_tag")} /> : null}
          {e.members ? <Status kind="" ic="lock" text={t("members_only")} /> : null}
          {isPast(e) ? null : <DeadlineTag e={e} />}
        </div>
      </div>
      <div className="side">
        <StarButton e={e} />
        {e.image ? <img className="thumb" src={e.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      </div>
    </a>
  );
}

/** the loading placeholder of a list row */
export function Skel() {
  return <div className="skel" aria-hidden="true"><div className="b d"></div><div><div className="b t"></div><div className="b m"></div><div className="b m s"></div></div></div>;
}
