// The navigation chrome, identical on every screen: top bar (back · logo | extra · Dev · Rotaract · info · settings) and bottom tabs
// (home · discover · calendar). App renders both from the route table, including a screen's own top-bar button (ROUTE_META extra).
import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { t } from "../../i18n";
import { cx } from "../../lib/color";
import { anyDevFlag } from "../../lib/dev";
import { href } from "../../lib/route";
import { store } from "../../lib/store";
import { Icon, type IconName } from "../Icon";
import { useStored } from "../../hooks";
import { canGoBack } from "../../router";

/** what the top bar and tabs mark as current */
export type Active = "home" | "discover" | "calendar" | "about" | "app" | "settings" | "dev" | null;

function Hbtn({ name, to, label, on = false }: { name: IconName; to: string; label: string; on?: boolean }) {
  return (
    <a className={cx("hbtn", on && "on")} href={to} aria-label={label} title={label}>
      <Icon name={name} />
      <span>{label}</span>
    </a>
  );
}

export function TopBar({ active, back = false, extra = null }: { active: Active; back?: boolean; extra?: ReactNode }) {
  const dev = useStored("rac.dev", false);
  const preview = useSyncExternalStore(store.subscribe, anyDevFlag);
  return (
    <header id="top">
      <div className="wrap bar">
        <div className="lft">
          {back && (
            <a
              className="hbtn"
              href={href("home")}
              aria-label={t("back")}
              onClick={(ev) => {
                if (canGoBack()) {
                  ev.preventDefault();
                  history.back();
                }
              }}
            >
              <Icon name="back" />
            </a>
          )}
          <a className="brand" href={href("home")} aria-label="Rotaract Events">
            <img src="rotaract.svg" alt="Rotaract" />
          </a>
        </div>
        <div className="rgt">
          {extra}
          {/* developer mode (Settings, ten taps on "made by") puts the developer screen one tap away; lit while a preview switch is on */}
          {dev ? <Hbtn name="code" to={href("dev")} label="Dev" on={active === "dev" || preview} /> : null}
          <Hbtn name="wheel" to={href("about")} label="Rotaract" on={active === "about"} />
          <Hbtn name="info" to={href("public")} label={t("info")} on={active === "app"} />
          <Hbtn name="settings" to={href("settings")} label={t("settings")} on={active === "settings"} />
        </div>
      </div>
    </header>
  );
}

const TABS = [
  ["home", href("home")],
  ["discover", href("discover")],
  ["calendar", href("calendar")],
] as const;
export function Tabs({ active }: { active: Active }) {
  const ref = useRef<HTMLElement>(null);
  // the calendar's day sheet ends above the tabs
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      if (ref.current) document.documentElement.style.setProperty("--tabs", ref.current.offsetHeight + "px");
    });
    return () => cancelAnimationFrame(id);
  });
  return (
    <nav className="tabs-bar" id="tabs" aria-label="Main" ref={ref}>
      {TABS.map(([k, to]) => (
        <a
          key={k}
          className={cx("tab", active === k && "on")}
          href={to}
          aria-current={active === k ? "page" : undefined}
        >
          <Icon name={k} />
          <span>{t(k)}</span>
        </a>
      ))}
    </nav>
  );
}
