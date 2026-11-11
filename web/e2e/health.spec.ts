// Across screens: navigation through the chrome and the cards, what one screen leaves behind for the next (body classes, wash,
// title), no console errors or 404s anywhere, no listeners piling up, and the installed app's first start.
import AxeBuilder from "@axe-core/playwright";
import { expect, go, MEMBER, standalone, test } from "./fixtures";

const SCREENS = ["#/", "#/discover", "#/calendar", "#/map", "#/event/223112", "#/club/luzern", "#/settings", "#/subscribe", "#/about", "#/about-more",
  "#/family", "#/public", "#/guide", "#/words", "#/intl", "#/dev", "#/event/nope", "#/club/nope"];

// What axe found when the check was added, as "<screen> <rule>": open work, not accepted. Fix one, delete its line; anything not
// listed here fails the test.
const KNOWN_A11Y = new Set<string>([
  "#/calendar label-content-name-mismatch",
  "#/words definition-list",
]);

test.describe("member", () => {
  test.use({ storage: { ...MEMBER, "rac.dev": true, "rac.devUnlocked": true } });

  test("every screen: no console errors, no 404s", async ({ page, problems }) => {
    await page.goto("./");
    await expect(page.locator(".hello")).toBeVisible();
    for (const h of SCREENS) {
      await go(page, h);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("networkidle");
    }
    expect(problems.console).toEqual([]);
    expect(problems.http).toEqual([]);
  });

  test("every screen: no new accessibility violations (axe, WCAG 2.1 A/AA)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });  // nothing measured halfway through a fade
    await page.goto("./");
    await expect(page.locator(".hello")).toBeVisible();
    const found: string[] = [];
    for (const h of SCREENS) {
      await go(page, h);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("networkidle");
      for (const v of (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()).violations)
        if (!KNOWN_A11Y.has(`${h} ${v.id}`)) found.push(`${h} ${v.id}: ${v.nodes.map(n => n.target.join(" ")).join(", ")}`);
    }
    expect(found).toEqual([]);
  });

  test("tabs, top bar and cards lead everywhere; nothing of one screen stays on the next", async ({ page }) => {
    const body = page.locator("body");
    const clean = async (pageName: string, title: RegExp) => {
      await expect(body).toHaveAttribute("data-page", pageName);
      await expect(page).toHaveTitle(title);
    };
    await page.goto("./");
    await clean("home", /^Rotaract Events$/);
    await expect(body).toHaveClass(/wash/);
    await page.locator("#tabs a.tab", { hasText: "Calendar" }).click();
    await clean("calendar", /^Calendar ·/);
    await expect(body).toHaveClass("calpage");  // Home's wash is gone
    await expect(body).not.toHaveAttribute("style", /--c1/);
    await page.locator("#tabs a.tab", { hasText: "Discover" }).click();
    await clean("discover", /^Discover ·/);
    await expect(body).toHaveClass("");
    await page.locator("main a.event").first().click();
    await clean("event", / · Rotaract Events$/);
    await expect(body).toHaveClass(/wash/);
    await expect(page.locator("header#top .lft a.hbtn")).toHaveCount(1);  // the back button
    await page.locator("main .evdetail .tags a.chip, main .evdetail a.chip").first().click();
    await clean("club", / · Rotaract Events$/);
    await page.locator("header#top a.hbtn[href='#/settings']").click();
    await clean("settings", /^Settings ·/);
    await expect(body).toHaveClass("");
    await expect(body).not.toHaveAttribute("style", /--c1/);
    // the sticky offset of the club's compact head is reset to the bar
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--stick").trim())).toBe(
      await page.evaluate(() => document.getElementById("top")!.offsetHeight + "px"));
    await page.locator("header#top a.hbtn[href='#/about']").click();
    await clean("about", /^What is Rotaract\? ·/);
    await page.locator("main a[href='#/about-more']").first().click();
    await clean("about-more", /^Rotary, districts/);
    await expect(body).toHaveClass(/frosted/);
    await page.locator("header#top a.hbtn[href='#/public']").click();
    await clean("public", /^About this app ·/);
    await expect(body).not.toHaveClass(/frosted/);
    await page.locator("header#top a.hbtn[href='#/dev']").click();
    await clean("dev", /^Developer ·/);
    await page.locator("header#top a.brand").click();
    await clean("home", /^Rotaract Events$/);
    await expect(page.locator("header#top .lft a.hbtn")).toHaveCount(0);  // no back button on Home
  });

  test("50 times back and forth: no window listeners pile up", async ({ page }) => {
    await page.addInitScript(() => {
      const live = new Map<string, Set<unknown>>();
      (window as unknown as { __live: () => Record<string, number> }).__live = () => Object.fromEntries([...live].map(([k, s]) => [k, s.size]));
      const add = EventTarget.prototype.addEventListener, rm = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function (type: string, f: unknown, o?: unknown) {
        if (f && (this === window || this === document)) { if (!live.has(type)) live.set(type, new Set()); live.get(type)!.add(f); }
        return add.call(this, type, f as EventListener, o as AddEventListenerOptions);
      };
      EventTarget.prototype.removeEventListener = function (type: string, f: unknown, o?: unknown) {
        if (f && (this === window || this === document)) live.get(type)?.delete(f);
        return rm.call(this, type, f as EventListener, o as EventListenerOptions);
      };
    });
    const live = () => page.evaluate(() => (window as unknown as { __live: () => Record<string, number> }).__live());
    await page.goto("./");
    await expect(page.locator(".hello")).toBeVisible();
    const screens = SCREENS.filter(h => h !== "#/map" && h !== "#/");  // the map screen loads Leaflet, whose own listeners are its business
    for (const h of screens) await go(page, h);
    await go(page, "#/");
    await expect(page.locator(".hello")).toBeVisible();
    const before = await live();
    expect(before.scroll).toBeGreaterThan(0);
    for (let i = 0; i < 50; i++) {
      await go(page, screens[i % screens.length]!);
      await expect(page.locator("body")).not.toHaveAttribute("data-page", "home");
      await page.goBack();
      await expect(page.locator("body")).toHaveAttribute("data-page", "home");
    }
    expect(await live()).toEqual(before);
  });
});

test.describe("installed app", () => {
  test("the first start opens the welcome steps on its own", async ({ page }) => {
    await standalone(page);
    await page.goto("./");
    await expect(page.locator("dialog#ob")).toBeVisible();
    await expect(page.locator("dialog#ob h2")).toHaveText("Welcome 👋");
  });

  test.describe("onboarded", () => {
    test.use({ storage: MEMBER });
    test("later starts don't", async ({ page }) => {
      await standalone(page);
      await page.goto("./");
      await expect(page.locator(".hello")).toBeVisible();
      await expect(page.locator("dialog#ob")).toBeHidden();
    });
  });

  test("a shared filter link doesn't start them either", async ({ page }) => {
    await standalone(page);
    await page.goto("./#/?q=stamm");
    await expect(page.locator("body")).toHaveAttribute("data-page", "discover");
    await expect(page.locator("dialog#ob[open]")).toHaveCount(0);
  });
});
