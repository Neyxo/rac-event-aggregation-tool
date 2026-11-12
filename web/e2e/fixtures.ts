// What every e2e test gets: events.json and status.json from web/e2e/fixture (context.route, so a service worker's own fetches are
// answered too), the clock at 2026-11-11 10:00 in Zurich, no real outside requests (pictures and map tiles get a blank pixel, the IP
// lookup answers "near Lucerne"), localStorage seeded once per tab from the `storage` option, and a list of the page's problems
// (uncaught errors fail every test; console errors and 404s are checked by health.spec.ts).
import { test as base, expect, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

export { expect };
export const FIXTURE = fileURLToPath(new URL("./fixture/", import.meta.url));
export const NOW = new Date("2026-11-11T10:00:00+01:00");
/** a member of Luzern who also follows Sempachersee, past the welcome steps */
export const MEMBER = { "rac.settings": { home: "luzern", also: ["sempachersee"] }, "rac.onboarded": true };
/** a guest who follows no club, past the welcome steps (without "rac.onboarded" Home opens them) */
export const GUEST = { "rac.onboarded": true };
const PIXEL = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

export interface Problems { errors: string[]; console: string[]; http: string[] }

export const test = base.extend<{ storage: Record<string, unknown>; problems: Problems }>({
  storage: [{}, { option: true }],
  context: async ({ context, storage }, use) => {
    await context.route(/\/(events|status)\.json(\?|$)/, r => r.fulfill({ path: FIXTURE + (r.request().url().includes("/status.json") ? "status.json" : "events.json") }));
    await context.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, r => {
      const u = r.request().url();
      if (u.includes("geojs.io")) return r.fulfill({ json: { latitude: "47.05", longitude: "8.30", country_code: "CH" } });
      if (r.request().resourceType() === "image") return r.fulfill({ body: PIXEL, contentType: "image/png" });
      return r.abort();
    });
    // once per tab, so a reload keeps what the test changed
    await context.addInitScript(s => {
      try {
        if (sessionStorage.getItem("e2e.seeded")) return;
        sessionStorage.setItem("e2e.seeded", "1");
        for (const [k, v] of Object.entries(s)) localStorage.setItem(k, JSON.stringify(v));
      } catch { /* about:blank has no storage */ }
    }, storage);
    await use(context);
  },
  page: async ({ page }, use) => {
    await page.clock.install({ time: NOW });
    await use(page);
  },
  problems: [async ({ page, baseURL }, use) => {
    const p: Problems = { errors: [], console: [], http: [] };
    page.on("pageerror", e => p.errors.push(e.message));
    page.on("console", m => { if (m.type() === "error") p.console.push(m.text()); });
    page.on("response", r => { if (r.status() >= 400 && r.url().startsWith(baseURL!)) p.http.push(r.status() + " " + r.url()); });
    await use(p);
    expect(p.errors, "uncaught errors in the page").toEqual([]);
  }, { auto: true }],
});

/** navigator.share off (desktop Chrome has none either) and the clipboard recorded in window.__copied: the share buttons' fallback */
export async function stubClipboard(page: Page): Promise<void> {
  await page.addInitScript(() => {
    delete (Navigator.prototype as { share?: unknown }).share;
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (s: string) => { (window as unknown as { __copied: string }).__copied = s; } } });
  });
}
export const copied = (page: Page) => page.evaluate(() => (window as unknown as { __copied?: string }).__copied);

/** go to a hash route inside the running app, like a link would */
export async function go(page: Page, hash: string): Promise<void> {
  await page.evaluate(h => { location.hash = h; }, hash);
}

/** the "installed app" check (display-mode: standalone) answers yes */
export async function standalone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const mm = window.matchMedia.bind(window);
    window.matchMedia = q => mm(/display-mode:\s*standalone/.test(q) ? "(min-width: 0px)" : q);
  });
}
