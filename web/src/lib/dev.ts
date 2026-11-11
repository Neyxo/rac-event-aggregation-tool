// Developer mode's preview switches (the dev screen): each is a rac.dev* key that only counts while developer mode (rac.dev) is on.
import { store } from "./store";

export type DevFlag = "Date" | "Guest" | "New" | "Stale";
export function devFlag(k: "Date"): string | null;
export function devFlag(k: Exclude<DevFlag, "Date">): boolean | null;
export function devFlag(k: DevFlag): string | boolean | null {
  return store.get("rac.dev", false) ? store.get(`rac.dev${k}`, null) : null;
}
/** any preview switch on: the Dev button in the top bar is lit */
export const anyDevFlag = (): boolean => !!(devFlag("Date") || devFlag("Guest") || devFlag("New") || devFlag("Stale"));

/** "pretend a date": every "now" on this device is shifted so that today is that day; dates of events are untouched.
 *  Must run before anything reads the date: first thing in main.tsx. */
export function installPretendDate(): void {
  const day = devFlag("Date");
  if (!day) return;
  const Real = Date;
  const off = new Real(day + "T" + new Real().toTimeString().slice(0, 8)).getTime() - Real.now();
  if (isNaN(off)) return;
  class Shifted extends Real {
    constructor(...a: unknown[]) {
      if (a.length) super(...(a as [string])); else super(Real.now() + off);
    }
    static override now() { return Real.now() + off; }
  }
  globalThis.Date = Shifted as DateConstructor;
}
