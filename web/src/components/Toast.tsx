// The toast at the bottom: one line, gone after 2.2 s; with an action button it stays until replaced.
// toast() works from anywhere (event handlers, lib callers); <Toast/> is rendered once by App.
import { useSyncExternalStore } from "react";
import { cx } from "../lib/color";
import { emitter } from "../lib/store";

export interface ToastAction { label: string; fn: () => void }
interface State { msg: string; action: ToastAction | null; show: boolean }
let state: State = { msg: "", action: null, show: false }, timer: ReturnType<typeof setTimeout> | undefined;
const changes = emitter();
const set = (s: State) => { state = s; changes.emit(); };

export function toast(msg: string, action?: ToastAction): void {
  set({ msg, action: action ?? null, show: true });
  clearTimeout(timer);
  if (!action) timer = setTimeout(() => set({ ...state, show: false }), 2200);
}

export function Toast() {
  const s = useSyncExternalStore(changes.subscribe, () => state);
  return (
    <div className={cx("toast", s.show && "show")} id="toast" role="status">
      {s.msg}{s.action && <button type="button" onClick={s.action.fn}>{s.action.label}</button>}
    </div>
  );
}
