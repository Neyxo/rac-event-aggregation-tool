// The welcome steps: the onboarding dialog Home opens on the first visit, from ?welcome and from "Get started".
// In the browser it first offers the app (step -1); installed, it stops there: the welcome goes on in the app.
// A member: welcome, clubs, good to know, calendar. A guest: welcome, three slides, clubs near.
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { t, tx } from "../../i18n";
import { club, getData, isRac, myClubs, setSettings, withAlsoToggled, withHome } from "../../lib/data";
import { BRAND, cx, vars } from "../../lib/color";
import { guessClubs } from "../../lib/geo";
import { appUrl, chromeUrl, install, isInstalled } from "../../lib/install";
import { guessOS } from "../../lib/geo";
import type { Pillar } from "../../lib/pillars";
import { store } from "../../lib/store";
import type { Settings } from "../../lib/types";
import {
  ClubChips,
  copy,
  feedsFor,
  Icon,
  PillarPic,
  toast,
  useData,
  useInstallPrompt,
  useModal,
  useSubFlow,
  type IconName,
} from "../../components";

interface Ob {
  /** the clubs being chosen; saved on finish */
  s: Settings;
  /** null on the first step, which asks */
  member: boolean | null;
  /** -1: the app first (in a browser) */
  step: number;
  /** clubs near the approximate position (or per language) */
  guess: string[];
  /** finished: the dialog stays closed, its last step still in it */
  done?: boolean;
}

function ObNav({
  next,
  skip,
  onNext,
  onSkip,
}: {
  next: string;
  skip?: string;
  onNext: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="nav">
      {skip ? (
        <button className="skip" type="button" onClick={onSkip}>
          {skip}
        </button>
      ) : (
        <span />
      )}
      <button className="btn" type="button" onClick={onNext}>
        {next}
      </button>
    </div>
  );
}

const HOW = { ios: "g_ios", android: "g_android", desktop: "g_desktop" } as const;
/** The app first: one big button, and a faint way past it. With the browser's prompt the button installs, in whatever browser
 *  this is; without one (iPhone, Firefox, DuckDuckGo, inside another app) it shows this system's three steps, with the way to
 *  the browser they name: a link to Chrome on Android, and the address to copy. Installed, the website's part is over. */
function InstallStep({ title, onWeb }: { title: (text: string) => ReactNode; onWeb: () => void }) {
  const prompt = useInstallPrompt();
  const [how, setHow] = useState(false);
  const web = (k: "ob_web" | "ob_web_back") => (
    <button className="skip web" type="button" onClick={onWeb}>
      {t(k)}
    </button>
  );
  if (isInstalled())
    return (
      <>
        {title(t("ob_inst_done"))}
        <p>{t("ob_inst_done_t")}</p>
        {web("ob_web_back")}
      </>
    );
  if (how)
    return (
      <>
        {title(t("inst_btn"))}
        <ol className="qsteps">
          {tx(HOW[guessOS()]).map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <div className="links">
          {chromeUrl() && (
            <a className="linkbtn primary" href={chromeUrl()!}>
              <Icon name="ext" />
              {t("inst_chrome")}
            </a>
          )}
          <button className="linkbtn" type="button" onClick={() => void copy(appUrl())}>
            {t("copy_link")}
          </button>
        </div>
        <p>{t("ob_inst_then")}</p>
        {web("ob_web")}
      </>
    );
  return (
    <>
      {title(t("ob_inst"))}
      <div className="choice">
        <button
          className="btn big"
          type="button"
          onClick={() => {
            if (prompt) void install();
            else setHow(true);
          }}
        >
          {t("inst_btn")}
        </button>
        {web("ob_web")}
      </div>
    </>
  );
}

const FACT_IC: IconName[] = ["eye", "refresh", "ext"];
/** the calendar step: the same flow as everywhere, for the clubs just chosen; "Not now" and its end both finish the welcome */
function SubStep({ ids, title, onDone }: { ids: string[]; title: (text: string) => ReactNode; onDone: () => void }) {
  const f = useSubFlow(feedsFor(useData(), ids), { pickTitle: t("ob_sub") });
  return (
    <>
      <div className="obhead">
        {f.back && (
          <button className="obback" type="button" aria-label={t("back")} onClick={f.back}>
            <Icon name="back" />
          </button>
        )}
        {title(f.title)}
      </div>
      {f.body}
      <div className="nav">
        {f.finished ? (
          <span />
        ) : (
          <button className="skip" type="button" onClick={onDone}>
            {t("not_now")}
          </button>
        )}
        {f.finished ? (
          <button className="btn" type="button" onClick={onDone}>
            {t("done")}
          </button>
        ) : (
          f.primary
        )}
      </div>
    </>
  );
}

const SLIDES: [k: "who" | "what" | "how", color: string, pic: Pillar][] = [
  ["who", BRAND.azure, "learn"],
  ["what", BRAND.green, "help"],
  ["how", BRAND.cranberry, "party"],
];
const PILLARS: [Pillar, string][] = [
  ["learn", BRAND.azure],
  ["help", BRAND.green],
  ["party", BRAND.cranberry],
];
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
          {PILLARS.map(([w, c]) => (
            <p key={w} style={vars({ "--p": c })}>
              <b>{t(`ab_${w}`) + "."}</b>
              {" " + t(`ab_${w}_t`)}
            </p>
          ))}
        </div>
      ) : (
        <p>{t(k === "who" ? "ab_lead" : "ob_how_t")}</p>
      )}
    </div>
  );
}

/** One step of the welcome. A member: welcome, clubs, good to know, calendar (4). A guest: welcome, three slides, clubs near (5). */
function ObStep({
  ob,
  set,
  finish,
  h2,
}: {
  ob: Ob;
  set: (o: Partial<Ob>) => void;
  finish: (s: Settings) => void;
  h2: RefObject<HTMLHeadingElement | null>;
}) {
  const { s, member, step, guess } = ob;
  const D = useData();
  const toggleAlso = (id: string) => set({ s: withAlsoToggled(s, id) });
  const title = (text: string) => (
    <h2 id="obTitle" tabIndex={-1} ref={h2}>
      {text}
    </h2>
  );
  if (step < 0) return <InstallStep title={title} onWeb={() => set({ step: 0 })} />;
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
          <button className="btn big" type="button" onClick={() => void yes()}>
            {t("ob_member")}
          </button>
          <button className="btn big alt" type="button" onClick={() => void no()}>
            {t("ob_guest")}
          </button>
        </div>
      </>
    );
  }
  if (member && step === 1) {
    return (
      <>
        {title(t("ob_q"))}
        {s.home ? null : <p>{t("ob_pick")}</p>}
        <h3>{t("ob_main")}</h3>
        <ClubChips single selected={s.home} onPick={(id) => set({ s: withHome(s, id) })} />
        <h3>{t("ob_also")}</h3>
        <ClubChips selected={new Set(s.also)} onPick={toggleAlso} exclude={[s.home]} />
        <ObNav next={t("next")} skip={t("skip")} onNext={() => set({ step: 2 })} onSkip={() => finish(s)} />
      </>
    );
  }
  if (member && step === 2) {
    return (
      <>
        {title(t("app_know_h"))}
        <ul className="facts2 big">
          {tx("ob_facts").map((f, i) => (
            <li key={i}>
              <Icon name={FACT_IC[i] ?? "info"} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <ObNav next={t("next")} onNext={() => set({ step: 3 })} />
      </>
    );
  }
  if (member) return <SubStep ids={[s.home, ...s.also]} title={title} onDone={() => finish(s)} />;
  if (!member && step <= 3) {
    // Skip jumps to the clubs
    return (
      <>
        <Slide step={step} title={title(t(SLIDE_TITLE[SLIDES[step - 1]![0]]))} />
        <ObNav
          next={t("next")}
          skip={t("skip")}
          onNext={() => set({ step: step + 1 })}
          onSkip={() => set({ step: 4 })}
        />
      </>
    );
  }
  const near = guess.length
    ? guess
    : D.data.clubs
        .filter(isRac)
        .slice(0, 4)
        .map((c) => c.id);
  return (
    <>
      {title(t("ob_follow"))}
      <ClubChips selected={new Set(s.also)} onPick={toggleAlso} only={near} />
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
  // a new run starts the steps over from the settings as they are: set while rendering, no draw in between shows the old steps
  const [ran, setRan] = useState(0);
  if (run !== ran) {
    setRan(run);
    setOb({
      s: { home: D.settings.home, also: [...D.settings.also] },
      member: null,
      step: isInstalled() ? 0 : -1,
      guess: [],
    });
  }
  // every step (and every chip tap) puts the focus on the title, so a screen reader reads where it is; finished, it closes
  useModal(dlg, !!ob && !ob.done, { focus: h2, refocus: ob });
  const finish = (s: Settings) => {
    setSettings(s);
    store.set("rac.onboarded", true);
    setOb((o) => o && { ...o, done: true });
    const now = getData(); // the state setSettings() just set
    const mine = myClubs(now);
    if (mine.length) toast(t("ob_showing", { clubs: mine.map((id) => club(now, id).short).join(", ") }));
  };
  const set = (o: Partial<Ob>) => setOb((cur) => cur && { ...cur, ...o });
  return (
    <dialog
      className={cx("ob", ob?.member === false && "full")}
      id="ob"
      aria-labelledby="obTitle"
      ref={dlg}
      onCancel={(ev) => {
        ev.preventDefault();
        if (ob) finish(ob.s);
      }}
    >
      <div className="ob-in">
        {ob && ob.step >= 0 ? <Bar n={ob.member === false ? 5 : 4} step={ob.step} /> : null}
        {ob ? <ObStep ob={ob} set={set} finish={finish} h2={h2} /> : null}
      </div>
    </dialog>
  );
}

/** the progress dots */
function Bar({ n, step }: { n: number; step: number }) {
  return (
    <div className="bar2" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <i key={i} className={i <= step ? "on" : ""} />
      ))}
    </div>
  );
}
