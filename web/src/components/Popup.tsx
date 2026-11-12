// A small popup with a title, some content and Done (done: another label; aside: a link or the main action left of it; quiet: Done
// is a grey "x Close" because the main action is the aside; back: a round back button before the title): <dialog class="ob"><div class="ob-in"><h2/>{content}<div class="nav"><span/><button/></div></div></dialog>.
// Mount it to open it ({open && <Popup .../>}); it calls onClose when closed (Done, Esc). Rendered into body, so the
// CSS of where it was opened (.feed .l a ...) never reaches into it.
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n";
import { Icon } from "./Icon";
import { useModal } from "./hooks";

export function Popup({ title, onClose, children, className = "ob", done = t("done"), aside, quiet, back, action }: { title: string; onClose: () => void; children: ReactNode; className?: string; done?: string; aside?: ReactNode; quiet?: boolean; back?: () => void; action?: ReactNode }) {
  const dlg = useRef<HTMLDialogElement>(null), h2 = useRef<HTMLHeadingElement>(null);
  useModal(dlg, true, { focus: h2 });
  return createPortal(
    <dialog className={className} ref={dlg} onClose={onClose}>
      <div className="ob-in">
        <div className="obhead">
          {back && <button className="obback" type="button" aria-label={t("back")} onClick={back}><Icon name="back" /></button>}
          <h2 tabIndex={-1} ref={h2}>{title}</h2>
        </div>
        {children}
        {/* action: a stepper's Next takes Done's place, and closing becomes the quiet text on the left */}
        {action ? <div className="nav"><button className="skip" type="button" onClick={() => dlg.current?.close()}>{done}</button>{action}</div>
          : <div className="nav"><span>{aside}</span><button className={quiet ? "btn quiet" : "btn"} type="button" onClick={() => dlg.current?.close()}>{quiet && <Icon name="x" />}{done}</button></div>}
      </div>
    </dialog>,
    document.body,
  );
}
