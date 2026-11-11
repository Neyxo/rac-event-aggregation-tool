// The welcome steps: the onboarding dialog Home opens from ?welcome, from "Get started", or on the first start of the installed app.
// A member: welcome, clubs, calendar, install. A guest: welcome, three slides, clubs near, install.
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { t } from "../i18n";
import { club, isRac, myClubs, setSettings, withAlsoToggled, withHome } from "../lib/data";
import { BRAND, cx, vars } from "../lib/color";
import { guessClubs } from "../lib/geo";
import { install, isInstalled } from "../lib/install";
import type { Pillar } from "../lib/pillars";
import { href } from "../lib/route";
import { store } from "../lib/store";
import type { Settings } from "../lib/types";
import { ClubChips, FeedRow, PillarPic, toast, useData, useInstallPrompt, useModal } from "../components";

interface Ob {
  /** the clubs being chosen; saved on finish */
  s: Settings;
  /** null on the first step, which asks */
  member: boolean | null;
  step: number;
  /** clubs near the approximate position (or per language) */
  guess: string[];
  /** finished: the dialog stays closed, its last step still in it */
  done?: boolean;
}

function ObNav({ next, skip, onNext, onSkip }: { next: string; skip?: string; onNext: () => void; onSkip?: () => void }) {
  return (
    <div className="nav">
      {skip ? <button className="skip" type="button" onClick={onSkip}>{skip}</button> : <span />}
      <button className="btn" type="button" onClick={onNext}>{next}</button>
    </div>
  );
}

function InstallHow({ onDone }: { onDone: () => void }) {
  const prompt = useInstallPrompt();
  if (isInstalled()) return <p>{t("ob_installed")}</p>;
  if (prompt) return <button className="btn" type="button" onClick={() => void install().then(onDone)}>{t("inst_btn")}</button>;
  return <p className="meta">{t("inst_text")} <a href={href("settings") + "#install"}>{t("settings")}</a></p>;
}

const SLIDES: [k: "who" | "what" | "how", color: string, pic: Pillar][] = [["who", BRAND.azure, "learn"], ["what", BRAND.green, "help"], ["how", BRAND.cranberry, "party"]];
const PILLARS: [Pillar, string][] = [["learn", BRAND.azure], ["help", BRAND.green], ["party", BRAND.cranberry]];
const SLIDE_TITLE = { who: "ob_who", what: "ob_what", how: "ob_how" } as const;

/** a guest's slides 1-3: who we are, what we do, how to start */
function Slide({ step, title }: { step: number; title: ReactNode }) {
  const [k, color, pic] = SLIDES[step - 1]!;
  return (
    <div className="slide" style={vars({ "--p": color })}>
      <PillarPic k={pic} />
      {title}
      {k === "what" ? (
        <div className="pill">
          {PILLARS.map(([w, c]) => <p key={w} style={vars({ "--p": c })}><b>{t(`ab_${w}`) + "."}</b>{" " + t(`ab_${w}_t`)}</p>)}
        </div>
      ) : <p>{t(k === "who" ? "ab_lead" : "ob_how_t")}</p>}
    </div>
  );
}

/** One step of the welcome. A member: welcome, clubs, calendar, install (4). A guest: welcome, three slides, clubs near, install (6). */
function ObStep({ ob, set, finish, h2 }: { ob: Ob; set: (o: Partial<Ob>) => void; finish: (s: Settings) => void; h2: RefObject<HTMLHeadingElement | null> }) {
  const { s, member, step, guess } = ob;
  const D = useData();
  const toggleAlso = (id: string) => set({ s: withAlsoToggled(s, id) });
  const title = (text: string) => <h2 id="obTitle" tabIndex={-1} ref={h2}>{text}</h2>;
  if (step === 0) {
    const yes = async () => {
      const g = await guessClubs(D.data.clubs);
      // a member without clubs yet starts from the guess: the nearest as the main club
      const next = s.home ? s : { home: g[0] ?? "", also: g.slice(1) };
      set({ member: true, guess: g, s: next, step: 1 });
    };
    const no = async () => {
      const g = await guessClubs(D.data.clubs);
      set({ member: false, guess: g, step: 1 });
    };
    return (
      <>
        {title(t("ob_welcome"))}
        <p>{t("ob_member_q")}</p>
        <div className="choice">
          <button className="btn big" type="button" onClick={() => void yes()}>{t("ob_member")}</button>
          <button className="btn big alt" type="button" onClick={() => void no()}>{t("ob_guest")}</button>
        </div>
      </>
    );
  }
  if (member && step === 1) {
    return (
      <>
        {title(t("ob_q"))}
        <p>{s.home ? t("ob_pre") : t("ob_pick")}</p>
        <h3>{t("ob_main")}</h3>
        <ClubChips single selected={s.home} onPick={id => set({ s: withHome(s, id) })} />
        <h3>{t("ob_also")}</h3>
        <ClubChips selected={new Set(s.also)} onPick={toggleAlso} exclude={[s.home]} />
        <ObNav next={t("next")} skip={t("skip")} onNext={() => set({ step: 2 })} onSkip={() => finish(s)} />
      </>
    );
  }
  if (member && step === 2) {
    const ids = [s.home, ...s.also].filter(id => D.clubs[id]);
    return (
      <>
        {title(t("ob_sub"))}
        <p>{t("ob_sub_text")}</p>
        <div className="feeds stack">
          {ids.map(id => <FeedRow key={id} c={club(id)} />)}
          {ids.length ? <p className="meta" style={{ margin: "4px 0 0" }}>{t("ob_or")}</p> : null}
          <FeedRow name={t("all_feed_short")} />
          <p className="meta" style={{ margin: "6px 0 0" }}>{t("ob_help")}<a href={href("subscribe")} target="_blank">{t("ob_help_link")}</a></p>
        </div>
        <ObNav next={t("next")} skip={t("not_now")} onNext={() => set({ step: 3 })} onSkip={() => set({ step: 3 })} />
      </>
    );
  }
  if (!member && step <= 3) {
    // Skip jumps to the clubs
    return (
      <>
        <Slide step={step} title={title(t(SLIDE_TITLE[SLIDES[step - 1]![0]]))} />
        <ObNav next={t("next")} skip={t("skip")} onNext={() => set({ step: step + 1 })} onSkip={() => set({ step: 4 })} />
      </>
    );
  }
  if (!member && step === 4) {
    const near = guess.length ? guess : D.data.clubs.filter(isRac).slice(0, 4).map(c => c.id);
    return (
      <>
        {title(t("ob_follow"))}
        <p>{t("ob_guest_text")}</p>
        <ClubChips selected={new Set(s.also)} onPick={toggleAlso} only={near} />
        <ObNav next={t("next")} skip={t("skip")} onNext={() => set({ step: 5 })} onSkip={() => finish(s)} />
      </>
    );
  }
  return (
    <>
      {title(t("ob_inst"))}
      <p>{t("ob_inst_text")}</p>
      <InstallHow onDone={() => finish(s)} />
      <ObNav next={t("done")} onNext={() => finish(s)} />
      <div className="credit">{t("credit_short")}</div>
    </>
  );
}

/** The welcome dialog. It stays mounted, so its content stays while it closes; run > 0 (re)starts it. */
export function Onboarding({ run }: { run: number }) {
  const D = useData();
  const dlg = useRef<HTMLDialogElement>(null);
  const h2 = useRef<HTMLHeadingElement>(null);
  const [ob, setOb] = useState<Ob | null>(null);
  useEffect(() => {
    if (run) setOb({ s: { home: D.settings.home, also: [...D.settings.also] }, member: null, step: 0, guess: [] });
  }, [run]);
  // every step (and every chip tap) puts the focus on the title, so a screen reader reads where it is; finished, it closes
  useModal(dlg, !!ob && !ob.done, { focus: h2, refocus: ob });
  const finish = (s: Settings) => {
    setSettings(s);
    store.set("rac.onboarded", true);
    setOb(o => o && { ...o, done: true });
    const mine = myClubs();
    if (mine.length) toast(t("ob_showing", { clubs: mine.map(id => club(id).short).join(", ") }));
  };
  const set = (o: Partial<Ob>) => setOb(cur => cur && { ...cur, ...o });
  return (
    <dialog className={cx("ob", ob?.member === false && "full")} id="ob" aria-labelledby="obTitle" ref={dlg}
      onCancel={ev => { ev.preventDefault(); if (ob) finish(ob.s); }}>
      <div className="ob-in">
        {ob ? <Bar n={ob.member === false ? 6 : 4} step={ob.step} /> : null}
        {ob ? <ObStep ob={ob} set={set} finish={finish} h2={h2} /> : null}
      </div>
    </dialog>
  );
}

/** the progress dots */
function Bar({ n, step }: { n: number; step: number }) {
  return <div className="bar2" aria-hidden="true">{Array.from({ length: n }, (_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>;
}
