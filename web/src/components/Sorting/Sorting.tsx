// The sorting ceremony: for someone who doesn't know which club to join, a hat asks three questions (language, part of the country,
// what you are after) and names one club. The playful sibling of the club finder (CtaBlock), which opens it; loaded on the first tap.
// The verdict is computed from events.json, never drawn by chance: the same answers give the same club until the data changes.
import { useRef, useState } from "react";
import { LANGS, nEvents, t, tx, type Lang } from "../../i18n";
import { isRac } from "../../lib/data";
import { clubVars, DISTRICT_IDS, DISTRICTS, isDistrict, type District } from "../../lib/color";
import { isPast } from "../../lib/dates";
import { LANG_CLUBS } from "../../lib/geo";
import { href } from "../../lib/route";
import type { Club, Event } from "../../lib/types";
import { ClubMark } from "../Club/Club";
import { useData } from "../hooks";
import { Popup } from "../Popup/Popup";

const LANG_IDS = Object.keys(LANGS) as Lang[];
/** what you are after: many events, a small club, the international ones. The order of tx("hat_wish"). */
export const WISHES = ["many", "small", "world"] as const;
export type Answers = [Lang, District, (typeof WISHES)[number]];
/** the three questions' answers as the buttons show them, in the order of their values */
const CHOICES = [
  LANG_IDS.map((l) => [l, LANGS[l]]),
  DISTRICT_IDS.map((d, i) => [d, tx("hat_where")[i]]),
  WISHES.map((w, i) => [w, tx("hat_wish")[i]]),
] as string[][][];

/** a club's upcoming events that still take place */
const upcoming = (events: Event[], id: string): number =>
  events.filter((e) => e.clubs.includes(id) && !isPast(e) && !e.cancelled).length;
/** The club for these answers, among the real clubs (no national or pseudo-club). Points: its language 2 (lib/geo LANG_CLUBS; a club
 *  in none of its lists speaks German), its district 1, and the wish: an international club (the English-speaking ones) 2.5, so it
 *  beats the language but not language and district together; many / few upcoming events less than 1, so they only decide among
 *  the clubs that fit otherwise. A tie goes to the club that comes first in events.json. */
export function sortClub(clubs: Club[], events: Event[], [lang, district, wish]: Answers): Club | undefined {
  const pool = clubs.filter(isRac);
  const n = (c: Club) => upcoming(events, c.id);
  const max = Math.max(...pool.map(n)) + 1;
  const wishScore = (c: Club) => {
    if (wish === "world") return 2.5 * +LANG_CLUBS.en!.includes(c.id);
    return wish === "many" ? n(c) / max : 1 - n(c) / max;
  };
  const score = (c: Club) =>
    2 * +(LANG_CLUBS[lang]?.includes(c.id) ?? !Object.values(LANG_CLUBS).flat().includes(c.id)) +
    +(c.district === district) +
    wishScore(c);
  return pool.reduce<Club | undefined>((a, c) => (!a || score(c) > score(a) ? c : a), undefined);
}

/** the hat's verdict: the club with its district and what is coming up there, or that it found none */
function Verdict({ c }: { c: Club | undefined }) {
  const D = useData();
  if (!c) return <p>{t("hat_none")}</p>;
  return (
    <div style={clubVars(c.color)}>
      <p>{t("hat_verdict")}</p>
      <ClubMark c={c} />
      <b>{c.name}</b>
      <p>
        {(isDistrict(c.district) ? t(DISTRICTS[c.district].key) + " · " : "") + nEvents(upcoming(D.data.events, c.id))}
      </p>
      <a className="linkbtn primary" href={href("club", c.id)}>
        {t("hat_go")}
      </a>
    </div>
  );
}

export default function Sorting({ onClose }: { onClose: () => void }) {
  const D = useData();
  const [a, setA] = useState<string[]>([]);
  const box = useRef<HTMLDivElement>(null);
  // the tapped button goes away with its question: keyboard focus moves to the box that shows the next one, or the verdict
  const go = (next: string[]) => {
    setA(next);
    box.current?.focus();
  };
  const step = a.length;
  const done = step === CHOICES.length;
  const c = done ? sortClub(D.data.clubs, D.data.events, a as Answers) : undefined;
  return (
    <Popup
      title={t("hat_title")}
      onClose={onClose}
      className="ob hat"
      back={step ? () => setA(a.slice(0, -1)) : undefined}
      action={
        done ? (
          <button className="skip" type="button" onClick={() => go([])}>
            {t("hat_again")}
          </button>
        ) : undefined
      }
    >
      <div className={done ? "mark nod" : "mark"} aria-hidden="true">
        🎩
      </div>
      {/* one live region: a screen reader hears the next question, then the verdict */}
      <div aria-live="polite" tabIndex={-1} ref={box}>
        {!done ? (
          <>
            <p>{tx("hat_q")[step]}</p>
            <div className="choice">
              {CHOICES[step]!.map(([v, label]) => (
                <button key={v} className="btn big alt" type="button" onClick={() => go([...a, v!])}>
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <Verdict c={c} />
        )}
      </div>
    </Popup>
  );
}
