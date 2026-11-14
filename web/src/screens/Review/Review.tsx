// Year in review (#/review, ?y=2026 for the year that began on 1 July 2026; without it the last finished one): the Rotaract year of
// my clubs (of all clubs for a guest) as a row of cards to swipe through, one number each. lib/review counts, this only draws, and
// leaves out a card with nothing to say. Made on the device from events.json and the saved events: nothing is recorded or sent.
// The row is plain CSS scroll-snap (app.css .rv); the two round buttons move it one card for keyboard and mouse, the segments above
// show where you are, and the card in view (.on) plays its entrance. A screen reader reads it as what it is, a list of sections. Home offers it in the first two weeks of July; otherwise the developer screen links here.
import { useRef, useState, type ReactNode } from "react";
import { LOCALE, nEvents, t } from "../../i18n";
import { club, myClubs } from "../../lib/data";
import { BRAND3, clubVars, vars, WHEEL } from "../../lib/color";
import { placeShort, racYear, racYearLabel } from "../../lib/dates";
import { review } from "../../lib/review";
import { href } from "../../lib/route";
import type { Event } from "../../lib/types";
import { ClubChip, Icon, share, useData, useTitle, useWash } from "../../components";
import type { ScreenProps } from "../../App";

const MONTH = new Intl.DateTimeFormat(LOCALE, { month: "long" });
const M1 = new Intl.DateTimeFormat(LOCALE, { month: "narrow" });
const EventLink = ({ e }: { e: Event }) => (
  <a href={href("event", e.id)}>{[e.title, placeShort(e)].filter(Boolean).join(" · ")}</a>
);

export default function Review({ route }: ScreenProps) {
  const D = useData();
  const mine = myClubs(D);
  const row = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const q = Number(route.query.get("y"));
  const y = q > 2000 && q < 2100 ? Math.floor(q) : racYear() - 1;
  const r = review(y, D.data.events, D.data.clubs, mine, D.saved);
  const label = racYearLabel(y);
  const title = t(mine.length ? "rv_title" : "rv_title_all", { y: label });
  const colors = mine.length ? mine.map((id) => club(D, id).color) : [...BRAND3];
  useTitle(title);
  useWash(...colors);
  const top = r.hosts[0]?.[1] ?? 1;
  const most = Math.max(...r.months, 1);
  const cards: ReactNode[] = [
    <>
      <div className="yr" aria-hidden="true">
        {label}
      </div>
      <h1>{title}</h1>
      <p>{t("rv_lead", { a: y, b: y + 1 })}</p>
    </>,
    r.n ? (
      <>
        <div className="k">{t(mine.length ? "rv_events_mine" : "rv_events_all")}</div>
        <b>{r.n}</b>
      </>
    ) : (
      <p>{t("rv_empty")}</p>
    ),
    r.month && (
      <>
        <div className="k">{t("rv_month")}</div>
        <b>{MONTH.format(new Date(2000, r.month.m))}</b>
        <p>{nEvents(r.month.n)}</p>
        {/* the year month by month, July first; the busiest one stands out */}
        <div className="bars" aria-hidden="true">
          {r.months.map((n, i) => (
            <i key={i} className={(i + 6) % 12 === r.month!.m ? "top" : undefined} style={vars({ "--h": n / most })}>
              <span>{M1.format(new Date(2000, (i + 6) % 12))}</span>
            </i>
          ))}
        </div>
      </>
    ),
    r.hosts.length > 0 && (
      <>
        <div className="k">{t("rv_hosts")}</div>
        {r.hosts.map(([id, n]) => (
          <p key={id} className="host" style={vars({ "--w": n / top })}>
            <ClubChip id={id} /> {nEvents(n)}
          </p>
        ))}
      </>
    ),
    r.far && (
      <>
        <div className="k">{t("rv_far")}</div>
        <b>{Math.round(r.far.km)} km</b>
        <p>{t("rv_far_sub")}</p>
        <p>
          <EventLink e={r.far.a} />
        </p>
        <p>
          <EventLink e={r.far.b} />
        </p>
      </>
    ),
    r.saved > 0 && (
      <>
        <div className="k">
          <Icon name="star" />
          {t("rv_saved")}
        </div>
        <b>{r.saved}</b>
      </>
    ),
    r.news + r.projects > 0 && (
      <>
        <div className="k">{t("rv_news")}</div>
        <b>{r.news + r.projects}</b>
        <p>{`${t("news")}: ${r.news} · ${t("projects")}: ${r.projects}`}</p>
      </>
    ),
    r.insta.length > 0 && (
      <>
        <div className="k">
          <Icon name="instagram" />
          {t("rv_insta")}
        </div>
        <div className="pics">
          {r.insta.map((p) => (
            <a key={p.url} href={p.url} target="_blank" rel="noopener">
              <img src={p.image} alt={p.caption} loading="lazy" />
            </a>
          ))}
        </div>
      </>
    ),
    <>
      <div className="yr" aria-hidden="true">
        {label}
      </div>
      <div className="k">{t("rv_end", { y: label })}</div>
      <div className="links">
        {/* the link carries the year only: whoever opens it sees the numbers of their own clubs */}
        <button
          className="primary"
          type="button"
          onClick={() => void share({ title, url: new URL(href("review", null, "y=" + y), location.href).href })}
        >
          <Icon name="share" />
          {t("share")}
        </button>
        <a href={href("home")}>{t("show_all")}</a>
      </div>
    </>,
  ].filter(Boolean);
  // one card further or back; the CSS scrolls smoothly unless reduced motion is asked for
  const go = (d: 1 | -1) => row.current?.scrollBy?.({ left: d * row.current.clientWidth });
  return (
    <main className="wrap review">
      <div className="rvbar" aria-hidden="true">
        {cards.map((_, i) => (
          <i key={i} className={i <= at ? "on" : undefined} />
        ))}
      </div>
      <div
        className="rv"
        ref={row}
        onScroll={(ev) =>
          setAt(Math.round(ev.currentTarget.scrollLeft / (ev.currentTarget.scrollWidth / cards.length)))
        }
      >
        {cards.map((c, i) => (
          <section key={i} className={i === at ? "on" : undefined} style={clubVars(colors[i % colors.length])}>
            <img className="wm" src={WHEEL} alt="" aria-hidden="true" />
            {c}
          </section>
        ))}
      </div>
      <div className="rvnav">
        <button className="fbtn ic" type="button" aria-label={t("rv_prev")} onClick={() => go(-1)}>
          <Icon name="back" />
        </button>
        <button className="fbtn ic next" type="button" aria-label={t("rv_next")} onClick={() => go(1)}>
          <Icon name="back" />
        </button>
      </div>
    </main>
  );
}
