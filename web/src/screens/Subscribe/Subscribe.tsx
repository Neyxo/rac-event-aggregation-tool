// Calendar help: the one button that adds a calendar (the same flow as everywhere), common problems with their fixes, questions.
import { useState } from "react";
import { t, tx, type Pair } from "../../i18n";
import type { ScreenProps } from "../../App";
import { Footer, Icon, QaList, SubscribeSheet, SyncSheet } from "../../components";

type Act = "sync" | "add" | null;
// what each fix of tx("sub_fix") offers to do, by problem and case: the phone steps, or adding the calendar (again)
const ACTS: Act[][] = [["sync", "add"], ["sync", "add", null], [null, null, "add"], [null], ["add"]];

/** One problem. With a question, the answer picks the case (Yes: the first, No: the second); without, every possible cause is listed. */
function Fix({
  q,
  ask,
  cases,
  acts,
  onAct,
}: {
  q: string;
  ask: string;
  cases: Pair[];
  acts: Act[];
  onAct: (a: Act) => void;
}) {
  const S = tx("sf");
  const [yes, setYes] = useState<boolean | null>(null);
  // with a question, only the case that fits the answer; without one, every case
  const answered = yes === null ? [] : [yes ? 0 : 1];
  const shown = ask ? answered : cases.map((_, i) => i);
  return (
    <details name="fix">
      <summary>{q}</summary>
      {ask && (
        <div className="fixask">
          <p>{ask}</p>
          <div className="seg" role="group">
            <button type="button" aria-pressed={yes === true} onClick={() => setYes(true)}>
              {t("yes")}
            </button>
            <button type="button" aria-pressed={yes === false} onClick={() => setYes(false)}>
              {t("no")}
            </button>
          </div>
        </div>
      )}
      {shown.map((i) => {
        const [h, text] = cases[i]!;
        const a = acts[i] ?? null;
        return (
          <div key={i} className="fixcase">
            <b>{h}</b>
            <span>{text}</span>
            {a && (
              <button className="linkbtn" type="button" onClick={() => onAct(a)}>
                {a === "sync" ? S.show : S.add}
              </button>
            )}
          </div>
        );
      })}
    </details>
  );
}

export default function Subscribe(_props: ScreenProps) {
  const S = tx("sf");
  const [open, setOpen] = useState<Act>(null);
  return (
    <main className="wrap">
      <section className="card">
        <h2>{t("sub_title")}</h2>
        <p>{t("ab_sub_sub")}</p>
        <button className="linkbtn primary" type="button" onClick={() => setOpen("add")}>
          <Icon name="calendar" />
          {S.add}
        </button>
      </section>
      <section className="card">
        <h2>{t("sub_fix_h")}</h2>
        <div className="qa">
          {tx("sub_fix").map((f, i) => (
            <Fix key={i} {...f} acts={ACTS[i] ?? []} onAct={setOpen} />
          ))}
        </div>
      </section>
      <section className="card">
        <h2>{t("faq")}</h2>
        <div className="qa">
          <QaList items={tx("sub_qa")} />
        </div>
      </section>
      <div id="foot">
        <Footer />
      </div>
      {open === "add" && <SubscribeSheet onClose={() => setOpen(null)} />}
      {open === "sync" && <SyncSheet onClose={() => setOpen(null)} />}
    </main>
  );
}
