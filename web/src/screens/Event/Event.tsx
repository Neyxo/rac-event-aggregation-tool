// The event screen: a frosted card on the lead club's colour wash, with a head that sticks and compacts as you
// scroll, the facts, the description, then up to three more events of the same clubs.
import type { ScreenProps } from "../../App";
import { t } from "../../i18n";
import { club, eventById } from "../../lib/data";
import { clubVars } from "../../lib/color";
import { dayN, fmt, isPast, metaLine, relDay, whenLong } from "../../lib/dates";
import { mapsUrl } from "../../lib/geo";
import { href } from "../../lib/route";
import { shareUrl } from "../../lib/share";
import type { Event as Ev } from "../../lib/types";
import {
  ClubChip,
  DatePane,
  EventCard,
  Footer,
  HelpLinks,
  Icon,
  IcsLink,
  StarButton,
  Status,
  share,
  GoPlace,
  MorphHead,
  Sh,
  useData,
  useTitle,
  useWash,
} from "../../components";

/** the Polaris page of the event; international events live on their organisers' sites instead */
const onPolaris = (e: Ev) => e.url.includes("/agenda/show/");
/** still open for registration; otherwise the button only opens the event on Polaris */
const isOpen = (e: Ev) => !e.cancelled && !isPast(e);

function goLabel(e: Ev): string {
  // a Rotary event opens on its club's own Polaris site
  if (e.layer === "rotary") return t("open_rotary");
  if (isOpen(e)) return t("register");
  return onPolaris(e) ? t("open_polaris") : t("details");
}

// e/<id>.html: a small page with the event's link preview that forwards into the app
const shareEvent = (e: Ev) =>
  share({
    title: e.title,
    text: `${e.title} · ${fmt.full.format(new Date(e.start))}${e.location ? " · " + e.location : ""}`,
    url: shareUrl({ event: e.id }),
  });

function deadline(e: Ev): string {
  const n = dayN(e.deadline);
  return fmt.full.format(new Date(e.deadline)) + (n >= 0 ? " · " + relDay(n) : "");
}

function Hero({ src }: { src: string }) {
  return (
    <div className="hero">
      <img className="blur" src={src} alt="" aria-hidden="true" referrerPolicy="no-referrer" />
      <img src={src} alt="" referrerPolicy="no-referrer" />
    </div>
  );
}

function Head({ e }: { e: Ev }) {
  const D = useData();
  const lead = club(D, e.clubs[0] ?? "");
  const label = goLabel(e);
  return (
    <MorphHead className="head">
      {lead.logo ? <img className="wm" src={lead.logo} alt="" aria-hidden="true" /> : null}
      <DatePane e={e} />
      <div>
        <h1>{e.title}</h1>
        <div className="meta">{metaLine(e)}</div>
        <div className="tags">
          {e.clubs
            .filter((c) => D.clubs[c])
            .map((c) => (
              <ClubChip key={c} id={c} />
            ))}
          {e.cancelled ? <Status kind="bad" text={t("cancelled")} /> : null}
          {e.members ? <Status kind="" ic="lock" text={t("members_only")} /> : null}
        </div>
      </div>
      <StarButton e={e} />
      <a className="go" href={e.url} target="_blank" rel="noopener" title={label}>
        <Icon name="ext" />
        <span>{label}</span>
      </a>
    </MorphHead>
  );
}

function Facts({ e }: { e: Ev }) {
  const showDeadline = !!e.deadline && isOpen(e);
  return (
    <dl className="kv">
      <dt>{t("when")}</dt>
      <dd>{whenLong(e)}</dd>
      {e.location ? <dt>{t("where")}</dt> : null}
      {e.location ? (
        <dd>
          <a href={mapsUrl(e.location)} target="_blank" rel="noopener">
            <Icon name="pin" />
            {e.location}
          </a>
        </dd>
      ) : null}
      {showDeadline ? <dt>{t("deadline_h")}</dt> : null}
      {showDeadline ? <dd className={dayN(e.deadline) <= 2 ? "soon" : ""}>{deadline(e)}</dd> : null}
      {e.registration ? <dt>{t("registration")}</dt> : null}
      {e.registration ? <dd>{e.registration}</dd> : null}
    </dl>
  );
}

function Detail({ e }: { e: Ev }) {
  const D = useData();
  const polaris = onPolaris(e);
  const more = D.data.events
    .filter((x) => x.id !== e.id && !isPast(x) && x.clubs.some((c) => e.clubs.includes(c)))
    .slice(0, 3);
  return (
    <>
      <article className="evdetail glass">
        {e.image ? <Hero src={e.image} /> : null}
        <Head e={e} />
        <div className="links">
          <GoPlace />
          {/* members-only: Polaris' calendar file needs a login; international events aren't on Polaris at all */}
          {e.members || !polaris ? null : (
            <IcsLink href={e.url.replace("/agenda/show/", "/agenda/ical/")}>
              <Icon name="calendar" />
              {t("add_cal")}
            </IcsLink>
          )}
          <button type="button" className="linkbtn" onClick={() => void shareEvent(e)}>
            <Icon name="share" />
            {t("share_event")}
          </button>
        </div>
        <Facts e={e} />
        {e.description || polaris ? <p className="desc">{e.description || t("no_desc")}</p> : null}
        {e.members ? <p className="desc">{t("members_note")}</p> : null}
        {e.layer === "rotary" ? <p className="desc">{t("rotary_note")}</p> : null}
      </article>
      {polaris ? null : <HelpLinks keys={["intl"]} />}
      <Sh>{t("more_events")}</Sh>
      {more.map((x, i) => (
        <EventCard key={x.id} e={x} i={i} />
      ))}
      <Footer />
    </>
  );
}

export default function Event({ route }: ScreenProps) {
  const D = useData();
  // eventById: a shared link to a Rotary event opens even with the Rotary layer off
  const e = eventById(D, route.params.id ?? "");
  const lead = e ? club(D, e.clubs[0] ?? "") : null;
  useWash(lead?.color, e && lead ? club(D, e.clubs[1] || lead.id).color : null, lead?.color);
  useTitle(e?.title);
  if (!e || !lead) {
    return (
      <main className="wrap evpage">
        <div className="empty">
          {t("empty")}
          <br />
          <a className="linkbtn" href={href("home")}>
            {t("show_all")}
          </a>
        </div>
      </main>
    );
  }
  return (
    <main className="wrap evpage" style={clubVars(lead.color)}>
      <Detail e={e} />
    </main>
  );
}
