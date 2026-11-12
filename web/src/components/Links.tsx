// Links and small blocks shared by several screens.
import { useState, type MouseEventHandler, type ReactNode } from "react";
import { LANG, LANGS, setLang, t, tx, type Lang, type Pair } from "../i18n";
import { IOS, PHONE } from "../lib/geo";
import { BRAND, clubVars, vars } from "../lib/color";
import { href } from "../lib/route";
import type { Club } from "../lib/types";
import { ClubMark } from "./Club";
import { Icon, type IconName } from "./Icon";
import { Popup } from "./Popup";
import { toast } from "./Toast";

/** a link that looks like one: icon in the colour p, title, one line, chevron. Another site opens in a new tab. */
export function MoreLink({ to, title, sub, ic = "info", p = BRAND.azure, onClick }: { to: string; title: string; sub?: string; ic?: IconName; p?: string; onClick?: MouseEventHandler }) {
  const ext = /^https?:/.test(to);
  return (
    <a className="more glass" href={to} style={vars({ "--p": p })} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined} onClick={onClick}>
      <div className="ic"><Icon name={ic} /></div>
      <div className="tx"><b>{title}</b>{sub ? <span>{sub}</span> : null}</div>
      <Icon name="back" className="chev" />
    </a>
  );
}

export type HelpKey = "guide" | "words" | "app" | "sub" | "world" | "family" | "intl";
const help = (k: HelpKey): [string, string, string, IconName, string] => {
  const nm = tx("nm"), intl = tx("intl");
  switch (k) {
    case "guide": return [href("guide"), nm.h, nm.steps_h, "flag", BRAND.cranberry];
    case "words": return [href("words"), nm.words_h, nm.words_sub, "book", BRAND.green];
    case "app": return [href("public"), t("app_h"), t("app_lead"), "info", BRAND.azure];
    case "sub": return [href("subscribe"), t("sub_title"), t("ab_sub_sub"), "calendar", BRAND.azure];
    case "world": return [href("about-more"), t("ab_more"), t("ab_more_sub"), "globe", BRAND.green];
    case "family": return [href("family"), t("fam_h"), t("fam_sub"), "wheel", BRAND.azure];
    case "intl": return [href("intl"), intl.h, intl.sub, "globe", BRAND.cranberry];
  }
};
/** the cards to the explanatory screens, by key, so every screen words and draws them the same */
export function HelpLinks({ keys }: { keys: HelpKey[] }) {
  return <>{keys.map(k => { const [to, title, sub, ic, p] = help(k); return <MoreLink key={k} to={to} title={title} sub={sub} ic={ic} p={p} />; })}</>;
}

/** "Made by ...", with the source link when source; onClick: Settings counts taps on it (developer mode) */
export function Footer({ source = false, onClick }: { source?: boolean; onClick?: MouseEventHandler<HTMLElement> }) {
  return (
    <footer onClick={onClick}>
      {t("made_by")}{source ? " · " : null}
      {source && <a href="https://github.com/Neyxo/rotaract-events" target="_blank" rel="noopener">{t("source")}</a>}
    </footer>
  );
}

/** questions and answers, one open at a time (details with the same name) */
export function QaList({ items, name = "qa" }: { items: Pair[]; name?: string }) {
  return <>{items.map(([q, a], i) => <details key={i} name={name}><summary>{q}</summary><p>{a}</p></details>)}</>;
}

/** Share through the system's share sheet; where there is none, copy the link and say so. Returns true when it copied. */
export async function share(data: { title: string; text?: string; url: string }): Promise<boolean> {
  if (navigator.share) {
    try { await navigator.share(data); } catch { /* dismissed */ }
    return false;
  }
  await copy(data.url);
  return true;
}
/** to the clipboard, and say so */
export async function copy(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  toast(t("copied"));
}

/** a calendar feed's address: absolute, because calendar apps get the link without this page around it; webcal: makes Apple and
 *  Outlook subscribe */
export function feedUrls(file: string): { https: string; webcal: string } {
  const https = new URL(file, location.href).href;
  return { https, webcal: https.replace(/^https?:/, "webcal:") };
}

/** a feed's row: the club (crest and name, a link to its page with link) or, without one, the all-clubs feed under name; the
 *  upcoming count when given; then the Subscribe button */
export function FeedRow({ c = null, name, count, link = false }: { c?: Club | null; name?: string; count?: number; link?: boolean }) {
  const [open, setOpen] = useState(false);
  const title = c ? c.name : name ?? "";
  return (
    <div className="feed">
      <div className="name" style={c ? clubVars(c.color) : undefined}>
        {c ? <ClubMark c={c} /> : null}
        <span className="nm">{c && link ? <a href={href("club", c.id)}>{c.name}</a> : title}
          {count != null ? <small className="meta">{t("n_upcoming", { n: count })}</small> : null}</span>
      </div>
      <button className="subbtn" type="button" onClick={() => setOpen(true)}><Icon name="calendar" />{t("subscribe")}</button>
      {open && <SubscribeSheet file={c ? c.id + ".ics" : "all.ics"} name={title} onClose={() => setOpen(false)} />}
    </div>
  );
}

/** a warning line: icon and text in the danger colour */
export function Warn({ children }: { children: ReactNode }) {
  return <p className="warn"><Icon name="alert" /><span>{children}</span></p>;
}
/** short numbered steps */
const Steps = ({ items }: { items: string[] }) => <ol className="qsteps">{items.map((s, i) => <li key={i}>{s}</li>)}</ol>;

/** what a subscription does, as icon lines (the subscribe screen and the sheet) */
export function SubFacts() {
  const ic: IconName[] = ["refresh", "calendar", "phone", "lock"];
  return <ul className="facts2">{tx("sub_facts").map((f, i) => <li key={i}><Icon name={ic[i] ?? "info"} /><span>{f}</span></li>)}</ul>;
}

// Apple Calendar takes webcal: on an iPhone, iPad or Mac; Windows and Android have nothing that opens it
const apple = () => IOS || /Macintosh/.test(navigator.userAgent);
type Way = "apple" | "google" | "outlook" | "ics";

/** the steps for Google or Outlook on a phone: their apps can't subscribe, a computer's browser can, and then it is on the phone too */
function WebBody({ way, url }: { way: "google" | "outlook"; url: string }) {
  const send = () => void share({ title: t(way === "google" ? "sp_google" : "way_outlook"), url });
  return (
    <>
      <ul className="where">
        <li className="no"><Icon name="phone" /><span>{t("sp_g_no")}</span></li>
        <li className="ok"><Icon name="laptop" /><span>{t("sp_g_yes")}</span></li>
        <li className="ok both"><Icon name="laptop" /><Icon name="phone" /><span>{t("sp_g_both")}</span></li>
      </ul>
      <Steps items={tx(way === "google" ? "sp_g_steps" : "sp_o_steps")} />
      <div className="links"><button className="primary" type="button" onClick={send}><Icon name="share" />{t("sp_g_send")}</button></div>
    </>
  );
}
/** a calendar file: the warning that it is a copy, how to add it, the download */
function IcsBody({ to, feed, onDone }: { to: string; feed: boolean; onDone: () => void }) {
  return (
    <>
      <Warn>{t(feed ? "ics_stale_feed" : "ics_stale")}</Warn>
      <Steps items={tx("ics_steps")} />
      <div className="links"><a className="primary" href={to} onClick={onDone}><Icon name="calendar" />{t("ics_dl")}</a></div>
    </>
  );
}

/** Subscribing to one feed: what it does, then Apple, Google, Outlook or the file. A way that can't work on this device says why
 *  and what to do instead, never a tap that does nothing. */
export function SubscribeSheet({ file, name, onClose }: { file: string; name: string; onClose: () => void }) {
  const { https, webcal } = feedUrls(file);
  const [way, setWay] = useState<Way | null>(null);
  const google = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
  const outlook = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=${encodeURIComponent(name)}`;
  const row = (w: Way, ic: IconName, title: string, sub: string, to?: string) => {
    const body = <><Icon name={ic} /><span><b>{title}</b><small>{sub}</small></span><Icon name="back" className="chev" /></>;
    return to ? <a className="way" href={to} target={to.startsWith("http") ? "_blank" : undefined} rel="noopener">{body}</a>
      : <button className="way" type="button" onClick={() => setWay(w)}>{body}</button>;
  };
  return (
    <Popup title={way ? t(`way_${way}`) : name} onClose={onClose}>
      {way === null ? (
        <div>
          <SubFacts />
          <div className="ways">
            {row("apple", "phone", t("way_apple"), t("way_apple_s"), apple() ? webcal : undefined)}
            {row("google", "globe", t("way_google"), t("way_google_s"), PHONE ? undefined : google)}
            {row("outlook", "laptop", t("way_outlook"), t("way_outlook_s"), PHONE ? undefined : outlook)}
            {row("ics", "calendar", t("way_ics"), t("way_ics_s"))}
          </div>
          <p className="meta"><a href={href("subscribe")}>{t("sub_more")}</a></p>
        </div>
      ) : (
        <div>
          <button className="linkbtn wayback" type="button" onClick={() => setWay(null)}>{t("back")}</button>
          {way === "apple" ? <><Warn>{t("apple_na")}</Warn>
            <div className="links"><button className="primary" type="button" onClick={() => void share({ title: name, url: https })}><Icon name="share" />{t("sp_g_send")}</button></div></>
            : way === "ics" ? <IcsBody to={https} feed onDone={onClose} />
            : <WebBody way={way} url={way === "google" ? google : outlook} />}
        </div>
      )}
    </Popup>
  );
}

/** A calendar file for one event (.ics): a one-time copy, not a subscription. A tap first says so and how to add it, then downloads. */
export function IcsLink({ href: to, children }: { href: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a href={to} onClick={ev => { ev.preventDefault(); setOpen(true); }}>{children}</a>
      {open && <Popup title={t("ics_h")} onClose={() => setOpen(false)}><div><IcsBody to={to} feed={false} onDone={() => setOpen(false)} /></div></Popup>}
    </>
  );
}

/** the language as a segmented control: four short choices, no native menu that opens somewhere else on screen. A tap saves and reloads. */
export function LangSelect() {
  return (
    <div className="seg" role="group" aria-label={t("language")}>
      {(Object.entries(LANGS) as [Lang, string][]).map(([k, v]) => (
        <button key={k} type="button" title={v} lang={k} aria-label={`${k.toUpperCase()} (${v})`} aria-pressed={k === LANG} onClick={() => setLang(k)}>{k.toUpperCase()}</button>
      ))}
    </div>
  );
}
