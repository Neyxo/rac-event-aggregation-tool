// The toast at the bottom: one line, gone after 2.2 s; with an action button it stays until replaced.
// toast() works from anywhere (event handlers, lib callers); <Toast/> is rendered once by App.
import { useSyncExternalStore } from "react";

export interface ToastAction { label: string; fn: () => void }
interface State { msg: string; action: ToastAction | null; show: boolean }
let state: State = { msg: "", action: null, show: false }, timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const set = (s: State) => { state = s; listeners.forEach(f => f()); };

export function toast(msg: string, action?: ToastAction): void {
  set({ msg, action: action ?? null, show: true });
  clearTimeout(timer);
  if (!action) timer = setTimeout(() => set({ ...state, show: false }), 2200);
}
/** the same function, for components that prefer a hook */
export const useToast = () => toast;

export function Toast() {
  const s = useSyncExternalStore(f => { listeners.add(f); return () => { listeners.delete(f); }; }, () => state);
  return (
    <div className={"toast" + (s.show ? " show" : "")} id="toast" role="status">
      {s.msg}{s.action && <button type="button" onClick={s.action.fn}>{s.action.label}</button>}
    </div>
  );
}
