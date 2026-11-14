// Home: for a member, a personal overview (greeting, next event, what changed, deadlines, saved) above the
// upcoming events of their clubs; for a guest, "explore mode" (an invitation, the club finder, events near them). The welcome steps
// (onboarding dialog) open on the first visit, from ?welcome and from "Get started".
import { useEffect, useEffectEvent, useLayoutEffect, useState } from "react";
import { t } from "../../i18n";
import { club, freshNews, myClubs } from "../../lib/data";
import { BRAND, clubVars, cx } from "../../lib/color";
import { dayLine, dayN, isPast, racYear, racYearLabel, relDay } from "../../lib/dates";
import { devFlag } from "../../lib/dev";
import { whatChanged, type Changes } from "../../lib/changes";
import { hasFilters, isFilterLink, scopeClubs, selectEvents } from "../../lib/filters";
import { href, takeWelcome } from "../../lib/route";
import { here, store } from "../../lib/store";
import type { Event } from "../../lib/types";
import {
  ClubChip,
  CtaBlock,
  HelpLinks,
  Icon,
  MoreLink,
  SubscribeSheet,
  NewIds,
  NewsStrip,
  NextUp,
  inPageLink,
  navigate,
  useData,
  useNav,
  Sh,
  useStored,
  useWash,
} from "../../components";
import type { ScreenProps } from "../../App";
import { Foot, ListHead, Results, StaleBanner, summaryText, useFilters, Views } from "../EventList/EventList";
import { Onboarding } from "../Onboarding/Onboarding";

/** my clubs' upcoming events */
const mineEvents = (events: Event[], mine: string[]): Event[] =>
  events.filter((e) => e.clubs.some((c) => mine.includes(c)) && !isPast(e));
const NOTHING_NEW: ReadonlySet<string> = new Set();

// ---------- the member overview

/** a pane row: colour bar, title, days left, chevron */
function Row({ e, label, soon = false }: { e: Event; label: string; soon?: boolean }) {
  return (
    <a
      className={cx("r", soon && "soon")}
      href={href("event", e.id)}
      style={clubVars(club(useData(), e.clubs[0] ?? "").color)}
    >
      <i />
      <span>{e.title}</span>
      <b>{label}</b>
      <Icon name="back" className="chev" />
    </a>
  );
}

/** one muted line a day: a "did you know", or the special date's own line (lib/dates) */
function DayLine() {
  const { special, text } = dayLine();
  return (
    <p className="fact">
      {special ? null : <b>{t("dyk")} </b>}
      {text}
    </p>
  );
}

/** good morning, hello, good evening: by the hour of the day */
function greeting(hour: number): string {
  if (hour < 11) return t("greet_morning");
  return hour < 18 ? t("greet_day") : t("greet_evening");
}
/** how many of my clubs' events are in the next seven days, in words */
function weekLine(n: number): string {
  if (n === 0) return t("wk_none");
  return n === 1 ? t("wk_one") : t("wk_events", { n });
}

function Hello({ cols, mineEv }: { cols: string[]; mineEv: Event[] }) {
  const h = new Date().getHours();
  const week = mineEv.filter((e) => dayN(e.start) < 7).length;
  return (
    <div className="hello">
      <h1>{greeting(h) + " 👋"}</h1>
      <p className="sub">{weekLine(week)}</p>
      <DayLine />
      <div className="chips">
        {cols.map((id) => (
          <ClubChip key={id} id={id} extra={id === cols[0] ? "main" : ""} />
        ))}
      </div>
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
  const open = mineEv.filter((e) => e.deadline && dayN(e.deadline) >= 0 && dayN(e.deadline) <= 21);
  const deadlines = open.sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  const saved = D.data.events.filter((e) => !isPast(e) && D.saved.has(e.id)).slice(0, 3);
  return (
    <div className="panes">
      <div className="pane glass">
        <div className="k">{t("deadline_h")}</div>
        {deadlines.length ? (
          deadlines.map((e) => <Row key={e.id} e={e} label={relDay(dayN(e.deadline))} soon={dayN(e.deadline) <= 2} />)
        ) : (
          <p className="m">{t("none_open")}</p>
        )}
      </div>
      <div className="pane glass">
        <div className="k">
          <Icon name="star" />
          {t("saved_h")}
        </div>
        {saved.length ? (
          saved.map((e) => <Row key={e.id} e={e} label={relDay(dayN(e.start))} />)
        ) : (
          <p className="m">{t("none_saved")}</p>
        )}
      </div>
    </div>
  );
}

function MemberBox({ cols, mineEv, changes }: { cols: string[]; mineEv: Event[]; changes: Changes }) {
  const D = useData();
  const guideSeen = useStored("rac.guideSeen", false);
  const next = mineEv[0];
  return (
    <>
      <Hello cols={cols} mineEv={mineEv} />
      {next ? <NextUp e={next} label={t("next_event") + " · " + club(D, next.clubs[0] ?? "").short} /> : null}
      <News changes={changes} />
      <Panes mineEv={mineEv} />
      {guideSeen ? null : <HelpLinks keys={["guide"]} />}
      <SubOffer />
    </>
  );
}

/** The calendar subscription is the app's main use beyond looking, so Home offers it until opened once; later it is on every club
 *  page and in Settings. */
function SubOffer() {
  const seen = useStored("rac.subSeen", false);
  const [open, setOpen] = useState(false);
  if (seen) return null;
  return (
    <>
      <MoreLink
        to={href("subscribe")}
        title={t("home_sub")}
        sub={t("ab_sub_sub")}
        ic="calendar"
        p={BRAND.azure}
        onClick={(ev) => {
          ev.preventDefault();
          setOpen(true);
        }}
      />
      {open && (
        <SubscribeSheet
          onClose={() => {
            setOpen(false);
            store.set("rac.subSeen", true);
          }}
        />
      )}
    </>
  );
}

/** 1 to 14 July: the year that just ended, in numbers (screens/Review) */
function ReviewOffer({ member }: { member: boolean }) {
  const now = new Date();
  if (now.getMonth() !== 6 || now.getDate() > 14) return null;
  return (
    <MoreLink
      to={href("review")}
      title={t(member ? "rv_title" : "rv_title_all", { y: racYearLabel(racYear(now) - 1) })}
      sub={t("rv_offer_sub")}
      ic="star"
      p={BRAND.cranberry}
    />
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
          <button className="primary" type="button" onClick={onStart}>
            {t("ob_start")}
          </button>
          <a href={href("about")}>{t("explore_all")}</a>
        </div>
        <DayLine />
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
  useLayoutEffect(() => {
    if (toDiscover) navigate(href("discover", null, route.query), { replace: true });
  }, [toDiscover, route.query]);
  return toDiscover ? null : <HomeScreen key={id} route={route} />;
}

/** The welcome steps: on the first visit (in the browser too: there the welcome starts with the app) and when the app was opened
 *  with ?welcome, but not on a shared link. Returns the run counter for <Onboarding> and what starts them again. */
function useWelcome(query: URLSearchParams): [number, () => void] {
  const [run, setRun] = useState(0);
  // once, when Home opens, with the query it opened with
  const opened = useEffectEvent(() => {
    const shared = [...query.keys()].some((k) => k !== "lang" && k !== "welcome");
    if (takeWelcome() || (!shared && !store.get("rac.onboarded", false))) setRun(1);
  });
  useEffect(() => opened(), []);
  return [run, () => setRun((n) => n + 1)];
}

/** What changed in my clubs since the last visit (null for a guest), and the visit is remembered. Computed once per set of clubs
 *  and kept in state: remembering the visit would change the answer for a redraw. */
function useChanges(mine: string[]): Changes | null {
  const D = useData();
  const clubs = mine.join();
  const compute = () => {
    if (!mine.length) return null;
    const seen = store.get("rac.seen", null);
    const seenPrev = store.get("rac.seenPrev", null);
    return whatChanged(mineEvents(D.data.events, mine), seen, seenPrev, Date.now(), !!devFlag("New"));
  };
  const [at, setAt] = useState(() => ({ clubs, changes: compute() }));
  // other clubs (the welcome steps just finished): again, while rendering, so no draw shows the old answer
  if (at.clubs !== clubs) setAt({ clubs, changes: compute() });
  const changes = at.clubs === clubs ? at.changes : null;
  useEffect(() => {
    if (changes?.seenPrev) store.set("rac.seenPrev", changes.seenPrev);
    if (changes?.seen) store.set("rac.seen", changes.seen);
  }, [changes]);
  return changes;
}

/** The four latest news teasers of these clubs, under their heading; nothing when there are none. A fragment on purpose: in the
 *  main flow next to the list title, not in a wrapper, the heading stays stuck until the title pushes it. */
function HomeNews({ clubs }: { clubs: string[] }) {
  const D = useData();
  const news = clubs
    .flatMap((id) => freshNews(club(D, id)))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  if (!news.length) return null;
  return (
    <>
      <Sh className="hn">{t("news")}</Sh>
      <NewsStrip items={news} className="strip teasers hn" />
    </>
  );
}

/** The list's title. A member's is fixed. A guest's is only decided in the "upcoming" view (found); the saved view keeps the
 *  last one, so it doesn't flip to a generic title. */
function useListTitle(member: boolean, found: "explore_near" | "home_soon" | null | undefined): string {
  const [guestTitle, setGuestTitle] = useState<"v_all" | "explore_near" | "home_soon">("v_all");
  if (found && found !== guestTitle) setGuestTitle(found);
  return member ? t("home_soon") : t(found ?? guestTitle);
}

function HomeScreen({ route }: ScreenProps) {
  const D = useData();
  const mine = myClubs(D);
  const member = mine.length > 0;
  const api = useFilters(route.query, "home", (f) => (member ? f : { ...f, center: here.get() }));
  const [obRun, startWelcome] = useWelcome(route.query);
  const changes = useChanges(mine);
  const mineEv = member ? mineEvents(D.data.events, mine) : [];
  const main = D.settings.home || mine[0] || "";
  const cols = member ? [main, ...mine.filter((id) => id !== main)] : [];
  useWash(...cols.slice(0, 3).map((id) => club(D, id).color), member && BRAND.cranberry, member && BRAND.azure);

  const f = api.shown;
  const skip = member ? mineEv[0]?.id : undefined;
  const res = f
    ? selectEvents(D.data.events, f, {
        page: "home",
        mine,
        saved: D.saved,
        skip,
        scope: scopeClubs("home", mine),
        club: (id) => club(D, id),
      })
    : null;
  const title = useListTitle(member, res?.title);
  // the cards tag the events new since the last visit, here only: Discover, Calendar or a club screen tag nothing
  return (
    <NewIds.Provider value={changes?.newIds ?? NOTHING_NEW}>
      <StaleBanner />
      <main className="wrap" id="main">
        <div className="home">
          {changes ? <MemberBox cols={cols} mineEv={mineEv} changes={changes} /> : null}
          {!member ? <ExploreBox onStart={startWelcome} onPlace={(pos) => api.update({ center: pos }, true)} /> : null}
          <ReviewOffer member={member} />
        </div>
        <HomeNews clubs={mine} />
        <ListHead
          titleId="listTitle"
          title={title}
          summary={res && f ? summaryText(res, f) : t("loading")}
          clear={!!f && hasFilters(f)}
          onClear={api.clear}
        />
        <Views views={["all", "saved"]} pressed={api.live.view} onPick={api.setView} />
        <Results res={res} view={f?.view ?? "all"} onClear={api.clear} />
        <Foot />
      </main>
      <Onboarding run={obRun} />
    </NewIds.Provider>
  );
}
