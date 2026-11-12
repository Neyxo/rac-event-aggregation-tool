// What is Rotaract?: the scroll morph (Learn, Help, Celebrate open one after the other, or on a tap), then the people line, the call to
// action, the help links and the questions. The top bar carries a share button while this screen is shown.
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { ScreenProps } from "../App";
import { t } from "../i18n";
import { nClubs } from "../lib/data";
import { BRAND, vars } from "../lib/color";
import type { Pillar } from "../lib/pillars";
import { shareUrl } from "../lib/share";
import { CtaBlock, Footer, HelpLinks, Icon, PillarPic, QaList, share, useData, useEventListener, useStickyHeads, useWash } from "../components";

const PILLARS: { k: Pillar; color: string; word: string; text: string }[] = [
  { k: "learn", color: BRAND.azure, word: t("ab_learn"), text: t("ab_learn_t") },
  { k: "help", color: BRAND.green, word: t("ab_help"), text: t("ab_help_t") },
  { k: "party", color: BRAND.cranberry, word: t("ab_party"), text: t("ab_party_t") },
];
const QA = [1, 2, 3, 4, 5] as const;
const CLOSED_COLOR = BRAND.cranberry;

/** the top bar's share button on this screen (App's route table puts it there) */
export function ShareButton() {
  return (
    <button className="hbtn" type="button" title={t("ab_share")} onClick={() => void share({ title: t("ab_title"), text: t("ab_lead"), url: shareUrl("about") })}>
      <Icon name="share" />
      <span>{t("share")}</span>
    </button>
  );
}

/** cur: -2 not measured yet, -1 closed, 0..2 that word open. all: every word open (reduced motion), until the phase next changes. */
interface Phase { cur: number; all: boolean }

// The scroll range of the track: a short closed start (a small scroll already opens Learn), then a third for each word. Each third's
// middle is a proximity snap point (app.css .snap), so a scroll that ends near a word settles on it, while a long fling still goes
// straight through to the end.
const CLOSED = 0.05;
const MIDS = [0, 1, 2].map(i => CLOSED + (1 - CLOSED) * (i + 0.5) / 3);

/** The phase from the scroll position, with a little hysteresis so it never flickers at a boundary. */
function usePhase(track: RefObject<HTMLDivElement | null>): Phase {
  const [phase, setPhase] = useState<Phase>({ cur: -2, all: false });
  const measure = () => {
    const tr = track.current;
    if (!tr) return;
    const range = tr.offsetHeight - innerHeight, top = tr.getBoundingClientRect().top;
    const p = range > 0 ? Math.min(1, Math.max(0, -top / range)) : 1;
    // -1 below CLOSED, then 0..3 across the thirds
    const raw = p < CLOSED ? -1 + p / CLOSED : (p - CLOSED) / (1 - CLOSED) * 3;
    setPhase(ph => {
      const next = Math.max(-1, Math.min(2, Math.floor(raw + (raw > ph.cur ? -0.06 : 0.06))));
      return next === ph.cur ? ph : { cur: next, all: false };
    });
  };
  useEventListener("scroll", () => measure());
  useEventListener("resize", () => measure());
  useLayoutEffect(() => {
    measure();
    // reduced motion: everything open at first (no scroll-driven reveal); the next phase change takes over again
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) setPhase(ph => ({ ...ph, all: true }));
  }, []);
  return phase;
}

/** scrolls to the middle of word i's third of the track, so a tap on a word opens it like scrolling there would */
function scrollToWord(track: HTMLDivElement | null, i: number) {
  if (!track) return;
  const range = track.offsetHeight - innerHeight;
  if (range <= 0) return;
  window.scrollTo({ top: scrollY + track.getBoundingClientRect().top + range * MIDS[i]!, behavior: "smooth" });
}

function Stage({ phase, onWord }: { phase: Phase; onWord: (i: number) => void }) {
  const { cur, all } = phase;
  const color = cur < 0 ? CLOSED_COLOR : PILLARS[cur]!.color;
  return (
    <div className="stage" style={cur === -2 ? undefined : vars({ "--p": color })}>
      <div className="prog" aria-hidden="true">
        {PILLARS.map((p, i) => <i key={p.k} className={i === cur ? "on" : undefined} />)}
      </div>
      <div className={cur === -1 && !all ? "words closed" : "words"}>
        {PILLARS.map((p, i) => (
          <div key={p.k} className={all || i === cur ? "w on" : "w"} style={vars({ "--p": p.color })}>
            <div className="word" role="button" tabIndex={0} onClick={() => onWord(i)} onKeyDown={ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); onWord(i); } }}>{p.word + "."}</div>
            <div className="open">
              <div>
                <div className="pic"><PillarPic k={p.k} /></div>
                <p>{p.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hint" aria-hidden="true"><span>{t("scroll")}</span><i>⌄</i></div>
    </div>
  );
}

export default function About(_props: ScreenProps) {
  const D = useData();
  useWash(BRAND.azure, BRAND.green, BRAND.cranberry);
  useStickyHeads();
  const track = useRef<HTMLDivElement>(null);
  const phase = usePhase(track);
  return (
    <main className="wrap about">
      <div className="track" ref={track}>
        {MIDS.map(m => <i key={m} className="snap" aria-hidden="true" style={vars({ "--at": m })} />)}
        <Stage phase={phase} onWord={i => scrollToWord(track.current, i)} />
      </div>
      <section className="after">
        <h2>{t("ab_people")}</h2>
        <p className="lead">{t("ab_people_t", { n: nClubs() })}</p>
        {!D.clubs[D.settings.home] && <CtaBlock />}
        <h3 className="sh">{t("read_on")}</h3>
        <HelpLinks keys={["guide", "words", "intl", "world", "family"]} />
        <h3 className="sh">{t("faq")}</h3>
        <div className="qa"><QaList items={QA.map(i => [t(`ab_q${i}`), t(`ab_a${i}`)])} /></div>
        <div id="foot"><Footer /></div>
      </section>
    </main>
  );
}
