// Adding a calendar: one flow, the same wherever it starts (the welcome steps, Home, a club's page, the calendar help screen).
// Which calendar, where (Apple, Google, Outlook, a file), then one step per page, each with a drawing of what to tap.
import { useState, type ReactNode } from "react";
import { t, tx } from "../i18n";
import { IOS, PHONE } from "../lib/geo";
import { clubVars } from "../lib/color";
import { href } from "../lib/route";
import type { Club } from "../lib/types";
import type { AppData } from "../lib/data";
import { ClubMark } from "./Club";
import { Icon } from "./Icon";
import { useData } from "./hooks";
import { copy, feedUrls, IcsDl, share, Warn } from "./Links";
import { Popup } from "./Popup";

export interface Feed { file: string; name: string; c?: Club }
type Way = "apple" | "google" | "outlook" | "ics";
type Os = "android" | "ios";
/** action: the step is a tap on this button (which also moves on); choice: a question answered in place; dead: this way can't
 *  work here, so nothing was added and there is no Done */
interface Step { text: string; vis?: ReactNode; action?: ReactNode; choice?: ReactNode; note?: string; warn?: boolean; dead?: boolean }

/** the calendars offered to someone: the given clubs (theirs, or the one whose page this is), the international events, everything */
export function feedsFor(D: AppData, ids: string[]): Feed[] {
  const clubs = [...ids.map(id => D.clubs[id]), ...D.data.clubs.filter(c => c.source === "international")].filter((c): c is Club => !!c);
  return [...[...new Set(clubs)].map(c => ({ file: c.id + ".ics", name: c.name, c })), { file: "all.ics", name: t("sp_all_feed") }];
}

// ---------- drawings

/** Apple, Google, Outlook as small calendar tiles in their colours: recognisable, not their logos */
export function WayIcon({ way }: { way: Way }) {
  const tile = { x: 2, y: 2, width: 24, height: 24, rx: 6 };
  return (
    <i className="wi">
      <svg viewBox="0 0 28 28" aria-hidden="true">
        {way === "apple" ? <><rect {...tile} fill="#fff" stroke="#d0d0d5" /><path d="M2 8a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v2H2z" fill="#ff3b30" /><text x="14" y="22" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1c1c1e">17</text></>
          : way === "google" ? <><rect {...tile} fill="#fff" stroke="#4285f4" strokeWidth="2.5" /><path d="M19 26h1a6 6 0 0 0 6-6v-1z" fill="#ea4335" /><path d="M8 25.5h11" stroke="#34a853" strokeWidth="2.5" /><path d="M25.5 8v11" stroke="#fbbc04" strokeWidth="2.5" /><text x="14" y="18.5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#4285f4">31</text></>
          : way === "outlook" ? <><rect {...tile} fill="#0f6cbd" /><circle cx="14" cy="14" r="5.5" fill="none" stroke="#fff" strokeWidth="3" /></>
          : <><rect {...tile} fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M2 10h24M9 1v4M19 1v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>}
      </svg>
    </i>
  );
}

type VisKind = "confirm" | "bar" | "send" | "app" | "menu" | "list" | "toggle" | "tick" | "file" | "done";
/** What to tap, drawn: a generic picture of the other app's screen with the one thing to tap in colour (class "hl"). Not a screenshot,
 *  so it survives their redesigns; label is the button's or row's text in this language. */
function Vis({ kind, label = "" }: { kind: VisKind; label?: string }) {
  const row = (y: number, hl = false) => <rect x="60" y={y} width="160" height="20" rx="6" className={hl ? "hl" : "ln"} />;
  const body = {
    // a dialog, the confirming button on the right
    confirm: () => <><rect x="40" y="14" width="200" height="102" rx="14" className="pn" /><rect x="58" y="32" width="120" height="8" rx="4" className="ln" /><rect x="58" y="48" width="84" height="8" rx="4" className="ln" /><rect x="58" y="78" width="60" height="26" rx="13" className="ln" /><rect x="126" y="78" width="100" height="26" rx="13" className="hl" /><text x="176" y="95" textAnchor="middle" className="on">{label}</text></>,
    // a browser, the address bar
    bar: () => <><rect x="30" y="14" width="220" height="102" rx="12" className="pn" /><rect x="44" y="26" width="192" height="26" rx="13" className="hl o" /><text x="58" y="43" className="tx">calendar.google.com/…</text><rect x="44" y="66" width="130" height="8" rx="4" className="ln" /><rect x="44" y="82" width="170" height="8" rx="4" className="ln" /><rect x="44" y="98" width="90" height="8" rx="4" className="ln" /></>,
    // from the phone to a computer
    send: () => <><rect x="52" y="24" width="44" height="82" rx="8" className="pn" /><rect x="64" y="56" width="20" height="8" rx="4" className="hl" /><path d="M108 65h44m-10-9 10 9-10 9" className="ar" /><rect x="168" y="34" width="76" height="52" rx="6" className="pn" /><path d="M158 96h96" className="ar" /><rect x="186" y="56" width="40" height="8" rx="4" className="hl" /></>,
    // the calendar app's icon on a home screen
    app: () => <><rect x="98" y="8" width="84" height="114" rx="12" className="pn" />{[0, 1, 2, 3, 5].map(i => <rect key={i} x={110 + (i % 2) * 34} y={22 + Math.floor(i / 2) * 32} width="26" height="26" rx="7" className="ln" />)}<rect x="110" y="86" width="26" height="26" rx="7" className="hl" /><text x="123" y="103" textAnchor="middle" className="on">31</text></>,
    // the menu button, then Settings
    menu: () => <><rect x="40" y="10" width="200" height="110" rx="12" className="pn" /><rect x="52" y="20" width="28" height="28" rx="14" className="hl" /><path d="M60 29h12M60 34h12M60 39h12" className="onl" />{row(56)}{row(92, true)}<rect x="60" y="80" width="160" height="6" rx="3" className="ln" /><text x="140" y="106" textAnchor="middle" className="on">{label}</text></>,
    // the list of calendars, the new one
    list: () => <><rect x="40" y="10" width="200" height="110" rx="12" className="pn" />{row(20)}{row(46)}{row(72, true)}<text x="140" y="86" textAnchor="middle" className="on">Rotaract …</text><text x="140" y="110" textAnchor="middle" className="tx">{label}</text></>,
    // a switch, on
    toggle: () => <><rect x="40" y="38" width="200" height="54" rx="14" className="pn" /><text x="60" y="70" className="tx b">{label}</text><rect x="176" y="52" width="48" height="26" rx="13" className="hl" /><circle cx="211" cy="65" r="10" className="knob" /></>,
    // a ticked box in a list
    tick: () => <><rect x="40" y="10" width="200" height="110" rx="12" className="pn" />{[24, 54, 84].map((y, i) => <g key={y}><rect x="56" y={y} width="20" height="20" rx="5" className={i === 1 ? "hl" : "ln"} /><rect x="88" y={y + 6} width={i === 1 ? 120 : 90} height="8" rx="4" className="ln" /></g>)}<path d="m60 64 5 5 8-9" className="onl" /></>,
    // a downloaded file
    file: () => <><path d="M108 14h46l22 22v80h-68z" className="pn" /><path d="M154 14v22h22" className="ar" /><rect x="122" y="60" width="40" height="8" rx="4" className="ln" /><rect x="122" y="76" width="40" height="8" rx="4" className="ln" /><text x="142" y="104" textAnchor="middle" className="tx b">.ics</text></>,
    // in the calendar
    done: () => <><circle cx="140" cy="65" r="44" className="hl" /><path d="m120 66 14 14 28-30" className="onl big" /></>,
  }[kind]();
  return <svg className="vis" viewBox="0 0 280 130" aria-hidden="true">{body}</svg>;
}

// ---------- the steps

const SYNCSELECT = "https://calendar.google.com/calendar/syncselect";
// Apple Calendar takes webcal: on an iPhone, iPad or Mac; Windows and Android have nothing that opens it
const apple = () => IOS || /Macintosh/.test(navigator.userAgent);
const OsPick = ({ os, onPick }: { os: Os; onPick: (o: Os) => void }) => (
  <div className="seg sfseg" role="group">
    {(["android", "ios"] as const).map(o => <button key={o} type="button" aria-pressed={o === os} onClick={() => onPick(o)}>{o === "ios" ? "iPhone" : "Android"}</button>)}
  </div>
);

/** Google doesn't put a newly subscribed calendar on every phone by itself (a calendar that never arrives looks like the
 *  subscription failed): on Android, Sync in the app's settings; with Apple Calendar on an iPhone, Google's sync page. */
function syncSteps(os: Os): Step[] {
  const S = tx("sf");
  const [a0 = "", a1 = "", a2 = "", a3 = ""] = S.sync_a, [i0 = "", i1 = "", i2 = ""] = S.sync_i;
  return os === "android"
    ? [{ text: a0, vis: <Vis kind="app" /> }, { text: a1, vis: <Vis kind="menu" label={S.ui_settings} /> }, { text: a2, vis: <Vis kind="list" label={S.ui_more} /> }, { text: a3, vis: <Vis kind="toggle" label={S.ui_sync} /> }]
    : [{ text: i0, action: <a className="linkbtn primary" href={SYNCSELECT} target="_blank" rel="noopener"><Icon name="ext" />{S.sync_btn}</a>, note: S.sync_note }, { text: i1, vis: <Vis kind="tick" /> }, { text: i2, vis: <Vis kind="confirm" label={S.ui_save} /> }];
}

/** The steps of one way in. A way that can't work on this device says why and what to do instead, never a tap that does nothing.
 *  via: Google on a phone, whose app can't subscribe: through this phone's browser, or through a computer. next: an action done. */
function stepsFor(way: Way, via: "phone" | "pc" | null, os: Os, setOs: (o: Os) => void, feed: Feed, next: () => void): Step[] {
  const S = tx("sf"), { https, webcal } = feedUrls(feed.file);
  const google = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(feed.name)}`;
  const open = (to: string, label: string) => <a className="linkbtn primary" href={to} target={to.startsWith("http") ? "_blank" : undefined} rel="noopener" onClick={next}><Icon name="ext" />{label}</a>;
  const send = (title: string, url: string) => <button className="linkbtn primary" type="button" onClick={() => void share({ title, url }).then(next)}><Icon name="share" />{t("sp_g_send")}</button>;
  const confirm = (text: string, label: string): Step => ({ text, vis: <Vis kind="confirm" label={label} /> });
  if (way === "ics") {
    const [, s1 = "", s2 = ""] = tx("ics_steps");
    return [{ text: t("ics_stale_feed"), warn: true, action: <IcsDl to={https} onDone={next} /> }, { text: s1, vis: <Vis kind="file" /> }, confirm(s2, S.ui_add)];
  }
  if (way === "apple") return apple() ? [{ text: S.a_open, action: open(webcal, t("way_apple")) }, confirm(S.a_confirm, S.ui_sub)] : [{ text: t("apple_na"), warn: true, dead: true, action: send(feed.name, https) }];
  if (way === "outlook") return PHONE ? [{ text: S.send, action: send(t("way_outlook"), outlook) }, { text: S.o_pc, vis: <Vis kind="send" /> }, confirm(S.o_confirm, S.ui_import)]
    : [{ text: S.o_open, action: open(outlook, t("way_outlook")) }, confirm(S.o_confirm, S.ui_import)];
  const add = confirm(S.g_confirm, S.ui_add);
  if (!PHONE) return [{ text: S.g_open, action: open(google, t("way_google")) }, add, { text: S.phone_q, choice: <OsPick os={os} onPick={setOs} /> }, ...syncSteps(os)];
  const first: Step[] = via === "pc" ? [{ text: S.send, action: send(t("way_google"), google) }, { text: S.pc, vis: <Vis kind="send" /> }]
    : [{ text: S.g_copy, action: <button className="linkbtn primary" type="button" onClick={() => void copy(google).then(next)}><Icon name="share" />{S.copy_btn}</button> }, { text: S.g_paste, vis: <Vis kind="bar" /> }];
  return [...first, add, ...syncSteps(IOS ? "ios" : "android")];
}

/** one step: where it is in the row, the drawing, the one sentence, its button */
function StepView({ s, i, n }: { s: Step; i: number; n: number }) {
  return (
    <div className="sfstep">
      {n > 1 && <p className="sfn">{tx("sf").step.replace("{i}", String(i + 1)).replace("{n}", String(n))}</p>}
      {s.vis}
      {s.warn ? <Warn>{s.text}</Warn> : <p className="sft">{s.text}</p>}
      {s.action}{s.choice}
      {s.note && <small className="pf-note">{s.note}</small>}
    </div>
  );
}
const row = (key: string, icon: ReactNode, title: string, sub: string | null, onClick: () => void, done = false) => (
  <button key={key} className="way" type="button" onClick={onClick}>
    {icon}<span><b>{title}</b>{sub && <small>{sub}</small>}</span>{done ? <b className="sfok">✓</b> : <Icon name="back" className="chev" />}
  </button>
);

/** The flow's state, for whatever frames it (a popup, the welcome steps): the title, the content, where Back goes (if anywhere),
 *  the main button (Next / Done; none while a tap on a row moves on), and whether it has reached its end.
 *  start: the calendar it is about, which skips the choice. */
export function useSubFlow(feeds: Feed[], { start, pickTitle }: { start?: Feed; pickTitle?: string } = {}): { title: string; body: ReactNode; back?: () => void; primary: ReactNode; finished: boolean } {
  const S = tx("sf");
  const [feed, setFeed] = useState<Feed | null>(start ?? null);
  const [way, setWay] = useState<Way | null>(null);
  const [via, setVia] = useState<"phone" | "pc" | null>(null);
  const [os, setOs] = useState<Os>(IOS ? "ios" : "android");
  const [i, setI] = useState(0);
  const [added, setAdded] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const again = () => { setFeed(null); setWay(null); setVia(null); setI(0); setFinished(false); };

  if (finished) return {
    title: S.done, finished, primary: null,
    body: (
      <div className="sfstep">
        <Vis kind="done" />
        <p className="sft">{S.done_t}</p>
        <div className="ways">{row("again", <Icon name="calendar" />, S.another, null, again)}</div>
        <a className="meta sfhelp" href={href("subscribe")}>{S.trouble}</a>
      </div>
    ),
  };
  if (!feed) return {
    title: pickTitle ?? S.pick, finished, primary: null,
    body: <div className="ways">{feeds.map(f => row(f.file, f.c ? <i className="sfmark" style={clubVars(f.c.color)}><ClubMark c={f.c} /></i> : <Icon name="globe" />, f.name, null, () => setFeed(f), added.includes(f.file)))}</div>,
  };
  if (!way) return {
    title: t("way_pick"), finished, primary: null, back: start && !added.length ? undefined : () => setFeed(null),
    body: (
      <div>
        <p className="sfn">{feed.name}</p>
        <div className="ways">
          {(["apple", "google", "outlook"] as const).map(w => row(w, <WayIcon way={w} />, t(`way_${w}`), t(`way_${w}_s`), () => setWay(w)))}
          <button className="sfquiet" type="button" onClick={() => setWay("ics")}>{t("way_ics") + " · " + t("way_ics_s")}</button>
        </div>
      </div>
    ),
  };
  if (way === "google" && PHONE && !via) return {
    title: S.how, finished, primary: null, back: () => setWay(null),
    body: <div className="ways">{row("phone", <Icon name="phone" />, S.on_phone, S.on_phone_s, () => setVia("phone"))}{row("pc", <Icon name="laptop" />, S.on_pc, S.on_pc_s, () => setVia("pc"))}</div>,
  };
  const end = () => { setAdded(a => [...a, feed.file]); setFinished(true); };
  // an action on the last step has nowhere to move on to
  const steps: Step[] = stepsFor(way, via, os, setOs, feed, () => setI(n => Math.min(n + 1, steps.length - 1)));
  const last = i >= steps.length - 1, s = steps[Math.min(i, steps.length - 1)]!;
  return {
    title: t(`way_${way}`), finished,
    back: () => { if (i > 0) setI(i - 1); else if (via) setVia(null); else setWay(null); },
    // a step with a button of its own: that is the thing to tap, Next stays quiet beside it
    primary: s.dead ? null : <button className={s.action && !last ? "btn quiet" : "btn"} type="button" onClick={last ? end : () => setI(i + 1)}>{last ? t("done") : t("next")}</button>,
    body: <StepView s={s} i={Math.min(i, steps.length - 1)} n={steps.length} />,
  };
}

/** The flow in a popup. club: the calendar it is about (a club's page); without one it first asks which. */
export function SubscribeSheet({ club, onClose }: { club?: Club | null; onClose: () => void }) {
  const D = useData();
  // the club itself, not looked up: a Rotary district's feed exists while its layer (and so its club) is switched off
  const start = club ? { file: club.id + ".ics", name: club.name, c: club } : undefined;
  const rest = feedsFor(D, [D.settings.home, ...D.settings.also]).filter(x => x.file !== start?.file);
  const f = useSubFlow(start ? [start, ...rest] : rest, { start });
  return <Popup title={f.title} onClose={onClose} done={t("close")} quiet back={f.back} action={f.primary}><div>{f.body}</div></Popup>;
}

/** only the phone part: the calendar is subscribed but doesn't show there (the calendar help's "Show me how") */
export function SyncSheet({ onClose }: { onClose: () => void }) {
  const S = tx("sf");
  const [os, setOs] = useState<Os>(IOS ? "ios" : "android"), [i, setI] = useState(0);
  const steps: Step[] = [{ text: S.phone_q, choice: <OsPick os={os} onPick={setOs} /> }, ...syncSteps(os)];
  const last = i >= steps.length - 1;
  return (
    <Popup title={S.sync_h} onClose={onClose} done={t("close")} quiet back={i ? () => setI(i - 1) : undefined}
      action={last ? undefined : <button className="btn" type="button" onClick={() => setI(i + 1)}>{t("next")}</button>}>
      <div><StepView s={steps[Math.min(i, steps.length - 1)]!} i={i} n={steps.length} /></div>
    </Popup>
  );
}

/** a feed's row (the developer page's list): the club (crest and name, a link to its page with link) or, without one, the all-clubs
 *  feed under name; the upcoming count when given; then the Subscribe button */
export function FeedRow({ c = null, name, count, link = false }: { c?: Club | null; name?: string; count?: number; link?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="feed">
      <div className="name" style={c ? clubVars(c.color) : undefined}>
        {c ? <ClubMark c={c} /> : null}
        <span className="nm">{c && link ? <a href={href("club", c.id)}>{c.name}</a> : c ? c.name : name ?? ""}
          {count != null ? <small className="meta">{t("n_upcoming", { n: count })}</small> : null}</span>
      </div>
      <button className="subbtn" type="button" onClick={() => setOpen(true)}><Icon name="calendar" />{t("subscribe")}</button>
      {open && <SubscribeSheet club={c} onClose={() => setOpen(false)} />}
    </div>
  );
}
