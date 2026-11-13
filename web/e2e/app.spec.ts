// The app end to end, screen by screen and across screens, on a phone and on a desktop, with the fixture data at 2026-11-11 10:00.
import { copied, expect, go, GUEST, MEMBER, stubClipboard, test } from "./fixtures";

const EVENT = "223112";  // Luzern, Thu 19 Nov 2026: "Suppenmittag Wheel-Clubs Luzern-Sursee"
const ROTARY = "218819"; // a Rotary-layer event, 12 Nov 2026
const store = (page: import("@playwright/test").Page, k: string) => page.evaluate(k => JSON.parse(localStorage.getItem(k) ?? "null"), k);

test.describe("first visit", () => {
  test("the welcome opens by itself and offers the app first; without an install prompt the button shows the steps", async ({ page }) => {
    await page.goto("./");
    const ob = page.locator("dialog#ob");
    await expect(ob).toBeVisible();
    await expect(ob.locator("h2")).toHaveText("Get the app");
    await ob.getByRole("button", { name: "Install app" }).click();
    await expect(ob.locator("ol.qsteps li").first()).toBeVisible();
    // the faint way past it
    await ob.getByRole("button", { name: "No thanks, use the website" }).click();
    await expect(ob.locator("h2")).toHaveText("Welcome 👋");
    await expect(ob.getByRole("button", { name: "Not (yet)" })).toBeVisible();
    expect(await store(page, "rac.onboarded")).toBe(null);
  });

  test("member path: main club, good to know, the calendar step by step, Home then shows the club", async ({ page, isMobile }) => {
    await stubClipboard(page);
    await page.goto("./");
    const ob = page.locator("dialog#ob"), h2 = ob.locator("h2");
    await ob.getByRole("button", { name: "No thanks, use the website" }).click();
    await ob.getByRole("button", { name: "Yes, I'm a member" }).click();
    // pre-selected from the (stubbed) IP position near Lucerne
    await expect(ob.locator(".chips").first().getByRole("button", { name: "Rotaract Luzern" })).toHaveAttribute("aria-pressed", "true");
    await ob.locator(".chips").first().getByRole("button", { name: "Rotaract Bern" }).click();
    await expect(ob.locator(".chips").first().getByRole("button", { name: "Rotaract Bern" })).toHaveAttribute("aria-pressed", "true");
    await ob.getByRole("button", { name: "Next" }).click();
    await expect(h2).toHaveText("Good to know");
    await expect(ob.locator("ul.facts2.big li")).toHaveCount(3);
    await ob.getByRole("button", { name: "Next" }).click();
    // the calendar: which one, where, then one step per page
    await expect(h2).toHaveText("Add events to your calendar?");
    await expect(ob.getByRole("button", { name: "Not now" })).toBeVisible();
    await expect(ob.locator(".way").first()).toContainText("Rotaract Bern");
    await expect(ob.locator(".way").last()).toHaveText("All Rotaract events in Switzerland & Liechtenstein");
    await ob.locator(".way").first().click();
    await expect(h2).toHaveText("Where do you want it?");
    await expect(ob.locator(".way b")).toHaveText(["Apple Calendar", "Google Calendar", "Outlook"]);
    await expect(ob.locator(".sfmore")).toHaveText("Calendar file (.ics)");
    await ob.locator(".way", { hasText: "Google Calendar" }).click();
    const n = ob.locator("ol.stepper"), ctx = ob.locator("p.sfctx");
    // a phone: the link in Chrome, confirm, the four sync steps; a desktop: open, confirm, which phone, the sync steps
    const of = isMobile ? 6 : 7;
    let at = 1;
    if (isMobile) {
      // the Google Calendar app can't subscribe: through this phone's browser, or a computer
      await expect(h2).toHaveText("How do you want to add it?");
      await ob.locator(".way", { hasText: "On this phone" }).click();
      await expect(n).toHaveAccessibleName("Step 1 of 6");
      // a tapped calendar.google.com link goes to the app: this one opens the helper page, which opens it in this browser
      const open = ob.locator(".sfstep a.linkbtn");
      await expect(open).toHaveText("Open Google Calendar");
      await expect(open).toHaveAttribute("href", /^go\.html#https%3A%2F%2Fcalendar\.google\.com%2Fcalendar%2Fr%3Fcid%3Dwebcal.*bern\.ics$/);
      await expect(open).toHaveAttribute("target", "_blank");
      await ob.getByRole("button", { name: "Didn't open? Copy the link and paste it in your browser" }).click();  // done: on to the next step by itself
      await expect(n).toHaveAccessibleName("Step 2 of 6");
      expect(await copied(page)).toMatch(/^https:\/\/calendar\.google\.com\/calendar\/r\?cid=webcal.*bern\.ics$/);
      at = 2;
    } else {
      await expect(n).toHaveAccessibleName("Step 1 of 7");
      // a step that is only a button: no sentence, no drawing
      await expect(ob.locator(".sfstep a.linkbtn")).toHaveText("Open Google Calendar");
      await expect(ob.locator(".sfstep a.linkbtn")).toHaveAttribute("href", /^https:\/\/calendar\.google\.com\/calendar\/r\?cid=webcal.*bern\.ics$/);
      await expect(ob.locator(".sfstep .sft, .sfstep figure.sfvis")).toHaveCount(0);
      await ob.getByRole("button", { name: "Next" }).click();
      at = 2;
    }
    await expect(h2).toHaveText("Google Calendar");
    // the confirming step: where it happens, a drawing, the row of steps with this one current
    await expect(ctx).toHaveText("In your browser");
    await expect(ob.locator("figure.sfvis svg")).toBeVisible();
    await expect(n.locator("li")).toHaveCount(of);
    await expect(n.locator("li[aria-current=step]")).toHaveText("2");
    await expect(n.locator("li.past")).toHaveText(["✓"]);
    while (at < of) {
      await ob.getByRole("button", { name: "Next" }).click();
      await expect(n).toHaveAccessibleName(`Step ${++at} of ${of}`);
      if (at === of - 3) await expect(ctx).toHaveText("On your phone");
    }
    await expect(ctx).toHaveText("On your phone, in the Google Calendar app");
    await expect(ob.locator(".sfstep")).toContainText("Turn on Sync.");
    await ob.getByRole("button", { name: "Done", exact: true }).click();
    await expect(h2).toHaveText("Done!");
    await expect(ob.getByRole("button", { name: "Not now" })).toHaveCount(0);
    await ob.getByRole("button", { name: "Done", exact: true }).click();
    await expect(ob).toBeHidden();
    expect(await store(page, "rac.settings")).toMatchObject({ home: "bern" });
    expect(await store(page, "rac.onboarded")).toBe(true);
    await expect(page.locator(".hello h1")).toHaveText("Good morning 👋");
    await expect(page.locator(".hello .chips .chip").first()).toContainText("Bern");
    await expect(page.locator("#toast")).toContainText("Bern");
  });

  test("member path: \"Not now\" on the calendar step finishes the welcome", async ({ page }) => {
    await page.goto("./");
    const ob = page.locator("dialog#ob");
    await ob.getByRole("button", { name: "No thanks, use the website" }).click();
    await ob.getByRole("button", { name: "Yes, I'm a member" }).click();
    for (let i = 0; i < 2; i++) await ob.getByRole("button", { name: "Next" }).click();
    await ob.getByRole("button", { name: "Not now" }).click();
    await expect(ob).toBeHidden();
    expect(await store(page, "rac.settings")).toMatchObject({ home: "luzern" });
    expect(await store(page, "rac.onboarded")).toBe(true);
  });

  test("guest path: three slides, follow a club nearby", async ({ page }) => {
    await page.goto("./");
    const ob = page.locator("dialog#ob");
    await ob.getByRole("button", { name: "No thanks, use the website" }).click();
    await ob.getByRole("button", { name: "Not (yet)" }).click();
    await expect(ob).toHaveClass(/full/);
    for (let i = 0; i < 3; i++) await ob.getByRole("button", { name: "Next" }).click();
    await expect(ob.locator(".chips .chip")).toHaveText(["Luzern", "Sempach"]);  // the two nearest
    await ob.getByRole("button", { name: "Rotaract Sempachersee" }).click();
    await ob.getByRole("button", { name: "Done" }).click();
    await expect(ob).toBeHidden();
    expect(await store(page, "rac.settings")).toEqual({ home: "", also: ["sempachersee"] });
    expect(await store(page, "rac.onboarded")).toBe(true);
    await expect(page.locator(".hello .chips")).toContainText("Sempach");
  });
});

test.describe("guest, past the welcome", () => {
  test.use({ storage: GUEST });
  test("Home is explore mode without the dialog; \"Get started\" opens the welcome again", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator(".explore")).toBeVisible();
    const ob = page.locator("dialog#ob");
    await expect(ob).toBeHidden();
    await page.getByRole("button", { name: "Get started" }).click();
    await expect(ob).toBeVisible();
    await expect(ob.locator("h2")).toHaveText("Get the app");
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
    await page.locator("#sheetClose.obx[aria-label=Close]").click();
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

  test("Club: partner chip, share c/<id>.html, the subscribe popup, how to join", async ({ page, isMobile }) => {
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
    // about this club: straight to where it goes
    await expect(popup.locator("h2")).toHaveText("Where do you want it?");
    await expect(popup.locator(".sfn")).toHaveText("Rotaract Luzern");
    await expect(popup.locator(".way")).toHaveCount(3);
    await expect(popup.locator(".sfmore")).toHaveText("Calendar file (.ics)");
    // nothing to go back to, nothing to move on with: only the round close button, top right
    await expect(popup.locator(".obhead button")).toHaveCount(1);
    await expect(popup.locator(".nav")).toHaveCount(0);
    await popup.locator(".way", { hasText: "Outlook" }).click();
    const open = popup.locator(".sfstep a.linkbtn");
    if (isMobile) {
      // the Outlook app can't subscribe either
      await expect(popup.locator("h2")).toHaveText("How do you want to add it?");
      await expect(popup.locator(".way b")).toHaveText(["On this phone", "On a computer"]);
      await popup.locator(".way", { hasText: "On this phone" }).click();
      await expect(open).toHaveText("Open Outlook");
      await expect(open).toHaveAttribute("href", /^go\.html#https%3A%2F%2Foutlook\.live\.com%2Fcalendar%2F0%2Faddfromweb%3Furl%3Dwebcal.*luzern\.ics%26name%3DRotaract%2520Luzern$/);
      await popup.getByRole("button", { name: "Didn't open? Copy the link and paste it in your browser" }).click();
      expect(await copied(page)).toMatch(/^https:\/\/outlook\.live\.com\/calendar\/0\/addfromweb\?url=webcal.*luzern\.ics&name=Rotaract%20Luzern$/);
    } else {
      await expect(open).toHaveText("Open Outlook");
      await expect(open).toHaveAttribute("href", /^https:\/\/outlook\.live\.com\/calendar\/0\/addfromweb\?url=webcal.*luzern\.ics&name=Rotaract%20Luzern$/);
      // in the steps: back and close in the head, only Next below
      await expect(popup.locator(".obhead button")).toHaveCount(2);
      await expect(popup.locator(".nav button")).toHaveText(["Next"]);
      await popup.getByRole("button", { name: "Next" }).click();
    }
    await expect(popup.locator("h2")).toHaveText("Outlook");
    await expect(popup.locator("ol.stepper")).toHaveAccessibleName("Step 2 of 2");
    await expect(popup.locator("p.sfctx")).toHaveText("In your browser");
    await expect(popup.locator(".sfstep")).toContainText("Confirm \"Import\".");
    await expect(popup.locator(".nav button")).toHaveText(["Done"]);
    await popup.locator(".obhead button.obx[aria-label=Close]").click();
    await expect(popup).toHaveCount(0);
    // a club's "How to join": the same head, no button below
    await page.getByRole("button", { name: "How to join" }).click();
    await expect(popup.locator("h2")).toHaveText("How to join");
    await expect(popup.locator(".obhead button")).toHaveCount(1);
    await expect(popup.locator(".nav")).toHaveCount(0);
    await popup.locator(".obhead button.obx[aria-label=Close]").click();
    await expect(popup).toHaveCount(0);
    // the partner chip leads to the other club
    await page.locator(".aboutc .with a.chip[href='#/club/sempachersee']").click();
    await expect(page.locator("main h1")).toHaveText("Rotaract Sempachersee");
  });

  test("Home: the calendar card opens the subscribe popup, once", async ({ page }) => {
    await page.goto("./");
    const card = page.locator("main a.more", { hasText: "Get your club's events in your calendar" });
    await card.click();
    const popup = page.locator("dialog.ob[open]");
    await expect(popup.locator("h2")).toHaveText("Which calendar?");
    await expect(popup.locator(".way b").first()).toHaveText("Rotaract Luzern");
    await expect(popup.locator(".way b").nth(1)).toHaveText("Rotaract Sempachersee");
    await expect(popup.locator(".way b").last()).toHaveText("All Rotaract events in Switzerland & Liechtenstein");
    await popup.locator(".way").first().click();
    await expect(popup.locator("h2")).toHaveText("Where do you want it?");
    await popup.getByRole("button", { name: "Back" }).click();
    await expect(popup.locator("h2")).toHaveText("Which calendar?");
    // every other club, behind the small button under the rows
    await popup.locator(".sfmore", { hasText: "Another club" }).click();
    await expect(popup.locator("h2")).toHaveText("Another club");
    const names = await popup.locator(".way b").allInnerTexts();
    expect(names.length).toBeGreaterThan(5);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names).not.toContain("Rotaract Luzern");
    await popup.locator(".way", { hasText: "Rotaract Bern" }).click();
    await expect(popup.locator("h2")).toHaveText("Where do you want it?");
    await expect(popup.locator(".sfn")).toHaveText("Rotaract Bern");
    await popup.getByRole("button", { name: "Back" }).click();
    await expect(popup.locator("h2")).toHaveText("Another club");
    await popup.getByRole("button", { name: "Back" }).click();
    await expect(popup.locator("h2")).toHaveText("Which calendar?");
    await popup.getByRole("button", { name: "Close" }).click();
    await expect(popup).toHaveCount(0);
    await expect(card).toHaveCount(0);
    expect(await store(page, "rac.subSeen")).toBe(true);
  });

  test("Calendar help: add a calendar, and a problem's Yes leads to the phone steps", async ({ page }) => {
    await page.goto("./#/subscribe");
    const popup = page.locator("dialog.ob[open]");
    await page.locator("main").getByRole("button", { name: "Add a calendar" }).click();
    await expect(popup.locator("h2")).toHaveText("Which calendar?");
    await popup.getByRole("button", { name: "Close" }).click();
    await expect(popup).toHaveCount(0);
    // the how-tos and the per-club list are gone from here
    await expect(page.locator("main .feed")).toHaveCount(0);
    const fix = page.locator("main details[name=fix]");
    await expect(fix).toHaveCount(5);
    await fix.first().locator("summary").click();
    await expect(fix.first().locator(".fixcase")).toHaveCount(0);  // nothing before the answer
    await fix.first().getByRole("button", { name: "Yes" }).click();
    await expect(fix.first().locator(".fixcase b")).toHaveText("It is hidden on your phone");
    await fix.first().getByRole("button", { name: "Show me how" }).click();
    await expect(popup.locator("h2")).toHaveText("Show it on your phone");
    await expect(popup.locator("ol.stepper")).toHaveAccessibleName("Step 1 of 5");
    await expect(popup.getByRole("button", { name: "Android" })).toHaveAttribute("aria-pressed", "true");
    // an iPhone has other steps, and fewer
    await popup.getByRole("button", { name: "iPhone" }).click();
    await expect(popup.locator("ol.stepper")).toHaveAccessibleName("Step 1 of 4");
    await popup.getByRole("button", { name: "Next" }).click();
    await expect(popup.locator(".sfstep a.linkbtn")).toHaveAttribute("href", "https://calendar.google.com/calendar/syncselect");
    await popup.getByRole("button", { name: "Close" }).click();
    await expect(popup).toHaveCount(0);
    // No: add it again
    await fix.first().getByRole("button", { name: "No", exact: true }).click();
    await expect(fix.first().locator(".fixcase")).toContainText("It isn't subscribed yet");
    await expect(fix.first().locator(".fixcase").getByRole("button", { name: "Add a calendar" })).toBeVisible();
  });

  test("About this app: the calendar card comes first, the tiles are titles only", async ({ page }) => {
    await page.goto("./#/public");
    await expect(page.locator("main p.lead + a.more")).toHaveAttribute("href", "#/subscribe");
    await expect(page.locator("main p.lead + a.more b")).toHaveText("Subscribe to a calendar");
    await expect(page.locator("#know .ft")).toHaveCount(4);
    await expect(page.locator("#know .ft span")).toHaveCount(0);
    await expect(page.locator("#know .ft b").first()).toHaveText("Updated every night");
  });

  test("Settings: French reloads the app in French", async ({ page }) => {
    await page.goto("./#/settings");
    // the club picker: the same popup head as everywhere, closed by its x (no Done below)
    await page.locator("button.setrow.link").first().click();
    const popup = page.locator("dialog.ob[open]");
    await expect(popup.locator(".obhead > *")).toHaveCount(2);
    await expect(popup.locator(".nav")).toHaveCount(0);
    await popup.locator(".obhead button.obx[aria-label=Close]").click();
    await expect(popup).toHaveCount(0);
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
    // the app and its data, each with its own age
    await expect(page.locator("main .devstate", { hasText: /^App · version \d\S* · updated .+ ago · / })).toBeVisible();
    await expect(page.locator("main .devstate", { hasText: /^Data · read .+ ago · / })).toBeVisible();
    // every feed, with its Subscribe button
    await page.locator("main a[href='#/dev/feeds']").click();
    await expect(page.locator("main .feeds .feed").first()).toContainText("All Rotaract events in Switzerland & Liechtenstein");
    await expect(page.locator("main .feeds .feed a[href='#/club/luzern']")).toBeVisible();
    await page.locator("main .feeds .feed", { hasText: "Rotaract Luzern" }).getByRole("button", { name: "Subscribe" }).click();
    await expect(page.locator("dialog.ob[open] h2")).toHaveText("Where do you want it?");
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

// static/go.html: the calendar's page opened by a form the page submits itself, which a phone's browser keeps instead of handing it to
// the calendar app like a tapped link
test.describe("go.html", () => {
  const G = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent("webcal://example.org/rotaract/all.ics");
  test("goes on to the calendar's address by itself, with every parameter; once per tab", async ({ page }) => {
    const req = page.waitForRequest(r => r.url().startsWith("https://calendar.google.com/"));
    await page.goto("./go.html#" + encodeURIComponent(G));
    expect((await req).url()).toBe(G.replace(/%20/g, "+"));
    // back on the page (Back): it waits with the link instead of bouncing forward again
    await page.goto("./go.html#" + encodeURIComponent(G));
    await expect(page.locator("#a")).toHaveAttribute("href", G);
    await expect(page.locator("#a")).toBeVisible();
    await expect(page).toHaveURL(/go\.html#/);
  });
  test("goes nowhere but Google Calendar and Outlook", async ({ page }) => {
    await page.goto("./go.html#" + encodeURIComponent("https://example.com/?cid=x"));
    await expect(page.locator("#a")).toBeHidden();
    await expect(page).toHaveURL(/go\.html#/);
  });
});
