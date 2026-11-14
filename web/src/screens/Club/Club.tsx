// A club: sticky compacting head (crest, name, subscribe), colour block with the site / social / share buttons, next event, about,
// news, projects, photos, more events. An unknown id lists all clubs.
import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { ScreenProps } from "../../App";
import { BE, setLang, t } from "../../i18n";
import { freshNews } from "../../lib/data";
import { clubVars, DISTRICTS, isDistrict } from "../../lib/color";
import { isPast } from "../../lib/dates";
import { href } from "../../lib/route";
import { shareUrl } from "../../lib/share";
import type { Club as ClubT, Partner } from "../../lib/types";
import {
  ClubChip,
  EventCard,
  SubscribeSheet,
  Footer,
  HelpLinks,
  Icon,
  ICON,
  NewsStrip,
  NextUp,
  Popup,
  Rich,
  share,
  toast,
  GoPlace,
  MorphHead,
  Sh,
  useData,
  useEventListener,
  useTitle,
  useWash,
  type IconName,
} from "../../components";

const isIcon = (k: string): k is IconName => k in ICON;

/** a round icon link in the colour block (website, socials) */
function IconLink({ name, to, label }: { name: IconName; to: string; label: string }) {
  return (
    <a className="btn glass ic" href={to} target="_blank" rel="noopener" aria-label={label} title={label}>
      <Icon name={name} />
    </a>
  );
}

/** the club's own share page (c/<id>.html, with its own link preview), shared like an event */
function ShareButton({ c }: { c: ClubT }) {
  return (
    <button
      className="btn glass ic"
      type="button"
      aria-label={t("share")}
      title={t("share")}
      onClick={() => void share({ title: c.name, url: shareUrl({ club: c.id }) })}
    >
      <Icon name="share" />
    </button>
  );
}

/** "#/club/X" in clubs.toml is another club of this app: its chip (a plain link while it is not loaded); anything else is an outside site */
function PartnerChip({ p }: { p: Partner }) {
  const D = useData();
  const id = p.url.match(/^#\/club\/(.+)/)?.[1];
  if (id && D.clubs[id]) return <ClubChip id={id} />;
  const out = id ? {} : { target: "_blank", rel: "noopener" };
  return (
    <a className="chip club" href={p.url} {...out} title={p.note || undefined}>
      <Icon name="wheel" />
      {p.name}
    </a>
  );
}

function About({ c }: { c: ClubT }) {
  const [join, setJoin] = useState(false);
  const partners = c.partners || [];
  if (!c.about && !c.how && !partners.length) return null;
  return (
    <section className="aboutc glass">
      <div className="k">{t("cp_about")}</div>
      {c.about ? <p>{c.about}</p> : null}
      {c.how ? (
        <div className="links">
          <button type="button" onClick={() => setJoin(true)}>
            <Icon name="flag" />
            {t("cp_join")}
          </button>
        </div>
      ) : null}
      {partners.length ? (
        <div className="with">
          <span>{t("cp_partners")}</span>
          {partners.map((p) => (
            <PartnerChip key={p.url} p={p} />
          ))}
        </div>
      ) : null}
      {join && (
        <Popup title={t("cp_join")} onClose={() => setJoin(false)}>
          <Rich text={c.how} color={c.color} />
        </Popup>
      )}
    </section>
  );
}

/** Instagram posts once the build has a token (docs/layers.md); otherwise the club's own photos, or pictures of its past events */
function Photos({ c, pastPics }: { c: ClubT; pastPics: { src: string; href: string; title: string }[] }) {
  const insta = c.instagram || [];
  if (insta.length) {
    return (
      <div className="strip pics">
        {insta.map((p) => (
          <a key={p.url} href={p.url} target="_blank" rel="noopener" title={p.caption}>
            <img src={p.image} alt={p.caption} loading="lazy" />
          </a>
        ))}
      </div>
    );
  }
  if (c.photos?.length) {
    return (
      <div className="strip pics">
        {c.photos.map((src) => (
          <a key={src} href={src} target="_blank" rel="noopener">
            <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" />
          </a>
        ))}
      </div>
    );
  }
  return (
    <div className="strip pics">
      {pastPics.map((p) => (
        <a key={p.href} href={p.href} title={p.title || undefined}>
          <img src={p.src} alt={p.title || ""} loading="lazy" referrerPolicy="no-referrer" />
        </a>
      ))}
    </div>
  );
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: scored 21 of 15 when the rule came in; to be split up
export default function Club({ route }: ScreenProps) {
  const D = useData();
  const c = D.clubs[route.params.id];
  const hero = useRef<HTMLDivElement>(null);
  const [sub, setSub] = useState(false);
  useWash(c?.color, c?.color, c?.color);
  useTitle(c?.name);
  // the colour block drifts up a touch faster than the page: a subtle parallax that shows off the frosting
  const drift = () => {
    if (hero.current && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      hero.current.style.transform = `translateY(${-(scrollY * 0.12).toFixed(1)}px)`;
  };
  useEventListener("scroll", drift);
  useLayoutEffect(drift, [c]);

  // Easter egg: seven taps on the Bern crest switch Bärndütsch on (and off again). A mouse/touch extra on purpose, so the crest
  // stays a plain image for screen readers and the keyboard.
  const taps = useRef(0);
  const bear =
    c?.id === "bern"
      ? (ev: MouseEvent<HTMLImageElement>) => {
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
            ev.currentTarget.animate?.([{ rotate: "-10deg" }, { rotate: "10deg" }, { rotate: "0deg" }], 250);
          if (++taps.current < 7) return;
          taps.current = 0;
          toast(BE ? "Adieu, merci!" : "Äuä!");
          setTimeout(() => setLang("de", !BE), 900); // long enough to read the toast; setLang reloads
        }
      : undefined;

  if (!c) {
    return (
      <main className="wrap clubpage">
        <h1>{t("clubs")}</h1>
        {D.data.clubs.map((x) => (
          <p key={x.id}>
            <a href={href("club", x.id)}>{x.name}</a>
          </p>
        ))}
      </main>
    );
  }

  const upcoming = D.data.events.filter((e) => e.clubs.includes(c.id) && !isPast(e));
  const next = upcoming[0];
  const pastPics = D.data.events
    .filter((e) => e.clubs.includes(c.id) && e.image && isPast(e))
    .slice(-6)
    .map((e) => ({ src: e.image, href: href("event", e.id), title: e.title }));
  const hasPhotos = (c.instagram || []).length > 0 || (c.photos?.length ? c.photos.length : pastPics.length) > 0;
  const news = freshNews(c);
  const projects = c.projects || [];
  const national = c.source ? null : t("national");
  const subLine = [isDistrict(c.district) ? t(DISTRICTS[c.district].key) : national, c.city]
    .filter(Boolean)
    .join(" · ");
  return (
    <main className="wrap clubpage" style={clubVars(c.color)}>
      {/* two parts: a sticky header whose box is always 64px (crest and name draw big over the block at rest and compact as you scroll),
          and the colour block with the buttons, which simply scrolls away. No height changes while sticking, so nothing bounces. */}
      <MorphHead className="cstick">
        {c.logo ? <img className="c" src={c.logo} alt="" onClick={bear} /> : null}
        <h1>{c.name}</h1>
        <div className="sub">{subLine}</div>
        <a
          className="go"
          href={href("subscribe")}
          title={t("cp_sub")}
          onClick={(ev) => {
            ev.preventDefault();
            setSub(true);
          }}
        >
          <Icon name="calendar" />
          <span>{t("subscribe")}</span>
        </a>
      </MorphHead>
      <div className="chero" ref={hero}>
        {c.logo ? <img className="big" src={c.logo} alt="" /> : null}
        <div className="btns">
          {/* at rest the subscribe pill sits here, below the name: the block starts below the head's content (app.css) */}
          <GoPlace />
          <IconLink name="globe" to={c.url} label={t("cp_site")} />
          {Object.entries(c.links || {}).map(([k, to]) => (
            <IconLink key={k} name={isIcon(k) ? k : "globe"} to={to} label={k[0]!.toUpperCase() + k.slice(1)} />
          ))}
          <ShareButton c={c} />
        </div>
      </div>
      {next ? (
        <NextUp e={next} />
      ) : (
        <p className="meta" style={{ marginTop: 14 }}>
          {t("cp_none")}
        </p>
      )}
      {c.source === "international" ? <HelpLinks keys={["intl"]} /> : null}
      <About c={c} />
      {news.length ? <Sh>{t("news")}</Sh> : null}
      {news.length ? <NewsStrip items={news} /> : null}
      {/* projects are not filtered by age like news: a club's projects stay its projects */}
      {projects.length ? <Sh>{t("projects")}</Sh> : null}
      {projects.length ? <NewsStrip items={projects} /> : null}
      {hasPhotos ? <Sh>{t("photos")}</Sh> : null}
      {hasPhotos ? <Photos c={c} pastPics={pastPics} /> : null}
      {upcoming.length > 1 ? <Sh>{t("more_events")}</Sh> : null}
      {upcoming.slice(1, 8).map((e, i) => (
        <EventCard key={e.id} e={e} i={i} />
      ))}
      <div className="links center">
        <a href={href("discover", null, "clubs=" + c.id)}>
          <Icon name="discover" />
          {t("cp_all")}
        </a>
      </div>
      <Footer />
      {sub && <SubscribeSheet club={c} onClose={() => setSub(false)} />}
    </main>
  );
}
