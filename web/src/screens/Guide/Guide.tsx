// New in the club: a hero in the home club's colour, four tappable steps, three facts. Texts: nm in i18n.
import { useEffect } from "react";
import type { ScreenProps } from "../../App";
import { t, tx } from "../../i18n";
import { BRAND3, clubVars, vars } from "../../lib/color";
import { fmt, isPast } from "../../lib/dates";
import { nClubs } from "../../lib/data";
import { href } from "../../lib/route";
import { store } from "../../lib/store";
import type { Club, Event } from "../../lib/types";
import { Footer, HelpLinks, Icon, useData, Sh, useTitle, useWash } from "../../components";

/** one step: a link when it leads somewhere (another site in a new tab), a plain box when it doesn't */
function Step({ n, title, text, to }: { n: number; title: string; text: string; to: string | undefined }) {
  const ext = !!to && /^http/.test(to);
  const style = vars({ "--p": BRAND3[(n - 1) % 3]! });
  const body = (
    <>
      <div className="ic">{String(n)}</div>
      <div className="tx">
        <b>{title}</b>
        <span>{text}</span>
      </div>
      {to ? <Icon name="back" className="chev" /> : null}
    </>
  );
  if (!to)
    return (
      <li>
        <div className="step glass" style={style}>
          {body}
        </div>
      </li>
    );
  return (
    <li>
      <a
        className="step glass"
        href={to}
        target={ext ? "_blank" : undefined}
        rel={ext ? "noopener" : undefined}
        style={style}
      >
        {body}
      </a>
    </li>
  );
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
  const D = useData();
  // Home stops pointing here once it has been opened
  useEffect(() => {
    store.set("rac.guideSeen", true);
  }, []);
  const home: Club | undefined = D.settings.home ? D.clubs[D.settings.home] : undefined;
  // its first colour is the home club's
  useWash(home ? home.color : BRAND3[0], BRAND3[1], BRAND3[2]);
  useTitle(nm.h);
  // each step leads somewhere: the club's Polaris site, Settings, Subscribe, the club's next event
  const next: Event | undefined = D.data.events.find(
    (e) => !isPast(e) && !e.cancelled && e.layer !== "rotary" && (!home || e.clubs.includes(home.id)),
  );
  const to = [
    home?.url || undefined,
    href("settings"),
    href("subscribe"),
    next ? href("event", next.id) : href("discover"),
  ];
  return (
    <main className="wrap fam">
      <div className="hero glass" style={home ? clubVars(home.color) : undefined}>
        <HeroContent home={home} />
      </div>
      <Sh lv1>{nm.steps_h}</Sh>
      <ol className="nsteps">
        {nm.steps.map(([title, text], i) => (
          <Step
            key={i}
            n={i + 1}
            title={title}
            text={i === 3 && next ? `${fmt.dm.format(new Date(next.start))} · ${next.title}` : text}
            to={to[i]}
          />
        ))}
      </ol>
      <div className="facts">
        {nm.facts.map(([v, l], i) => (
          <div key={i} className="glass" style={vars({ "--p": BRAND3[i]! })}>
            <b>{v.replace("{n}", String(nClubs()))}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>
      <Sh lv1>{t("read_on")}</Sh>
      <HelpLinks keys={["words", "family", "world"]} />
      <div id="foot">
        <Footer />
      </div>
    </main>
  );
}
