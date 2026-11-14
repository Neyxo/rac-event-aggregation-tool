// A small popup, every one laid out the same: back (when there is somewhere to go back to) top left, the title, close top right;
// the content; then, bottom right, the one button that moves on (action: Next, Done, Download), when there is one.
// <dialog class="ob"><div class="ob-in"><div class="obhead">[back]<h2/>[close]</div>{content}<div class="nav">{action}</div></div></dialog>.
// Mount it to open it ({open && <Popup .../>}); it calls onClose when closed (the x, Esc). Rendered into body, so the
// CSS of where it was opened (.feed .l a ...) never reaches into it.
import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { t } from "../../i18n";
import { Icon } from "../Icon";
import { useModal } from "../hooks";

export function Popup({
  title,
  onClose,
  children,
  className = "ob",
  back,
  action,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  back?: () => void;
  action?: ReactNode;
}) {
  const dlg = useRef<HTMLDialogElement>(null);
  const h2 = useRef<HTMLHeadingElement>(null);
  useModal(dlg, true, { focus: h2 });
  return createPortal(
    <dialog className={className} ref={dlg} onClose={onClose}>
      <div className="ob-in">
        <div className="obhead">
          {back && (
            <button className="obback" type="button" aria-label={t("back")} onClick={back}>
              <Icon name="back" />
            </button>
          )}
          <h2 tabIndex={-1} ref={h2}>
            {title}
          </h2>
          <button className="obback obx" type="button" aria-label={t("close")} onClick={() => dlg.current?.close()}>
            <Icon name="x" />
          </button>
        </div>
        {children}
        {action ? (
          <div className="nav">
            <span />
            {action}
          </div>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}
