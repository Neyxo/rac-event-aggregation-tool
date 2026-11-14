// The real service worker (static/sw.js): offline after one visit, and events.json from the cache while it is younger than 30 minutes.
// context.route answers the worker's own fetches, so counting them there counts what reaches the network.
import type { BrowserContext, Page } from "@playwright/test";
import { expect, MEMBER, test } from "./fixtures";

test.use({ serviceWorkers: "allow", storage: MEMBER });

async function firstVisit(page: Page): Promise<void> {
  await page.goto("./");
  await expect(page.locator("main a.event").first()).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}
function countData(context: BrowserContext): { n: number } {
  const c = { n: 0 };
  context.on("request", (r) => {
    if (r.serviceWorker() && /\/events\.json/.test(r.url())) c.n++;
  });
  return c;
}

test("after one visit the app works offline: reload shows the events", async ({ page, context }) => {
  await firstVisit(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".hello h1")).toHaveText("Good morning 👋");
  await expect(page.locator("main a.event").first()).toBeVisible();
  await page.locator("#tabs a.tab", { hasText: "Discover" }).click();
  await expect(page.locator("main a.event").first()).toBeVisible();
});

test("events.json: no request within 30 minutes, a fresh one after", async ({ page, context }) => {
  const net = countData(context);
  await firstVisit(page);
  const after = net.n; // the worker fetched it once on install
  await page.reload();
  await expect(page.locator("main a.event").first()).toBeVisible();
  await page.reload();
  await expect(page.locator("main a.event").first()).toBeVisible();
  expect(net.n).toBe(after);
  // 31 minutes later, in the worker (it keeps its own clock)
  const sw = context.serviceWorkers()[0]!;
  await sw.evaluate(() => {
    const real = Date.now;
    Date.now = () => real() + 31 * 60e3;
  });
  await page.clock.fastForward("31:00");
  await page.reload();
  await expect(page.locator("main a.event").first()).toBeVisible();
  await expect.poll(() => net.n).toBe(after + 1);
});
