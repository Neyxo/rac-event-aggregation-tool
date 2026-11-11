// A small popup with a title, some content and Done: <dialog class="ob"><div class="ob-in"><h2/>{content}<div class="nav"><span/><button/></div></div></dialog>.
// Mount it to open it ({open && <Popup .../>}); it calls onClose when closed (Done, Esc). Rendered into body, so the
// CSS of where it was opened (.feed .l a ...) never reaches into it.
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";

export function Popup({ title, onClose, children, className = "ob" }: { title: string; onClose: () => void; children: ReactNode; className?: string }) {
  const dlg = useRef<HTMLDialogElement>(null), h2 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const d = dlg.current;
    if (d && !d.open) d.showModal?.();
    h2.current?.focus();
  }, []);
  return createPortal(
    <dialog className={className} ref={dlg} onClose={onClose}>
      <div className="ob-in">
        <h2 tabIndex={-1} ref={h2}>{title}</h2>
        {children}
        <div className="nav"><span /><button className="btn" type="button" onClick={() => dlg.current?.close()}>{t("done")}</button></div>
      </div>
    </dialog>,
    document.body,
  );
}
