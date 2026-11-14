// Layout that only a real browser can show, on a phone and on a desktop: nothing wider than the screen, the bars where they belong,
// the list headings sticking in two levels with the frost behind them, the calendar filling its page, dialogs inside the screen.
// (The morphing heads have their own file, morph.spec.ts.)
import type { Page } from "@playwright/test";
import { expect, go, MEMBER, scrollToY, settle, test } from "./fixtures";

const SCREENS = [
  "#/",
  "#/discover",
  "#/calendar",
  "#/map",
  "#/event/223112",
  "#/event/222523",
  "#/club/luzern",
  "#/club/geneve-international",
  "#/settings",
  "#/subscribe",
  "#/about",
  "#/about-more",
  "#/family",
  "#/public",
  "#/guide",
  "#/words",
  "#/intl",
  "#/dev",
  "#/dev/feeds",
  "#/event/nope",
  "#/club/nope",
];

const frame = (page: Page) =>
  page.evaluate(() => {
    const d = document.documentElement;
    const bar = document.getElementById("top")!.getBoundingClientRect();
    const tabs = document.getElementById("tabs")!.getBoundingClientRect();
    // what reaches past the right edge, were the page to scroll sideways
    const wide = [...document.querySelectorAll<HTMLElement>("main *")]
      .filter(
        (el) =>
          el.getBoundingClientRect().right > d.clientWidth + 1 &&
          !el.closest(".strip, .leaflet-container, [aria-hidden=true]") &&
          getComputedStyle(el).position !== "fixed",
      )
      .slice(0, 3)
      .map((el) => el.tagName.toLowerCase() + "." + el.className);
    return {
      sideways: d.scrollWidth - d.clientWidth,
      wide: d.scrollWidth > d.clientWidth ? wide : [],
      barTop: bar.top,
      barLeft: bar.left,
      barRight: bar.right,
      tabsBottom: tabs.bottom,
      tabsLeft: tabs.left,
      tabsRight: tabs.right,
      vw: d.clientWidth,
      vh: innerHeight,
      max: d.scrollHeight - innerHeight,
    };
  });

test.use({ storage: MEMBER });

test.describe("developer mode on, so the Dev screens are there too", () => {
  test.use({ storage: { ...MEMBER, "rac.dev": true, "rac.devUnlocked": true } });
  test("every screen: never wider than the screen, the top bar and the tabs stay put from the first line to the last", async ({
    page,
  }) => {
    test.slow(); // many screens and scroll steps: three times the usual time limit, for a busy CI machine
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await expect(page.locator(".hello")).toBeVisible();
    const bad: string[] = [];
    for (const h of SCREENS) {
      await go(page, h);
      await expect(page.locator("main")).toBeVisible();
      await page.waitForLoadState("networkidle");
      await settle(page);
      const top = await frame(page);
      for (const y of [0, Math.round(top.max / 2), top.max]) {
        await scrollToY(page, y);
        const f = await frame(page);
        const at = `${h} at ${y}: `;
        if (f.sideways > 0) bad.push(at + `${f.sideways}px wider than the screen (${f.wide.join(", ")})`);
        if (Math.abs(f.barTop) > 0.5 || f.barLeft > 0.5 || f.barRight < f.vw - 0.5)
          bad.push(at + `top bar at ${f.barTop}, ${f.barLeft}..${f.barRight}`);
        if (Math.abs(f.tabsBottom - f.vh) > 0.5 || f.tabsLeft > 0.5 || f.tabsRight < f.vw - 0.5)
          bad.push(at + `tabs end at ${f.tabsBottom} of ${f.vh}, ${f.tabsLeft}..${f.tabsRight}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

for (const [width, storage] of [
  [360, MEMBER],
  [320, MEMBER],
  [360, { ...MEMBER, "rac.dev": true, "rac.devUnlocked": true }],
] as const)
  test.describe(`a small phone (${width}px wide${"rac.dev" in storage ? ", developer mode" : ""})`, () => {
    test.use({ storage });
    test("no screen is wider than the screen", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width, height: 640 });
      await page.goto("./");
      await expect(page.locator(".hello")).toBeVisible();
      const bad: string[] = [];
      for (const h of SCREENS.filter((h) => "rac.dev" in storage || !h.startsWith("#/dev"))) {
        await go(page, h);
        await expect(page.locator("main")).toBeVisible();
        await settle(page);
        const f = await frame(page);
        // innerWidth: a phone widens its layout to what doesn't fit, and then shows the page zoomed out
        if (f.sideways > 0 || (await page.evaluate(() => innerWidth)) > width)
          bad.push(`${h}: ${f.sideways}px wider than the screen (${f.wide.join(", ")})`);
      }
      expect(bad).toEqual([]);
    });
  });

test.describe("the list headings on Discover", () => {
  interface Heads {
    bar: number;
    title: { top: number; bottom: number };
    months: { text: string; top: number; bottom: number }[];
    frost: { top: number; bottom: number; opacity: number };
    y: number;
  }
  const heads = (page: Page) =>
    page.evaluate(() => {
      const r = (el: Element) => {
        const b = el.getBoundingClientRect();
        return { top: b.top, bottom: b.bottom };
      };
      const frost = document.getElementById("frost")!;
      const fc = getComputedStyle(frost, "::before");
      const ft = frost.getBoundingClientRect().top;
      return {
        bar: document.getElementById("top")!.getBoundingClientRect().bottom,
        title: r(document.querySelector("main .sh.lv1")!),
        months: [...document.querySelectorAll<HTMLElement>("main h3.sh")].map((h) => ({ text: h.innerText, ...r(h) })),
        frost: { top: ft, bottom: ft + parseFloat(fc.height), opacity: +fc.opacity },
        y: scrollY,
      };
    }) as Promise<Heads>;
  const openList = async (page: Page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./#/discover");
    await expect(page.locator("main a.event").nth(8)).toBeVisible();
    await settle(page);
    return heads(page);
  };

  test("at the top nothing sticks and there is no frost", async ({ page }) => {
    const h = await openList(page);
    expect(h.months.length).toBeGreaterThan(1);
    expect(h.title.top).toBeGreaterThan(h.bar + 20);
    expect(h.months[0]!.top).toBeGreaterThanOrEqual(h.title.bottom - 1);
    expect(h.frost.opacity).toBe(0);
  });

  test("scrolling: the title sticks under the bar, the current month right under the title, the next month pushes it out, the frost covers both", async ({
    page,
  }) => {
    test.slow(); // many scroll steps: three times the usual time limit, for a busy CI machine
    const h0 = await openList(page);
    const bad: string[] = [];
    const stuck = new Set<string>();
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const from = Math.round(h0.title.top - h0.bar) + 40; // the title has reached the bar
    for (let y = from; y <= max; y += 23) {
      await scrollToY(page, y);
      const h = await heads(page);
      const say = (m: string) => bad.push(`at ${y}: ${m}`);
      if (Math.abs(h.title.top - h.bar) > 1.5) say(`title at ${h.title.top}, bar ends at ${h.bar}`);
      // the months from the first one that has not left the screen above the title
      const live = h.months.filter((m) => m.bottom > h.title.bottom + 0.5);
      const cur = live[0];
      const next = live[1];
      // (the months before them are parked under the title, clipped away)
      for (let i = 1; i < live.length; i++)
        if (live[i]!.top < live[i - 1]!.bottom - 1) say(`${live[i]!.text} overlaps ${live[i - 1]!.text}`);
      if (!cur) continue;
      if (cur.top < h.title.bottom - 1.5) {
        // partly under the title: only while the next month pushes it out, edge to edge
        if (!next || Math.abs(next.top - cur.bottom) > 1.5)
          say(`${cur.text} is under the title (top ${cur.top}, title ends ${h.title.bottom}) with nothing pushing it`);
      } else if (cur.top <= h.title.bottom + 1.5) {
        stuck.add(cur.text);
        if (h.frost.opacity !== 1) say("a month is stuck but the frost is off");
        if (h.frost.top > h.title.top + 1 || h.frost.bottom < cur.bottom - 1)
          say(`frost ${h.frost.top}..${h.frost.bottom} doesn't cover title and month (${h.title.top}..${cur.bottom})`);
      }
      if (h.frost.opacity === 1 && h.frost.bottom < h.title.bottom - 1)
        say(`frost ends at ${h.frost.bottom}, above the title's end ${h.title.bottom}`);
    }
    expect(bad).toEqual([]);
    expect(stuck.size, "several months took their turn under the title").toBeGreaterThan(1);
    // back at the top: all of it is undone
    await scrollToY(page, 3);
    await scrollToY(page, 0);
    const h = await heads(page);
    expect(h.frost.opacity).toBe(0);
    expect(h.title.top).toBeCloseTo(h0.title.top, 0);
    expect(h.months.map((m) => Math.round(m.top))).toEqual(h0.months.map((m) => Math.round(m.top)));
  });

  test("a filter that shortens the list while scrolled leaves no heading or frost hanging", async ({ page }) => {
    await openList(page);
    await scrollToY(page, 900);
    expect((await heads(page)).frost.opacity).toBe(1);
    await page.locator("#q").fill("zzzz no such event");
    await expect(page.locator("main a.event")).toHaveCount(0);
    await settle(page);
    const h = await heads(page);
    expect(h.months).toEqual([]);
    expect(h.y).toBeLessThan(900);
    if (h.title.top > h.bar + 1.5) expect(h.frost.opacity, "the title is not stuck: no frost").toBe(0);
  });
});

test.describe("calendar", () => {
  test("fills the page between the bars without a page scroll, at any size; the day sheet stays inside the screen", async ({
    page,
  }) => {
    await page.goto("./#/calendar");
    await expect(page.locator("#grid")).toBeVisible();
    const vp = page.viewportSize()!;
    for (const size of [
      vp,
      { width: vp.width, height: 560 },
      { width: Math.max(320, vp.width - 60), height: vp.height },
    ]) {
      await page.setViewportSize(size);
      await settle(page);
      const m = await page.evaluate(() => {
        const d = document.documentElement;
        const g = document.getElementById("grid")!.getBoundingClientRect();
        return {
          scroll: d.scrollHeight - innerHeight,
          side: d.scrollWidth - d.clientWidth,
          gridTop: g.top,
          gridBottom: g.bottom,
          gridLeft: g.left,
          gridRight: g.right,
          vw: d.clientWidth,
          bar: document.getElementById("top")!.getBoundingClientRect().bottom,
          tabs: document.getElementById("tabs")!.getBoundingClientRect().top,
        };
      });
      const at = `${size.width}x${size.height}`;
      expect(m.scroll, at + ": no page scroll").toBeLessThanOrEqual(0);
      expect(m.side, at + ": not wider than the screen").toBeLessThanOrEqual(0);
      expect(m.gridTop, at).toBeGreaterThanOrEqual(m.bar);
      expect(m.gridBottom, at + ": the grid ends above the tabs").toBeLessThanOrEqual(m.tabs + 1);
      expect(m.tabs - m.gridBottom, at + ": and uses the room down to them").toBeLessThan(40);
      expect(m.gridLeft >= 0 && m.gridRight <= m.vw, at).toBe(true);
    }
    await page.setViewportSize(vp);
    await page.locator("#grid button[aria-label^='Thursday, 19 November 2026']").click();
    await expect(page.locator("#sheet")).toHaveClass(/open/);
    await settle(page);
    const s = (await page.locator("#sheet .sheet-in").boundingBox())!;
    expect(s.x).toBeGreaterThanOrEqual(0);
    expect(s.x + s.width).toBeLessThanOrEqual(vp.width + 0.5);
    expect(s.y).toBeGreaterThanOrEqual(0);
    expect(s.y + s.height).toBeLessThanOrEqual(vp.height + 0.5);
    await expect(page.locator("#sheetBody a.event").first()).toBeInViewport();
  });
});

test.describe("dialogs", () => {
  const inside = async (page: Page, sel: string) => {
    await settle(page);
    const b = (await page.locator(sel).boundingBox())!;
    const vp = page.viewportSize()!;
    expect(b.x, sel).toBeGreaterThanOrEqual(0);
    expect(b.y, sel).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width, sel).toBeLessThanOrEqual(vp.width + 0.5);
    expect(b.y + b.height, sel).toBeLessThanOrEqual(vp.height + 0.5);
    // nothing in it reaches out of it sideways
    expect(
      await page
        .locator(sel)
        .evaluate((d) =>
          [...d.querySelectorAll("*")].every(
            (el) => el.getBoundingClientRect().right <= d.getBoundingClientRect().right + 1,
          ),
        ),
      sel + ": content inside",
    ).toBe(true);
  };

  test.describe("first visit", () => {
    test.use({ storage: {} });
    test("the welcome fits the screen at every step, also on a small phone, and the page behind can't be reached", async ({
      page,
    }) => {
      await page.goto("./");
      const ob = page.locator("dialog#ob");
      await expect(ob).toBeVisible();
      await inside(page, "dialog#ob");
      await page.setViewportSize({ width: 360, height: 640 });
      await inside(page, "dialog#ob");
      await ob.getByRole("button", { name: "No thanks, use the website" }).click();
      await inside(page, "dialog#ob");
      await ob.getByRole("button", { name: "Yes, I'm a member" }).click();
      await inside(page, "dialog#ob");
      // modal: what is under its middle is the dialog, and Tab never leaves it
      for (let i = 0; i < 8; i++) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => !!document.activeElement?.closest("dialog#ob"))).toBe(true);
      }
      expect(
        await page.evaluate(
          () =>
            !!document.elementFromPoint(innerWidth / 2, 20)?.closest("dialog") ||
            document.elementFromPoint(innerWidth / 2, 20) === document.querySelector("dialog#ob"),
        ),
      ).toBe(true);
    });
  });

  test("the club's subscribe popup fits the screen, also on a small phone; Escape gives the page back", async ({
    page,
  }) => {
    await page.goto("./#/club/luzern");
    await page.locator("main .cstick a.go").click();
    await expect(page.locator("dialog[open]")).toBeVisible();
    await inside(page, "dialog[open]");
    await page.setViewportSize({ width: 360, height: 640 });
    await inside(page, "dialog[open]");
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator("main .cstick a.go")).toBeInViewport();
  });

  test("the toast shows above the tab bar, inside the screen", async ({ page }) => {
    await page.addInitScript(() => {
      delete (Navigator.prototype as { share?: unknown }).share;
      Object.defineProperty(navigator, "clipboard", { value: { writeText: async () => {} } });
    });
    await page.goto("./#/club/luzern");
    await page.locator(".chero").getByRole("button", { name: "Share" }).click();
    const toast = page.locator("#toast");
    await expect(toast).toHaveText("Link copied");
    await settle(page);
    const b = (await toast.boundingBox())!;
    const tabs = (await page.locator("nav#tabs").boundingBox())!;
    const vp = page.viewportSize()!;
    expect(b.y + b.height).toBeLessThanOrEqual(tabs.y);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(vp.width);
    expect(await toast.evaluate((el) => +getComputedStyle(el).opacity)).toBe(1);
  });
});
