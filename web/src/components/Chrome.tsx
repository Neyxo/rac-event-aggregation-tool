// The navigation chrome, identical on every screen: top bar (back · logo | extra · Dev · Rotaract · info · settings) and bottom tabs
// (home · discover · calendar). App renders both from the route table; a screen adds a button to the top bar with useTopBarExtra().
import { createContext, useContext, useLayoutEffect, useRef, type ReactNode } from "react";
import { t } from "../i18n";
import { anyDevFlag } from "../lib/dev";
import { href } from "../lib/route";
import { Icon, type IconName } from "./Icon";
import { useStored } from "./hooks";
import { canGoBack } from "./router";

/** what the top bar and tabs mark as current */
export type Active = "home" | "discover" | "calendar" | "about" | "app" | "settings" | "dev" | null;

function Hbtn({ name, to, label, on = false }: { name: IconName; to: string; label: string; on?: boolean }) {
  return <a className={"hbtn" + (on ? " on" : "")} href={to} aria-label={label} title={label}><Icon name={name} /><span>{label}</span></a>;
}

export function TopBar({ active, back = false, extra = null }: { active: Active; back?: boolean; extra?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const dev = useStored("rac.dev", false);
  useStored("rac.devDate", ""); useStored("rac.devGuest", false); useStored("rac.devNew", false); useStored("rac.devStale", false);  // re-render when a preview switch changes
  // sticky section headings start under the top bar
  useLayoutEffect(() => { if (ref.current) document.documentElement.style.setProperty("--stick", ref.current.offsetHeight + "px"); });
  return (
    <header id="top" ref={ref}>
      <div className="wrap bar">
        <div className="lft">
          {back && <a className="hbtn" href={href("home")} aria-label={t("back")} onClick={ev => { if (canGoBack()) { ev.preventDefault(); history.back(); } }}><Icon name="back" /></a>}
          <a className="brand" href={href("home")} aria-label="Rotaract Events"><img src="rotaract.svg" alt="Rotaract" /></a>
        </div>
        <div className="rgt">
          {extra}
          {/* developer mode (Settings, ten taps on "made by") puts the developer screen one tap away; lit while a preview switch is on */}
          {dev ? <Hbtn name="code" to={href("dev")} label="Dev" on={active === "dev" || anyDevFlag()} /> : null}
          <Hbtn name="wheel" to={href("about")} label="Rotaract" on={active === "about"} />
          <Hbtn name="info" to={href("public")} label={t("info")} on={active === "app"} />
          <Hbtn name="settings" to={href("settings")} label={t("settings")} on={active === "settings"} />
        </div>
      </div>
    </header>
  );
}

const TABS = [["home", href("home")], ["discover", href("discover")], ["calendar", href("calendar")]] as const;
export function Tabs({ active }: { active: Active }) {
  const ref = useRef<HTMLElement>(null);
  // the calendar's day sheet ends above the tabs
  useLayoutEffect(() => { const id = requestAnimationFrame(() => { if (ref.current) document.documentElement.style.setProperty("--tabs", ref.current.offsetHeight + "px"); }); return () => cancelAnimationFrame(id); });
  return (
    <nav className="tabs-bar" id="tabs" aria-label="Main" ref={ref}>
      {TABS.map(([k, to]) => (
        <a key={k} className={"tab" + (active === k ? " on" : "")} href={to} aria-current={active === k ? "page" : undefined}><Icon name={k} /><span>{t(k)}</span></a>
      ))}
    </nav>
  );
}

/** App provides the setter; screens call useTopBarExtra() */
export const ExtraContext = createContext<(n: ReactNode) => void>(() => {});
/** put a button at the start of the top bar's right side (About's share button) while this screen is shown.
 *  Set once on mount: give it a node whose handlers don't need fresh props (read refs or module state). */
export function useTopBarExtra(node: ReactNode): void {
  const set = useContext(ExtraContext);
  useLayoutEffect(() => { set(node); return () => set(null); }, []);
}
