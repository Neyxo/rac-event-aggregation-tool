// Settings: clubs, Rotary layer, language, theme, install steps, share link, help links, developer mode.
import { useEffect, useRef, useState } from "react";
import { t, tx } from "../i18n";
import { setRotary, setSettings, withAlsoToggled, withHome } from "../lib/data";
import { anyDevFlag } from "../lib/dev";
import { guessOS, type OS } from "../lib/geo";
import { chromeUrl, install, isInstalled } from "../lib/install";
import { href } from "../lib/route";
import { setTheme, store } from "../lib/store";
import type { ScreenProps } from "../App";
import { ClubChips, ClubLabel, copy, Footer, Icon, LangSelect, Popup, toast, useData, useInstallPrompt, useStored } from "../components";
import { useNav } from "../components/router";
import { version } from "../../../package.json";

/** an Off / On segmented control (Rotary layer, developer mode) */
function OnOff({ id, on, onPick }: { id?: string; on: boolean; onPick: (on: boolean) => void }) {
  return (
    <div className="seg" id={id}>
      <button type="button" aria-pressed={!on} onClick={() => onPick(false)}>{t("off")}</button>
      <button type="button" aria-pressed={on} onClick={() => onPick(true)}>{t("on")}</button>
    </div>
  );
}

/** the chosen clubs of a row, or "none" */
function Cur({ ids }: { ids: string[] }) {
  if (!ids.length) return <div className="cur"><span className="meta">{t("none")}</span></div>;
  return <div className="cur">{ids.map(c => <ClubLabel key={c} id={c} />)}</div>;
}

/** installed: a note; Chrome's prompt available: one button; otherwise the steps per system, the reader's own first
 *  (on Samsung Internet under a link that opens the app in Chrome) */
function Install() {
  const prompt = useInstallPrompt();
  const [os, setOS] = useState<OS>(guessOS);
  if (isInstalled()) return <div id="installBody"><p className="meta">{t("inst_done")}</p></div>;
  if (prompt) return <div id="installBody"><button className="linkbtn primary" type="button" onClick={() => void install()}>{t("inst_btn")}</button></div>;
  const chrome = chromeUrl();
  return (
    <div id="installBody">
      {chrome && <a className="linkbtn primary" href={chrome}>{t("inst_chrome")}</a>}
      <div className="seg" role="tablist">
        {(["ios", "android", "desktop"] as const).map(k => (
          <button key={k} type="button" role="tab" aria-selected={os === k} onClick={() => setOS(k)}>{t(k)}</button>
        ))}
      </div>
      <ol className="steps">{tx(`g_${os}`).map((s, i) => <li key={i}>{s}</li>)}</ol>
    </div>
  );
}

/** a help row: label and chevron */
function RowLink({ to, k, hidden }: { to: string; k: "subscribe_link" | "rerun" | "app_h" | "dev_page"; hidden?: boolean }) {
  return <a className="setrow link" hidden={hidden} href={to}><span>{t(k)}</span><Icon name="back" className="chev" /></a>;
}

export default function Settings(_props: ScreenProps) {
  const D = useData();
  const { pop } = useNav();
  const [picker, setPicker] = useState<"home" | "also" | null>(null);
  // anything but "dark" is light, as index.html's inline script reads it
  const dark = useStored("rac.theme", "light") === "dark";
  const rotary = useStored("rac.rotary", false);
  const unlocked = useStored("rac.devUnlocked", false);
  const dev = useStored("rac.dev", false);
  // the preview switches (pretend date, guest) only count while developer mode is on and are read once at start: when switching
  // changes what is in effect, reload, or the guest preview's empty clubs could be saved over the real ones
  const pickDev = (on: boolean) => {
    const before = anyDevFlag();
    store.set("rac.dev", on);
    if (anyDevFlag() !== before) location.reload();
  };
  const devSec = useRef<HTMLElement>(null);
  const taps = useRef<number[]>([]);
  const s = D.settings;

  const pickHome = (id: string) => setSettings(withHome(s, id));
  const pickAlso = (id: string) => setSettings(withAlsoToggled(s, id));
  // Developer mode, like on Android: ten quick taps on the "made by" line unlock the Developer section for good (rac.devUnlocked);
  // its switch (rac.dev) shows the developer link here and in the top bar
  const tap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter(x => now - x < 3000), now];
    if (taps.current.length < 10 || store.get("rac.devUnlocked", false)) return;
    store.set("rac.devUnlocked", true);
    store.set("rac.dev", true);
    toast(t("dev_on"));
    requestAnimationFrame(() => devSec.current?.scrollIntoView({ behavior: "smooth", block: "center" }));  // once it is shown
  };
  // #/settings#install (the welcome steps link here): jump to the install row, centred, so the sticky top bar doesn't cover its
  // title. After App has scrolled the new screen to the top; back/forward keeps the restored position instead.
  useEffect(() => {
    if (!pop && location.hash.endsWith("#install")) document.getElementById("install")?.scrollIntoView({ block: "center" });
  }, []);
  // the app's address, without index.html or the route
  const shareLink = location.origin + location.pathname.replace(/[^/]*$/, "");

  return (
    <main className="wrap settings">
      <h1>{t("settings")}</h1>
      <p className="lead">{t("set_hint")}</p>
      <section className="glass"><h2>{t("set_clubs_h")}</h2>
        <button className="setrow link" type="button" onClick={() => setPicker("home")}>
          <span>{t("main_club")}</span>
          <Cur ids={s.home ? [s.home] : []} />
          <Icon name="back" className="chev" />
        </button>
        <button className="setrow link" type="button" onClick={() => setPicker("also")}>
          <span>{t("also_show")}</span>
          <Cur ids={s.also} />
          <Icon name="back" className="chev" />
        </button>
        <div className="setrow"><span>{t("rotary_show")}</span><OnOff id="rotarySeg" on={rotary} onPick={setRotary} /></div>
        <p className="meta" style={{ margin: 0 }}>{t("rotary_hint")}</p>
      </section>
      <section className="glass"><h2>{t("set_app_h")}</h2>
        <div className="setrow"><span>{t("language")}</span><span><LangSelect /></span></div>
        <div className="setrow"><span>{t("appearance")}</span>
          <div className="seg" id="themeSeg">
            <button type="button" aria-pressed={!dark} onClick={() => setTheme("light")}><Icon name="sun" />{t("theme_light")}</button>
            <button type="button" aria-pressed={dark} onClick={() => setTheme("dark")}><Icon name="moon" />{t("theme_dark")}</button>
          </div>
        </div>
        <div className="setrow col" id="install"><span>{t("inst_title")}</span><Install /></div>
        <div className="setrow col"><span>{t("share_title")}</span>
          <div className="linkbox"><input type="text" readOnly value={shareLink} aria-label={t("share_title")} /><button type="button" onClick={() => void copy(shareLink)}>{t("copy")}</button></div>
        </div>
      </section>
      <section className="glass"><h2>{t("set_help_h")}</h2>
        <RowLink to={href("subscribe")} k="subscribe_link" />
        <RowLink to="./?welcome" k="rerun" />
        <RowLink to={href("public")} k="app_h" />
      </section>
      <section className="glass" id="devSec" hidden={!unlocked} ref={devSec}><h2>{t("dev_h")}</h2>
        <div className="setrow"><span>{t("dev_mode")}</span><OnOff on={dev} onPick={pickDev} /></div>
        <RowLink to={href("dev")} k="dev_page" hidden={!dev} />
      </section>
      <div id="foot"><Footer onClick={tap} /><p className="meta">{`v${version}`}</p></div>
      {picker === "home" && (
        <Popup title={t("pick_main")} onClose={() => setPicker(null)}>
          <ClubChips single selected={s.home} onPick={pickHome} />
        </Popup>
      )}
      {picker === "also" && (
        <Popup title={t("pick_also")} onClose={() => setPicker(null)}>
          <ClubChips selected={new Set(s.also)} exclude={[s.home]} onPick={pickAlso} />
        </Popup>
      )}
    </main>
  );
}
