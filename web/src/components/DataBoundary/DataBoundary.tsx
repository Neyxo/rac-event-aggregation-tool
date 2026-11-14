// What stands in for a screen before and without events.json: a skeleton while it loads, the offline note when it can't be loaded.
import { Component, Suspense, type ReactNode } from "react";
import { t } from "../../i18n";
import { LoadFailed } from "../../lib/data";
import { Skel } from "../Event/Event";

/** offline on a first visit, or the site is broken: say so instead of a skeleton forever. Render it as the content of <main>. */
export function LoadError() {
  return (
    <div className="empty">
      {t("offline")}
      <br />
      <button className="linkbtn" type="button" onClick={() => location.reload()}>
        {t("refresh")}
      </button>
    </div>
  );
}

interface BoundaryProps {
  /** the navigation's id (useNav().id): a failure is forgotten on the next navigation, the same screen's included (App has the
   *  data loaded again then: lib/data's retryLoad) */
  nav: number;
  /** the class of the screen's own <main>, so the skeleton and the offline note sit where its content would */
  main: string;
  /** skeleton rows while loading (a list, an event); none: an empty main */
  skel: number;
  children: ReactNode;
}
/** Around every screen (App renders one per screen, keyed like the screen): while events.json (or the screen's code) loads, useData()
 *  suspends and a skeleton stands in for the screen; when it can't be loaded (LoadFailed), the offline note. Any other error is not
 *  caught here. */
export class DataBoundary extends Component<BoundaryProps, { failed: unknown; nav: number }> {
  override state: { failed: unknown; nav: number } = { failed: null, nav: -1 };
  // a new navigation (or the first): forget an earlier failure
  static getDerivedStateFromProps(p: BoundaryProps, s: { nav: number }) {
    return p.nav === s.nav ? null : { failed: null, nav: p.nav };
  }
  static getDerivedStateFromError(failed: unknown) {
    return { failed };
  }
  override render() {
    const { failed } = this.state;
    const { main, skel } = this.props;
    if (failed && !(failed instanceof LoadFailed)) throw failed;
    if (failed)
      return (
        <main className={main} id="main">
          <LoadError />
        </main>
      );
    const rows = Array.from({ length: skel }, (_, i) => <Skel key={i} />);
    return (
      <Suspense
        fallback={
          <main className={main} id="main" aria-busy="true">
            {rows}
          </main>
        }
      >
        {this.props.children}
      </Suspense>
    );
  }
}
