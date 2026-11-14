// The sticky pieces of a screen, each with its rules inside: the head that compacts as you scroll, and the section headings.
import { useRef, type ReactNode } from "react";
import { useMorphHead, useStickyHeads } from "./hooks";

/** The head of the event and club screens: sticks under the top bar and compacts as you scroll (hooks' useMorphHead has the how).
 *  Renders its own sentinel. Its primary button is a child with class "go"; <GoPlace /> in the button row below keeps that
 *  button's place at rest. className must not change between renders: the hook toggles .on on the element. */
export function MorphHead({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useMorphHead(ref);
  return (
    <>
      <i className="sent" aria-hidden="true" />
      <div className={className + " morph"} ref={ref}>{children}</div>
    </>
  );
}
/** in the button row after a MorphHead: as big as the head's "go" button, which sits there at rest */
export const GoPlace = () => <span className="ph" />;

/** A section heading that sticks: lv1 (an h2: the page's sections) under the bar or the compact head, otherwise (an h3: months,
 *  sub-sections) under the stuck lv1 heading. Measures itself: no hook to call in the screen. */
export function Sh({ lv1, className, children }: { lv1?: boolean; className?: string; children: ReactNode }) {
  useStickyHeads();
  const Tag = lv1 ? "h2" : "h3";
  return <Tag className={"sh" + (lv1 ? " lv1" : "") + (className ? " " + className : "")}>{children}</Tag>;
}
