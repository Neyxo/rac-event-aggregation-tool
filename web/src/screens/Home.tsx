// Home (old index.html + app.js): for a member, a personal overview (greeting, next event, what changed, deadlines, saved) above the
// upcoming events of their clubs; for a guest, "explore mode" (an invitation, the club finder, events near them). The welcome steps
// (onboarding dialog) open from ?welcome, from "Get started", or on the first start of the installed app.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { t } from "../i18n";
import { club, D, freshNews, isRac, myClubs, saveSettings } from "../lib/data";
import { clubVars, vars } from "../lib/color";
import { dayN, isPast } from "../lib/dates";
import { devFlag } from "../lib/dev";
import { whatChanged, type Changes } from "../lib/changes";
import { hasFilters, isFilterLink, scopeClubs, selectEvents } from "../lib/filters";
import { guessClubs } from "../lib/geo";
import type { Pillar } from "../lib/pillars";
import { href, takeWelcome } from "../lib/route";
import { here, store } from "../lib/store";
import type { Club, Event, Settings } from "../lib/types";
import {
  ClubChip, ClubChips, ClubMark, CtaBlock, GoogleLink, HelpLinks, Icon, LoadError, NewsStrip, NextUp, PillarPic,
  inPageLink, navigate, toast, useData, useNav, useRerender, useStickyHeads, useStored, useWash,
} from "../components";
import type { ScreenProps } from "../App";
import { Foot, ListHead, Results, StaleBanner, summaryText, useFilters, Views } from "./EventList";

/** the Chrome install prompt; not in TypeScript's DOM types. Caught early, so the last welcome step can offer it. */
interface InstallPrompt extends globalThis.Event { prompt(): Promise<void>; userChoice: Promise<unknown> }
let installPrompt: InstallPrompt | null = null;
if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    installPrompt = e as InstallPrompt;
  });
}
const standalone = () => matchMedia("(display-mode: standalone)").matches || !!(navigator as { standalone?: boolean }).standalone;

/** my clubs' upcoming events */
const mineEvents = (mine: string[]): Event[] => D.data.events.filter(e => e.clubs.some(c => mine.includes(c)) && !isPast(e));
const dLabel = (n: number) => n === 0 ? t("today") : n === 1 ? t("tomorrow") : t("d_short", { n });

// ---------- the member overview

/** a pane row: colour bar, title, days left, chevron */
function Row({ e, label, soon = false }: { e: Event; label: string; soon?: boolean }) {
  return (
    <a className={"r" + (soon ? " soon" : "")} href={href("event", e.id)} style={clubVars(club(e.clubs[0] ?? "").color)}>
      <i />
      <span>{e.title}</span>
      <b>{label}</b>
      <Icon name="back" className="chev" />
    </a>
  );
}

function Hello({ cols, mineEv }: { cols: string[]; mineEv: Event[] }) {
  const h = new Date().getHours();
  const week = mineEv.filter(e => dayN(e.start) < 7).length;
  return (
    <div className="hello">
      <h1>{(h < 11 ? t("greet_morning") : h < 18 ? t("greet_day") : t("greet_evening")) + " 👋"}</h1>
      <p className="sub">{week === 0 ? t("wk_none") : week === 1 ? t("wk_one") : t("wk_events", { n: week })}</p>
      <div className="chips">{cols.map(id => <ClubChip key={id} id={id} extra={id === cols[0] ? "main" : ""} />)}</div>
    </div>
  );
}

/** "2 new since your last visit · 1 moved", a jump to the list where the new ones are tagged */
function News({ changes }: { changes: Changes }) {
  if (!changes.newIds.size && !changes.moved) return null;
  return (
    <a className="news glass" {...inPageLink("results")}>
      <b>{t("news_new", { n: changes.newIds.size })}</b>
      <span>{" " + t("news_rest") + (changes.moved ? " · " + t("news_moved", { n: changes.moved }) : "")}</span>
      <Icon name="back" />
    </a>
  );
}

/** deadlines within three weeks, and the saved events (any club) */
function Panes({ mineEv }: { mineEv: Event[] }) {
  const open = mineEv.filter(e => e.deadline && dayN(e.deadline) >= 0 && dayN(e.deadline) <= 21);
  const deadlines = open.sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  const saved = D.data.events.filter(e => !isPast(e) && D.saved.has(e.id)).slice(0, 3);
  return (
    <div className="panes">
      <div className="pane glass">
        <div className="k">{t("deadline_h")}</div>
        {deadlines.length ? deadlines.map(e => <Row key={e.id} e={e} label={dLabel(dayN(e.deadline))} soon={dayN(e.deadline) <= 2} />) : <p className="m">{t("none_open")}</p>}
      </div>
      <div className="pane glass">
        <div className="k"><Icon name="star" />{t("saved_h")}</div>
        {saved.length ? saved.map(e => <Row key={e.id} e={e} label={dLabel(dayN(e.start))} />) : <p className="m">{t("none_saved")}</p>}
      </div>
    </div>
  );
}

function MemberBox({ cols, mineEv, changes }: { cols: string[]; mineEv: Event[]; changes: Changes }) {
  const guideSeen = useStored("rac.guideSeen", false);
  const next = mineEv[0];
  return (
    <>
      <Hello cols={cols} mineEv={mineEv} />
      {next ? <NextUp e={next} label={t("next_event") + " · " + club(next.clubs[0] ?? "").short} /> : null}
      <News changes={changes} />
      <Panes mineEv={mineEv} />
      {guideSeen ? null : <HelpLinks keys={["guide"]} />}
    </>
  );
}

/** explore mode: an invitation to the welcome steps, and the club finder (which also tells the list where the visitor is) */
function ExploreBox({ onStart, onPlace }: { onStart: () => void; onPlace: (pos: [number, number]) => void }) {
  return (
    <>
      <div className="explore glass">
        <div className="k">{t("explore_title")}</div>
        <p>{t("explore_lead")}</p>
        <div className="links">
          <button className="primary" type="button" onClick={onStart}>{t("ob_start")}</button>
          <a href={href("about")}>{t("explore_all")}</a>
        </div>
      </div>
      <CtaBlock onPlace={onPlace} />
    </>
  );
}

// ---------- the welcome steps

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

/** a calendar feed: Apple (webcal:), Google, the .ics file */
function FeedRow({ c, file }: { c: Club | null; file: string }) {
  const https = new URL(file, location.href).href;
  const webcal = https.replace(/^https?:/, "webcal:");
  return (
    <div className="feed">
      <div className="name" style={c ? clubVars(c.color) : undefined}>{c ? <ClubMark c={c} /> : null}{c ? c.name : t("all_feed_short")}</div>
      <div className="l"><a href={webcal}>{t("apple")}</a><GoogleLink webcal={webcal} /><a href={https}>.ics</a></div>
    </div>
  );
}

function InstallHow({ onDone }: { onDone: () => void }) {
  if (standalone()) return <p>{t("ob_installed")}</p>;
  const prompt = installPrompt;
  if (prompt) {
    const install = async () => {
      await prompt.prompt();
      await prompt.userChoice;
      onDone();
    };
    return <button className="btn" type="button" onClick={() => void install()}>{t("inst_btn")}</button>;
  }
  return <p className="meta">{t("inst_text")} <a href={href("settings") + "#install"}>{t("settings")}</a></p>;
}

const SLIDES: [k: "who" | "what" | "how", color: string, pic: Pillar][] = [["who", "#0067c8", "learn"], ["what", "#009739", "help"], ["how", "#d41367", "party"]];
const PILLARS: [Pillar, string][] = [["learn", "#0067c8"], ["help", "#009739"], ["party", "#d41367"]];
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
  const toggleAlso = (id: string) => set({ s: { ...s, also: s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id] } });
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
    const pickHome = (id: string) => set({ s: { home: id, also: s.also.filter(x => x !== id) } });
    return (
      <>
        {title(t("ob_q"))}
        <p>{s.home ? t("ob_pre") : t("ob_pick")}</p>
        <h3>{t("ob_main")}</h3>
        <ClubChips single selected={s.home} onPick={pickHome} />
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
          {ids.map(id => <FeedRow key={id} c={club(id)} file={id + ".ics"} />)}
          {ids.length ? <p className="meta" style={{ margin: "4px 0 0" }}>{t("ob_or")}</p> : null}
          <FeedRow c={null} file="all.ics" />
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

/** The welcome dialog. It is always in the page (as in the old HTML); run > 0 (re)starts it. Its content stays after it closed. */
function Onboarding({ run, onFinish }: { run: number; onFinish: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const h2 = useRef<HTMLHeadingElement>(null);
  const [ob, setOb] = useState<Ob | null>(null);
  useEffect(() => {
    if (run) setOb({ s: { home: D.settings.home, also: [...D.settings.also] }, member: null, step: 0, guess: [] });
  }, [run]);
  // every step (and every chip tap, as before) puts the focus on the title, so a screen reader reads where it is
  useEffect(() => {
    const d = dlg.current;
    if (!ob || !d || ob.done) return;
    if (!d.open) d.showModal();
    h2.current?.focus();
  }, [ob]);
  const finish = (s: Settings) => {
    D.settings = s;
    saveSettings();
    store.set("rac.onboarded", true);
    setOb(o => o && { ...o, done: true });
    dlg.current?.close();
    onFinish();
    const mine = myClubs();
    if (mine.length) toast(t("ob_showing", { clubs: mine.map(id => club(id).short).join(", ") }));
  };
  const set = (o: Partial<Ob>) => setOb(cur => cur && { ...cur, ...o });
  return (
    <dialog className={"ob" + (ob?.member === false ? " full" : "")} id="ob" aria-labelledby="obTitle" ref={dlg}
      onCancel={ev => { ev.preventDefault(); if (ob) finish(ob.s); }}>
      <div className="ob-in" id="obBody">
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

// ---------- the screen

/** A new navigation to Home (its tab from #/?view=saved, back/forward) starts over from the URL, as loading index.html did; App only
 *  remounts a screen when the route name changes. */
export default function Home({ route }: ScreenProps) {
  // a filter link only redirects (to Discover), once: no new key for the navigation that redirect makes
  const id = useNav().id;
  return <HomeScreen key={isFilterLink(route.query) ? "to-discover" : id} route={route} />;
}

function HomeScreen({ route }: ScreenProps) {
  const { ready, error } = useData();
  const rerender = useRerender();
  // a shared link with filters is about all of Rotaract, not "my clubs": Discover has the UI for it
  const [toDiscover] = useState(() => isFilterLink(route.query));
  const mine = ready ? myClubs() : [];
  const member = mine.length > 0;
  const api = useFilters(ready && !toDiscover, route.query, "home", f => member ? f : { ...f, center: here.get() });
  const [obRun, setObRun] = useState(0);
  // a guest's list title is only decided in the "upcoming" view; the saved view keeps the last one (as the old page did)
  const guestTitle = useRef<"v_all" | "explore_near" | "home_soon">("v_all");
  useStickyHeads();

  useLayoutEffect(() => {
    if (toDiscover) navigate(href("discover", null, route.query), { replace: true });
  }, []);
  useEffect(() => {
    if (!ready || toDiscover) return;
    const shared = [...route.query.keys()].some(k => k !== "lang" && k !== "welcome");
    if (takeWelcome() || (standalone() && !shared && !store.get("rac.onboarded", false))) setObRun(1);
  }, [ready]);

  // what changed since the last visit: computed once per set of clubs (store writes below would change the answer for a redraw)
  const mineKey = mine.join();
  const changes = useMemo(() => member ? whatChanged(mineEvents(mine), store.get("rac.seen", null), store.get("rac.seenPrev", null), Date.now(), !!devFlag("New")) : null, [mineKey]);
  useEffect(() => {
    if (changes?.seenPrev) store.set("rac.seenPrev", changes.seenPrev);
    if (changes?.seen) store.set("rac.seen", changes.seen);
  }, [changes]);
  // the cards read it for their NEW tag; set before they render, and emptied once they are in the DOM, so the cards of the next screen
  // (Discover, Calendar, a club) have no tag, as on the old pages
  D.newIds = changes?.newIds ?? new Set();
  useLayoutEffect(() => { D.newIds = new Set(); });

  const mineEv = member ? mineEvents(mine) : [];
  const main = D.settings.home || mine[0] || "";
  const cols = member ? [main, ...mine.filter(id => id !== main)] : [];
  useWash(...cols.slice(0, 3).map(id => club(id).color), member && "#d41367", member && "#0067c8");

  if (error) {
    return <><StaleBanner ready={false} /><main className="wrap" id="main"><LoadError /></main><Onboarding run={0} onFinish={rerender} /></>;
  }
  const news = member ? mine.flatMap(id => freshNews(club(id))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4) : [];
  const f = api.shown;
  const skip = member ? mineEv[0]?.id : undefined;
  const res = f ? selectEvents(D.data.events, f, { page: "home", mine, saved: D.saved, skip, scope: scopeClubs("home", mine), club }) : null;
  if (res?.title) guestTitle.current = res.title;
  const title = !ready ? t("v_all") : member ? t("home_soon") : t(guestTitle.current);
  const afterOb = () => {
    rerender();
    api.draw();
  };
  return (
    <>
      <StaleBanner ready={ready} />
      <main className="wrap" id="main">
        <div className="home" id="home">
          {ready && changes ? <MemberBox cols={cols} mineEv={mineEv} changes={changes} /> : null}
          {ready && !member ? <ExploreBox onStart={() => setObRun(n => n + 1)} onPlace={pos => api.update({ center: pos }, true)} /> : null}
        </div>
        {/* in the main flow next to the list title, not in a wrapper: the heading then stays stuck until the title pushes it */}
        {news.length ? <h3 className="sh hn">{t("news")}</h3> : null}
        {news.length ? <NewsStrip items={news} className="strip teasers hn" /> : null}
        <ListHead titleId="listTitle" titleKey="v_all" title={title} summary={res && f ? summaryText(res, f) : t("loading")} clear={!!f && hasFilters(f)} onClear={api.clear} />
        <Views views={["all", "saved"]} pressed={api.inited ? api.live.view : undefined} onPick={api.setView} />
        <Results res={res} view={f?.view ?? "all"} onClear={api.clear} onStar={rerender} />
        <Foot ready={ready} />
      </main>
      <Onboarding run={obRun} onFinish={afterOb} />
    </>
  );
}
