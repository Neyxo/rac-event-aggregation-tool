// Adding a calendar: one flow, the same wherever it starts (the welcome steps, Home, a club's page, the calendar help screen).
// Which calendar, where (Apple, Google, Outlook, a file), then one step per page: where you are now (this browser, a computer, the
// phone's calendar app), a drawing of what to tap there, one sentence.
import { useState, type ReactNode } from "react";
import { t, tx } from "../../i18n";
import { IOS, PHONE } from "../../lib/geo";
import { clubVars } from "../../lib/color";
import { href } from "../../lib/route";
import type { Club } from "../../lib/types";
import type { AppData } from "../../lib/data";
import { ClubMark } from "../Club/Club";
import { Icon, type IconName } from "../Icon";
import { useData } from "../hooks";
import { copy, feedUrls, IcsDl, share, Warn } from "../Links/Links";
import { Popup } from "../Popup/Popup";

export interface Feed {
  file: string;
  name: string;
  c?: Club;
}
type Way = "apple" | "google" | "outlook" | "ics";
type Os = "android" | "ios";
/** where a step happens: in the browser tab that just opened, on a computer, on the phone, in the phone's Google Calendar app */
type Ctx = "browser" | "pc" | "phone" | "gcal";
/** text: the one sentence (none when the button says it); action: the step is a tap on this button (which also moves on); alt: a
 *  quiet second way; choice: a question answered in place; dead: this way can't work here, so nothing was added and there is no Done */
interface Step {
  text?: string;
  ctx?: Ctx;
  vis?: ReactNode;
  action?: ReactNode;
  alt?: ReactNode;
  choice?: ReactNode;
  note?: string;
  warn?: boolean;
  dead?: boolean;
}

const feedOf = (c: Club): Feed => ({ file: c.id + ".ics", name: c.name, c });
/** the calendars offered first: the given clubs (theirs, or the one whose page this is), the international events, everything */
export function feedsFor(D: AppData, ids: string[]): Feed[] {
  const clubs = [...ids.map((id) => D.clubs[id]), ...D.data.clubs.filter((c) => c.source === "international")].filter(
    (c): c is Club => !!c,
  );
  return [...[...new Set(clubs)].map(feedOf), { file: "all.ics", name: t("sp_all_feed") }];
}
/** every other club, by name: behind "Another club" */
const otherFeeds = (D: AppData, shown: Feed[]): Feed[] =>
  D.data.clubs
    .filter((c) => !shown.some((f) => f.c?.id === c.id))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(feedOf);

// ---------- drawings

/** Apple's, Google's and Microsoft's own calendar icons (static/img/cal, from Wikimedia Commons; their trademarks, used to name them) */
const LOGO = { apple: "img/cal/apple.svg", google: "img/cal/google.svg", outlook: "img/cal/outlook.svg" };
export function WayIcon({ way }: { way: keyof typeof LOGO }) {
  return <img className="wi" src={LOGO[way]} alt="" width="34" height="34" />;
}

type VisKind = "confirm" | "send" | "home" | "menu" | "list" | "toggle" | "tick" | "file" | "done";
/** What to tap, drawn: the other app's screen in outline, inside a phone or a browser window so it is clear where this is, the
 *  one thing to tap in colour with a ring around it, and the new calendar with its colour dot. A drawing, not a screenshot: it
 *  survives their redesigns; the frame, the dashed border and the ring say it isn't a control of this app. label: the button's or row's text in this
 *  language. */
function Vis({ kind, label = "", phone = PHONE }: { kind: VisKind; label?: string; phone?: boolean }) {
  const S = tx("sf");
  // the ring: around a small target, or (r 10) on the corner of a labelled one, so the label stays readable
  const tap = (x: number, y: number, r = 15) => <circle cx={x} cy={y} r={r} className="tap" />;
  // the frames: a phone's upper half, a browser window's
  const ph = (
    <>
      <path d="M68 150V26a16 16 0 0 1 16-16h112a16 16 0 0 1 16 16v124" className="pn" />
      <rect x="124" y="17" width="32" height="5" rx="2.5" className="ln" />
    </>
  );
  const win = (
    <>
      <rect x="22" y="10" width="236" height="150" rx="10" className="pn" />
      {[36, 46, 56].map((x) => (
        <circle key={x} cx={x} cy="22" r="3" className="ln" />
      ))}
      <rect x="70" y="16" width="150" height="12" rx="6" className="ln" />
      <path d="M22 34h236" className="rule" />
    </>
  );
  const line = (x: number, y: number, w: number) => <rect x={x} y={y} width={w} height="6" rx="3" className="ln" />;
  const dot = (x: number, y: number, c: string) => <circle cx={x} cy={y} r="5" fill={c} />;
  const body = {
    // a dialog over the page, its confirming button
    confirm: () => {
      const w = Math.max(64, label.length * 5.4 + 20);
      const x0 = phone ? 82 : 60;
      const x1 = phone ? 198 : 220;
      return (
        <>
          {phone ? ph : win}
          <rect x={x0} y="46" width={x1 - x0} height="82" rx="10" className="pn dl" />
          {line(x0 + 12, 60, 70)}
          {line(x0 + 12, 72, 46)}
          <rect x={x1 - 10 - w} y="96" width={w} height="22" rx="11" className="hl" />
          <text x={x1 - 10 - w / 2} y="110.5" textAnchor="middle" className="on">
            {label}
          </text>
          {tap(x1 - 14, 117, 10)}
        </>
      );
    },
    // from the phone to a computer
    send: () => (
      <>
        <rect x="52" y="30" width="44" height="82" rx="8" className="pn" />
        <rect x="64" y="62" width="20" height="8" rx="4" className="hl" />
        <path d="M108 71h44m-10-9 10 9-10 9" className="ar" />
        <rect x="168" y="40" width="76" height="52" rx="6" className="pn" />
        <path d="M158 102h96" className="ar" />
        <rect x="186" y="62" width="40" height="8" rx="4" className="hl" />
      </>
    ),
    // the phone's home screen, the Google Calendar app
    home: () => (
      <>
        {ph}
        {[0, 1, 2, 3, 4, 6, 7].map((i) => (
          <rect
            key={i}
            x={84 + (i % 4) * 29}
            y={36 + Math.floor(i / 4) * 34}
            width="22"
            height="22"
            rx="6"
            className="ln"
          />
        ))}
        {tap(124, 81)}
        <image href={LOGO.google} x="113" y="70" width="22" height="22" />
      </>
    ),
    // in the app: the menu button, then its drawer, which ends in Settings (the calendar list above it doesn't have the new one yet)
    menu: () => (
      <>
        <rect x="20" y="14" width="96" height="112" rx="10" className="pn" />
        <rect x="29" y="23" width="22" height="22" rx="11" className="hl" />
        <path d="M35 30h10M35 34h10M35 38h10" className="onl thin" />
        {tap(40, 34)}
        {line(58, 31, 44)}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect
            key={i}
            x={30 + (i % 4) * 20}
            y={58 + Math.floor(i / 4) * 26}
            width="14"
            height="14"
            rx="4"
            className="ln"
          />
        ))}
        <path d="M124 70h22m-8-7 8 7-8 7" className="ar" />
        <rect x="156" y="8" width="108" height="124" rx="10" className="pn" />
        {(
          [
            ["#4285f4", 22],
            ["#34a853", 38],
            ["#fbbc04", 54],
          ] as const
        ).map(([c, y]) => (
          <g key={y}>
            <rect x="166" y={y - 5} width="10" height="10" rx="2.5" fill={c} />
            {line(184, y - 3, 54)}
          </g>
        ))}
        <path d="M156 70h108" className="rule" />
        {line(184, 80, 40)}
        <rect x="162" y="96" width="96" height="26" rx="8" className="hl" />
        <circle cx="175" cy="109" r="4.5" className="gear" />
        <text x="186" y="113" className="on">
          {label}
        </text>
        {tap(252, 120, 10)}
      </>
    ),
    // Settings: the calendars with their colour dots, the new one last, maybe behind "Show more"
    list: () => (
      <>
        {ph}
        <text x="82" y="42" className="tx b">
          {S.ui_settings}
        </text>
        {dot(88, 58, "#4285f4")}
        {line(100, 55, 70)}
        {dot(88, 76, "#34a853")}
        {line(100, 73, 52)}
        <text x="100" y="97" className="tx">
          {label}
        </text>
        <path d="m186 92 4 4 4-4" className="ar thin" />
        <rect x="78" y="106" width="124" height="26" rx="8" className="hl o" />
        {dot(90, 119, "var(--accent)")}
        <text x="102" y="123" className="tx b sm">
          Rotaract …
        </text>
        {tap(196, 130, 10)}
      </>
    ),
    // the calendar's own page: the Sync switch, on
    toggle: () => (
      <>
        {ph}
        {dot(88, 40, "var(--accent)")}
        <text x="100" y="44" className="tx b sm">
          Rotaract …
        </text>
        <path d="M76 54h128" className="rule" />
        <text x="82" y="80" className="tx b">
          {label}
        </text>
        <rect x="160" y="66" width="38" height="22" rx="11" className="hl" />
        <circle cx="187" cy="77" r="8" className="knob" />
        {tap(179, 77)}
        {line(82, 104, 70)}
        {line(82, 122, 50)}
      </>
    ),
    // Google's sync page: a ticked box in a list
    tick: () => (
      <>
        {phone ? ph : win}
        {[46, 72, 98].map((y, i) => (
          <g key={y}>
            <rect x="88" y={y} width="16" height="16" rx="4" className={i === 1 ? "hl" : "ln"} />
            {i === 1 ? (
              <>
                {dot(118, y + 8, "var(--accent)")}
                <text x="128" y={y + 12} className="tx b sm">
                  Rotaract …
                </text>
              </>
            ) : (
              line(114, y + 5, 60)
            )}
          </g>
        ))}
        <path d="m91.5 80 3.5 3.5 6-7" className="onl thin" />
        {tap(96, 80)}
      </>
    ),
    // a downloaded file
    file: () => (
      <>
        <path d="M108 18h46l22 22v80h-68z" className="pn" />
        <path d="M154 18v22h22" className="ar" />
        {line(122, 64, 40)}
        {line(122, 78, 40)}
        <text x="142" y="106" textAnchor="middle" className="tx b">
          .ics
        </text>
        {tap(142, 70)}
      </>
    ),
    // in the calendar
    done: () => (
      <>
        <circle cx="140" cy="70" r="44" className="hl" />
        <path d="m120 71 14 14 28-30" className="onl big" />
      </>
    ),
  }[kind]();
  return (
    <figure className="sfvis">
      <svg viewBox="0 0 280 140" aria-hidden="true">
        {body}
      </svg>
    </figure>
  );
}

// ---------- the steps

const SYNCSELECT = "https://calendar.google.com/calendar/syncselect";
// Apple Calendar takes webcal: on an iPhone, iPad or Mac; Windows and Android have nothing that opens it
const apple = () => IOS || /Macintosh/.test(navigator.userAgent);
/** On a phone a tapped link to calendar.google.com or outlook.live.com is handed to that calendar's app, which can't subscribe.
 *  static/go.html opens the same address by submitting a form by itself, which every browser keeps for itself: whatever the
 *  browser, no app in between, nothing to copy. */
export const goUrl = (u: string) => "go.html#" + encodeURIComponent(u);
const OsPick = ({ os, onPick }: { os: Os; onPick: (o: Os) => void }) => (
  <div className="seg sfseg" role="group">
    {(["android", "ios"] as const).map((o) => (
      <button key={o} type="button" aria-pressed={o === os} onClick={() => onPick(o)}>
        {o === "ios" ? "iPhone" : "Android"}
      </button>
    ))}
  </div>
);

/** Google doesn't put a newly subscribed calendar on every phone by itself (a calendar that never arrives looks like the
 *  subscription failed): on Android, Sync in the app's settings; with Apple Calendar on an iPhone, Google's sync page. */
function syncSteps(os: Os): Step[] {
  const S = tx("sf");
  const [a0 = "", a1 = "", a2 = "", a3 = ""] = S.sync_a;
  const [i0 = "", i1 = "", i2 = ""] = S.sync_i;
  return os === "android"
    ? [
        { text: a0, ctx: "phone", vis: <Vis kind="home" /> },
        { text: a1, ctx: "gcal", vis: <Vis kind="menu" label={S.ui_settings} /> },
        { text: a2, ctx: "gcal", vis: <Vis kind="list" label={S.ui_more} /> },
        { text: a3, ctx: "gcal", vis: <Vis kind="toggle" label={S.ui_sync} /> },
      ]
    : [
        {
          text: i0,
          action: (
            <a className="linkbtn primary" href={SYNCSELECT} target="_blank" rel="noopener">
              <Icon name="ext" />
              {S.sync_btn}
            </a>
          ),
          note: S.sync_note,
        },
        { text: i1, ctx: "browser", vis: <Vis kind="tick" /> },
        { text: i2, ctx: "browser", vis: <Vis kind="confirm" label={S.ui_save} /> },
      ];
}

/** The steps of one way in. A way that can't work on this device says why and what to do instead, never a tap that does nothing.
 *  via: Google or Outlook on a phone, whose apps can't subscribe: through this phone's browser, or through a computer.
 *  next: an action done. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: scored 16 of 15 when the rule came in; to be split up
function stepsFor(
  way: Way,
  via: "phone" | "pc" | null,
  os: Os,
  setOs: (o: Os) => void,
  feed: Feed,
  next: () => void,
): Step[] {
  const S = tx("sf");
  const { https, webcal } = feedUrls(feed.file);
  const open = (to: string, label: string) => (
    <a
      className="linkbtn primary"
      href={to}
      target={to.startsWith("webcal:") ? undefined : "_blank"}
      rel="noopener"
      onClick={next}
    >
      <Icon name="ext" />
      {label}
    </a>
  );
  const send = (title: string, url: string) => (
    <button className="linkbtn primary" type="button" onClick={() => void share({ title, url }).then(next)}>
      <Icon name="share" />
      {t("sp_g_send")}
    </button>
  );
  const copyBtn = (url: string, label: string, cls: string) => (
    <button className={cls} type="button" onClick={() => void copy(url).then(next)}>
      {label}
    </button>
  );
  const confirm = (text: string, label: string, ctx?: Ctx, note?: string): Step => ({
    text,
    ctx,
    note,
    vis: <Vis kind="confirm" label={label} phone={ctx === "pc" ? false : PHONE} />,
  });
  if (way === "ics") {
    const [, s1 = "", s2 = ""] = tx("ics_steps");
    return [
      { text: t("ics_stale_feed"), warn: true, action: <IcsDl to={https} onDone={next} /> },
      { text: s1, vis: <Vis kind="file" /> },
      confirm(s2, S.ui_add),
    ];
  }
  if (way === "apple")
    return apple()
      ? [{ action: open(webcal, S.a_open) }, confirm(S.a_confirm, S.ui_sub)]
      : [{ text: t("apple_na"), warn: true, dead: true, action: send(feed.name, https) }];
  // Google and Outlook are web pages: the address that subscribes, its opening button, the confirming step, what follows it
  const where: Ctx = via === "pc" ? "pc" : "browser";
  const [url, openLabel, sure, after]: [string, string, Step, (o: Os) => Step[]] =
    way === "google"
      ? [
          "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal),
          S.g_open,
          confirm(S.g_confirm, S.ui_add, where, PHONE && via !== "pc" ? S.g_desktop : undefined),
          syncSteps,
        ]
      : [
          `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(feed.name)}`,
          S.o_open,
          confirm(S.o_confirm, S.ui_import, where),
          () => [],
        ];
  if (!PHONE)
    return [
      { action: open(url, openLabel) },
      sure,
      ...(way === "google" ? [{ text: S.phone_q, choice: <OsPick os={os} onPick={setOs} /> }] : []),
      ...after(os),
    ];
  const first: Step[] =
    via === "pc"
      ? [
          { action: send(t(`way_${way}`), url) },
          { text: way === "google" ? S.pc : S.o_pc, ctx: "pc", vis: <Vis kind="send" /> },
        ]
      : [{ action: open(goUrl(url), openLabel), alt: copyBtn(url, S.copy_alt, "sfmore") }];
  return [...first, sure, ...after(IOS ? "ios" : "android")];
}

/** a dot of the stepper: a step already done, the one being shown, or one still to come */
function stepState(k: number, current: number): "past" | "now" | undefined {
  if (k === current) return "now";
  return k < current ? "past" : undefined;
}

const CTX_IC: Record<Ctx, IconName> = { browser: "globe", pc: "laptop", phone: "phone", gcal: "phone" };
/** one step: where it is in the row of steps, where you are now, the drawing, the one sentence, its button */
function StepView({ s, i, n }: { s: Step; i: number; n: number }) {
  const S = tx("sf");
  return (
    <div className="sfstep">
      {n > 1 && (
        <ol className="stepper" aria-label={S.step.replace("{i}", String(i + 1)).replace("{n}", String(n))}>
          {Array.from({ length: n }, (_, k) => (
            <li key={k} className={stepState(k, i)} aria-current={k === i ? "step" : undefined}>
              <span>{k < i ? "✓" : k + 1}</span>
            </li>
          ))}
        </ol>
      )}
      {s.ctx && (
        <p className="sfctx">
          <Icon name={CTX_IC[s.ctx]} />
          {S[`ctx_${s.ctx}`]}
        </p>
      )}
      {s.vis}
      {s.text && (s.warn ? <Warn>{s.text}</Warn> : <p className="sft">{s.text}</p>)}
      {s.action}
      {s.choice}
      {s.alt}
      {s.note && <small className="pf-note">{s.note}</small>}
    </div>
  );
}
const row = (key: string, icon: ReactNode, title: string, sub: string | null, onClick: () => void, done = false) => (
  <button key={key} className="way" type="button" onClick={onClick}>
    {icon}
    <span>
      <b>{title}</b>
      {sub && <small>{sub}</small>}
    </span>
    {done ? <b className="sfok">✓</b> : <Icon name="back" className="chev" />}
  </button>
);
/** a small second choice under the rows: quieter than them, still plainly a button */
const more = (icon: IconName, label: string, onClick: () => void) => (
  <button className="sfmore" type="button" onClick={onClick}>
    <Icon name={icon} />
    {label}
    <Icon name="back" className="chev" />
  </button>
);

/** The flow's state, for whatever frames it (a popup, the welcome steps): the title, the content, where Back goes (if anywhere),
 *  the main button (Next / Done; none while a tap on a row moves on), and whether it has reached its end.
 *  start: the calendar it is about, which skips the choice. */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: scored 22 of 15 when the rule came in; to be split up
export function useSubFlow(
  feeds: Feed[],
  { start, pickTitle }: { start?: Feed; pickTitle?: string } = {},
): { title: string; body: ReactNode; back?: () => void; primary: ReactNode; finished: boolean } {
  const S = tx("sf");
  const D = useData();
  const [feed, setFeed] = useState<Feed | null>(start ?? null);
  /** the list of every other club, behind "Another club" */
  const [others, setOthers] = useState(false);
  const [way, setWay] = useState<Way | null>(null);
  const [via, setVia] = useState<"phone" | "pc" | null>(null);
  const [os, setOs] = useState<Os>(IOS ? "ios" : "android");
  const [i, setI] = useState(0);
  const [added, setAdded] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const again = () => {
    setFeed(null);
    setOthers(false);
    setWay(null);
    setVia(null);
    setI(0);
    setFinished(false);
  };
  const feedRow = (f: Feed) =>
    row(
      f.file,
      f.c ? (
        <i className="sfmark" style={clubVars(f.c.color)}>
          <ClubMark c={f.c} />
        </i>
      ) : (
        <Icon name="globe" />
      ),
      f.name,
      null,
      () => setFeed(f),
      added.includes(f.file),
    );

  if (finished)
    return {
      title: S.done,
      finished,
      primary: null,
      body: (
        <div className="sfstep">
          <Vis kind="done" />
          <p className="sft">{S.done_t}</p>
          <div className="ways">{row("again", <Icon name="calendar" />, S.another, null, again)}</div>
          <a className="meta sfhelp" href={href("subscribe")}>
            {S.trouble}
          </a>
        </div>
      ),
    };
  if (!feed && others)
    return {
      title: S.other,
      finished,
      primary: null,
      back: () => setOthers(false),
      body: <div className="ways">{otherFeeds(D, feeds).map(feedRow)}</div>,
    };
  if (!feed)
    return {
      title: pickTitle ?? S.pick,
      finished,
      primary: null,
      // a club added through "Another club" joins the list, ticked
      body: (
        <div className="ways">
          {[...feeds, ...otherFeeds(D, feeds).filter((f) => added.includes(f.file))].map(feedRow)}
          {more("discover", S.other, () => setOthers(true))}
        </div>
      ),
    };
  if (!way)
    return {
      title: t("way_pick"),
      finished,
      primary: null,
      back: start && !added.length ? undefined : () => setFeed(null),
      body: (
        <div>
          <p className="sfn">{feed.name}</p>
          <div className="ways">
            {(["apple", "google", "outlook"] as const).map((w) =>
              row(w, <WayIcon way={w} />, t(`way_${w}`), t(`way_${w}_s`), () => setWay(w)),
            )}
            {more("calendar", t("way_ics"), () => setWay("ics"))}
          </div>
        </div>
      ),
    };
  if ((way === "google" || way === "outlook") && PHONE && !via)
    return {
      title: S.how,
      finished,
      primary: null,
      back: () => setWay(null),
      body: (
        <div className="ways">
          {row("phone", <Icon name="phone" />, S.on_phone, S.on_phone_s, () => setVia("phone"))}
          {row("pc", <Icon name="laptop" />, S.on_pc, S.on_pc_s, () => setVia("pc"))}
        </div>
      ),
    };
  const end = () => {
    setAdded((a) => [...a, feed.file]);
    setFinished(true);
  };
  // an action on the last step has nowhere to move on to
  const steps: Step[] = stepsFor(way, via, os, setOs, feed, () => setI((n) => Math.min(n + 1, steps.length - 1)));
  const last = i >= steps.length - 1;
  const s = steps[Math.min(i, steps.length - 1)]!;
  return {
    title: t(`way_${way}`),
    finished,
    back: () => {
      if (i > 0) setI(i - 1);
      else if (via) setVia(null);
      else setWay(null);
    },
    // a step with a button of its own: that is the thing to tap, Next stays quiet beside it
    primary: s.dead ? null : (
      <button
        className={s.action && !last ? "btn quiet" : "btn"}
        type="button"
        onClick={last ? end : () => setI(i + 1)}
      >
        {last ? t("done") : t("next")}
      </button>
    ),
    body: <StepView s={s} i={Math.min(i, steps.length - 1)} n={steps.length} />,
  };
}

/** The flow in a popup. club: the calendar it is about (a club's page); without one it first asks which. */
export function SubscribeSheet({ club, onClose }: { club?: Club | null; onClose: () => void }) {
  const D = useData();
  // the club itself, not looked up: a Rotary district's feed exists while its layer (and so its club) is switched off
  const start = club ? feedOf(club) : undefined;
  const rest = feedsFor(D, [D.settings.home, ...D.settings.also]).filter((x) => x.file !== start?.file);
  const f = useSubFlow(start ? [start, ...rest] : rest, { start });
  return (
    <Popup title={f.title} onClose={onClose} back={f.back} action={f.primary}>
      <div>{f.body}</div>
    </Popup>
  );
}

/** only the phone part: the calendar is subscribed but doesn't show there (the calendar help's "Show me how") */
export function SyncSheet({ onClose }: { onClose: () => void }) {
  const S = tx("sf");
  const [os, setOs] = useState<Os>(IOS ? "ios" : "android");
  const [i, setI] = useState(0);
  const steps: Step[] = [{ text: S.phone_q, choice: <OsPick os={os} onPick={setOs} /> }, ...syncSteps(os)];
  const last = i >= steps.length - 1;
  return (
    <Popup
      title={S.sync_h}
      onClose={onClose}
      back={i ? () => setI(i - 1) : undefined}
      action={
        last ? undefined : (
          <button className="btn" type="button" onClick={() => setI(i + 1)}>
            {t("next")}
          </button>
        )
      }
    >
      <div>
        <StepView s={steps[Math.min(i, steps.length - 1)]!} i={i} n={steps.length} />
      </div>
    </Popup>
  );
}

/** a feed's row (the developer page's list): the club (crest and name, a link to its page with link) or, without one, the all-clubs
 *  feed under name; the upcoming count when given; then the Subscribe button */
export function FeedRow({
  c = null,
  name,
  count,
  link = false,
}: {
  c?: Club | null;
  name?: string;
  count?: number;
  link?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="feed">
      <div className="name" style={c ? clubVars(c.color) : undefined}>
        {c ? <ClubMark c={c} /> : null}
        <span className="nm">
          {c && link ? <a href={href("club", c.id)}>{c.name}</a> : (c?.name ?? name ?? "")}
          {count != null ? <small className="meta">{t("n_upcoming", { n: count })}</small> : null}
        </span>
      </div>
      <button className="subbtn" type="button" onClick={() => setOpen(true)}>
        <Icon name="calendar" />
        {t("subscribe")}
      </button>
      {open && <SubscribeSheet club={c} onClose={() => setOpen(false)} />}
    </div>
  );
}
