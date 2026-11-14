// Links and small blocks shared by several screens.
import { useState, type MouseEventHandler, type ReactNode } from "react";
import { BE, BE_UNLOCKED, LANG, LANGS, setLang, t, tx, type Lang, type Pair } from "../../i18n";
import { BRAND, vars } from "../../lib/color";
import { href } from "../../lib/route";
import { Icon, type IconName } from "../Icon";
import { Popup } from "../Popup/Popup";
import { toast } from "../Toast/Toast";

/** a link that looks like one: icon in the colour p, title, one line, chevron. Another site opens in a new tab. */
export function MoreLink({
  to,
  title,
  sub,
  ic = "info",
  p = BRAND.azure,
  onClick,
}: {
  to: string;
  title: string;
  sub?: string;
  ic?: IconName;
  p?: string;
  onClick?: MouseEventHandler;
}) {
  const ext = /^https?:/.test(to);
  return (
    <a
      className="more glass"
      href={to}
      style={vars({ "--p": p })}
      target={ext ? "_blank" : undefined}
      rel={ext ? "noopener" : undefined}
      onClick={onClick}
    >
      <div className="ic">
        <Icon name={ic} />
      </div>
      <div className="tx">
        <b>{title}</b>
        {sub ? <span>{sub}</span> : null}
      </div>
      <Icon name="back" className="chev" />
    </a>
  );
}

export type HelpKey = "guide" | "words" | "app" | "sub" | "world" | "family" | "intl";
const help = (k: HelpKey): [string, string, string, IconName, string] => {
  const nm = tx("nm");
  const intl = tx("intl");
  switch (k) {
    case "guide":
      return [href("guide"), nm.h, nm.steps_h, "flag", BRAND.cranberry];
    case "words":
      return [href("words"), nm.words_h, nm.words_sub, "book", BRAND.green];
    case "app":
      return [href("public"), t("app_h"), t("app_lead"), "info", BRAND.azure];
    case "sub":
      return [href("subscribe"), t("sub_title"), t("ab_sub_sub"), "calendar", BRAND.azure];
    case "world":
      return [href("about-more"), t("ab_more"), t("ab_more_sub"), "globe", BRAND.green];
    case "family":
      return [href("family"), t("fam_h"), t("fam_sub"), "wheel", BRAND.azure];
    case "intl":
      return [href("intl"), intl.h, intl.sub, "globe", BRAND.cranberry];
  }
};
/** the cards to the explanatory screens, by key, so every screen words and draws them the same */
export function HelpLinks({ keys }: { keys: HelpKey[] }) {
  return (
    <>
      {keys.map((k) => {
        const [to, title, sub, ic, p] = help(k);
        return <MoreLink key={k} to={to} title={title} sub={sub} ic={ic} p={p} />;
      })}
    </>
  );
}

/** "Made by ...", with the source link when source; onClick: Settings counts taps on it (developer mode) */
export function Footer({ source = false, onClick }: { source?: boolean; onClick?: MouseEventHandler<HTMLElement> }) {
  return (
    <footer onClick={onClick}>
      {t("made_by")}
      {source ? " · " : null}
      {source && (
        <a href={__REPO__} target="_blank" rel="noopener">
          {t("source")}
        </a>
      )}
    </footer>
  );
}

/** questions and answers, one open at a time (details with the same name) */
export function QaList({ items, name = "qa" }: { items: Pair[]; name?: string }) {
  return (
    <>
      {items.map(([q, a], i) => (
        <details key={i} name={name}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </>
  );
}

/** Share through the system's share sheet; where there is none, copy the link and say so. Returns true when it copied. */
export async function share(data: { title: string; text?: string; url: string }): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
    } catch {
      /* dismissed */
    }
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

/** a warning line: icon and text in the danger colour */
export function Warn({ children }: { children: ReactNode }) {
  return (
    <p className="alertline">
      <Icon name="alert" />
      <span>{children}</span>
    </p>
  );
}
/** short numbered steps */
export const Steps = ({ items }: { items: string[] }) => (
  <ol className="qsteps">
    {items.map((s, i) => (
      <li key={i}>{s}</li>
    ))}
  </ol>
);

/** a calendar file: the warning that it is a copy and how to add it; IcsDl is the download, the popup's action */
export function IcsBody({ feed }: { feed: boolean }) {
  return (
    <>
      <Warn>{t(feed ? "ics_stale_feed" : "ics_stale")}</Warn>
      <Steps items={tx("ics_steps")} />
    </>
  );
}
export const IcsDl = ({ to, onDone }: { to: string; onDone: () => void }) => (
  <a className="linkbtn primary" href={to} onClick={onDone}>
    <Icon name="calendar" />
    {t("ics_dl")}
  </a>
);

/** A calendar file for one event (.ics): a one-time copy, not a subscription. A tap first says so and how to add it, then downloads. */
export function IcsLink({ href: to, children }: { href: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <a
        href={to}
        onClick={(ev) => {
          ev.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </a>
      {open && (
        <Popup
          title={t("ics_h")}
          onClose={() => setOpen(false)}
          action={<IcsDl to={to} onDone={() => setOpen(false)} />}
        >
          <div>
            <IcsBody feed={false} />
          </div>
        </Popup>
      )}
    </>
  );
}

/** the language as a segmented control: four short choices (five with Bärndütsch unlocked), no native menu that opens somewhere else on screen. A tap saves and reloads. */
export function LangSelect() {
  return (
    <div className="seg" role="group" aria-label={t("language")}>
      {(Object.entries(LANGS) as [Lang, string][]).map(([k, v]) => (
        <button
          key={k}
          type="button"
          title={v}
          lang={k}
          aria-label={`${k.toUpperCase()} (${v})`}
          aria-pressed={k === LANG && !BE}
          onClick={() => setLang(k)}
        >
          {k.toUpperCase()}
        </button>
      ))}
      {/* the Easter egg (i18n/be.ts): only once it was unlocked on the Bern crest */}
      {BE_UNLOCKED && (
        <button
          type="button"
          title="Bärndütsch"
          lang="gsw"
          aria-label="BE (Bärndütsch)"
          aria-pressed={BE}
          onClick={() => setLang("de", true)}
        >
          BE
        </button>
      )}
    </div>
  );
}
