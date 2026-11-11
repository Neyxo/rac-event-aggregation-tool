// A club: sticky compacting head (crest, name, subscribe), colour block with the site / social / share buttons, next event, about,
// news, projects, photos, more events. An unknown id lists all clubs.
import { useLayoutEffect, useRef, useState } from "react";
import type { ScreenProps } from "../App";
import { t } from "../i18n";
import { freshNews } from "../lib/data";
import { clubVars } from "../lib/color";
import { isPast } from "../lib/dates";
import { href } from "../lib/route";
import { shareUrl } from "../lib/share";
import type { Club as ClubT, Partner } from "../lib/types";
import {
  ClubChip, EventCard, Footer, GoogleLink, HelpLinks, Icon, ICON, LoadError, NewsStrip, NextUp, Popup, Rich, toast,
  useData, useMorphHead, useStickyHeads, useTitle, useWash, type IconName,
} from "../components";

const DISTRICT = { "1980": "d1980", "1990": "d1990", "2000": "d2000" } as const;
const isIcon = (k: string): k is IconName => k in ICON;

/** a round icon link in the colour block (website, socials) */
function IconLink({ name, to, label }: { name: IconName; to: string; label: string }) {
  return <a className="btn glass ic" href={to} target="_blank" rel="noopener" aria-label={label} title={label}><Icon name={name} /></a>;
}

/** the club's own share page (c/<id>.html, with its own link preview), shared like an event */
function ShareButton({ c }: { c: ClubT }) {
  const share = async () => {
    const url = shareUrl({ club: c.id });
    if (navigator.share) {
      try { await navigator.share({ title: c.name, url }); } catch { /* dismissed */ }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast(t("copied"));
  };
  return <button className="btn glass ic" type="button" aria-label={t("share")} title={t("share")} onClick={() => void share()}><Icon name="share" /></button>;
}

/** "club.html?id=X" in clubs.toml is another club of this app: its chip; anything else is an outside site */
function PartnerChip({ p }: { p: Partner }) {
  const { D } = useData();
  const m = p.url.match(/^club\.html\?id=(.+)/);
  if (m?.[1] && D.clubs[m[1]]) return <ClubChip id={m[1]} />;
  return <a className="chip club" href={m?.[1] ? href("club", m[1]) : p.url} target="_blank" rel="noopener" title={p.note || undefined}><Icon name="wheel" />{p.name}</a>;
}

function About({ c }: { c: ClubT }) {
  const [join, setJoin] = useState(false);
  const partners = c.partners || [];
  if (!c.about && !c.how && !partners.length) return null;
  return (
    <section className="aboutc glass">
      <div className="k">{t("cp_about")}</div>
      {c.about ? <p>{c.about}</p> : null}
      {c.how ? <div className="links"><button type="button" onClick={() => setJoin(true)}><Icon name="flag" />{t("cp_join")}</button></div> : null}
      {partners.length ? <div className="with"><span>{t("cp_partners")}</span>{partners.map(p => <PartnerChip key={p.url} p={p} />)}</div> : null}
      {join && <Popup title={t("cp_join")} onClose={() => setJoin(false)}><Rich text={c.how} color={c.color} /></Popup>}
    </section>
  );
}

/** a bare webcal: link does nothing where no app handles it (Android, most Windows browsers): the same choices as the subscribe screen */
function SubscribePopup({ c, onClose }: { c: ClubT; onClose: () => void }) {
  const https = new URL(c.id + ".ics", location.href).href;
  const webcal = https.replace(/^https?:/, "webcal:");
  return (
    <Popup title={t("cp_sub")} onClose={onClose}>
      <div className="feeds">
        <div className="feed"><div className="l"><a href={webcal}>{t("apple")}</a><GoogleLink webcal={webcal} /><a href={https}>.ics</a></div></div>
        <p className="meta"><a href={href("subscribe")}>{t("sub_title")}</a></p>
      </div>
    </Popup>
  );
}

/** Instagram posts once the build has a token (docs/layers.md); otherwise the club's own photos, or pictures of its past events */
function Photos({ c, pastPics }: { c: ClubT; pastPics: { src: string; href: string; title: string }[] }) {
  const insta = c.instagram || [];
  if (insta.length) {
    return <div className="strip pics">{insta.map(p => <a key={p.url} href={p.url} target="_blank" rel="noopener" title={p.caption}><img src={p.image} alt={p.caption} loading="lazy" /></a>)}</div>;
  }
  if (c.photos?.length) {
    return <div className="strip pics">{c.photos.map(src => <a key={src} href={src} target="_blank" rel="noopener"><img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" /></a>)}</div>;
  }
  return <div className="strip pics">{pastPics.map(p => <a key={p.href} href={p.href} title={p.title || undefined}><img src={p.src} alt={p.title || ""} loading="lazy" referrerPolicy="no-referrer" /></a>)}</div>;
}

export default function Club({ route }: ScreenProps) {
  const { ready, error, D } = useData();
  const c = ready ? D.clubs[route.params.id] : undefined;
  const head = useRef<HTMLDivElement>(null), hero = useRef<HTMLDivElement>(null), ph = useRef<HTMLSpanElement>(null);
  const [sub, setSub] = useState(false);
  useWash(c?.color, c?.color, c?.color);
  useTitle(c?.name);
  useStickyHeads();
  useMorphHead(head, !!c);
  // at rest the subscribe pill sits below the name (inside the sticky box, overflowing); the block starts below it and a placeholder
  // in the button row keeps its place, so the icon buttons line up next to it
  useLayoutEffect(() => {
    const h = head.current, b = hero.current, p = ph.current, go = h?.querySelector<HTMLElement>(".go"), s = h?.querySelector(".sub");
    if (!h || !b || !p || !go || !s) return;
    const bt = Math.round(s.getBoundingClientRect().bottom - h.getBoundingClientRect().top + 12);
    h.style.setProperty("--bt", bt + "px");
    b.style.paddingTop = bt + "px";
    p.style.width = go.offsetWidth + "px";
    p.style.height = go.offsetHeight + "px";
  }, [c]);
  // the colour block drifts up a touch faster than the page: a subtle parallax that shows off the frosting
  useLayoutEffect(() => {
    const b = hero.current;
    if (!b || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const drift = () => { b.style.transform = `translateY(${-(scrollY * .12).toFixed(1)}px)`; };
    addEventListener("scroll", drift, { passive: true });
    drift();
    return () => removeEventListener("scroll", drift);
  }, [c]);

  if (error) return <main className="wrap clubpage" id="main"><LoadError /></main>;
  if (!ready) return <main className="wrap clubpage" id="main" />;
  if (!c) {
    return (
      <main className="wrap clubpage" id="main">
        <h1>{t("clubs")}</h1>
        {D.data.clubs.map(x => <p key={x.id}><a href={href("club", x.id)}>{x.name}</a></p>)}
      </main>
    );
  }

  const upcoming = D.data.events.filter(e => e.clubs.includes(c.id) && !isPast(e));
  const next = upcoming[0];
  const pastPics = D.data.events.filter(e => e.clubs.includes(c.id) && e.image && isPast(e)).slice(-6).map(e => ({ src: e.image, href: href("event", e.id), title: e.title }));
  const hasPhotos = (c.instagram || []).length > 0 || (c.photos?.length ? c.photos.length : pastPics.length) > 0;
  const news = freshNews(c);
  const projects = c.projects || [];
  const subLine = [c.district ? t(DISTRICT[c.district as keyof typeof DISTRICT]) : c.source ? null : t("national"), c.city].filter(Boolean).join(" · ");
  return (
    <main className="wrap clubpage" id="main" style={clubVars(c.color)}>
      <i className="sent" aria-hidden="true" />
      {/* two parts: a sticky header whose box is always 64px (crest and name draw big over the block at rest and compact as you scroll),
          and the colour block with the buttons, which simply scrolls away. No height changes while sticking, so nothing bounces. */}
      <div className="cstick morph" ref={head}>
        {c.logo ? <img className="c" src={c.logo} alt="" /> : null}
        <h1>{c.name}</h1>
        <div className="sub">{subLine}</div>
        <a className="go" href={href("subscribe")} title={t("cp_sub")} onClick={ev => { ev.preventDefault(); setSub(true); }}><Icon name="calendar" /><span>{t("subscribe")}</span></a>
      </div>
      <div className="chero" ref={hero}>
        {c.logo ? <img className="big" src={c.logo} alt="" /> : null}
        <div className="btns">
          <span className="ph" ref={ph} />
          <IconLink name="globe" to={c.url} label={t("cp_site")} />
          {Object.entries(c.links || {}).map(([k, to]) => <IconLink key={k} name={isIcon(k) ? k : "globe"} to={to} label={k[0]!.toUpperCase() + k.slice(1)} />)}
          <ShareButton c={c} />
        </div>
      </div>
      {next ? <NextUp e={next} /> : <p className="meta" style={{ marginTop: 14 }}>{t("cp_none")}</p>}
      {c.source === "international" ? <HelpLinks keys={["intl"]} /> : null}
      <About c={c} />
      {news.length ? <h3 className="sh">{t("news")}</h3> : null}
      {news.length ? <NewsStrip items={news} /> : null}
      {/* projects are not filtered by age like news: a club's projects stay its projects */}
      {projects.length ? <h3 className="sh">{t("projects")}</h3> : null}
      {projects.length ? <NewsStrip items={projects} /> : null}
      {hasPhotos ? <h3 className="sh">{t("photos")}</h3> : null}
      {hasPhotos ? <Photos c={c} pastPics={pastPics} /> : null}
      {upcoming.length > 1 ? <h3 className="sh">{t("more_events")}</h3> : null}
      {upcoming.slice(1, 8).map((e, i) => <EventCard key={e.id} e={e} i={i} />)}
      <div className="links center"><a href={href("discover", null, "clubs=" + c.id)}><Icon name="discover" />{t("cp_all")}</a></div>
      <Footer />
      {sub && <SubscribePopup c={c} onClose={() => setSub(false)} />}
    </main>
  );
}
