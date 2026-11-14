// Installing the app: the browser's install prompt (Chrome, Edge, Android) and whether the app already runs installed.
// The prompt fires once, early, often before the screen that offers it is shown: it is caught here, at start, for the welcome
// steps and Settings alike (useInstallPrompt() in components/hooks re-renders when it arrives or is used up).
import { emitter } from "./store";

/** the beforeinstallprompt event; not in TypeScript's DOM types */
export interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome?: string }>;
}

let caught: InstallPrompt | null = null;
/** installed from this tab (the prompt accepted, or the browser says so): the tab itself still runs in the browser */
let installed = false;
const { subscribe, emit } = emitter();

/** on Android, a link that opens the app in Chrome, for a browser that can't install it (DuckDuckGo, Firefox, the browser inside
 *  another app); null elsewhere (a page can name Chrome, but not "the default browser"; an iPhone has no such link at all) */
export const chromeUrl = (): string | null =>
  /Android/.test(navigator.userAgent)
    ? `intent://${location.host}${location.pathname}#Intent;scheme=https;package=com.android.chrome;end`
    : null;
/** the app's address, without index.html or the route: what to share, or to paste into another browser */
export const appUrl = (): string => location.origin + location.pathname.replace(/[^/]*$/, "");

if (typeof window !== "undefined") {
  addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    caught = e as InstallPrompt;
    emit();
  });
  addEventListener("appinstalled", () => {
    installed = true;
    caught = null;
    emit();
  });
}

export const getInstallPrompt = (): InstallPrompt | null => caught;
export const subscribeInstall = subscribe;

/** shows the browser's install dialog; a prompt works once, so it is gone afterwards (whatever the answer) */
export async function install(): Promise<void> {
  const p = caught;
  if (!p) return;
  await p.prompt();
  if ((await p.userChoice)?.outcome === "accepted") installed = true;
  caught = null;
  emit();
}

/** running as the installed app */
export const standalone = (): boolean =>
  matchMedia("(display-mode: standalone)").matches || !!(navigator as { standalone?: boolean }).standalone;
/** running installed, or installed from this tab a moment ago: no install steps to show */
export const isInstalled = (): boolean => standalone() || installed;
