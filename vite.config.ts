/// <reference types="vitest/config" />
// The web app: sources in web/src, static files in web/static, built into dist/ at the repo root, which polaris_feed.py copies
// next to events.json, status.json, the .ics feeds and the e/ c/ share pages.
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import en, { type Messages } from "./web/src/i18n/en.ts";
import de from "./web/src/i18n/de.ts";
import fr from "./web/src/i18n/fr.ts";
import it from "./web/src/i18n/it.ts";
import { SHARE_PAGES, type SharePage } from "./web/src/lib/share.ts";

// where the site is published and where its code lives: package.json is the one place for both (polaris_feed.py reads it too)
const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  homepage: string;
  repository: string;
};
const SITE = pkg.homepage;
// the link-preview page, with {{placeholders}}: polaris_feed.py fills the same file for events and clubs
const SHARE_TEMPLATE = readFileSync(new URL("./share.template.html", import.meta.url), "utf8");
const PUBLIC = fileURLToPath(new URL("./public/", import.meta.url));
const FIXTURE = fileURLToPath(new URL("./web/e2e/fixture/", import.meta.url));

// "npm run dev" / "npm start" shows real data: events.json and status.json from the Python output in public/ when it is there,
// otherwise the e2e test data, so the app runs without a Python build first
function devData(): Plugin {
  return {
    name: "rac-dev-data",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = (req.url ?? "").split("?")[0]!.replace(/^.*\//, "");
        const file = [PUBLIC + name, FIXTURE + name].find((f) => existsSync(f));
        if ((name === "events.json" || name === "status.json") && file) {
          res.setHeader("Content-Type", "application/json");
          res.end(readFileSync(file));
          return;
        }
        next();
      });
    },
  };
}

// Share stubs for the static screens: s/<lang>/<page>.html, a tiny page with its own preview (og:*) that forwards into the app in that
// language, one per lib/share.ts SHARE_PAGES, which links to them; events and clubs have their own (e/<id>.html, c/<id>.html, written by polaris_feed.py).
type Pick = (m: Messages) => [string, string];
export const SHARE_TEXT: Record<SharePage, Pick> = {
  home: (m) => ["Rotaract Events", m.app_lead],
  discover: (m) => [m.discover_title, m.sp_all_text],
  calendar: (m) => [m.calendar, m.sp_all_text],
  subscribe: (m) => [m.sub_title, m.ab_sub_sub],
  about: (m) => [m.ab_title, m.ab_lead],
  "about-more": (m) => [m.ab_more, m.ab_more_sub],
  family: (m) => [m.fam_h, m.fam_sub],
  public: (m) => [m.app_h, m.app_lead],
  guide: (m) => [m.nm.h, m.nm.lead],
  words: (m) => [m.nm.words_h, m.nm.words_sub],
  intl: (m) => [m.intl.h, m.intl.lead],
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function shareStub(lang: string, page: SharePage, m: Messages): string {
  const [title, desc] = SHARE_TEXT[page](m);
  const to = `../../?lang=${lang}#/${page === "home" ? "" : page}`;
  const values: Record<string, string> = {
    lang,
    page_title: esc(title) + " · Rotaract Events",
    title: esc(title),
    desc: esc(desc),
    url: `${SITE}s/${lang}/${page}.html`,
    target: esc(to),
    image: SITE + "screenshot-wide.png",
    target_js: JSON.stringify(to).replace(/</g, "\\u003c"),
  };
  return SHARE_TEMPLATE.replace(/\{\{(\w+)\}\}/g, (_, k: string) => values[k] ?? "");
}
function shareStubs(): Plugin {
  return {
    name: "rac-share-stubs",
    apply: "build",
    generateBundle() {
      for (const [lang, m] of Object.entries({ en, de, fr, it }))
        for (const page of SHARE_PAGES)
          this.emitFile({ type: "asset", fileName: `s/${lang}/${page}.html`, source: shareStub(lang, page, m) });
    },
  };
}

export default defineConfig({
  root: "web",
  publicDir: "static",
  base: "./",
  plugins: [
    react(),
    devData(),
    shareStubs(),
    { name: "rac-site-url", transformIndexHtml: (html) => html.replaceAll("%SITE%", SITE) },
  ],
  // when and from which commit the app itself was built (the developer screen): the events in events.json can be older, a push of the app alone reuses them
  define: {
    __APP_BUILT__: JSON.stringify(new Date().toISOString()),
    __APP_COMMIT__: JSON.stringify((process.env.GITHUB_SHA ?? "").slice(0, 7)),
    __REPO__: JSON.stringify(pkg.repository),
  },
  // no CSS minifier: lightningcss drops "backdrop-filter" when "-webkit-backdrop-filter" follows it (the frost would vanish outside Safari)
  build: { outDir: "../dist", emptyOutDir: true, cssMinify: false },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
