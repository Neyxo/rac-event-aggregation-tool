// Links and small blocks shared by several screens.
import { useState, type MouseEventHandler } from "react";
import { LANG, LANGS, setLang, t, tx, type Lang, type Pair } from "../i18n";
import { IOS, PHONE } from "../lib/geo";
import { vars } from "../lib/color";
import { href } from "../lib/route";
import { Icon, type IconName } from "./Icon";
import { Popup } from "./Popup";
import { toast } from "./Toast";

/** a link that looks like one: icon in the colour p, title, one line, chevron. Another site opens in a new tab. */
export function MoreLink({ to, title, sub, ic = "info", p = "#0067c8" }: { to: string; title: string; sub?: string; ic?: IconName; p?: string }) {
  const ext = /^https?:/.test(to);
  return (
    <a className="more glass" href={to} style={vars({ "--p": p })} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined}>
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
    case "guide": return [href("guide"), nm.h, nm.steps_h, "flag", "#d41367"];
    case "words": return [href("words"), nm.words_h, nm.words_sub, "book", "#009739"];
    case "app": return [href("public"), t("app_h"), t("app_lead"), "info", "#0067c8"];
    case "sub": return [href("subscribe"), t("sub_title"), t("ab_sub_sub"), "calendar", "#0067c8"];
    case "world": return [href("about-more"), t("ab_more"), t("ab_more_sub"), "globe", "#009739"];
    case "family": return [href("family"), t("fam_h"), t("fam_sub"), "wheel", "#0067c8"];
    case "intl": return [href("intl"), intl.h, intl.sub, "globe", "#d41367"];
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
  await navigator.clipboard.writeText(data.url);
  toast(t("copied"));
  return true;
}

/** a calendar feed's address: absolute, because calendar apps get the link without this page around it; webcal: makes Apple and
 *  Outlook subscribe */
export function feedUrls(file: string): { https: string; webcal: string } {
  const https = new URL(file, location.href).href;
  return { https, webcal: https.replace(/^https?:/, "webcal:") };
}

/** a feed's three ways in: Apple (webcal:), Google, the .ics file */
export function FeedLinks({ file }: { file: string }) {
  const { https, webcal } = feedUrls(file);
  return <div className="l"><a href={webcal}>{t("apple")}</a><GoogleLink webcal={webcal} /><a href={https}>.ics</a></div>;
}

/** Google's phone apps can't subscribe to a calendar, only a computer browser can. So on a phone the Google link explains that and
 *  offers to send the link to a computer instead of opening a dead end. */
export function GoogleLink({ webcal }: { webcal: string }) {
  const url = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
  const [open, setOpen] = useState(false);
  const send = async () => { if (await share({ title: t("sp_google"), url })) setOpen(false); };
  return (
    <>
      <a href={url} target="_blank" rel="noopener" onClick={PHONE ? ev => { ev.preventDefault(); setOpen(true); } : undefined}>{t("google")}</a>
      {open && (
        <Popup title={t("sp_google")} onClose={() => setOpen(false)}>
          <div>
            <p>{t("sp_g_phone")}</p>
            <div className="links"><button className="primary" type="button" onClick={() => void send()}>{t("sp_g_send")}</button></div>
            {IOS ? <p>{t("sp_g_ios")} <a href={webcal}>{t("apple")}</a></p> : null}
          </div>
        </Popup>
      )}
    </>
  );
}

/** the language as a segmented control: four short choices, no native menu that opens somewhere else on screen. A tap saves and reloads. */
export function LangSelect() {
  return (
    <div className="seg" role="group" aria-label={t("language")}>
      {(Object.entries(LANGS) as [Lang, string][]).map(([k, v]) => (
        <button key={k} type="button" title={v} lang={k} aria-label={v} aria-pressed={k === LANG} onClick={() => setLang(k)}>{k.toUpperCase()}</button>
      ))}
    </div>
  );
}
