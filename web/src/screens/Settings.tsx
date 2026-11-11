// Settings (old settings.html): clubs, Rotary layer, language, theme, install steps, share link, help links, developer mode.
// data-t / data-k attributes are kept from the old page so the DOM stays identical (app.css and the comparison read the same tree).
import { useEffect, useRef, useState } from "react";
import { t, tx } from "../i18n";
import { saveSettings } from "../lib/data";
import { href } from "../lib/route";
import { setTheme, store } from "../lib/store";
import type { ScreenProps } from "../App";
import { ClubChips, ClubLabel, Footer, Icon, LangSelect, LoadError, Popup, toast, useData, useRerender, useStored } from "../components";
import { useNav } from "../components/router";

/** the Chrome install prompt; not in TypeScript's DOM types */
interface InstallPrompt extends Event { prompt(): Promise<void>; userChoice: Promise<unknown> }
type OS = "ios" | "android" | "desktop";

/** an Off / On segmented control (Rotary layer, developer mode) */
function OnOff({ id, on, onPick }: { id: string; on: boolean; onPick: (on: boolean) => void }) {
  return (
    <div className="seg" id={id}>
      <button type="button" data-k="off" data-t="off" aria-pressed={!on} onClick={() => onPick(false)}>{t("off")}</button>
      <button type="button" data-k="on" data-t="on" aria-pressed={on} onClick={() => onPick(true)}>{t("on")}</button>
    </div>
  );
}

/** the chosen clubs of a row, or "none" */
function Cur({ id, ids }: { id: string; ids: string[] | null }) {
  if (!ids) return <div className="cur" id={id} />;  // before events.json: the old page left it empty
  if (!ids.length) return <div className="cur" id={id}><span className="meta">{t("none")}</span></div>;
  return <div className="cur" id={id}>{ids.map(c => <ClubLabel key={c} id={c} />)}</div>;
}

const standalone = () => matchMedia("(display-mode: standalone)").matches || !!(navigator as { standalone?: boolean }).standalone;
// an iPad asks for the desktop site and says MacIntel, but has touch
const guessOS = (): OS => {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return /Android/.test(ua) ? "android" : "desktop";
};

/** installed: a note; Chrome's prompt available: one button; otherwise the steps per system, the reader's own first */
function Install() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [os, setOS] = useState<OS>(guessOS);
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPrompt); };
    addEventListener("beforeinstallprompt", on);
    return () => removeEventListener("beforeinstallprompt", on);
  }, []);
  if (standalone()) return <div id="installBody"><p className="meta">{t("inst_done")}</p></div>;
  if (prompt) {
    const install = async () => {
      await prompt.prompt();
      await prompt.userChoice;
    };
    return <div id="installBody"><button className="linkbtn primary" type="button" onClick={install}>{t("inst_btn")}</button></div>;
  }
  return (
    <div id="installBody">
      <div className="seg" role="tablist">
        {(["ios", "android", "desktop"] as const).map(k => (
          <button key={k} type="button" role="tab" data-key={k} aria-selected={os === k} onClick={() => setOS(k)}>{t(k)}</button>
        ))}
      </div>
      <ol className="steps">{tx(`g_${os}`).map((s, i) => <li key={i}>{s}</li>)}</ol>
    </div>
  );
}

/** a help row: label and chevron */
function RowLink({ to, k, id, hidden }: { to: string; k: "subscribe_link" | "rerun" | "app_h" | "dev_page"; id?: string; hidden?: boolean }) {
  return <a className="setrow link" id={id} hidden={hidden} href={to}><span data-t={k}>{t(k)}</span><Icon name="back" className="chev" /></a>;
}

export default function Settings(_props: ScreenProps) {
  const { ready, error, D } = useData();
  const { pop } = useNav();
  const rerender = useRerender();
  const [picker, setPicker] = useState<"home" | "also" | null>(null);
  useStored("rac.theme", "light");  // re-render when the theme changes; the pressed button follows <html data-theme>
  const theme = document.documentElement.dataset.theme;
  const rotary = useStored("rac.rotary", false);
  const unlocked = useStored("rac.devUnlocked", false);
  const dev = useStored("rac.dev", false);
  const devSec = useRef<HTMLElement>(null);
  const taps = useRef<number[]>([]);
  const s = D.settings;

  const pickHome = (id: string) => {
    s.home = id;
    s.also = s.also.filter(x => x !== id);
    saveSettings();
    rerender();
  };
  const pickAlso = (id: string) => {
    s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id];
    saveSettings();
    rerender();
  };
  // loadData() merges the Rotary districts in (or not), so the app reloads to pick them up in "also show"
  const setRotary = (on: boolean) => {
    store.set("rac.rotary", on);
    location.reload();
  };
  const copy = async () => {
    await navigator.clipboard.writeText(shareLink);
    toast(t("copied"));
  };
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
  // #/settings#install (the welcome steps link here): jump to the install row, as the browser did for settings.html#install;
  // centred, so the sticky top bar doesn't cover its title. An effect, not a layout effect: App scrolls a new screen to the top in
  // its layout effect, which runs after this screen's.
  // Back/forward keeps the restored position instead, as the browser did.
  useEffect(() => {
    if (!pop && location.hash.endsWith("#install")) document.getElementById("install")?.scrollIntoView({ block: "center" });
  }, []);
  // the app's address, without index.html or the route
  const shareLink = location.origin + location.pathname.replace(/[^/]*$/, "");
  // events.json failed: the old loadData() replaced all of <main> with the offline note
  if (error) return <main className="wrap settings" id="main"><LoadError /></main>;

  return (
    <main className="wrap settings" id="main">
      <h1 data-t="settings">{t("settings")}</h1>
      <p className="lead" data-t="set_hint">{t("set_hint")}</p>
      <section className="glass"><h2 data-t="set_clubs_h">{t("set_clubs_h")}</h2>
        <button className="setrow link" type="button" id="homeBtn" onClick={() => ready && setPicker("home")}>
          <span data-t="main_club">{t("main_club")}</span>
          <Cur id="homeCur" ids={ready ? (s.home ? [s.home] : []) : null} />
          <Icon name="back" className="chev" />
        </button>
        <button className="setrow link" type="button" id="alsoBtn" onClick={() => ready && setPicker("also")}>
          <span data-t="also_show">{t("also_show")}</span>
          <Cur id="alsoCur" ids={ready ? s.also : null} />
          <Icon name="back" className="chev" />
        </button>
        <div className="setrow"><span data-t="rotary_show">{t("rotary_show")}</span><OnOff id="rotarySeg" on={rotary} onPick={setRotary} /></div>
        <p className="meta" data-t="rotary_hint" style={{ margin: 0 }}>{t("rotary_hint")}</p>
      </section>
      <section className="glass"><h2 data-t="set_app_h">{t("set_app_h")}</h2>
        <div className="setrow"><span data-t="language">{t("language")}</span><span id="langBox"><LangSelect /></span></div>
        <div className="setrow"><span data-t="appearance">{t("appearance")}</span>
          <div className="seg" id="themeSeg">
            <button type="button" data-k="light" data-t="theme_light" aria-pressed={theme === "light"} onClick={() => setTheme("light")}><Icon name="sun" />{t("theme_light")}</button>
            <button type="button" data-k="dark" data-t="theme_dark" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Icon name="moon" />{t("theme_dark")}</button>
          </div>
        </div>
        <div className="setrow col" id="install"><span data-t="inst_title">{t("inst_title")}</span><Install /></div>
        <div className="setrow col"><span data-t="share_title">{t("share_title")}</span>
          {/* the value is set as a property, like the old page, so no value attribute shows up in the DOM */}
          <div className="linkbox"><input type="text" id="link" readOnly ref={n => { if (n) n.value = shareLink; }} /><button type="button" id="copy" data-t="copy" onClick={copy}>{t("copy")}</button></div>
        </div>
      </section>
      <section className="glass"><h2 data-t="set_help_h">{t("set_help_h")}</h2>
        <RowLink to={href("subscribe")} k="subscribe_link" />
        <RowLink to="./?welcome" k="rerun" />
        <RowLink to={href("public")} k="app_h" />
      </section>
      <section className="glass" id="devSec" hidden={!unlocked} ref={devSec}><h2 data-t="dev_h">{t("dev_h")}</h2>
        <div className="setrow"><span data-t="dev_mode">{t("dev_mode")}</span><OnOff id="devSeg" on={dev} onPick={on => store.set("rac.dev", on)} /></div>
        <RowLink to={href("dev")} k="dev_page" id="devLink" hidden={!dev} />
      </section>
      <div id="foot"><Footer onClick={tap} /></div>
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
