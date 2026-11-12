// Subscribe: how to subscribe per platform, the all-clubs feed, one feed per club (by district, then the international and Rotary
// pseudo-clubs), questions.
import { t, tx, type StrKey } from "../i18n";
import { isPast } from "../lib/dates";
import type { Club } from "../lib/types";
import type { ScreenProps } from "../App";
import { FeedRow, Footer, GoogleSync, QaList, SubFacts, useData } from "../components";
import { DISTRICT_IDS, DISTRICTS } from "../lib/color";

const PLATFORMS = [
  ["sp_ios", "sp_ios_s"],
  ["sp_google", "sp_google_s"],
  ["sp_android", "sp_android_s"],
  ["sp_outlook", "sp_outlook_s"],
] as const;

/** a heading and its clubs' feeds, nothing when there are no clubs (a district without clubs, Rotary switched off) */
function FeedGroup({ name, clubs, upcomingBy }: { name: string; clubs: Club[]; upcomingBy: Record<string, number> }) {
  if (!clubs.length) return null;
  return (
    <>
      <h3>{name}</h3>
      {clubs.map(c => <FeedRow key={c.id} c={c} link count={upcomingBy[c.id] || 0} />)}
    </>
  );
}

export default function Subscribe(_props: ScreenProps) {
  const D = useData();
  // per club, Rotary included (its district feeds); the "everything" feed is Rotaract only, like all.ics
  const upcomingBy: Record<string, number> = {};
  let total = 0;
  for (const e of D.data.events) {
    if (isPast(e)) continue;
    if (e.layer !== "rotary") total++;
    for (const c of e.clubs) upcomingBy[c] = (upcomingBy[c] || 0) + 1;
  }
  const districts: [string, StrKey][] = [...DISTRICT_IDS.map(d => [d, DISTRICTS[d].key] as [string, StrKey]), ["", "national"]];
  const inDistrict = (d: string) => D.data.clubs.filter(c => c.district === d && !c.source).sort((a, b) => a.name.localeCompare(b.name));
  const ofSource = (s: string) => D.data.clubs.filter(c => c.source === s);
  return (
    <main className="wrap">
      <section className="card">
        <h2>{t("sub_title")}</h2>
        <SubFacts />
        <div className="how">
          {PLATFORMS.map(([h, steps]) => (
            <details key={h}>
              <summary>{t(h)}</summary>
              <ol>{tx(steps).map((s, i) => <li key={i}>{s}</li>)}</ol>
              {(h === "sp_google" || h === "sp_android") && <GoogleSync />}
            </details>
          ))}
        </div>
      </section>
      <section className="card">
        <h2>{t("sp_all")}</h2>
        <p>{t("sp_all_text")}</p>
        <div className="feeds">
          <FeedRow name={t("sp_all_feed")} count={total} />
        </div>
      </section>
      <section className="card">
        <h2>{t("sp_club")}</h2>
        <p>{t("sp_club_text")}</p>
        <div className="feeds">
          {districts.map(([d, k]) => <FeedGroup key={d} name={t(k)} clubs={inDistrict(d)} upcomingBy={upcomingBy} />)}
          <FeedGroup name={tx("intl").h} clubs={ofSource("international")} upcomingBy={upcomingBy} />
          {/* the Rotary layer's feeds, one per district; only there when "Show Rotary events" is on */}
          <FeedGroup name={t("rotary_feeds")} clubs={ofSource("rotary")} upcomingBy={upcomingBy} />
        </div>
      </section>
      <section className="card">
        <h2>{t("faq")}</h2>
        <div className="qa"><QaList items={tx("sub_qa")} /></div>
      </section>
      <div id="foot"><Footer /></div>
    </main>
  );
}
