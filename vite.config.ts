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

const SITE = "https://neyxo.github.io/rotaract-events/";
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
        const file = [PUBLIC + name, FIXTURE + name].find(f => existsSync(f));
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
// language. lib/share.ts links to them; events and clubs have their own (e/<id>.html, c/<id>.html, written by polaris_feed.py).
type Pick = (m: Messages) => [string, string];
export const SHARE_TEXT: Record<string, Pick> = {
  home: m => ["Rotaract Events", m.app_lead],
  discover: m => [m.discover_title, m.sp_all_text],
  calendar: m => [m.calendar, m.sp_all_text],
  subscribe: m => [m.sub_title, m.ab_sub_sub],
  about: m => [m.ab_title, m.ab_lead],
  "about-more": m => [m.ab_more, m.ab_more_sub],
  family: m => [m.fam_h, m.fam_sub],
  public: m => [m.app_h, m.app_lead],
  guide: m => [m.nm.h, m.nm.lead],
  words: m => [m.nm.words_h, m.nm.words_sub],
  intl: m => [m.intl.h, m.intl.lead],
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function shareStub(lang: string, page: string, m: Messages): string {
  const [title, desc] = SHARE_TEXT[page]!(m);
  const to = `../../?lang=${lang}#/${page === "home" ? "" : page}`;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Rotaract Events</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Rotaract Events">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}screenshot-wide.png">
<meta property="og:url" content="${SITE}s/${lang}/${page}.html">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0; url=${to}">
<script>location.replace(${JSON.stringify(to)})</script>
</head>
<body><a href="${to}">${esc(title)}</a></body>
</html>
`;
}
function shareStubs(): Plugin {
  return {
    name: "rac-share-stubs",
    apply: "build",
    generateBundle() {
      for (const [lang, m] of Object.entries({ en, de, fr, it }))
        for (const page of Object.keys(SHARE_TEXT)) this.emitFile({ type: "asset", fileName: `s/${lang}/${page}.html`, source: shareStub(lang, page, m) });
    },
  };
}

export default defineConfig({
  root: "web",
  publicDir: "static",
  base: "./",
  plugins: [react(), devData(), shareStubs()],
  // no CSS minifier: lightningcss drops "backdrop-filter" when "-webkit-backdrop-filter" follows it (the frost would vanish outside Safari)
  build: { outDir: "../dist", emptyOutDir: true, cssMinify: false },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
