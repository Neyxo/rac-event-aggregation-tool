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
  // the old page left this empty until the data was there
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
  if (error) return <main className="wrap fam" id="main"><LoadError /></main>;
  return (
    <main className="wrap fam" id="main">
      <h1 id="h">{x.h}</h1>
      <p className="lead" id="lead">{x.lead}</p>
      <h2 className="sh lv1" id="kindsH">{x.kinds_h}</h2>
      <div className="tiles2" id="kinds">
        {x.kinds.map(([title, text], i) => (
          <div key={i} className="ft glass" style={vars({ "--p": COL[i % 3]! })}>
            <div className="ic"><Icon name={KIND_IC[i] ?? "info"} /></div>
            <b>{title}</b>
            <span>{text}</span>
          </div>
        ))}
      </div>
      <h2 className="sh lv1" id="nextH">{x.next_h}</h2>
      <div id="next"><Next /></div>
      <section className="box tint glass" style={vars({ "--p": "#d41367" })}>
        <div className="bh" id="whyH"><div className="ic"><Icon name="heart" /></div><h2 id="whyT">{x.why_h}</h2></div>
        <ul className="yes" id="why">{x.why.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </section>
      <h2 className="sh lv1" data-t="faq">{t("faq")}</h2>
      <section className="box glass"><div className="qa" id="qa"><QaList items={x.qa} /></div></section>
      <h2 className="sh lv1" data-t="read_on">{t("read_on")}</h2>
      <div id="more"><HelpLinks keys={["world", "family", "guide"]} /></div>
      <div id="foot"><Footer /></div>
    </main>
  );
}
