// International events: what REM, EUCO and the rest are, the international entry's upcoming events, questions.
import type { ScreenProps } from "../App";
import { t, tx } from "../i18n";
import { vars } from "../lib/color";
import { isPast } from "../lib/dates";
import { href } from "../lib/route";
import { EventCard, Footer, HelpLinks, Icon, LoadError, MoreLink, QaList, useData, useStickyHeads, useTitle, useWash, type IconName } from "../components";

const COL = ["#d41367", "#0067c8", "#009739"];
const KIND_IC: IconName[] = ["users", "flag", "pin", "wheel"];

/** the dates: the international entry's upcoming events (or a line saying there are none), then the way to follow them */
function Next() {
  const { ready, D } = useData();
  // nothing until the data is there: no skeleton for a few lines
  if (!ready) return null;
  const x = tx("intl");
  const next = D.data.events.filter(e => e.clubs.includes("international") && !isPast(e));
  return (
    <>
      {next.length ? next.map((e, i) => <EventCard key={e.id} e={e} i={i} />) : <p className="fine">{x.none}</p>}
      {D.clubs.international ? <MoreLink to={href("club", "international")} title={x.follow} sub={x.follow_sub} ic="calendar" p="#d41367" /> : null}
    </>
  );
}

export default function Intl(_props: ScreenProps) {
  const x = tx("intl");
  const { error } = useData();
  useWash("#d41367", "#0067c8", "#009739");
  useStickyHeads();
  useTitle(x.h);
  if (error) return <main className="wrap fam"><LoadError /></main>;
  return (
    <main className="wrap fam">
      <h1>{x.h}</h1>
      <p className="lead">{x.lead}</p>
      <h2 className="sh lv1">{x.kinds_h}</h2>
      <div className="tiles2">
        {x.kinds.map(([title, text], i) => (
          <div key={i} className="ft glass" style={vars({ "--p": COL[i % 3]! })}>
            <div className="ic"><Icon name={KIND_IC[i] ?? "info"} /></div>
            <b>{title}</b>
            <span>{text}</span>
          </div>
        ))}
      </div>
      <h2 className="sh lv1">{x.next_h}</h2>
      <Next />
      <section className="box tint glass" style={vars({ "--p": "#d41367" })}>
        <div className="bh"><div className="ic"><Icon name="heart" /></div><h2>{x.why_h}</h2></div>
        <ul className="yes">{x.why.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <h2 className="sh lv1">{t("faq")}</h2>
      <section className="box glass"><div className="qa"><QaList items={x.qa} /></div></section>
      <h2 className="sh lv1">{t("read_on")}</h2>
      <HelpLinks keys={["world", "family", "guide"]} />
      <div id="foot"><Footer /></div>
    </main>
  );
}
