// Discover: every event of Rotaract, with search, district and club chips, place and radius, and the
// views upcoming / near me / saved / past. The filters live in the URL (#/discover?q=&d=&clubs=&place=&r=&view=).
// And the Wheel of Fate: the round wheel button opens a wheel of fortune, which picks one upcoming event of the list for you.
import { useEffect, useRef, useState } from "react";
import { t } from "../../i18n";
import { club, myClubs } from "../../lib/data";
import { BRAND, clubVars, cx, DISTRICT_IDS, DISTRICTS, vars, WHEEL } from "../../lib/color";
import { fmt } from "../../lib/dates";
import { activeCount, hasFilters, selectEvents, type Filters } from "../../lib/filters";
import { href } from "../../lib/route";
import {
  ClubChips,
  clubLabel,
  ClubMark,
  EventCard,
  Icon,
  Popup,
  useData,
  useEventListener,
  useNav,
} from "../../components";
import type { Event } from "../../lib/types";
import type { ScreenProps } from "../../App";
import {
  Foot,
  ListHead,
  Results,
  StaleBanner,
  summaryText,
  useFilters,
  Views,
  type FilterApi,
} from "../EventList/EventList";

/** a chip, the radius or the district changed: the list follows */
const change = (api: FilterApi, patch: Partial<Filters>) => api.update(patch, true);

/** "District: All · D1980 · D1990 · D2000" */
function DistrictRow({ api }: { api: FilterApi }) {
  const d = api.live.d;
  return (
    <>
      <span className="rowlabel">{t("district")}</span>
      <button
        className="chip district"
        type="button"
        aria-pressed={d.size === 0}
        onClick={() => change(api, { d: new Set() })}
      >
        {t("all")}
      </button>
      {DISTRICT_IDS.map((id) => {
        const name = t(DISTRICTS[id].key);
        return (
          <button
            key={id}
            className="chip district"
            type="button"
            aria-pressed={d.has(id)}
            title={name}
            onClick={() => change(api, { d: d.symmetricDifference(new Set([id])) })}
          >
            {name}
          </button>
        );
      })}
    </>
  );
}

/** "Clubs: All", the chosen clubs (a tap removes one), and the button that opens the picker */
function ClubRow({ api }: { api: FilterApi }) {
  const [picking, setPicking] = useState(false);
  const D = useData();
  const { clubs, d } = api.live;
  const toggle = (id: string) => change(api, { clubs: api.live.clubs.symmetricDifference(new Set([id])) });
  // with districts chosen, the picker offers only their clubs
  const only = d.size ? D.data.clubs.filter((c) => d.has(c.district)).map((c) => c.id) : null;
  return (
    <>
      <span className="rowlabel">{t("clubs")}</span>
      <button
        className="chip"
        type="button"
        aria-pressed={clubs.size === 0}
        onClick={() => change(api, { clubs: new Set() })}
      >
        {t("all")}
      </button>
      {[...clubs].map((id) => {
        const c = club(id);
        return (
          <button
            key={id}
            className="chip club"
            type="button"
            style={clubVars(c.color)}
            aria-pressed="true"
            aria-label={clubLabel(c)}
            onClick={() => toggle(id)}
          >
            <ClubMark c={c} />
            {c.short}
          </button>
        );
      })}
      <button className="chip" type="button" onClick={() => setPicking(true)}>
        {t("pick_clubs")}
      </button>
      {picking && (
        <Popup title={t("clubs")} onClose={() => setPicking(false)}>
          <ClubChips selected={clubs} onPick={toggle} only={only} />
        </Popup>
      )}
    </>
  );
}

/** the place field: it counts once committed (the native change event: blur, or Enter, which blurs) */
function PlaceInput({ api }: { api: FilterApi }) {
  const ref = useRef<HTMLInputElement>(null);
  // the native change event, not React's onChange (which fires on every keystroke)
  useEventListener(
    "change",
    () => {
      const text = ref.current?.value ?? "";
      api.update({ place: text });
      void api.setPlace(text);
    },
    ref,
  );
  return (
    <input
      type="text"
      autoComplete="off"
      placeholder={t("place_ph")}
      aria-label={t("place_ph")}
      ref={ref}
      value={api.placeText}
      onChange={(ev) => api.setPlaceText(ev.target.value)}
      onKeyDown={(ev) => {
        if (ev.key === "Enter") ev.currentTarget.blur();
      }}
    />
  );
}

/** search, the Filters button (with the number of filters in use), the map, the views, and the panel the button opens */
function FilterBar({ api, onFate }: { api: FilterApi; onFate: () => void }) {
  const [open, setOpen] = useState(false);
  // the chips, place and radius count; typing a search doesn't
  const n = activeCount(api.live);
  return (
    <div className="filters">
      <div className="top">
        <div className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            id="q"
            autoComplete="off"
            placeholder={t("search_ph")}
            aria-label={t("search")}
            value={api.live.q}
            onChange={(ev) => api.setQ(ev.target.value)}
          />
        </div>
        <button
          className="fbtn"
          id="fbtn"
          type="button"
          aria-expanded={open}
          aria-controls="panel"
          onClick={() => setOpen(!open)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          <span>{t("filters")}</span>
          <span className="n" id="fcount" hidden={!n}>
            {n}
          </span>
        </button>
        <a className="fbtn" href={href("map")} aria-label={t("map")} title={t("map")}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" />
          </svg>
        </a>
        <button className="fbtn ic" type="button" aria-label={t("fate")} title={t("fate")} onClick={onFate}>
          <Icon name="wheel" />
        </button>
      </div>
      <Views views={["all", "near", "saved", "past"]} pressed={api.live.view} onPick={api.setView} />
      <div className="panel glass" id="panel" hidden={!open}>
        <div className="row" id="districts" role="group" aria-label={t("district")}>
          <DistrictRow api={api} />
        </div>
        <div className="row" id="clubs" role="group" aria-label={t("clubs")}>
          <ClubRow api={api} />
        </div>
        <div className="tools">
          <PlaceInput api={api} />
          <button className="linkbtn" type="button" onClick={api.locate}>
            📍 <span>{t("locate")}</span>
          </button>
          <select aria-label={t("radius")} value={api.live.r} onChange={(ev) => change(api, { r: ev.target.value })}>
            <option value="">{t("any_distance")}</option>
            {["10", "25", "50", "100"].map((r) => (
              <option key={r} value={r}>
                {r + " km"}
              </option>
            ))}
          </select>
          <div className="hint" hidden={!api.hint}>
            {api.hint}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The Wheel of Fate's popup: the Rotaract wheel, big, as a wheel of fortune. Inside its rim, in place of the spokes, up to ten of
 *  the events as segments (the date, on a wash of the club's colour and its crest as a backdrop, as on an event card); a pointer on
 *  top. Nothing moves until "Spin the wheel" is tapped; then the whole wheel turns (a CSS transition) until the chosen segment is
 *  under the pointer, and the event shows below as its usual card. "Reset the wheel" starts over, with other events on the wheel.
 *  At once under reduced motion. */
function Fate({ pool, onClose }: { pool: Event[]; onClose: () => void }) {
  // more than ten would be unreadable: then ten in a row, from a random start
  const draw = () =>
    pool.length <= 10
      ? pool
      : Array.from({ length: 10 }, (_, i) => pool[(Math.floor(Math.random() * pool.length) + i) % pool.length]!);
  // gen: which wheel it is (a reset makes a new one, standing still); k: the chosen segment, once spun; landed: the turn is over
  const [w, setW] = useState(() => ({ gen: 0, segs: draw(), k: -1, landed: false }));
  const { segs, k } = w;
  const a = 360 / segs.length;
  const spun = k >= 0;
  const done = spun && (w.landed || matchMedia("(prefers-reduced-motion: reduce)").matches);
  const lead = (e: Event) => club(e.clubs[0] ?? "");
  const wash = (e: Event) => `color-mix(in srgb, ${lead(e).color || BRAND.cranberry} 30%, var(--surface))`;
  // on a small screen the wheel and the card are taller than the popup: when the card appears, the popup scrolls down to it and the button under it
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (done) result.current?.closest(".ob-in")?.scrollTo?.({ top: 1e6, behavior: "smooth" });
  }, [done]);
  const button = !spun ? (
    <button className="btn" type="button" onClick={() => setW({ ...w, k: Math.floor(Math.random() * segs.length) })}>
      {t("fate_spin")}
    </button>
  ) : (
    <button
      className="skip"
      type="button"
      aria-disabled={!done}
      onClick={() => done && setW({ gen: w.gen + 1, segs: draw(), k: -1, landed: false })}
    >
      {t("fate_reset")}
    </button>
  );
  return (
    <Popup title={t("fate")} onClose={onClose} className="ob fate" action={segs.length ? button : undefined}>
      <p>{t(segs.length ? "fate_lead" : "fate_none")}</p>
      {segs.length > 0 && (
        <div className={cx("wheel", spun && !done && "spin")} aria-hidden="true">
          <i className="tick" />
          {/* the wheel turns as one piece, five times and on to where the middle of segment k is on top: the brand wheel, and inside its
              rim the segments (lines of the popup's own colour between them). key: a reset wheel stands at the start, without turning back */}
          <div
            key={w.gen}
            className="disc"
            onTransitionEnd={(ev) => ev.target === ev.currentTarget && setW((x) => ({ ...x, landed: true }))}
            style={{ transform: `rotate(${spun ? 1800 - (k + 0.5) * a : 0}deg)` }}
          >
            <img src={WHEEL} alt="" />
            <div
              className="segs"
              style={{
                background: `repeating-conic-gradient(var(--surface) 0 1.2deg, transparent 1.2deg ${a}deg), conic-gradient(${segs.map((e, i) => `${wash(e)} ${i * a}deg ${(i + 1) * a}deg`).join()})`,
              }}
            >
              {segs.map((e, i) => (
                <span key={i} style={vars({ "--a": (i + 0.5) * a + "deg", "--c": lead(e).color || BRAND.cranberry })}>
                  <ClubMark c={lead(e)} />
                  {fmt.dms.format(new Date(e.start))}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      <div aria-live="polite" ref={result}>
        {done ? (
          <>
            <div className="k">{t("fate_chosen")}</div>
            <EventCard e={segs[k]!} />
          </>
        ) : null}
      </div>
    </Popup>
  );
}

/** A new navigation to Discover (its tab, a link, back/forward) starts over from the URL; App only
 *  remounts a screen when the route name changes. replaceQuery is not a navigation. */
export default function Discover({ route }: ScreenProps) {
  return <DiscoverScreen key={useNav().id} route={route} />;
}

function DiscoverScreen({ route }: ScreenProps) {
  const D = useData();
  const api = useFilters(route.query, "discover");
  const f = api.shown;
  const ctx = { page: "discover", mine: myClubs(), saved: D.saved, scope: null, club } as const;
  const res = f ? selectEvents(D.data.events, f, ctx) : null;
  // the Wheel of Fate is open with these: the upcoming events the filters leave, never a cancelled one (the past view has none of
  // its own: there the wheel takes the upcoming ones)
  const [fate, setFate] = useState<Event[] | null>(null);
  const openFate = () => {
    if (f)
      setFate(
        selectEvents(D.data.events, { ...f, view: f.view === "past" ? "all" : f.view }, ctx).matches.filter(
          (e) => !e.cancelled,
        ),
      );
  };
  return (
    <>
      <StaleBanner />
      <main className="wrap" id="main">
        <FilterBar api={api} onFate={openFate} />
        <ListHead
          title={t("events")}
          summary={res && f ? summaryText(res, f) : t("loading")}
          clear={!!f && hasFilters(f)}
          onClear={api.clear}
        />
        <Results res={res} view={f?.view ?? "all"} onClear={api.clear} />
        <Foot />
      </main>
      {fate && <Fate pool={fate} onClose={() => setFate(null)} />}
    </>
  );
}
