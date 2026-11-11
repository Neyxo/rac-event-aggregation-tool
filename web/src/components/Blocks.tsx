// Bigger shared blocks: the call to action, news teasers, a club's rich text, the pillar pictures, the offline state.
import { useEffect, useState, type ReactNode } from "react";
import { t } from "../i18n";
import { D } from "../lib/data";
import { clubVars, vars } from "../lib/color";
import { fmt, isPast } from "../lib/dates";
import { geocode, guessPosition, nearestClubs } from "../lib/geo";
import { pillarFallback, type Pillar } from "../lib/pillars";
import { parseRich, type Inline } from "../lib/rich";
import { href } from "../lib/route";
import { here } from "../lib/store";
import type { Coords, NewsItem } from "../lib/types";
import { ClubChip, ClubMark } from "./Club";

/** call to action: "your club" with its next event when a main club is set, "find your club" (town search, near me) otherwise.
 *  onPlace(coords) tells the screen where the visitor is once they typed a town or tapped "near me" (Home lists nearby events then). */
export function CtaBlock({ onPlace }: { onPlace?: (pos: Coords) => void }) {
  const home = D.settings.home ? D.clubs[D.settings.home] : undefined;
  const [q, setQ] = useState(""), [hint, setHint] = useState(""), [pos, setPos] = useState<Coords | null>(null);
  const show = (p: Coords) => { here.set(p); setPos(p); onPlace?.(p); };
  // a position found earlier in this tab is shown right away; the approximate position is only looked up on a tap, never on load
  useEffect(() => { const p = here.get(); if (p && !home) show(p); }, []);
  if (home) {
    const e = D.data.events.find(e => e.clubs.includes(home.id) && !isPast(e));
    return (
      <div className="cta glass" style={clubVars(home.color)}>
        <div className="k">{t("your_club")}</div>
        <div className="rc"><ClubMark c={home} /><div><b>{home.name}</b><span>{e ? `${fmt.dm.format(new Date(e.start))} · ${e.title}` : t("cp_none")}</span></div><a className="go" href={e ? href("event", e.id) : href("club", home.id)}>{t("go")}</a></div>
      </div>
    );
  }
  const find = async () => {
    const text = q.trim(); if (!text) return;
    setHint(t("locating"));
    try { const hit = await geocode(text); if (!hit) { setHint(t("place_nf")); return; } setHint("📍 " + hit.label); show(hit.coords); } catch { setHint(t("place_err")); }
  };
  const me = async () => { setHint(t("locating")); const p = await guessPosition(); setHint(p ? "" : t("loc_na")); if (p) show(p); };
  return (
    <div className="cta glass new">
      <div className="k">{t("ab_find_title")}</div>
      <div className="find">
        <input className="in" type="text" placeholder={t("ab_find_ph")} aria-label={t("ab_find_ph")} autoComplete="off" value={q} onChange={ev => setQ(ev.target.value)} onKeyDown={ev => { if (ev.key === "Enter") void find(); }} />
        <button className="go" type="button" onClick={() => void find()}>{t("ab_find_btn")}</button>
      </div>
      <div className="hint">{hint}</div>
      <div className="near">
        {pos ? nearestClubs(D.data.clubs, pos, 3).map(({ c, d }) => <ClubChip key={c.id} id={c.id}><small>{Math.round(d) + " km"}</small></ClubChip>)
          : <button className="linkbtn" type="button" onClick={() => void me()}>{"📍 " + t("near_btn")}</button>}
      </div>
    </div>
  );
}

/** a news teaser: picture with the title on it, linking to the article on the club's site */
export function NewsCard({ n }: { n: NewsItem }) {
  return (
    <a className="nw" href={n.url} target="_blank" rel="noopener">
      {n.image ? <img src={n.image} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      <div className="t"><b>{n.title}</b>{n.date ? <span>{fmt.date.format(new Date(n.date))}</span> : null}</div>
    </a>
  );
}
/** className: Home adds "hn" ("strip teasers hn") */
export function NewsStrip({ items, className = "strip teasers" }: { items: NewsItem[]; className?: string }) {
  return <div className={className}>{items.map(n => <NewsCard key={n.url} n={n} />)}</div>;
}

const In = ({ x }: { x: Inline }): ReactNode => x.map((p, i) => typeof p === "string" ? p : <b key={i}>{p.b}</b>);
/** a club's own text (lib/rich.ts format) */
export function Rich({ text, color }: { text: string; color?: string }) {
  return (
    <div className="rich" style={vars({ "--p": color || "#d41367" })}>
      {parseRich(text).map((b, i) => {
        switch (b.kind) {
          case "p": return <p key={i}><In x={b.text} /></p>;
          case "h3": return <h3 key={i}>{b.text}</h3>;
          case "steps": return <ol key={i} className="nsteps">{b.items.map((s, j) => <li key={j} className="step"><div className="ic">{s.n}</div><div className="tx"><b><In x={s.title} /></b>{s.text ? <span><In x={s.text} /></span> : null}</div></li>)}</ol>;
          case "points": return <ul key={i} className="pts">{b.items.map((s, j) => <li key={j}><span><In x={s} /></span></li>)}</ul>;
        }
      })}
    </div>
  );
}

/** img/<k>.jpg, or an event picture whose title fits when that file is missing */
export function PillarPic({ k, className }: { k: Pillar; className?: string }) {
  const [fallback, setFallback] = useState<string | null>(null);
  return (
    <img className={className} src={fallback ?? "img/" + k + ".jpg"} alt="" loading="lazy" referrerPolicy={fallback ? "no-referrer" : undefined}
      onError={() => { const f = pillarFallback(D.data.events, k); if (f && !fallback) setFallback(f); }} />
  );
}

/** offline on a first visit, or the site is broken: say so instead of a skeleton forever. Render it as the content of <main>. */
export function LoadError() {
  return <div className="empty">{t("offline")}<br /><button className="linkbtn" type="button" onClick={() => location.reload()}>{t("refresh")}</button></div>;
}
