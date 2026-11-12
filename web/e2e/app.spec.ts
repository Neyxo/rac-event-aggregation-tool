// The app end to end, screen by screen and across screens, on a phone and on a desktop, with the fixture data at 2026-11-11 10:00.
import { copied, expect, go, MEMBER, stubClipboard, test } from "./fixtures";

const EVENT = "223112";  // Luzern, Thu 19 Nov 2026: "Suppenmittag Wheel-Clubs Luzern-Sursee"
const ROTARY = "218819"; // a Rotary-layer event, 12 Nov 2026
const store = (page: import("@playwright/test").Page, k: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? "null"), k);

test.describe("first visit", () => {
  test("member path: the welcome steps pick a main club, Home then shows it", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator(".explore")).toBeVisible();
    await page.getByRole("button", { name: "Get started" }).click();
    const ob = page.locator("dialog#ob");
    await expect(ob).toBeVisible();
    await ob.getByRole("button", { name: "Yes, I'm a member" }).click();
    // pre-selected from the (stubbed) IP position near Lucerne
    await expect(ob.locator(".chips").first().getByRole("button", { name: "Rotaract Luzern" })).toHaveAttribute("aria-pressed", "true");
    await ob.locator(".chips").first().getByRole("button", { name: "Rotaract Bern" }).click();
    await expect(ob.locator(".chips").first().getByRole("button", { name: "Rotaract Bern" })).toHaveAttribute("aria-pressed", "true");
    await ob.getByRole("button", { name: "Next" }).click();
    await expect(ob.locator(".feeds")).toContainText("Rotaract Bern");
    await ob.getByRole("button", { name: "Next" }).click();
    await ob.getByRole("button", { name: "Done" }).click();
    await expect(ob).toBeHidden();
    expect(await store(page, "rac.settings")).toMatchObject({ home: "bern" });
    expect(await store(page, "rac.onboarded")).toBe(true);
    await expect(page.locator(".hello h1")).toHaveText("Good morning 👋");
    await expect(page.locator(".hello .chips .chip").first()).toContainText("Bern");
    await expect(page.locator("#toast")).toContainText("Bern");
  });

  test("guest path: three slides, follow a club nearby", async ({ page }) => {
    await page.goto("./");
    await page.getByRole("button", { name: "Get started" }).click();
    const ob = page.locator("dialog#ob");
    await ob.getByRole("button", { name: "Not (yet)" }).click();
    await expect(ob).toHaveClass(/full/);
    for (let i = 0; i < 3; i++) await ob.getByRole("button", { name: "Next" }).click();
    await expect(ob.locator(".chips .chip")).toHaveText(["Luzern", "Sempach"]);  // the two nearest
    await ob.getByRole("button", { name: "Rotaract Sempachersee" }).click();
    await ob.getByRole("button", { name: "Next" }).click();
    await ob.getByRole("button", { name: "Done" }).click();
    await expect(ob).toBeHidden();
    expect(await store(page, "rac.settings")).toEqual({ home: "", also: ["sempachersee"] });
    await expect(page.locator(".hello .chips")).toContainText("Sempach");
  });
});

test.describe("member", () => {
  test.use({ storage: MEMBER });

  test("Home: greeting, my clubs, the next event, only my clubs' events", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator(".hello h1")).toHaveText("Good morning 👋");
    await expect(page.locator(".hello .chips .chip")).toHaveText(["Luzern", "Sempach"]);
    await expect(page.locator("#listTitle")).toHaveText("Coming up");
    const cards = page.locator("main a.event");
    await expect(cards.first()).toBeVisible();
    // my clubs, plus the international events (Home shows those to everyone)
    for (const chips of await cards.locator(".tags").allInnerTexts()) expect(chips).toMatch(/Luzern|Sempach|International/);
    expect((await cards.locator(".tags").allInnerTexts()).filter(c => /Luzern|Sempach/.test(c)).length).toBeGreaterThan(2);
    await expect(page.locator("body")).toHaveClass(/wash/);
    await expect(page.locator("#tabs a.tab.on")).toHaveText("Home");
  });

  test("Discover: search and district filters go into the URL and survive a reload", async ({ page }) => {
    await page.goto("./#/discover");
    const cards = page.locator("main a.event");
    await expect(cards.first()).toBeVisible();
    const all = await cards.count();
    await page.locator("#q").fill("stamm");
    await expect(page).toHaveURL(/#\/discover\?.*q=stamm/);
    await expect.poll(() => cards.count()).toBeLessThan(all);
    await page.locator("#fbtn").click();
    await page.locator("#districts button", { hasText: "D2000" }).click();
    await expect(page).toHaveURL(/d=2000/);
    const titles = await cards.locator("h4").allInnerTexts();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) expect(t.toLowerCase()).toContain("stamm");
    await page.reload();
    await expect(page.locator("#q")).toHaveValue("stamm");
    await expect(page.locator("#fcount")).toHaveText("1");
    await expect(cards.locator("h4")).toHaveText(titles);
    // a link with the same query opened fresh gives the same list
    const url = page.url();
    await page.goto("about:blank");
    await page.goto(url);
    await expect(cards.locator("h4")).toHaveText(titles);
  });

  test("Calendar: month navigation and the day sheet", async ({ page }) => {
    await page.goto("./#/calendar");
    await expect(page.locator("body")).toHaveClass(/calpage/);
    const title = page.locator("#mtitle");
    await expect(title).toHaveText("November 2026");
    await page.locator("#next").click();
    await expect(title).toHaveText("December 2026");
    await page.locator("#prev").click();
    await page.locator("#prev").click();
    await expect(title).toHaveText("October 2026");
    await page.locator("#todayBtn").click();
    await expect(title).toHaveText("November 2026");
    const day19 = page.locator("#grid button[aria-label^='Thursday, 19 November 2026']");
    await day19.click();
    const sheet = page.locator("#sheet");
    await expect(sheet).toHaveClass(/open/);
    await expect(page.locator("#sheetTitle")).toContainText("19 November 2026");
    await expect(page.locator("#sheetTitle")).toBeFocused();
    await expect(page.locator("#sheetBody")).toContainText("Suppenmittag Wheel-Clubs Luzern-Sursee");
    // modal: Tab stays inside the sheet
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest("#sheet"))).toBe(true);
    }
    await page.locator("#sheetClose").click();
    await expect(sheet).not.toHaveClass(/open/);
    // closed: gone (its links can't be reached by Tab), and the focus is back on the day
    await expect(sheet).toBeHidden();
    await expect(day19).toBeFocused();
    // Escape closes it too
    await day19.click();
    await expect(sheet).toHaveClass(/open/);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("Event: the star persists across a reload, share copies the e/<id>.html link", async ({ page }) => {
    await stubClipboard(page);
    await page.goto(`./#/event/${EVENT}`);
    await expect(page).toHaveTitle("Suppenmittag Wheel-Clubs Luzern-Sursee · Rotaract Events");
    const star = page.locator("main .evdetail button.star");
    await expect(star).toHaveAttribute("aria-pressed", "false");
    await star.click();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(star).toHaveAttribute("aria-pressed", "true");
    expect(await store(page, "rac.saved")).toEqual([EVENT]);
    await page.getByRole("button", { name: "Share" }).click();
    await expect(page.locator("#toast")).toHaveText("Link copied");
    expect(await copied(page)).toBe(new URL(`e/${EVENT}.html`, page.url()).href);
  });

  test("Club: partner chip, share c/<id>.html, the subscribe popup", async ({ page }) => {
    await stubClipboard(page);
    await page.goto("./#/club/luzern");
    await expect(page.locator("main h1")).toHaveText("Rotaract Luzern");
    await expect(page.locator(".aboutc .with a.chip[href='#/club/sempachersee']")).toBeVisible();
    await page.locator(".chero").getByRole("button", { name: "Share" }).click();
    await expect(page.locator("#toast")).toHaveText("Link copied");
    expect(await copied(page)).toBe(new URL("c/luzern.html", page.url()).href);
    await page.locator(".cstick a.go").click();
    const popup = page.locator("dialog.ob[open]");
    await expect(popup).toBeVisible();
    await expect(popup.locator(".way")).toHaveCount(4);
    await expect(popup.getByText("Calendar file (.ics)")).toBeVisible();
    await popup.getByRole("button", { name: "Done" }).click();
    await expect(popup).toHaveCount(0);
    // the partner chip leads to the other club
    await page.locator(".aboutc .with a.chip[href='#/club/sempachersee']").click();
    await expect(page.locator("main h1")).toHaveText("Rotaract Sempachersee");
  });

  test("Settings: French reloads the app in French", async ({ page }) => {
    await page.goto("./#/settings");
    await page.getByRole("button", { name: "Français" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("main h1")).toHaveText("Réglages");
    await expect(page.locator("#tabs")).toContainText("Accueil");
    await page.reload();
    await expect(page.locator("main h1")).toHaveText("Réglages");
  });

  test("Settings: dark theme sticks", async ({ page }) => {
    await page.goto("./#/settings");
    await page.locator("#themeSeg").getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("#themeSeg").getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Settings: the Rotary layer adds Rotary events to Discover", async ({ page }) => {
    await page.goto("./#/discover");
    await expect(page.locator("main a.event").first()).toBeVisible();
    await expect(page.locator(`#ev-${ROTARY}`)).toHaveCount(0);
    await go(page, "#/settings");
    await page.locator("#rotarySeg").getByRole("button", { name: "On" }).click();
    await expect(page.locator("#rotarySeg").getByRole("button", { name: "On" })).toHaveAttribute("aria-pressed", "true");  // after the reload
    await page.locator("#tabs a.tab", { hasText: "Discover" }).click();
    await expect(page.locator(`#ev-${ROTARY}`)).toBeVisible();
  });

  test("developer mode: ten taps on the footer unlock it, the Dev button opens the status", async ({ page }) => {
    await page.goto("./#/settings");
    await expect(page.locator("#devSec")).toBeHidden();
    const foot = page.locator("#foot footer");
    for (let i = 0; i < 10; i++) await foot.click();
    await expect(page.locator("#toast")).toHaveText("Developer mode is on");
    await expect(page.locator("#devSec")).toBeVisible();
    await page.locator("header#top a.hbtn", { hasText: "Dev" }).click();
    await expect(page.locator("body")).toHaveAttribute("data-page", "dev");
    await expect(page.locator("main")).toContainText("e2e fixture warning: layout of one club changed");
  });

  test("back and forward restore the scroll position", async ({ page }) => {
    await page.goto("./#/discover");
    await expect(page.locator("main a.event").nth(20)).toBeVisible();
    await page.locator("main a.event").nth(20).scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
    const y = await page.evaluate(() => scrollY);
    // a click right where it is: Playwright's click would first scroll the card back into view
    await page.locator("main a.event").nth(20).evaluate((a: HTMLElement) => a.click());
    await expect(page.locator("body")).toHaveAttribute("data-page", "event");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    // the app's back button
    await page.locator("header#top .lft a.hbtn").click();
    await expect(page.locator("body")).toHaveAttribute("data-page", "discover");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y - 5);
    // the browser's forward and back
    await page.goForward();
    await expect(page.locator("body")).toHaveAttribute("data-page", "event");
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await page.goBack();
    await expect(page.locator("body")).toHaveAttribute("data-page", "discover");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y - 5);
  });

  test("a shared link opened directly: the app's back button stays in the app", async ({ page }) => {
    await page.goto("about:blank");  // the tab was somewhere else before: history.length is 2
    await page.goto(`./#/event/${EVENT}`);
    await expect(page.locator("main h1")).toHaveText("Suppenmittag Wheel-Clubs Luzern-Sursee");
    await page.locator("header#top .lft a.hbtn").click();
    await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/#\/$/);
    await expect(page.locator("body")).toHaveAttribute("data-page", "home");
    // inside the app it is a real back again, also after a reload
    await page.locator(`main a[href='#/event/${EVENT}']`).first().click();
    await expect(page.locator("body")).toHaveAttribute("data-page", "event");
    await page.reload();
    await page.locator("header#top .lft a.hbtn").click();
    await expect(page.locator("body")).toHaveAttribute("data-page", "home");
    await page.goForward();
    await expect(page.locator("body")).toHaveAttribute("data-page", "event");
  });
});

test.describe("share pages", () => {
  test.use({ storage: MEMBER });
  test("s/de/about.html forwards to the about screen in German", async ({ page }) => {
    await page.goto("s/de/about.html");
    await expect(page).toHaveURL(/\?lang=de#\/about$/);
    await expect(page.locator("body")).toHaveAttribute("data-page", "about");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.locator("#tabs")).toContainText("Entdecken");
  });
});

test("a missing events.json shows the error state, and its button retries", async ({ page }) => {
  let fail = true, tries = 0;
  const logged: string[] = [];
  page.on("console", m => { if (m.type() === "error") logged.push(m.text()); });
  await page.route(/\/events\.json/, r => { if (!fail) return r.fallback(); tries++; return r.fulfill({ status: 404, body: "" }); });
  await page.goto("./#/");
  const err = page.locator("main .empty");
  await expect(err).toContainText("Couldn't load events. Are you online?");
  // it stays: no retry loop while the screen is shown, and an expected state, not an error
  await page.waitForTimeout(800);
  expect(tries).toBe(1);
  await expect(err).toBeVisible();
  expect(logged.filter(t => !t.includes("404"))).toEqual([]);
  // the next screen tries again
  await page.locator("#tabs").getByRole("link", { name: "Discover" }).click();
  await expect(page.locator("body")).toHaveAttribute("data-page", "discover");
  await expect.poll(() => tries).toBe(2);
  await expect(err).toBeVisible();
  fail = false;
  await err.getByRole("button", { name: "Refresh" }).click();
  await expect(page.locator("main a.event").first()).toBeVisible();
});
