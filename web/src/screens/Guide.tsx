// New in the club: a hero in the home club's colour, four tappable steps, three facts. Texts: nm in i18n.
import { useEffect } from "react";
import type { ScreenProps } from "../App";
import { t, tx } from "../i18n";
import { clubVars, vars } from "../lib/color";
import { fmt, isPast } from "../lib/dates";
import { nClubs } from "../lib/data";
import { href } from "../lib/route";
import { store } from "../lib/store";
import type { Club, Event } from "../lib/types";
import { Footer, HelpLinks, Icon, LoadError, useData, useStickyHeads, useTitle, useWash } from "../components";

const COL = ["#d41367", "#0067c8", "#009739"];

/** one step: a link when it leads somewhere (another site in a new tab), a plain box when it doesn't */
function Step({ n, title, text, to }: { n: number; title: string; text: string; to: string | undefined }) {
  const ext = !!to && /^http/.test(to);
  const style = vars({ "--p": COL[(n - 1) % 3]! });
  const body = (
    <>
      <div className="ic">{String(n)}</div>
      <div className="tx"><b>{title}</b><span>{text}</span></div>
      {to ? <Icon name="back" className="chev" /> : null}
    </>
  );
  if (!to) return <li><div className="step glass" style={style}>{body}</div></li>;
  return <li><a className="step glass" href={to} target={ext ? "_blank" : undefined} rel={ext ? "noopener" : undefined} style={style}>{body}</a></li>;
}

/** the hero's content: the home club's crest (or a wave) and a welcome */
function HeroContent({ home }: { home: Club | undefined }) {
  const nm = tx("nm");
  return (
    <>
      {home?.logo ? <img src={home.logo} alt="" /> : <div className="wave">👋</div>}
      <h1>{home ? nm.hi.replace("{club}", home.name) : nm.hi0}</h1>
      <p>{nm.lead}</p>
    </>
  );
}

export default function Guide(_props: ScreenProps) {
  const nm = tx("nm");
  const { ready, error, D } = useData();
  // Home stops pointing here once it has been opened
  useEffect(() => { store.set("rac.guideSeen", true); }, []);
  const home: Club | undefined = ready && D.settings.home ? D.clubs[D.settings.home] : undefined;
  // the wash waits for the data: its first colour is the home club's, and a late switch would flash
  useWash(ready && (home ? home.color : COL[0]), ready && COL[1], ready && COL[2]);
  useStickyHeads();
  useTitle(nm.h);
  if (error) return <main className="wrap fam" id="main"><LoadError /></main>;
  // each step leads somewhere: the club's Polaris site, Settings, Subscribe, the club's next event
  const next: Event | undefined = ready ? D.data.events.find(e => !isPast(e) && !e.cancelled && e.layer !== "rotary" && (!home || e.clubs.includes(home.id))) : undefined;
  const to = [home?.url || undefined, href("settings"), href("subscribe"), next ? href("event", next.id) : href("discover")];
  return (
    <main className="wrap fam" id="main">
      <div className="hero glass" id="hero" style={home ? clubVars(home.color) : undefined}>{ready ? <HeroContent home={home} /> : null}</div>
      <h2 className="sh lv1" id="stepsH">{nm.steps_h}</h2>
      <ol className="nsteps" id="steps">
        {ready && nm.steps.map(([title, text], i) => (
          <Step key={i} n={i + 1} title={title} text={i === 3 && next ? `${fmt.dm.format(new Date(next.start))} · ${next.title}` : text} to={to[i]} />
        ))}
      </ol>
      <div className="facts" id="facts">
        {ready && nm.facts.map(([v, l], i) => (
          <div key={i} className="glass" style={vars({ "--p": COL[i]! })}><b>{v.replace("{n}", String(nClubs()))}</b><span>{l}</span></div>
        ))}
      </div>
      <h2 className="sh lv1">{t("read_on")}</h2>
      <div id="more"><HelpLinks keys={["words", "family", "world"]} /></div>
      <div id="foot"><Footer /></div>
    </main>
  );
}
