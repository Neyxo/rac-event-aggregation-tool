// The developer screen (old dev.html): reached from the Dev button in the top bar once developer mode is on (Settings, ten taps on
// "made by"). English only, like the old page. Every text node is one template string: the old page built each text in one piece,
// and React would otherwise split "a" + {b} into several text nodes.
import { useEffect, useState, type ReactNode } from "react";
import { I18N } from "../i18n";
import { club } from "../lib/data";
import { clubVars } from "../lib/color";
import { fmt, isPast } from "../lib/dates";
import { devFlag } from "../lib/dev";
import { href } from "../lib/route";
import { store, type StoreKey } from "../lib/store";
import type { Club, Event, Status } from "../lib/types";
import type { ScreenProps } from "../App";
import { ClubMark, Footer, LoadError, toast, useData } from "../components";

/** status.json as written by the feed run; on a fetch error only clubs and failures are known */
type Stat = Pick<Status, "clubs" | "failures"> & Partial<Omit<Status, "clubs" | "failures">>;
interface Device {
  reg: ServiceWorkerRegistration | undefined;
  names: string[];
  cached: number;
  keys: string[];
}
type PreviewKey = Extract<StoreKey, "rac.devGuest" | "rac.devNew" | "rac.devStale">;

const ALL_RUNS = "https://github.com/Neyxo/rac-event-aggregation-tool/actions/workflows/feeds.yml";
// a reload, not a re-render: the switches are read once at start (pretend date, guest settings in loadData)
const reload = () => location.reload();

function useStatus(): Stat | null {
  const [st, setSt] = useState<Stat | null>(null);
  useEffect(() => {
    fetch("status.json", { cache: "no-cache" })
      .then(r => r.json() as Promise<Stat>)
      .catch((): Stat => ({ clubs: {}, failures: ["status.json could not be loaded"] }))
      .then(setSt);
  }, []);
  return st;
}

async function readDevice(): Promise<Device> {
  const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
  // this app's caches only: other projects on the same github.io origin share Cache Storage
  const names = "caches" in window ? (await caches.keys()).filter(n => n.startsWith("rac-")) : [];
  let cached = 0;
  for (const n of names) cached += (await (await caches.open(n)).keys()).length;
  const keys = Object.keys(localStorage).filter(k => k.startsWith("rac.")).sort();
  return { reg, names, cached, keys };
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" className="linkbtn " onClick={onClick}>{label}</button>;
}
function Link({ label, to }: { label: string; to: string }) {
  return <a className="linkbtn" href={to} target={/^https?:/.test(to) ? "_blank" : undefined} rel="noopener">{label}</a>;
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="setrow"><span>{label}</span>{children}</div>;
}
function Count({ label, n }: { label: string; n: number }) {
  return <div><b>{n}</b><span>{label}</span></div>;
}
/** a check: folded list with its count, or a green "none" */
function Fold({ title, items }: { title: string; items: ReactNode[] }) {
  if (!items.length) return <p className="devok">{`✓ ${title}: none`}</p>;
  return <details><summary>{`${title} (${items.length})`}</summary><div className="devlist">{items}</div></details>;
}
/** ClubChip for a club object: the Rotary districts are not in D.clubs while their layer is off, and putting them there (as the old
 *  page did) would leak into the other screens of this one-page app */
function Chip({ c }: { c: Club }) {
  return <a className="chip club " href={href("club", c.id)} style={clubVars(c.color)} aria-label={c.name}><ClubMark c={c} />{c.short}</a>;
}

/** the workflow's cron: 17 *\/6 * * * (UTC) */
function nextRun(): Date {
  const n = new Date();
  const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), Math.floor(n.getUTCHours() / 6) * 6, 17));
  if (d <= n) d.setUTCHours(d.getUTCHours() + 6);
  return d;
}

function Build({ st, own, up, rot }: { st: Stat; own: Event[]; up: Event[]; rot: Event[] }) {
  const { data } = useData().D;
  const gen = new Date(data.generated);
  const age = (Date.now() - gen.getTime()) / 36e5;
  const level = age < 8 ? "ok" : age < 30 ? "warn" : "bad";
  const insta = data.clubs.filter(c => (c.instagram || []).length).length;
  const warnings = st.warnings ?? [];
  return (
    <>
      <p className={"devstate " + level}><i />{`Built ${fmt.stamp.format(gen)}, ${age < 1 ? "less than an hour" : Math.round(age) + " h"} ago` + (st.commit ? ` · commit ${st.commit}` : " · local build")}</p>
      <p className="meta">{`Next scheduled run about ${fmt.stamp.format(nextRun())} (GitHub often starts it late).` + (devFlag("Date") ? " A pretend date is on, so ages on this page are shifted." : "")}</p>
      {st.failures.length ? <pre className="devfail">{st.failures.join("\n")}</pre> : <p className="devok">✓ No failures in the last run</p>}
      {/* new in status.json: a run that worked but looks suspicious (layout changes, lists gone empty); no line when there are none */}
      {warnings.map((w, i) => <p key={i} className="devstate warn"><i />{w}</p>)}
      <div className="facts devfacts">
        <Count label="upcoming" n={up.length} />
        <Count label="in the app" n={own.length} />
        <Count label="international" n={own.filter(e => e.clubs.includes("international")).length} />
        <Count label="Rotary layer" n={rot.length} />
        <Count label="members only" n={own.filter(e => e.members).length} />
        <Count label="cancelled" n={own.filter(e => e.cancelled).length} />
      </div>
      <p className="meta">{insta ? `Instagram layer: on, ${insta} clubs with pictures.` : "Instagram layer: off (no pictures in this build)."}</p>
      <div className="links">
        {st.run ? <Link label="This run's log" to={st.run} /> : null}
        <Link label="All runs" to={ALL_RUNS} />
        <Link label="status.json" to="status.json" />
        <Link label="events.json" to="events.json" />
        <Link label="Map" to={href("map")} />
      </div>
    </>
  );
}

/** an Off / On control for a preview switch; reads the key itself, not devFlag(), so it shows what is stored */
function Switch({ k }: { k: PreviewKey }) {
  const on = !!store.get(k, false);
  const pick = (v: boolean) => {
    store.set(k, v);
    reload();
  };
  return (
    <div className="seg">
      <button type="button" aria-pressed={!on} onClick={() => pick(false)}>Off</button>
      <button type="button" aria-pressed={on} onClick={() => pick(true)}>On</button>
    </div>
  );
}

function Preview() {
  const day = store.get("rac.devDate", "") || "";
  const setDay = (v: string) => {
    store.set("rac.devDate", v);
    reload();
  };
  const guideAgain = () => {
    localStorage.removeItem("rac.guideSeen");
    toast("Done: it is back on Home");
  };
  return (
    <>
      <Row label="See the app as a guest"><Switch k="rac.devGuest" /></Row>
      <Row label="Mark three events as new"><Switch k="rac.devNew" /></Row>
      <Row label="Show the old-data banner"><Switch k="rac.devStale" /></Row>
      <Row label="Pretend today is">
        <div className="tools">
          <input type="date" defaultValue={day} aria-label="Pretend date" onChange={e => setDay(e.target.value)} />
          {day ? <Btn label="Real date" onClick={() => setDay("")} /> : null}
        </div>
      </Row>
      <p className="meta">As a guest your clubs are hidden, not deleted, and club changes are not saved meanwhile. The Dev button in the top bar stays lit while a switch is on.</p>
      <div className="links">
        <Link label="Run the welcome steps" to="./?welcome" />
        <Btn label="Show the New-in-the-club card again" onClick={guideAgain} />
      </div>
    </>
  );
}

function StoredKey({ k }: { k: string }) {
  const edit = () => {
    const v = prompt(k, localStorage.getItem(k) ?? "");
    if (v == null) return;
    try {
      JSON.parse(v);
    } catch {
      alert("Not valid JSON, nothing changed.");
      return;
    }
    localStorage.setItem(k, v);
    reload();
  };
  const del = () => {
    if (!confirm("Delete " + k + "?")) return;
    localStorage.removeItem(k);
    reload();
  };
  return (
    <div className="devkey">
      <code>{k}</code>
      <span>{localStorage.getItem(k)}</span>
      <Btn label="Edit" onClick={edit} />
      <Btn label="Delete" onClick={del} />
    </div>
  );
}

function DeviceInfo({ dev }: { dev: Device }) {
  const { reg, names, cached, keys } = dev;
  const installed = matchMedia("(display-mode: standalone)").matches || !!(navigator as { standalone?: boolean }).standalone;
  const update = async () => {
    if (reg) await reg.update();
    for (const n of names) await caches.delete(n);
    reload();
  };
  const unregister = async () => {
    if (reg) await reg.unregister();
    reload();
  };
  const clearAll = async () => {
    if (!confirm("Delete your clubs, saved events and every other setting of this app on this device? Developer mode stays on.")) return;
    for (const k of keys) if (k !== "rac.dev" && k !== "rac.devUnlocked") localStorage.removeItem(k);
    for (const n of names) await caches.delete(n);
    reload();
  };
  return (
    <>
      <p className="meta">{`Service worker: ${reg ? (reg.active ? "active" : "registered") : "none"} · cache: ${cached} files · installed app: ${installed ? "yes" : "no"} · online: ${navigator.onLine ? "yes" : "no"} · device language: ${navigator.language}`}</p>
      <p className="meta devua">{navigator.userAgent}</p>
      <div className="links">
        <Btn label="Check for an update" onClick={update} />
        <Btn label="Unregister service worker" onClick={unregister} />
        <Btn label="Clear all app data" onClick={clearAll} />
      </div>
      <h3>{`Stored on this device (${keys.length})`}</h3>
      {keys.map(k => <StoredKey key={k} k={k} />)}
    </>
  );
}

/** keys of English (and one level of sub-keys) that a language lacks; the types make this rare, the JSON-ish data can still miss */
function missingTexts(): string[] {
  const missing: string[] = [];
  for (const l of ["de", "fr", "it"] as const) {
    const dict = I18N[l] as Record<string, unknown>;
    for (const [k, v] of Object.entries(I18N.en)) {
      if (!(k in dict)) missing.push(`${l}: ${k}`);
      else if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const sub of Object.keys(v)) if (!(sub in (dict[k] as object))) missing.push(`${l}: ${k}.${sub}`);
      }
    }
  }
  return missing;
}

/** what a club could fix on Polaris, and texts that are missing in a language */
function Checks({ own, up }: { own: Event[]; up: Event[] }) {
  const { data } = useData().D;
  const ev = (e: Event) => <a key={e.id} href={href("event", e.id)}>{`${fmt.dms.format(new Date(e.start))} · ${club(e.clubs[0] ?? "").short} · ${e.title}`}</a>;
  const lastOf = (c: Club) => own.filter(e => e.clubs.includes(c.id)).at(-1);
  const quiet = data.clubs.filter(c => !c.source).filter(c => !up.some(e => e.clubs.includes(c.id)));
  const quietLine = (c: Club) => {
    const last = lastOf(c);
    return <a key={c.id} href={href("club", c.id)}>{c.name + (last ? " · last: " + fmt.date.format(new Date(last.start)) : " · never had one here")}</a>;
  };
  return (
    <>
      <Fold title="Upcoming events without a place" items={up.filter(e => !e.location).map(ev)} />
      <Fold title="Upcoming events with a place the map can't find" items={up.filter(e => e.location && !e.coords).map(ev)} />
      <Fold title="Upcoming events without a picture" items={up.filter(e => !e.image).map(ev)} />
      <Fold title="Upcoming events without a description" items={up.filter(e => !e.description && !e.members).map(ev)} />
      <Fold title="Clubs with no upcoming event" items={quiet.map(quietLine)} />
      <Fold title="Texts missing in a language" items={missingTexts().map(m => <span key={m}>{m}</span>)} />
    </>
  );
}

/** one line per club, the Rotary districts included whether or not their layer is switched on */
function Clubs({ st, own, rot, rotClubs }: { st: Stat; own: Event[]; rot: Event[]; rotClubs: Club[] }) {
  const { data } = useData().D;
  const upBy: Record<string, number> = {};
  for (const e of [...own, ...rot]) if (!isPast(e)) for (const c of e.clubs) upBy[c] = (upBy[c] || 0) + 1;
  const all = [...data.clubs.filter(c => c.source !== "rotary"), ...rotClubs];
  const line = (c: Club) => {
    const s: Partial<Status["clubs"][string]> = st.clubs[c.id] || {};
    const unreadable = st.unreadable?.[c.id];  // new in status.json: agenda items whose date the feed could not read
    return `${upBy[c.id] || 0} upcoming · ${s.events ?? "?"} in history` + (s.cancelled ? ` · ${s.cancelled} cancelled` : "") + (s.without_detail ? ` · ${s.without_detail} without details` : "") + (unreadable ? ` · ${unreadable} with no readable date` : "");
  };
  return <>{all.map(c => <div key={c.id} className="devclub"><Chip c={c} /><span>{line(c)}</span><a href={c.id + ".ics"}>.ics</a></div>)}</>;
}

export default function Dev(_props: ScreenProps) {
  const { ready, error, D } = useData();
  const st = useStatus();
  const [dev, setDev] = useState<Device | null>(null);
  useEffect(() => {
    readDevice().then(setDev);
  }, []);
  const own = D.data.events.filter(e => e.layer !== "rotary");
  const up = own.filter(e => !isPast(e));
  const rot = D.rotary;
  // the old page filled everything after events.json and status.json; the same order, so nothing jumps
  const go = ready && st;
  // events.json failed: the old loadData() replaced everything in main with the offline message
  if (error) return <main className="wrap settings dev" id="main"><LoadError /></main>;
  return (
    <main className="wrap settings dev" id="main">
      <h1>Developer</h1>
      <p className="lead">For the people who run this app. English only. Everything here affects this device alone.</p>
      <section className="glass"><h2>Last build</h2><div id="build">{go && <Build st={st} own={own} up={up} rot={rot.events} />}</div></section>
      <section className="glass"><h2>Preview on this device</h2><div id="preview">{go && <Preview />}</div></section>
      <section className="glass"><h2>This device</h2><div id="device">{go && dev && <DeviceInfo dev={dev} />}</div></section>
      <section className="glass"><h2>Content checks</h2><div className="qa" id="checks">{go && dev && <Checks own={own} up={up} />}</div></section>
      <section className="glass"><h2>Clubs and layers</h2><div id="clubs">{go && dev && <Clubs st={st} own={own} rot={rot.events} rotClubs={rot.clubs} />}</div></section>
      <div id="foot">{go && dev && <Footer source />}</div>
    </main>
  );
}
