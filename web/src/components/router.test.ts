// The back button's depth: a link opened directly (even in a tab that was elsewhere before) has nothing in the app to go back to.
import { beforeEach, expect, test, vi } from "vitest";

beforeEach(() => { vi.resetModules(); history.replaceState(null, "", "/#/event/1"); });
const go = (h: string) => { history.pushState(null, "", h); dispatchEvent(new HashChangeEvent("hashchange")); };

test("opened directly: no in-app history, even when history.length > 1", async () => {
  history.pushState(null, "", "/#/event/1");  // another page before it in this tab
  const { canGoBack } = await import("./router");
  expect(history.length).toBeGreaterThan(1);
  expect(canGoBack()).toBe(false);
});

test("in-app navigations count up, back to the first entry counts down, a reload keeps the depth", async () => {
  const { canGoBack } = await import("./router");
  const first = history.state as { k: number; d: number };
  expect(first.d).toBe(0);
  go("/#/club/x");
  expect(canGoBack()).toBe(true);
  expect((history.state as { d: number }).d).toBe(1);
  // back/forward: the entry's own depth
  history.replaceState(first, "", "/#/event/1"); dispatchEvent(new HashChangeEvent("hashchange"));
  expect(canGoBack()).toBe(false);
  // a reload on a deeper entry
  history.replaceState({ k: 99, d: 2 }, "", "/#/club/x");
  vi.resetModules();
  expect((await import("./router")).canGoBack()).toBe(true);
});
