// The event screen: a frosted card on the lead club's colour wash, with a head that sticks and compacts as you
// scroll, the facts, the description, then up to three more events of the same clubs.
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { ScreenProps } from "../App";
import { t } from "../i18n";
import { club, eventById } from "../lib/data";
import { clubVars } from "../lib/color";
import { dayN, fmt, isPast, lastDay, metaLine, sameDay } from "../lib/dates";
import { mapsUrl } from "../lib/geo";
import { href } from "../lib/route";
import { shareUrl } from "../lib/share";
import type { Event as Ev } from "../lib/types";
import { ClubChip, DatePane, EventCard, Footer, HelpLinks, Icon, LoadError, Skel, StarButton, Status, toast, useData, useMorphHead, useStickyHeads, useTitle, useWash } from "../components";

/** the Polaris page of the event; international events live on their organisers' sites instead */
const onPolaris = (e: Ev) => e.url.includes("/agenda/show/");
/** still open for registration; otherwise the button only opens the event on Polaris */
const isOpen = (e: Ev) => !e.cancelled && !isPast(e);

function goLabel(e: Ev): string {
  // a Rotary event opens on its club's own Polaris site
  if (e.layer === "rotary") return t("open_rotary");
  if (isOpen(e)) return t("register");
  return onPolaris(e) ? t("open_polaris") : t("details");
}

async function share(e: Ev): Promise<void> {
  // e/<id>.html: a small page with the event's link preview that forwards into the app
  const url = shareUrl({ event: e.id });
  const text = `${e.title} · ${fmt.full.format(new Date(e.start))}${e.location ? " · " + e.location : ""}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: e.title, text, url });
    } catch {
      // cancelled by the user
    }
    return;
  }
  await navigator.clipboard.writeText(url);
  toast(t("copied"));
}

function when(e: Ev): string {
  const s = new Date(e.start);
  const en = new Date(e.end);
  if (e.allday) return fmt.full.format(s) + (sameDay(s, lastDay(e)) ? "" : " – " + fmt.full.format(lastDay(e)));
  return fmt.full.format(s) + ", " + fmt.time.format(s) + (sameDay(s, en) ? "–" + fmt.time.format(en) : "");
}

function deadline(e: Ev): string {
  const n = dayN(e.deadline);
  const rel = n === 0 ? t("today") : n === 1 ? t("tomorrow") : t("in_days", { n });
  return fmt.full.format(new Date(e.deadline)) + (n >= 0 ? " · " + rel : "");
}

function Hero({ src }: { src: string }) {
  return (
    <div className="hero">
      <img className="blur" src={src} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
      <img src={src} alt="" referrerPolicy="no-referrer" />
    </div>
  );
}

/** className is static ("morph" included): useMorphHead toggles .on on it, and the measuring effect writes its style */
function Head({ e, headRef }: { e: Ev; headRef: RefObject<HTMLDivElement | null> }) {
  const { D } = useData();
  const lead = club(e.clubs[0] ?? "");
  const label = goLabel(e);
  return (
    <div className="head morph" ref={headRef}>
      {lead.logo ? <img className="wm" src={lead.logo} alt="" aria-hidden="true" /> : null}
      <DatePane e={e} />
      <div>
        <h1>{e.title}</h1>
        <div className="meta">{metaLine(e)}</div>
        <div className="tags">
          {e.clubs.filter(c => D.clubs[c]).map(c => <ClubChip key={c} id={c} />)}
          {e.cancelled ? <Status kind="bad" text={t("cancelled")} /> : null}
          {e.members ? <Status kind="" ic="lock" text={t("members_only")} /> : null}
        </div>
      </div>
      <StarButton e={e} />
      <a className="go" href={e.url} target="_blank" rel="noopener" title={label}><Icon name="ext" /><span>{label}</span></a>
    </div>
  );
}

function Facts({ e }: { e: Ev }) {
  const showDeadline = !!e.deadline && isOpen(e);
  return (
    <dl className="kv">
      <dt>{t("when")}</dt>
      <dd>{when(e)}</dd>
      {e.location ? <dt>{t("where")}</dt> : null}
      {e.location ? <dd><a href={mapsUrl(e.location)} target="_blank" rel="noopener"><Icon name="pin" />{e.location}</a></dd> : null}
      {showDeadline ? <dt>{t("deadline_h")}</dt> : null}
      {showDeadline ? <dd className={dayN(e.deadline) <= 2 ? "soon" : ""}>{deadline(e)}</dd> : null}
      {e.registration ? <dt>{t("registration")}</dt> : null}
      {e.registration ? <dd>{e.registration}</dd> : null}
    </dl>
  );
}

/** The head is a 64px sticky box whose content overflows onto the card at rest and compacts into the box as you scroll; its height
 *  never changes, so nothing below jumps. The register button is part of it: a pill in the action row at rest (.ph keeps its place
 *  there), the icon at the right once stuck. Measured once, right after the first draw. */
function useHeadLayout(head: RefObject<HTMLDivElement | null>, links: RefObject<HTMLDivElement | null>, ph: RefObject<HTMLSpanElement | null>): void {
  useLayoutEffect(() => {
    const h = head.current;
    const l = links.current;
    const p = ph.current;
    const go = h?.querySelector<HTMLElement>(".go");
    if (!h || !l || !p || !go) return;
    const parts = [...h.children].filter(n => !/\b(go|wm)\b/.test(n.className));
    const cb = Math.round(Math.max(...parts.map(n => n.getBoundingClientRect().bottom)) - h.getBoundingClientRect().top);
    h.style.setProperty("--bt", cb + 12 + "px");
    l.style.marginTop = cb - 64 + "px";
    p.style.width = go.offsetWidth + "px";
    p.style.height = go.offsetHeight + "px";
  }, []);
}

function Detail({ e }: { e: Ev }) {
  const { D } = useData();
  const head = useRef<HTMLDivElement>(null);
  const links = useRef<HTMLDivElement>(null);
  const ph = useRef<HTMLSpanElement>(null);
  // measured before the morph hook can compact the head: the measurement is of the head at rest
  useHeadLayout(head, links, ph);
  useMorphHead(head);
  useStickyHeads();
  const polaris = onPolaris(e);
  const more = D.data.events.filter(x => x.id !== e.id && !isPast(x) && x.clubs.some(c => e.clubs.includes(c))).slice(0, 3);
  return (
    <>
      <article className="evdetail glass">
        {e.image ? <Hero src={e.image} /> : null}
        <i className="sent" aria-hidden="true" />
        <Head e={e} headRef={head} />
        <div className="links" ref={links}>
          <span className="ph" ref={ph} />
          {/* members-only: Polaris' calendar file needs a login; international events aren't on Polaris at all */}
          {e.members || !polaris ? null : <a href={e.url.replace("/agenda/show/", "/agenda/ical/")}><Icon name="calendar" />{t("add_cal")}</a>}
          <button type="button" className="linkbtn" onClick={() => void share(e)}><Icon name="share" />{t("share_event")}</button>
        </div>
        <Facts e={e} />
        {e.description || polaris ? <p className="desc">{e.description || t("no_desc")}</p> : null}
        {e.members ? <p className="desc">{t("members_note")}</p> : null}
        {e.layer === "rotary" ? <p className="desc">{t("rotary_note")}</p> : null}
      </article>
      {polaris ? null : <HelpLinks keys={["intl"]} />}
      <h3 className="sh">{t("more_events")}</h3>
      {more.map((x, i) => <EventCard key={x.id} e={x} i={i} />)}
      <Footer />
    </>
  );
}

export default function Event({ route }: ScreenProps) {
  const { ready, error } = useData();
  // eventById: a shared link to a Rotary event opens even with the Rotary layer off
  const e = ready ? eventById(route.params.id ?? "") : undefined;
  const lead = e ? club(e.clubs[0] ?? "") : null;
  useWash(lead?.color, e && lead ? club(e.clubs[1] || lead.id).color : null, lead?.color);
  useTitle(e?.title);
  if (error) return <main className="wrap evpage" id="main"><LoadError /></main>;
  if (!ready) return <main className="wrap evpage" id="main"><Skel /></main>;
  if (!e || !lead) {
    return (
      <main className="wrap evpage" id="main">
        <div className="empty">{t("empty")}<br /><a className="linkbtn" href={href("home")}>{t("show_all")}</a></div>
      </main>
    );
  }
  return <main className="wrap evpage" id="main" style={clubVars(lead.color)}><Detail e={e} /></main>;
}
