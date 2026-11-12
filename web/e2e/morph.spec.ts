// The morphing heads, measured in a real browser (jsdom has no layout): the event head and the club head stick under the top bar and
// compact as you scroll, and the About screen opens Learn / Help / Celebrate one after the other. These tests look at what the user
// sees (boxes, sizes, what is on top), not at how it is done (--m, .on), so they should stay green through a rewrite of the hooks.
// What they need from the markup is in SEL below.
import type { Page } from "@playwright/test";
import { expect, FIXTURE, go, MEMBER, scrollToY, settle, test } from "./fixtures";
import { readFileSync } from "node:fs";

const SEL = {
  bar: "header#top",
  /** the primary button of a head, its label, and the placeholder that keeps its place in the row below the head */
  go: ".go", label: ".go span", ph: ".ph",
};
interface Head { name: string; hash: string; head: string; title: string; goLabel: string }
const EVENT: Head = { name: "event", hash: "#/event/223112", head: "main .evdetail .head", title: "Suppenmittag Wheel-Clubs Luzern-Sursee", goLabel: "Register" };
const CLUB: Head = { name: "club", hash: "#/club/luzern", head: "main .cstick", title: "Rotaract Luzern", goLabel: "Subscribe" };
const LONG: Head = { ...EVENT, name: "event with a 103-character title", hash: "#/event/222523", title: "" };
const CANCELLED: Head = { ...EVENT, name: "cancelled event", hash: "#/event/222796", title: "", goLabel: "Open on Polaris" };
const HEADS = [EVENT, CLUB, LONG, CANCELLED];

interface Box { top: number; bottom: number; left: number; right: number; w: number; h: number }
interface Snap {
  y: number; vw: number; pageH: number; barBottom: number;
  head: Box; go: Box; ph: Box; h1: Box; label: Box;
  /** where the title's text can be: its box without the padding */
  h1Left: number; h1Right: number;
  /** the head's parts other than the button and the watermark: its text and pictures */
  contentBottom: number;
  h1Lines: number; h1Size: number; labelOpacity: number;
  /** where the row with the placeholder sits in the document, whatever the scroll position */
  phDocTop: number;
  /** the element on top in the middle of the head's 64px box is part of the head */
  headOnTop: boolean;
}
const snap = (page: Page, head: string) => page.evaluate(([head, S]) => {
  const box = (el: Element): Box => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, w: r.width, h: r.height }; };
  const h = document.querySelector<HTMLElement>(head!)!, bar = document.querySelector<HTMLElement>(S!.bar)!;
  const goEl = h.querySelector<HTMLElement>(S!.go)!, label = h.querySelector<HTMLElement>(S!.label)!, ph = h.parentElement!.querySelector<HTMLElement>(S!.ph)!;
  const h1 = h.querySelector("h1")!, cs = getComputedStyle(h1), hb = box(h);
  const parts = [...h.querySelectorAll<HTMLElement>("h1, .meta, .sub, .tags, .date, img.c")].filter(n => n.getBoundingClientRect().height > 0);
  const top = document.elementFromPoint(hb.left + hb.w / 2, hb.top + Math.min(hb.h, 64) / 2);
  return {
    y: scrollY, vw: document.documentElement.clientWidth, pageH: document.documentElement.scrollHeight, barBottom: bar.getBoundingClientRect().bottom,
    head: hb, go: box(goEl), ph: box(ph), h1: box(h1), label: box(label),
    h1Left: box(h1).left + parseFloat(cs.paddingLeft), h1Right: box(h1).right - parseFloat(cs.paddingRight),
    contentBottom: Math.max(...parts.map(n => n.getBoundingClientRect().bottom)),
    h1Lines: Math.round(h1.getBoundingClientRect().height / parseFloat(cs.lineHeight)), h1Size: parseFloat(cs.fontSize),
    labelOpacity: +getComputedStyle(label).opacity,
    phDocTop: ph.getBoundingClientRect().top + scrollY,
    headOnTop: !!top && h.contains(top),
  };
}, [head, SEL] as const) as Promise<Snap>;

/** the scroll position at which the head arrives under the top bar */
const stickAt = async (page: Page, head: string) => { await scrollToY(page, 0); const s = await snap(page, head); return Math.round(s.head.top - s.barBottom); };
const open = async (page: Page, h: Head) => {
  await page.goto("./" + h.hash);
  await expect(page.locator(h.head)).toBeVisible();
  await settle(page);
};
const isPill = (s: Snap) => s.go.w > 70 && s.label.w > 30 && s.labelOpacity === 1;
const isIcon = (s: Snap) => s.go.w <= 40 && s.label.w < 1;
const near = (a: number, b: number, tol = 1.5) => Math.abs(a - b) <= tol;

test.use({ storage: MEMBER });

for (const H of HEADS) {
  test.describe(`${H.name} head`, () => {
    test("at rest: the title in full, the button a labelled pill below it, exactly on its placeholder", async ({ page }) => {
      await open(page, H);
      const s = await snap(page, H.head);
      if (H.title) await expect(page.locator(H.head + " h1")).toHaveText(H.title);
      await expect(page.locator(`${H.head} ${SEL.label}`)).toHaveText(H.goLabel);
      expect(isPill(s), "a labelled pill").toBe(true);
      // on its placeholder, which has its size: the buttons next to the placeholder line up with it
      expect(near(s.go.left, s.ph.left) && near(s.go.top, s.ph.top), `button at ${s.go.left},${s.go.top}, placeholder at ${s.ph.left},${s.ph.top}`).toBe(true);
      expect(near(s.go.w, s.ph.w) && near(s.go.h, s.ph.h), "placeholder has the button's size").toBe(true);
      // below the head's text, not on it
      expect(s.go.top).toBeGreaterThanOrEqual(s.contentBottom + 8);
      expect(s.go.top).toBeLessThanOrEqual(s.contentBottom + 16);
      // nothing sticks out of the screen
      expect(s.go.left).toBeGreaterThanOrEqual(0);
      expect(s.h1.right).toBeLessThanOrEqual(s.vw);
    });

    test("scrolled: sticks right under the top bar, 64px, one line, the button an icon at the right", async ({ page }) => {
      await open(page, H);
      const rest = await snap(page, H.head), at = await stickAt(page, H.head);
      await scrollToY(page, at + 120);
      await expect.poll(async () => isIcon(await snap(page, H.head)), "the button becomes the icon alone").toBe(true);
      await expect.poll(async () => (await snap(page, H.head)).h1Lines, "the title is one line").toBe(1);
      const s = await snap(page, H.head);
      expect(near(s.head.top, s.barBottom), `head at ${s.head.top}, bar ends at ${s.barBottom}`).toBe(true);
      expect(near(s.head.h, 64)).toBe(true);
      expect(s.headOnTop, "nothing covers the head").toBe(true);
      // the button: inside the head's box, near its right edge
      expect(s.go.top).toBeGreaterThanOrEqual(s.head.top);
      expect(s.go.bottom).toBeLessThanOrEqual(s.head.bottom);
      expect(s.head.right - s.go.right).toBeGreaterThanOrEqual(8);
      expect(s.head.right - s.go.right).toBeLessThanOrEqual(24);
      expect(s.go.right).toBeLessThanOrEqual(s.vw);
      // the title: smaller, inside the box, and it ends before the button
      expect(s.h1Size).toBeLessThan(rest.h1Size);
      expect(s.h1.top).toBeGreaterThanOrEqual(s.head.top);
      expect(s.h1.bottom).toBeLessThanOrEqual(s.head.bottom);
      expect(s.h1Right).toBeLessThanOrEqual(s.go.left);
      // the button still works there
      await expect(page.locator(`${H.head} ${SEL.go}`)).toHaveAttribute("title", /.+/);
    });

    test("compacting moves nothing else: same page height, the row below stays where it was", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });  // the club's colour block drifts with the scroll otherwise (its own test)
      await open(page, H);
      const rest = await snap(page, H.head), at = await stickAt(page, H.head);
      await scrollToY(page, at + 120);
      await expect.poll(async () => isIcon(await snap(page, H.head))).toBe(true);
      const s = await snap(page, H.head);
      expect(s.pageH).toBe(rest.pageH);
      expect(near(s.phDocTop, rest.phDocTop, 0.5), `row at ${s.phDocTop}, was at ${rest.phDocTop}`).toBe(true);
      // and back at the top it is the pill on its placeholder again
      await scrollToY(page, 0);
      await expect.poll(async () => isPill(await snap(page, H.head))).toBe(true);
      await expect.poll(async () => { const b = await snap(page, H.head); return near(b.go.left, b.ph.left) && near(b.go.top, b.ph.top) && b.h1Size === rest.h1Size && b.h1.h === rest.h1.h; }).toBe(true);
    });

    test("not scroll-bound: compact after 24px of sticking, back only under 8px", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });  // no transition: the state right after the scroll is the final one
      await open(page, H);
      const at = await stickAt(page, H.head);
      const state = async (y: number) => { await scrollToY(page, at + y); const s = await snap(page, H.head); return isIcon(s) ? "compact" : isPill(s) ? "rest" : `between (button ${s.go.w}px)`; };
      expect(await state(0)).toBe("rest");
      expect(await state(20)).toBe("rest");
      expect(await state(30)).toBe("compact");
      expect(await state(14)).toBe("compact");  // hysteresis: stays
      expect(await state(10)).toBe("compact");
      expect(await state(4)).toBe("rest");
      expect(await state(14)).toBe("rest");     // and stays the other way too
      expect(await state(22)).toBe("rest");
      expect(await state(26)).toBe("compact");
      // a jump far down and straight back to the top
      expect(await state(600)).toBe("compact");
      await scrollToY(page, 0);
      expect(isPill(await snap(page, H.head))).toBe(true);
    });

    test("every scroll position on the way down and back up: never under the bar, never covered, never off the side", async ({ page }) => {
      test.slow();  // many scroll steps: three times the usual time limit, for a busy CI machine
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, H);
      const at = await stickAt(page, H.head), end = at + 400, bad: string[] = [];
      const ys = [...Array.from({ length: 41 }, (_, i) => Math.round(i * end / 40)), ...Array.from({ length: 41 }, (_, i) => Math.round(end - i * end / 40))];
      for (const y of ys) {
        await scrollToY(page, y);
        const s = await snap(page, H.head);
        if (s.y !== y) continue;  // the page is shorter than that
        const say = (m: string) => bad.push(`at ${y}: ${m}`);
        if (s.head.top < s.barBottom - 1.5 && s.head.bottom > s.barBottom) say(`head top ${s.head.top} is under the bar (${s.barBottom})`);
        if (y > at + 30 && s.head.bottom > s.barBottom + 32 && !near(s.head.top, s.barBottom)) say(`head not stuck: top ${s.head.top}`);
        if (s.head.bottom > s.barBottom + 32 && !s.headOnTop) say("head covered");
        if (!isPill(s) && !isIcon(s)) say(`button is neither pill nor icon: ${s.go.w}px`);
        if (s.go.left < 0 || s.go.right > s.vw) say(`button off the side: ${s.go.left}..${s.go.right}`);
        if (isIcon(s) && s.h1Right > s.go.left + 0.5) say("title runs under the button");
      }
      expect(bad).toEqual([]);
    });

    test("compact survives a resize: still under the bar, the button still at the right edge", async ({ page }) => {
      await open(page, H);
      const at = await stickAt(page, H.head), vp = page.viewportSize()!;
      await scrollToY(page, at + 120);
      await expect.poll(async () => isIcon(await snap(page, H.head))).toBe(true);
      await page.setViewportSize({ width: vp.width + 180, height: vp.height - 80 });
      await settle(page);
      await expect.poll(async () => { const s = await snap(page, H.head); return isIcon(s) && near(s.head.top, s.barBottom) && s.head.right - s.go.right >= 8 && s.head.right - s.go.right <= 24 && s.go.right <= s.vw; }).toBe(true);
    });
  });
}

test.describe("event head", () => {
  test("compact: date pane smaller, chips and star faded out; all back at rest", async ({ page }) => {
    await open(page, EVENT);
    const parts = () => page.evaluate(h => {
      const q = (s: string) => document.querySelector<HTMLElement>(h + " " + s)!;
      return { date: q(".date").getBoundingClientRect().width, tagsH: q(".tags").getBoundingClientRect().height, tags: +getComputedStyle(q(".tags")).opacity, star: +getComputedStyle(q(".star")).opacity };
    }, EVENT.head);
    const rest = await parts(), at = await stickAt(page, EVENT.head);
    expect(rest).toMatchObject({ tags: 1, star: 1 });
    expect(rest.tagsH).toBeGreaterThan(15);
    await scrollToY(page, at + 120);
    await expect.poll(async () => (await parts()).tagsH).toBe(0);
    const c = await parts();
    expect(c).toMatchObject({ tags: 0, star: 0 });
    expect(c.date).toBeLessThan(rest.date * 0.75);
    await scrollToY(page, 0);
    await expect.poll(parts).toEqual(rest);
  });

  test("the button keeps its link in both states", async ({ page }) => {
    await open(page, EVENT);
    const goBtn = page.locator(`${EVENT.head} ${SEL.go}`);
    const url = JSON.parse(readFileSync(FIXTURE + "events.json", "utf8")).events.find((e: { id: string }) => e.id === "223112").url as string;
    await expect(goBtn).toHaveAttribute("href", url);
    await expect(goBtn).toHaveAttribute("target", "_blank");
    await scrollToY(page, await stickAt(page, EVENT.head) + 120);
    await expect.poll(async () => isIcon(await snap(page, EVENT.head))).toBe(true);
    await expect(goBtn).toHaveAttribute("href", url);
    await expect(goBtn).toHaveAttribute("title", "Register");  // the label is gone: the title still says what it does
  });

  test("with a picture: the head starts below it and sticks once the picture has scrolled away", async ({ page }) => {
    await page.route(/\/events\.json(\?|$)/, async r => {
      const d = JSON.parse(readFileSync(FIXTURE + "events.json", "utf8"));
      d.events.find((e: { id: string }) => e.id === "223112").image = "https://example.org/pic.jpg";
      await r.fulfill({ json: d });
    });
    await open(page, EVENT);
    const hero = await page.locator("main .evdetail .hero").boundingBox();
    expect(hero!.height).toBeGreaterThan(100);
    const s0 = await snap(page, EVENT.head);
    expect(s0.head.top).toBeGreaterThanOrEqual(hero!.y + hero!.height - 1);
    expect(near(s0.go.top, s0.ph.top) && near(s0.go.left, s0.ph.left)).toBe(true);
    const at = await stickAt(page, EVENT.head);
    expect(at).toBeGreaterThan(100);
    // half the picture gone: still at rest, scrolling with the page
    await scrollToY(page, at / 2);
    const mid = await snap(page, EVENT.head);
    expect(isPill(mid)).toBe(true);
    expect(mid.head.top).toBeGreaterThan(mid.barBottom + 20);
    await scrollToY(page, at + 60);
    await expect.poll(async () => { const s = await snap(page, EVENT.head); return isIcon(s) && near(s.head.top, s.barBottom); }).toBe(true);
  });

  test("the card's end takes the head away with it; the heading after it then sticks under the bar", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 420 });  // short, so the page is long enough to scroll the card away
    await open(page, EVENT);
    const sh = page.locator("main > h3.sh").first();
    const shDocTop = await sh.evaluate(el => el.getBoundingClientRect().top + scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    expect(max, "room to scroll the card away").toBeGreaterThan(shDocTop - 60);
    // the card's last lines under the bar: the head is on its way out, above the heading and never over it
    await scrollToY(page, shDocTop - 150);
    let s = await snap(page, EVENT.head), b = (await sh.boundingBox())!;
    expect(s.head.bottom).toBeLessThanOrEqual(b.y + 1);
    expect(s.head.top).toBeLessThanOrEqual(s.barBottom + 1.5);
    // the heading has passed the bar: it sticks there, the head is gone
    await scrollToY(page, shDocTop - 37);
    s = await snap(page, EVENT.head); b = (await sh.boundingBox())!;
    expect(near(b.y, s.barBottom), `heading at ${b.y}, bar ends at ${s.barBottom}`).toBe(true);
    expect(s.head.bottom).toBeLessThanOrEqual(s.barBottom + 1);
  });

  test("another event from the list below starts at rest; back restores the scrolled, compact head", async ({ page }) => {
    await open(page, EVENT);
    const at = await stickAt(page, EVENT.head);
    await scrollToY(page, at + 90);
    await expect.poll(async () => isIcon(await snap(page, EVENT.head))).toBe(true);
    const y = await page.evaluate(() => scrollY);
    const next = page.locator("main > a.event").first(), title = await next.locator("h4").innerText();
    await next.evaluate((a: HTMLElement) => a.click());
    await expect(page.locator(EVENT.head + " h1")).toHaveText(title);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    await expect.poll(async () => { const s = await snap(page, EVENT.head); return isPill(s) && near(s.go.top, s.ph.top) && near(s.go.left, s.ph.left); }, "the new event's head is at rest, measured for its own title").toBe(true);
    await page.goBack();
    await expect(page.locator(EVENT.head + " h1")).toHaveText(EVENT.title);
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(y);
    await expect.poll(async () => { const s = await snap(page, EVENT.head); return isIcon(s) && near(s.head.top, s.barBottom); }, "compact again, without a scroll").toBe(true);
    // and the way up still ends at rest, on the placeholder
    await scrollToY(page, 0);
    await expect.poll(async () => { const s = await snap(page, EVENT.head); return isPill(s) && near(s.go.top, s.ph.top); }).toBe(true);
  });
});

test.describe("club head", () => {
  const crest = (page: Page) => page.locator(CLUB.head + " img.c").boundingBox();

  test("at rest it is see-through over the colour block; compact it is a full-width coloured bar with a small crest", async ({ page }) => {
    await open(page, CLUB);
    const bg = () => page.locator(CLUB.head).evaluate(el => getComputedStyle(el).backgroundImage);
    const c0 = (await crest(page))!, s0 = await snap(page, CLUB.head);
    expect(Math.round(c0.width)).toBe(56);
    // the block's buttons sit in one row with the pill
    const row = await page.locator("main .chero .btns > a, main .chero .btns > button").evaluateAll(els => els.map(e => e.getBoundingClientRect()).map(r => ({ top: r.top, h: r.height })));
    expect(row.length).toBeGreaterThan(1);
    for (const r of row) expect(near(r.top + r.h / 2, s0.go.top + s0.go.h / 2, 2), "icon buttons level with the pill").toBe(true);
    const restBg = await bg();
    await scrollToY(page, await stickAt(page, CLUB.head) + 120);
    await expect.poll(async () => Math.round((await crest(page))!.width)).toBe(30);
    const s = await snap(page, CLUB.head), c = (await crest(page))!;
    expect(near(s.head.left, 0) && near(s.head.right, s.vw), `bar spans ${s.head.left}..${s.head.right} of ${s.vw}`).toBe(true);
    expect(c.y).toBeGreaterThanOrEqual(s.head.top);
    expect(c.y + c.height).toBeLessThanOrEqual(s.head.bottom);
    expect(s.h1Left).toBeGreaterThanOrEqual(c.x + c.width);  // the name starts after the crest
    expect(await bg()).not.toBe(restBg);
    // no sideways scroll from the widened bar
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });

  test("the icon button still opens the subscribe popup", async ({ page }) => {
    await open(page, CLUB);
    await scrollToY(page, await stickAt(page, CLUB.head) + 120);
    await expect.poll(async () => isIcon(await snap(page, CLUB.head))).toBe(true);
    const y = await page.evaluate(() => scrollY);
    await page.locator(`${CLUB.head} ${SEL.go}`).click();
    const popup = page.locator("dialog[open]");
    await expect(popup).toBeVisible();
    await expect(popup).toContainText("Rotaract Luzern");
    await page.keyboard.press("Escape");
    await expect(popup).toHaveCount(0);
    // the page behind is where it was, still compact
    expect(await page.evaluate(() => scrollY)).toBe(y);
    expect(isIcon(await snap(page, CLUB.head))).toBe(true);
  });

  test("section headings stick right under the compact head, with the frost behind them", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: page.viewportSize()!.width, height: 420 });  // short, so the last heading can reach the head
    await open(page, CLUB);
    const heads = page.locator("main > h3.sh");
    expect(await heads.count()).toBeGreaterThan(0);
    const last = heads.last(), docTop = await last.evaluate(el => el.getBoundingClientRect().top + scrollY);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    expect(max, "room for the last heading to reach the head").toBeGreaterThan(docTop - 100);
    // in one jump, as back/forward restores a scroll position
    await scrollToY(page, Math.min(max, docTop - 40));
    const s = await snap(page, CLUB.head), b = (await last.boundingBox())!;
    expect(near(s.head.top, s.barBottom)).toBe(true);
    expect(near(b.y, s.head.bottom), `heading at ${b.y}, head ends at ${s.head.bottom}`).toBe(true);
    const frost = await page.evaluate(() => { const c = getComputedStyle(document.getElementById("frost")!, "::before"), r = document.getElementById("frost")!.getBoundingClientRect(); return { top: r.top, h: parseFloat(c.height), opacity: +c.opacity }; });
    expect(frost.opacity).toBe(1);
    expect(frost.top).toBeLessThanOrEqual(b.y);
    expect(frost.top + frost.h).toBeGreaterThanOrEqual(b.y + b.height - 0.5);
    // back at the top: no heading stuck, no frost
    await scrollToY(page, 0);
    await expect.poll(() => page.evaluate(() => +getComputedStyle(document.getElementById("frost")!, "::before").opacity)).toBe(0);
  });

  test("the colour block drifts up a little faster than the page; not with reduced motion", async ({ page }) => {
    await open(page, CLUB);
    const ty = () => page.locator("main .chero").evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42);
    expect(await ty()).toBe(0);
    await scrollToY(page, 100);
    expect(await ty()).toBeCloseTo(-12, 1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.locator(CLUB.head)).toBeVisible();
    await scrollToY(page, 100);
    expect(await ty()).toBe(0);
  });

  test("club to club (the partner chip): the next club's head starts at rest, measured for its own name", async ({ page }) => {
    await open(page, CLUB);
    await scrollToY(page, await stickAt(page, CLUB.head) + 60);
    await expect.poll(async () => isIcon(await snap(page, CLUB.head))).toBe(true);
    await page.locator(".aboutc .with a.chip[href='#/club/sempachersee']").evaluate((a: HTMLElement) => a.click());
    await expect(page.locator(CLUB.head + " h1")).toHaveText("Rotaract Sempachersee");
    await expect.poll(async () => { const s = await snap(page, CLUB.head); return s.y === 0 && isPill(s) && near(s.go.top, s.ph.top) && near(s.go.left, s.ph.left) && s.go.top >= s.contentBottom + 8; }).toBe(true);
  });
});

test.describe("leaving a morphing screen", () => {
  test("the next screen's headings stick under the bar again, not under a head that is gone", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, CLUB);
    await scrollToY(page, await stickAt(page, CLUB.head) + 200);
    await go(page, "#/discover");
    await expect(page.locator("main a.event").nth(8)).toBeVisible();
    await scrollToY(page, 500);
    const r = await page.evaluate(() => ({ bar: document.getElementById("top")!.getBoundingClientRect().bottom, head: document.querySelector("main .sh.lv1")!.getBoundingClientRect().top }));
    expect(near(r.head, r.bar), `list title at ${r.head}, bar ends at ${r.bar}`).toBe(true);
  });
});

// ---- What is Rotaract?: Learn, Help, Celebrate open one after the other as you scroll through the track
test.describe("about: the scroll morph", () => {
  const WORDS = ["Learn.", "Help.", "Celebrate."];
  interface About { open: number[]; sizes: number[]; dots: number[]; stageTop: number; barBottom: number; color: string; y: number; range: number; trackTop: number }
  const about = (page: Page) => page.evaluate(() => {
    const ws = [...document.querySelectorAll<HTMLElement>("main.about .words > *")], track = document.querySelector<HTMLElement>("main.about .track")!;
    return {
      // the panel under each word (picture and text): its height
      open: ws.map(w => Math.round(w.querySelector<HTMLElement>(".open")!.getBoundingClientRect().height)),
      sizes: ws.map(w => Math.round(parseFloat(getComputedStyle(w.querySelector(".word")!).fontSize))),
      dots: [...document.querySelectorAll("main.about .prog i")].map(i => Math.round(i.getBoundingClientRect().width)),
      stageTop: document.querySelector("main.about .stage")!.getBoundingClientRect().top, barBottom: document.getElementById("top")!.getBoundingClientRect().bottom,
      color: getComputedStyle(document.querySelector("main.about .prog i.on") ?? document.querySelector("main.about .stage")!).backgroundColor,
      y: scrollY, range: track.offsetHeight - innerHeight, trackTop: track.getBoundingClientRect().top + scrollY,
    };
  }) as Promise<About>;
  /** which word is open: -1 none, 0..2, or "a,b" when it isn't exactly one */
  const which = (a: About) => { const o = a.open.map((h, i) => h > 60 ? i : -1).filter(i => i >= 0); return o.length === 0 ? -1 : o.length === 1 ? o[0]! : o.join(","); };
  const settled = async (page: Page) => { await settle(page); return about(page); };
  /** the scroll position of fraction p of the track */
  const at = (a: About, p: number) => Math.round(a.trackTop + a.range * p);
  const MIDS = [0, 1, 2].map(i => 0.05 + 0.95 * (i + 0.5) / 3);
  const openAbout = async (page: Page) => { await page.goto("./#/about"); await expect(page.getByText("Learn.")).toBeVisible(); return settled(page); };

  test("at the top all three words are big and closed, the stage fills the screen between the bars", async ({ page }) => {
    const a = await openAbout(page);
    expect(which(a)).toBe(-1);
    expect(a.open).toEqual([0, 0, 0]);
    expect(new Set(a.sizes).size).toBe(1);
    expect(a.dots).toEqual([6, 6, 6]);
    await expect(page.locator("main.about .word")).toHaveText(WORDS);
    const stage = (await page.locator("main.about .stage").boundingBox())!, tabs = (await page.locator("nav#tabs").boundingBox())!;
    expect(near(stage.y, a.barBottom, 2)).toBe(true);
    expect(near(stage.y + stage.height, tabs.y, 1), `stage ends at ${stage.y + stage.height}, the tab bar starts at ${tabs.y}`).toBe(true);
    await expect(page.locator("main.about .hint")).toBeVisible();
    expect(a.range).toBeGreaterThan(1000);  // room to scroll through the three words
  });

  test("scrolling opens Learn, then Help, then Celebrate: one at a time, its dot and colour with it, the stage pinned", async ({ page }) => {
    const a0 = await openAbout(page), colors: string[] = [];
    for (const i of [0, 1, 2]) {
      await scrollToY(page, at(a0, MIDS[i]!));
      const a = await settled(page);
      expect(which(a), `${WORDS[i]} open at its third of the track`).toBe(i);
      expect(a.open[i]).toBeGreaterThan(120);  // picture and text
      expect(a.dots).toEqual([0, 1, 2].map(j => j === i ? 18 : 6));
      expect(a.sizes[i]).toBeGreaterThan(Math.max(...a.sizes.filter((_, j) => j !== i)));  // the open word is the big one
      expect(near(a.stageTop, a.barBottom, 2), "the stage stays pinned under the bar").toBe(true);
      await expect(page.locator("main.about .w").nth(i).locator("img")).toBeVisible();
      colors.push(a.color);
    }
    expect(new Set(colors).size, "each word has its own colour").toBe(3);
    // past the track: Celebrate stays open and the page goes on
    await scrollToY(page, at(a0, 1) + 300);
    const end = await settled(page);
    expect(which(end)).toBe(2);
    expect(end.stageTop).toBeLessThan(end.barBottom - 100);
    await expect(page.locator("main.about .after h2")).toBeInViewport();
    // and all the way back up it closes again
    await scrollToY(page, 0);
    expect(which(await settled(page))).toBe(-1);
  });

  test("the words open in order on the way down and close in order on the way up, never two at once, no flicker at a boundary", async ({ page }) => {
    test.slow();  // many scroll steps: three times the usual time limit, for a busy CI machine
    const a0 = await openAbout(page);
    // without the snap points (their own test below): they hold the page on a word, and this is about where one word hands over to the next
    await page.addStyleTag({ content: "html { scroll-snap-type: none !important; }" });
    // the state the screen is in is its class here: the panels' heights lag behind by their transition
    const cur = () => page.evaluate(() => { const on = [...document.querySelectorAll("main.about .words > *")].map((w, i) => w.classList.contains("on") ? i : -1).filter(i => i >= 0); return on.length > 1 ? 99 : on[0] ?? -1; });
    const seen: number[] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) { await scrollToY(page, at(a0, i / N)); seen.push(await cur()); }
    const down = seen.filter((v, i) => v !== seen[i - 1]);
    expect(down).toEqual([-1, 0, 1, 2]);
    // each word gets about a third of the track
    for (const w of [0, 1, 2]) expect(seen.filter(v => v === w).length).toBeGreaterThan(N / 4);
    const back: number[] = [];
    for (let i = N; i >= 0; i--) { await scrollToY(page, at(a0, i / N)); back.push(await cur()); }
    expect(back.filter((v, i) => v !== back[i - 1])).toEqual([2, 1, 0, -1]);
    // hysteresis: wiggling around a boundary doesn't flip it back and forth
    const edge = seen.findIndex(v => v === 1) / N;
    await scrollToY(page, at(a0, edge));
    expect(await cur()).toBe(1);
    const wiggle: number[] = [];
    for (const d of [-0.005, 0.005, -0.005, 0.005, -0.005]) { await scrollToY(page, at(a0, edge + d)); wiggle.push(await cur()); }
    expect(new Set(wiggle).size).toBe(1);
  });

  test("a scroll that ends near a word settles on the middle of its third; far past the track nothing pulls back", async ({ page }) => {
    const a0 = await openAbout(page);
    for (const i of [0, 1, 2]) {
      await scrollToY(page, at(a0, MIDS[i]!) + 60);
      const a = await settled(page);
      expect(near(a.y, at(a0, MIDS[i]!), 2), `stopped at ${a.y}, ${WORDS[i]} is at ${at(a0, MIDS[i]!)}`).toBe(true);
      expect(which(a)).toBe(i);
    }
    await scrollToY(page, at(a0, 1) + 700);
    expect(near((await about(page)).y, at(a0, 1) + 700, 2)).toBe(true);
  });

  test("a tap on a word scrolls to it and opens it; Enter on a focused word does the same", async ({ page }) => {
    const a0 = await openAbout(page);
    await page.locator("main.about .word", { hasText: "Celebrate." }).click();
    await expect.poll(async () => which(await about(page)), { timeout: 10_000 }).toBe(2);
    const a = await settled(page);
    expect(Math.abs(a.y - at(a0, MIDS[2]!))).toBeLessThan(a0.range * 0.12);  // at (or snapped near) the middle of its third
    const help = page.locator("main.about .word", { hasText: "Help." });
    await expect(help).toHaveAttribute("role", "button");
    await help.focus();
    await page.keyboard.press("Enter");
    await expect.poll(async () => which(await about(page)), { timeout: 10_000 }).toBe(1);
    await help.focus();
    await page.locator("main.about .word", { hasText: "Learn." }).focus();
    await page.keyboard.press(" ");
    await expect.poll(async () => which(await about(page)), { timeout: 10_000 }).toBe(0);
  });

  test("reduced motion: no pinned stage, everything open at once", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const a = await openAbout(page);
    expect(a.open.every(h => h > 120), `all three panels open: ${a.open}`).toBe(true);
    expect(a.range).toBeLessThan(600);  // no 340vh track to scroll through
    for (const w of WORDS) await expect(page.getByText(w, { exact: true })).toBeVisible();
    await expect(page.locator("main.about .w img")).toHaveCount(3);
  });

  test("coming back to the screen starts it closed again; a resize keeps the open word", async ({ page }) => {
    const a0 = await openAbout(page);
    await scrollToY(page, at(a0, MIDS[1]!));
    expect(which(await settled(page))).toBe(1);
    const vp = page.viewportSize()!;
    await page.setViewportSize({ width: vp.width, height: vp.height - 120 });
    const r = await settled(page);
    expect([0, 1, 2]).toContain(which(r));  // one word, open, after the track changed its height
    await page.locator("#tabs a.tab").first().click();
    await expect(page.locator("body")).toHaveAttribute("data-page", "home");
    await page.locator("header#top a.hbtn[href='#/about']").click();
    await expect(page.getByText("Learn.")).toBeVisible();
    expect(which(await settled(page))).toBe(-1);
  });
});
