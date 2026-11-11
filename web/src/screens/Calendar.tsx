// Calendar: the month fills the screen, no scrolling; tapping a day slides up a frosted sheet with that day's events.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ScreenProps } from "../App";
import { t, tx } from "../i18n";
import type { Event } from "../lib/types";
import { byDay, calendarEvents, monthGrid } from "../lib/calendar";
import { fmt, sameDay, startOfDay } from "../lib/dates";
import { club, myClubs } from "../lib/data";
import { clubVars, cx, vars } from "../lib/color";
import { EventCard, useData, useEventListener, useModal } from "../components";

type Scope = "mine" | "all";
/** what the sheet shows; kept after closing so the content stays while it slides away */
interface SheetContent { day: Date; evs: Event[] }

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// Every event is in its cell. A day first gets as many title lines per event as it has room for (three, two, one: a tall phone shows
// more of each title, an iPhone SE one line); only then are events hidden from the end, with their number ("+2").
// This measures the laid-out cells, so it works on the DOM directly, after React has rendered them (React doesn't own --l, the chips'
// hidden or the "+n" text, so it never undoes this).
function fit(grid: HTMLElement) {
  for (const cell of grid.querySelectorAll<HTMLElement>(".day")) {
    const chips = [...cell.querySelectorAll<HTMLElement>(".ch")];
    const more = cell.querySelector<HTMLElement>(".more");
    if (!more) continue;
    for (const c of chips) c.hidden = false;
    more.hidden = true;
    for (const l of [3, 2, 1]) {
      cell.style.setProperty("--l", String(l));
      if (cell.scrollHeight <= cell.clientHeight + 1) break;
    }
    for (let n = 1; n <= chips.length && cell.scrollHeight > cell.clientHeight + 1; n++) {
      chips[chips.length - n]!.hidden = true;
      more.hidden = false;
      more.textContent = "+" + n;
    }
  }
}

// A url() inside a custom property resolves against the stylesheet that uses it (the bundled app.css under assets/), not the page:
// made absolute here so "crests/x.svg" still means the site's crests/.
const absolute = (u: string) => (u ? new URL(u, document.baseURI).href : "");

function Chip({ e }: { e: Event }) {
  const c = club(e.clubs[0] ?? "");
  return (
    <span className="ch" style={clubVars(c.color, { "--crest": `url("${absolute(c.logo)}")` })} title={e.title}>
      <i>{e.title}</i>
    </span>
  );
}

function DayCell({ d, month, now, selected, evs, onOpen }: { d: Date; month: Date; now: Date; selected: Date | null; evs: Event[]; onOpen: () => void }) {
  const cls = cx("day", d.getMonth() !== month.getMonth() && "other", sameDay(d, now) && "today");
  return (
    <button type="button" className={cls} aria-pressed={!!selected && sameDay(d, selected)} aria-label={fmt.full.format(d) + ", " + t("n_on_day", { n: evs.length })} onClick={onOpen}>
      <span className="n">{d.getDate()}</span>
      {evs.map((e, i) => <Chip key={e.id + "/" + i} e={e} />)}
      <span className="more" hidden />
    </button>
  );
}

function Grid({ month, scope, selected, onOpen }: { month: Date; scope: Scope; selected: Date | null; onOpen: (d: Date, evs: Event[]) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const g = monthGrid(month);
  const days = byDay(calendarEvents(useData().data.events, scope, myClubs()), g);
  // after every render (new month, scope, pressed day) and on resize; body already has its calpage class (the full-height column the
  // cells are measured in): App sets it in an earlier sibling's layout effect
  useLayoutEffect(() => { if (ref.current) fit(ref.current); });
  useEventListener("resize", () => { if (ref.current) fit(ref.current); });
  return (
    <div className="grid" id="grid" role="grid" style={vars({ "--rows": g.cells / 7 })} ref={ref}>
      {tx("dow").map(d => <div key={d} className="dow" role="columnheader">{d}</div>)}
      {g.days.map(d => {
        const evs = days[d.toDateString()] ?? [];
        return <DayCell key={d.toDateString()} d={d} month={month} now={now} selected={selected} evs={evs} onOpen={() => onOpen(d, evs)} />;
      })}
    </div>
  );
}

// A modal <dialog>: while open, focus is inside it and the screen behind can't be reached (not by Tab either); closed, it is gone
// (display: none). It closes in two steps so it can slide away: "open" (the slide) goes first, the dialog itself 300 ms later,
// which also hands the focus back to the tapped day. Escape (the dialog's cancel) and a tap on the dim area close it too.
function Sheet({ open, content, onClose }: { open: boolean; content: SheetContent | null; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null), title = useRef<HTMLHeadingElement>(null), y0 = useRef<number | null>(null);
  const [shown, setShown] = useState(false);
  useModal(dlg, open, { focus: title, closeAfter: 300 });  // 300: the .sheet-in transition
  useEffect(() => {
    if (!open) { setShown(false); return; }
    const id = requestAnimationFrame(() => setShown(true));  // a frame after showing, so the slide-in transitions
    return () => cancelAnimationFrame(id);
  }, [open]);
  return (
    <dialog className={cx("sheet", shown && "open")} id="sheet" aria-labelledby="sheetTitle" ref={dlg}
      onCancel={ev => { ev.preventDefault(); onClose(); }} onClick={ev => { if (ev.target === ev.currentTarget) onClose(); }}>
      <div className="sheet-in glass">
        {/* a swipe down on the handle closes the sheet */}
        <div className="handle"
          onTouchStart={ev => { y0.current = ev.touches[0]?.clientY ?? null; }}
          onTouchEnd={ev => { const y = ev.changedTouches[0]?.clientY; if (y0.current != null && y != null && y - y0.current > 40) onClose(); y0.current = null; }}>
          <i />
        </div>
        <div className="sheet-head">
          <h3 id="sheetTitle" tabIndex={-1} ref={title}>{content ? fmt.full.format(content.day) : null}</h3>
          <button type="button" className="linkbtn" id="sheetClose" onClick={onClose}>{t("close")}</button>
        </div>
        <div className="sheet-body" id="sheetBody">
          {content && (content.evs.length
            ? content.evs.map((e, i) => <EventCard key={e.id} e={e} i={i} />)
            : <p className="meta">{t("no_events_day")}</p>)}
        </div>
      </div>
    </dialog>
  );
}

export default function Calendar(_props: ScreenProps) {
  const D = useData();
  const [month, setMonth] = useState(() => firstOfMonth(new Date()));
  const [picked, setScope] = useState<Scope>("mine");
  const [day, setDay] = useState<Date | null>(null);
  const [content, setContent] = useState<SheetContent | null>(null);
  // without clubs of my own there is nothing to narrow down to: everything, and no switch
  const noClubs = !myClubs().length;
  const scope: Scope = noClubs ? "all" : picked;

  const openDay = (d: Date, evs: Event[]) => {
    setDay(d);
    setContent({ day: d, evs });
  };
  const close = () => setDay(null);
  const shiftMonth = (n: number) => setMonth(m => new Date(m.getFullYear(), m.getMonth() + n, 1));
  // today's month, and the sheet when something starts today
  const goToday = () => {
    const n = new Date();
    setMonth(firstOfMonth(n));
    const evs = calendarEvents(D.data.events, scope, myClubs()).filter(e => sameDay(new Date(e.start), n));
    if (evs.length) openDay(startOfDay(n), evs);
  };

  return (
    <>
      <main className="calwrap" id="main">
        <div className="mhead">
          <button type="button" id="prev" aria-label={t("prev_month")} onClick={() => shiftMonth(-1)}>‹</button>
          <h2 id="mtitle">{fmt.month.format(month)}</h2>
          <div className="seg scope" role="group" hidden={noClubs}>
            <ScopeButton s="mine" label={t("mine_short")} scope={scope} onPick={setScope} />
            <ScopeButton s="all" label={t("all_clubs_short")} scope={scope} onPick={setScope} />
          </div>
          <button type="button" id="todayBtn" onClick={goToday}>{t("today")}</button>
          <button type="button" id="next" aria-label={t("next_month")} onClick={() => shiftMonth(1)}>›</button>
        </div>
        <Grid month={month} scope={scope} selected={day} onOpen={openDay} />
      </main>
      <Sheet open={day !== null} content={content} onClose={close} />
    </>
  );
}

function ScopeButton({ s, label, scope, onPick }: { s: Scope; label: string; scope: Scope; onPick: (s: Scope) => void }) {
  return <button type="button" aria-pressed={scope === s} onClick={() => onPick(s)}>{label}</button>;
}
