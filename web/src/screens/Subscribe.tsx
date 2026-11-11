// Subscribe (old subscribe.html): how to subscribe per platform, the all-clubs feed, one feed per club (by district, then the
// international and Rotary pseudo-clubs), questions. data-t attributes are kept from the old page so the DOM stays identical.
import { t, tx, type StrKey } from "../i18n";
import { isPast } from "../lib/dates";
import { clubVars } from "../lib/color";
import { href } from "../lib/route";
import type { Club } from "../lib/types";
import type { ScreenProps } from "../App";
import { ClubMark, Footer, GoogleLink, LoadError, QaList, useData } from "../components";

const PLATFORMS = [
  ["sp_ios", "sp_ios_s"],
  ["sp_google", "sp_google_s"],
  ["sp_android", "sp_android_s"],
  ["sp_outlook", "sp_outlook_s"],
] as const;

/** one row: the feed's name (a club links to its page) with its upcoming count, then Apple / Google / .ics */
function FeedRow({ c, file, count }: { c: Club | { id?: undefined; name: string }; file: string; count: number }) {
  // absolute, because calendar apps get the link without this page around it; webcal: makes Apple and Outlook subscribe
  const https = new URL(file, location.href).href;
  const webcal = https.replace(/^https?:/, "webcal:");
  return (
    <div className="feed">
      <div className="name" style={c.id ? clubVars(c.color) : undefined}>
        {c.id ? <ClubMark c={c} /> : null}
        {c.id ? <a href={href("club", c.id)}>{c.name}</a> : c.name}
        <span className="meta">{t("n_upcoming", { n: count })}</span>
      </div>
      <div className="l">
        <a href={webcal}>{t("apple")}</a>
        <GoogleLink webcal={webcal} />
        <a href={https}>.ics</a>
      </div>
    </div>
  );
}

/** a heading and its clubs' feeds, nothing when there are no clubs (a district without clubs, Rotary switched off) */
function FeedGroup({ name, clubs, upcomingBy }: { name: string; clubs: Club[]; upcomingBy: Record<string, number> }) {
  if (!clubs.length) return null;
  return (
    <>
      <h3>{name}</h3>
      {clubs.map(c => <FeedRow key={c.id} c={c} file={c.id + ".ics"} count={upcomingBy[c.id] || 0} />)}
    </>
  );
}

export default function Subscribe(_props: ScreenProps) {
  const { ready, error, D } = useData();
  if (error) return <main className="wrap" id="main"><LoadError /></main>;
  // per club, Rotary included (its district feeds); the "everything" feed is Rotaract only, like all.ics
  const upcomingBy: Record<string, number> = {};
  let total = 0;
  for (const e of ready ? D.data.events : []) {
    if (isPast(e)) continue;
    if (e.layer !== "rotary") total++;
    for (const c of e.clubs) upcomingBy[c] = (upcomingBy[c] || 0) + 1;
  }
  const districts: [string, StrKey][] = [["1980", "d1980"], ["1990", "d1990"], ["2000", "d2000"], ["", "national"]];
  const inDistrict = (d: string) => D.data.clubs.filter(c => c.district === d && !c.source).sort((a, b) => a.name.localeCompare(b.name));
  const ofSource = (s: string) => D.data.clubs.filter(c => c.source === s);
  return (
    <main className="wrap" id="main">
      <section className="card">
        <h2 data-t="sub_title">{t("sub_title")}</h2>
        <p data-t="sp_intro">{t("sp_intro")}</p>
        <div className="how" id="how">
          {PLATFORMS.map(([h, steps]) => (
            <details key={h}>
              <summary>{t(h)}</summary>
              <ol>{tx(steps).map((s, i) => <li key={i}>{s}</li>)}</ol>
            </details>
          ))}
        </div>
      </section>
      <section className="card" id="all">
        <h2 data-t="sp_all">{t("sp_all")}</h2>
        <p data-t="sp_all_text">{t("sp_all_text")}</p>
        <div className="feeds" id="feedAll">
          {ready && <FeedRow c={{ name: t("sp_all_feed") }} file="all.ics" count={total} />}
        </div>
      </section>
      <section className="card">
        <h2 data-t="sp_club">{t("sp_club")}</h2>
        <p data-t="sp_club_text">{t("sp_club_text")}</p>
        <div className="feeds" id="feeds">
          {ready && districts.map(([d, k]) => <FeedGroup key={d} name={t(k)} clubs={inDistrict(d)} upcomingBy={upcomingBy} />)}
          {ready && <FeedGroup name={tx("intl").h} clubs={ofSource("international")} upcomingBy={upcomingBy} />}
          {/* the Rotary layer's feeds, one per district; only there when "Show Rotary events" is on */}
          {ready && <FeedGroup name={t("rotary_feeds")} clubs={ofSource("rotary")} upcomingBy={upcomingBy} />}
        </div>
      </section>
      <section className="card">
        <h2 data-t="faq">{t("faq")}</h2>
        <div className="qa" id="qa"><QaList items={tx("sub_qa")} /></div>
      </section>
      <div id="foot">{ready && <Footer />}</div>
    </main>
  );
}
