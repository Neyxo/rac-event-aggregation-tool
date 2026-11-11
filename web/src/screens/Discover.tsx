// Discover: every event of Rotaract, with search, district and club chips, place and radius, and the
// views upcoming / near me / saved / past. The filters live in the URL (#/discover?q=&d=&clubs=&place=&r=&view=).
import { useRef, useState } from "react";
import { t } from "../i18n";
import { club, myClubs } from "../lib/data";
import { clubVars } from "../lib/color";
import { DISTRICT_IDS, hasFilters, selectEvents, type Filters } from "../lib/filters";
import { href } from "../lib/route";
import { ClubChips, ClubMark, LoadError, Popup, useData, useEventListener, useNav, useStickyHeads } from "../components";
import type { ScreenProps } from "../App";
import { Foot, ListHead, Results, StaleBanner, summaryText, useFilters, Views, type FilterApi } from "./EventList";

/** a chip, the radius or the place changed: the list and the Filters count follow */
const change = (api: FilterApi, patch: Partial<Filters>) => {
  api.update(patch, true);
  api.recount();
};

const toggled = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

/** "District: All · D1980 · D1990 · D2000" */
function DistrictRow({ api }: { api: FilterApi }) {
  const d = api.live.d;
  return (
    <>
      <span className="rowlabel">{t("district")}</span>
      <button className="chip district" type="button" aria-pressed={d.size === 0} onClick={() => change(api, { d: new Set() })}>{t("all")}</button>
      {DISTRICT_IDS.map(id => {
        const name = t(`d${id}`);
        return <button key={id} className="chip district" type="button" aria-pressed={d.has(id)} title={name} onClick={() => change(api, { d: toggled(d, id) })}>{name}</button>;
      })}
    </>
  );
}

/** "Clubs: All", the chosen clubs (a tap removes one), and the button that opens the picker */
function ClubRow({ api }: { api: FilterApi }) {
  const [picking, setPicking] = useState(false);
  const { D } = useData();
  const { clubs, d } = api.live;
  const toggle = (id: string) => change(api, { clubs: toggled(api.live.clubs, id) });
  // with districts chosen, the picker offers only their clubs
  const only = d.size ? D.data.clubs.filter(c => d.has(c.district)).map(c => c.id) : null;
  return (
    <>
      <span className="rowlabel">{t("clubs")}</span>
      <button className="chip" type="button" aria-pressed={clubs.size === 0} onClick={() => change(api, { clubs: new Set() })}>{t("all")}</button>
      {[...clubs].map(id => {
        const c = club(id);
        return <button key={id} className="chip club" type="button" style={clubVars(c.color)} aria-pressed="true" aria-label={c.name} onClick={() => toggle(id)}><ClubMark c={c} />{c.short}</button>;
      })}
      <button className="chip" type="button" onClick={() => setPicking(true)}>{t("pick_clubs")}</button>
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
  useEventListener("change", () => {
    const text = ref.current?.value ?? "";
    api.update({ place: text });
    api.recount();
    void api.setPlace(text);
  }, ref);
  return (
    <input type="text" id="place" autoComplete="off" placeholder={t("place_ph")} aria-label={t("place_ph")} ref={ref}
      value={api.placeText} onChange={ev => api.setPlaceText(ev.target.value)} onKeyDown={ev => { if (ev.key === "Enter") ev.currentTarget.blur(); }} />
  );
}

/** search, the Filters button (with the number of filters in use), the map, the views, and the panel the button opens */
function FilterBar({ api, ready }: { api: FilterApi; ready: boolean }) {
  const [open, setOpen] = useState(false);
  const n = api.count;
  return (
    <div className="filters">
      <div className="top">
        <div className="search">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" id="q" autoComplete="off" placeholder={t("search_ph")} aria-label={t("search")} value={api.live.q} onChange={ev => api.setQ(ev.target.value)} />
        </div>
        <button className="fbtn" id="fbtn" type="button" aria-expanded={open} aria-controls="panel" onClick={() => setOpen(!open)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18M6 12h12M10 19h4" /></svg>
          <span>{t("filters")}</span>
          <span className="n" id="fcount" hidden={!n}>{n}</span>
        </button>
        <a className="fbtn" href={href("map")} aria-label={t("map")} title={t("map")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg>
        </a>
      </div>
      <Views views={["all", "near", "saved", "past"]} pressed={api.inited ? api.live.view : undefined} onPick={api.setView} />
      <div className="panel glass" id="panel" hidden={!open}>
        <div className="row" id="districts" role="group" aria-label={t("district")}>{ready && <DistrictRow api={api} />}</div>
        <div className="row" id="clubs" role="group" aria-label={t("clubs")}>{ready && <ClubRow api={api} />}</div>
        <div className="tools">
          <PlaceInput api={api} />
          <button className="linkbtn" type="button" id="locate" onClick={api.locate}>📍 <span>{t("locate")}</span></button>
          <select id="radius" aria-label={t("radius")} value={api.live.r} onChange={ev => change(api, { r: ev.target.value })}>
            <option value="">{t("any_distance")}</option>
            {["10", "25", "50", "100"].map(r => <option key={r} value={r}>{r + " km"}</option>)}
          </select>
          <div className="hint" id="placeHint" hidden={!api.hint}>{api.hint}</div>
        </div>
      </div>
    </div>
  );
}

/** A new navigation to Discover (its tab, a link, back/forward) starts over from the URL; App only
 *  remounts a screen when the route name changes. replaceQuery is not a navigation. */
export default function Discover({ route }: ScreenProps) {
  return <DiscoverScreen key={useNav().id} route={route} />;
}

function DiscoverScreen({ route }: ScreenProps) {
  const { ready, error, D } = useData();
  const api = useFilters(ready, route.query, "discover");
  useStickyHeads();
  if (error) {
    return <><StaleBanner ready={false} /><main className="wrap" id="main"><LoadError /></main></>;
  }
  const f = api.shown;
  const res = f ? selectEvents(D.data.events, f, { page: "discover", mine: myClubs(), saved: D.saved, scope: null, club }) : null;
  return (
    <>
      <StaleBanner ready={ready} />
      <main className="wrap" id="main">
        <FilterBar api={api} ready={ready} />
        <ListHead title={t("events")} summary={res && f ? summaryText(res, f) : t("loading")} clear={!!f && hasFilters(f)} onClear={api.clear} />
        <Results res={res} view={f?.view ?? "all"} onClear={api.clear} />
        <Foot ready={ready} />
      </main>
    </>
  );
}
