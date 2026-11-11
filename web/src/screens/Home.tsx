// Home: for a member, a personal overview (greeting, next event, what changed, deadlines, saved) above the
// upcoming events of their clubs; for a guest, "explore mode" (an invitation, the club finder, events near them). The welcome steps
// (onboarding dialog) open from ?welcome, from "Get started", or on the first start of the installed app.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { t } from "../i18n";
import { club, freshNews, myClubs } from "../lib/data";
import { clubVars, cx } from "../lib/color";
import { dayN, isPast } from "../lib/dates";
import { devFlag } from "../lib/dev";
import { whatChanged, type Changes } from "../lib/changes";
import { hasFilters, isFilterLink, scopeClubs, selectEvents } from "../lib/filters";
import { standalone } from "../lib/install";
import { href, takeWelcome } from "../lib/route";
import { here, store } from "../lib/store";
import type { Event } from "../lib/types";
import {
  ClubChip, CtaBlock, HelpLinks, Icon, NewIds, NewsStrip, NextUp, inPageLink, navigate, useData, useNav, useStickyHeads,
  useStored, useWash,
} from "../components";
import type { ScreenProps } from "../App";
import { Foot, ListHead, Results, StaleBanner, summaryText, useFilters, Views } from "./EventList";
import { Onboarding } from "./Onboarding";

/** my clubs' upcoming events */
const mineEvents = (events: Event[], mine: string[]): Event[] => events.filter(e => e.clubs.some(c => mine.includes(c)) && !isPast(e));
const NOTHING_NEW: ReadonlySet<string> = new Set();
const dLabel = (n: number) => n === 0 ? t("today") : n === 1 ? t("tomorrow") : t("d_short", { n });

// ---------- the member overview

/** a pane row: colour bar, title, days left, chevron */
function Row({ e, label, soon = false }: { e: Event; label: string; soon?: boolean }) {
  return (
    <a className={cx("r", soon && "soon")} href={href("event", e.id)} style={clubVars(club(e.clubs[0] ?? "").color)}>
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
  const D = useData();
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

// ---------- the screen

/** A new navigation to Home (its tab from #/?view=saved, back/forward) starts over from the URL; App only
 *  remounts a screen when the route name changes. */
export default function Home({ route }: ScreenProps) {
  const id = useNav().id;
  // a shared link with filters is about all of Rotaract, not "my clubs": Discover has the UI for it. Redirected at once, without
  // waiting for the data, and without drawing Home (which would count its events as seen).
  const toDiscover = isFilterLink(route.query);
  useLayoutEffect(() => { if (toDiscover) navigate(href("discover", null, route.query), { replace: true }); }, [toDiscover]);
  return toDiscover ? null : <HomeScreen key={id} route={route} />;
}

function HomeScreen({ route }: ScreenProps) {
  const D = useData();
  const mine = myClubs();
  const member = mine.length > 0;
  const api = useFilters(route.query, "home", f => member ? f : { ...f, center: here.get() });
  const [obRun, setObRun] = useState(0);
  // a guest's list title is only decided in the "upcoming" view; the saved view keeps the last one, so it doesn't flip to a generic title
  const guestTitle = useRef<"v_all" | "explore_near" | "home_soon">("v_all");
  useStickyHeads();

  useEffect(() => {
    const shared = [...route.query.keys()].some(k => k !== "lang" && k !== "welcome");
    if (takeWelcome() || (standalone() && !shared && !store.get("rac.onboarded", false))) setObRun(1);
  }, []);

  // what changed since the last visit: computed once per set of clubs (store writes below would change the answer for a redraw)
  const mineKey = mine.join();
  const changes = useMemo(() => member ? whatChanged(mineEvents(D.data.events, mine), store.get("rac.seen", null), store.get("rac.seenPrev", null), Date.now(), !!devFlag("New")) : null, [mineKey]);
  useEffect(() => {
    if (changes?.seenPrev) store.set("rac.seenPrev", changes.seenPrev);
    if (changes?.seen) store.set("rac.seen", changes.seen);
  }, [changes]);
  const mineEv = member ? mineEvents(D.data.events, mine) : [];
  const main = D.settings.home || mine[0] || "";
  const cols = member ? [main, ...mine.filter(id => id !== main)] : [];
  useWash(...cols.slice(0, 3).map(id => club(id).color), member && "#d41367", member && "#0067c8");

  const news = member ? mine.flatMap(id => freshNews(club(id))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4) : [];
  const f = api.shown;
  const skip = member ? mineEv[0]?.id : undefined;
  const res = f ? selectEvents(D.data.events, f, { page: "home", mine, saved: D.saved, skip, scope: scopeClubs("home", mine), club }) : null;
  if (res?.title) guestTitle.current = res.title;
  const title = member ? t("home_soon") : t(guestTitle.current);
  // the cards tag the events new since the last visit, here only: Discover, Calendar or a club screen tag nothing
  return (
    <NewIds.Provider value={changes?.newIds ?? NOTHING_NEW}>
      <StaleBanner />
      <main className="wrap" id="main">
        <div className="home">
          {changes ? <MemberBox cols={cols} mineEv={mineEv} changes={changes} /> : null}
          {!member ? <ExploreBox onStart={() => setObRun(n => n + 1)} onPlace={pos => api.update({ center: pos }, true)} /> : null}
        </div>
        {/* in the main flow next to the list title, not in a wrapper: the heading then stays stuck until the title pushes it */}
        {news.length ? <h3 className="sh hn">{t("news")}</h3> : null}
        {news.length ? <NewsStrip items={news} className="strip teasers hn" /> : null}
        <ListHead titleId="listTitle" title={title} summary={res && f ? summaryText(res, f) : t("loading")} clear={!!f && hasFilters(f)} onClear={api.clear} />
        <Views views={["all", "saved"]} pressed={api.live.view} onPick={api.setView} />
        <Results res={res} view={f?.view ?? "all"} onClear={api.clear} />
        <Foot />
      </main>
      <Onboarding run={obRun} />
    </NewIds.Provider>
  );
}
