// The developer screen: reached from the Dev button in the top bar once developer mode is on (Settings, ten taps on "made by").
// English only: it is for the people who run the app.
import { useEffect, useState, type ReactNode } from "react";
import { I18N, t, tx } from "../i18n";
import { club } from "../lib/data";
import { clubVars, cx, DISTRICT_IDS, DISTRICTS } from "../lib/color";
import { dayLine, fmt, isPast, racYear, racYearLabel } from "../lib/dates";
import { devFlag } from "../lib/dev";
import { href } from "../lib/route";
import { store, type StoreKey, type StoreKeys } from "../lib/store";
import type { Club, Event, Status } from "../lib/types";
import type { ScreenProps } from "../App";
import { ClubMark, clubLabel, FeedRow, feedUrls, Footer, goUrl, MoreLink, toast, useData, type IconName } from "../components";
import { playFestive } from "../components/Festive";
import Sorting from "../components/Sorting";
import Bingo from "../components/Bingo";
import { version } from "../../../package.json";

/** status.json as written by the feed run; on a fetch error only clubs and failures are known */
type Stat = Pick<Status, "clubs" | "failures"> & Partial<Omit<Status, "clubs" | "failures">>;
interface Device {
  reg: ServiceWorkerRegistration | undefined;
  names: string[];
  cached: number;
  keys: string[];
}
type PreviewKey = Extract<StoreKey, "rac.devGuest" | "rac.devNew" | "rac.devStale">;

const REPO = "https://github.com/Neyxo/rotaract-events";
const ALL_RUNS = `${REPO}/actions/workflows/feeds.yml`;
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
  return <button type="button" className="linkbtn" onClick={onClick}>{label}</button>;
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
/** ClubChip for a club object: the Rotary districts are not among the clubs while their layer is off, and adding them there would
 *  leak them into the other screens */
function Chip({ c }: { c: Club }) {
  return <a className="chip club" href={href("club", c.id)} style={clubVars(c.color)} aria-label={clubLabel(c)}><ClubMark c={c} />{c.short}</a>;
}

/** the Instagram line: from status.json when the run wrote it (older runs did not), else guessed from the pictures in the data */
function Instagram({ st, insta }: { st: Stat; insta: number }) {
  const ig = st.instagram;
  if (!ig) return <p className="meta">{insta ? `Instagram layer: on, ${insta} clubs with pictures.` : "Instagram layer: off (no pictures in this build)."}</p>;
  const errors = Object.entries(ig.clubs).filter(([, v]) => typeof v === "string");
  if (ig.state === "off") return <p className="meta">{`Instagram layer: off, ${ig.note}.`}</p>;
  if (ig.state === "error") return <p className="devstate bad"><i />{`Instagram layer: failed, ${ig.note}. No pictures in this build.`}</p>;
  const level = errors.length ? "warn" : "ok";
  const withPosts = Object.values(ig.clubs).filter(v => typeof v === "number" && v > 0).length;
  return <p className={cx("devstate", level)}><i />{`Instagram layer: on, ${withPosts} of ${Object.keys(ig.clubs).length} clubs with pictures` + (errors.length ? `, ${errors.length} could not be read (see Clubs and layers)` : "")}</p>;
}

/** the workflow's cron: 17 2 * * * (UTC), once a night; a push of the scraper or the club list reads the clubs too */
export function nextRun(n = new Date()): Date {
  const d = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 2, 17));
  if (d <= n) d.setUTCDate(d.getUTCDate() + 1);
  return d;
}

interface GhStep { name: string; status: string; conclusion: string | null }
interface GhJob { html_url: string; status: string; conclusion: string | null; started_at: string; completed_at: string | null; steps?: GhStep[] }
interface GhRun { event: string; display_title: string; status: string; conclusion: string | null }
const MARK: Record<string, string> = { success: "✓", failure: "✗", cancelled: "✗", skipped: "–" };
// GitHub's own bookkeeping steps say nothing about the build
const ownStep = (s: GhStep) => !/^(Set up job|Complete job|Post )/.test(s.name);

/** The run that built this version, read from GitHub's public API when this page opens: what started it, and each step with its
 *  outcome. The full log stays on GitHub. */
function Run({ url }: { url: string }) {
  const [r, setR] = useState<{ run: GhRun; jobs: GhJob[] } | "error" | null>(null);
  useEffect(() => {
    const api = url.replace("https://github.com/", "https://api.github.com/repos/");
    const get = <T,>(u: string) => fetch(u).then(x => { if (!x.ok) throw new Error(String(x.status)); return x.json() as Promise<T>; });
    Promise.all([get<GhRun>(api), get<{ jobs: GhJob[] }>(api + "/jobs")]).then(([run, j]) => setR({ run, jobs: j.jobs }), () => setR("error"));
  }, [url]);
  if (r === null) return <p className="meta">Loading the run…</p>;
  if (r === "error") return <p className="meta">The run could not be read from GitHub (offline or rate limit).</p>;
  const { run, jobs } = r, state = run.conclusion ?? run.status;
  const job = jobs[0];
  const mins = job?.completed_at ? Math.round((Date.parse(job.completed_at) - Date.parse(job.started_at)) / 6e4) : null;
  return (
    <div className="devrun">
      <p className={cx("devstate", state === "success" ? "ok" : run.conclusion ? "bad" : "warn")}><i />
        {`Run: ${state.replace("_", " ")} · ${run.event === "schedule" ? "nightly" : run.event}` + (mins != null ? ` · ${mins} min` : "")}</p>
      {run.event === "push" ? <p className="meta">{run.display_title}</p> : null}
      <ol className="devsteps">
        {jobs.flatMap(j => (j.steps ?? []).filter(ownStep)).map((s, i) => {
          const k = s.conclusion ?? s.status;
          return <li key={i} className={k}><b>{MARK[k] ?? "○"}</b><span>{s.name}</span></li>;
        })}
      </ol>
      {job ? <div className="links"><Link label="Open the log on GitHub" to={job.html_url} /></div> : null}
    </div>
  );
}

interface GhCommit { sha: string; html_url: string; commit: { message: string; author: { date: string } } }
interface GhRunRow { html_url: string; event: string; status: string; conclusion: string | null; created_at: string; updated_at: string; head_sha: string }
const API = REPO.replace("https://github.com/", "https://api.github.com/repos/");
const RUNS = `${API}/actions/workflows/feeds.yml/runs?per_page=30`, COMMITS = `${API}/commits?per_page=20`;
// one request per address and page load: the overview and the runs page share the list, and GitHub allows 60 calls an hour
const cache = new Map<string, Promise<unknown>>();
function gh<T>(u: string): Promise<T> {
  if (!cache.has(u)) cache.set(u, fetch(u).then(x => { if (!x.ok) throw new Error(String(x.status)); return x.json(); }).catch(e => { cache.delete(u); throw e; }));
  return cache.get(u) as Promise<T>;
}
/** a GitHub read: null while loading (or without u), "error" when offline or rate-limited */
function useGh<T>(u: string | null): T | "error" | null {
  const [r, setR] = useState<T | "error" | null>(null);
  useEffect(() => { if (u) gh<T>(u).then(setR, () => setR("error")); }, [u]);
  return r;
}
const when = (d: string) => fmt.stamp.format(new Date(d));
type Level = "ok" | "warn" | "bad";
const WORST: Level[] = ["ok", "warn", "bad"];
const worst = (...l: Level[]) => WORST[Math.max(...l.map(x => WORST.indexOf(x)))]!;
const runLevel = (x: GhRunRow): Level => x.conclusion === "success" ? "ok" : x.conclusion && x.conclusion !== "cancelled" && x.conclusion !== "skipped" ? "bad" : "warn";

/** the runs' history in one line: green when every finished run worked, yellow when an older one failed, red when the last one did.
 *  Cancelled runs (a newer push replaced them) don't count. */
export function runHealth(runs: GhRunRow[]): { level: Level; text: string } {
  const done = runs.filter(r => r.status === "completed" && r.conclusion !== "cancelled" && r.conclusion !== "skipped");
  const failed = done.filter(r => r.conclusion !== "success");
  if (!done.length) return { level: "warn", text: "No finished run yet" };
  const since = ` since ${fmt.date.format(new Date(done.at(-1)!.created_at))}`;
  if (done[0]!.conclusion !== "success") return { level: "bad", text: "Last run failed" + (failed.length > 1 ? ` · ${failed.length} of ${done.length} failed${since}` : "") };
  if (failed.length) return { level: "warn", text: `Last run worked · ${failed.length} of ${done.length} failed${since}` };
  return { level: "ok", text: `All ${done.length} runs worked${since}` };
}

/** one dot per run, oldest left, newest right */
function Strip({ runs }: { runs: GhRunRow[] }) {
  return <a className="devstrip" href={href("dev", "runs")} aria-label="Run history">{[...runs].reverse().map(x =>
    <i key={x.html_url} className={runLevel(x)} title={`${when(x.created_at)} · ${x.conclusion ?? x.status}`} />)}</a>;
}

/** the last 30 runs: outcome, what started it, the commit, how long; the run that built this page marked */
function Runs({ run }: { run?: string }) {
  const r = useGh<{ workflow_runs: GhRunRow[] }>(RUNS);
  if (r === null) return <p className="meta">Loading the runs…</p>;
  if (r === "error") return <p className="meta">The runs could not be read from GitHub (offline or rate limit).</p>;
  const runs = r.workflow_runs, h = runHealth(runs);
  return (
    <>
      <p className={cx("devstate", h.level)}><i />{h.text}</p>
      <Strip runs={runs} />
      <ul className="devrecent">
        {runs.map(x => {
          const state = x.conclusion ?? x.status, mins = Math.round((Date.parse(x.updated_at) - Date.parse(x.created_at)) / 6e4);
          return (
            <li key={x.html_url} className={cx("devstate", runLevel(x))}><i />
              <a href={x.html_url} target="_blank" rel="noopener">{`${state.replace("_", " ")} · ${x.event === "schedule" ? "nightly" : x.event} · ${x.head_sha.slice(0, 7)}` + (x.conclusion ? ` · ${mins} min` : "")}</a>
              <small>{when(x.created_at) + (x.html_url === run ? " · this build" : "")}</small>
            </li>
          );
        })}
      </ul>
      <div className="links"><Link label="All runs on GitHub" to={ALL_RUNS} /></div>
    </>
  );
}

/** the last 20 commits on main: when the app last changed */
function Commits() {
  const r = useGh<GhCommit[]>(COMMITS);
  if (r === null) return <p className="meta">Loading the commits…</p>;
  if (r === "error") return <p className="meta">The commits could not be read from GitHub (offline or rate limit).</p>;
  return (
    <>
      <ul className="devrecent">
        {r.map(c => <li key={c.sha}><a href={c.html_url} target="_blank" rel="noopener"><code>{c.sha.slice(0, 7)}</code> {c.commit.message.split("\n")[0]}</a><small>{when(c.commit.author.date)}</small></li>)}
      </ul>
      <div className="links"><Link label="All commits on GitHub" to={`${REPO}/commits/main`} /></div>
    </>
  );
}

/** how old this build's data is: when the clubs were last read, not when the app was built */
function useAge(): { gen: Date; age: number; level: Level } {
  const { data } = useData();
  const gen = new Date(data.generated), age = (Date.now() - gen.getTime()) / 36e5;
  return { gen, age, level: age < 8 ? "ok" : age < 30 ? "warn" : "bad" };
}
/** "11 Nov, 01:58, 8 h ago"; minutes under an hour, so a deploy shows right away. Never negative (a pretend date in the past). */
function stampAgo(d: Date): string {
  const min = Math.max(0, Math.round((Date.now() - d.getTime()) / 6e4));
  return `${fmt.stamp.format(d)}, ${min < 60 ? min + " min" : Math.round(min / 60) + " h"} ago`;
}
// the app itself: built on every push; the data only when the clubs are read (nightly, or a push of the scraper or the club list)
const APP_BUILT = new Date(__APP_BUILT__);
const appCommit = __APP_COMMIT__ ? `commit ${__APP_COMMIT__}` : "local build";

/** Everything at a glance: one overall state, the app and its data (each with its own age), the run history as dots, and what is
 *  wrong in this build. Details are on the pages. */
function Health({ st }: { st: Stat }) {
  const fromGh = !!st.run?.startsWith("https://github.com/");  // a local build has no runs of its own: no request
  const r = useGh<{ workflow_runs: GhRunRow[] }>(fromGh ? RUNS : null);
  const { gen, level: ageLevel } = useAge();
  const warnings = st.warnings ?? [];
  const runs = r && r !== "error" ? r.workflow_runs : null, h = runs ? runHealth(runs) : null;
  const all = worst(ageLevel, h?.level ?? "ok", st.failures.length ? "bad" : "ok", warnings.length ? "warn" : "ok");
  return (
    <section className="glass">
      <p className={cx("devhealth", all)}><i />{all === "ok" ? "All good" : all === "warn" ? "Working, have a look" : "Something is broken"}</p>
      {/* an old app is no problem, old data is */}
      <p className="devstate ok"><i />{`App · version ${version} · updated ${stampAgo(APP_BUILT)} · ${appCommit}`}</p>
      <p className={cx("devstate", ageLevel)}><i />{`Data · read ${stampAgo(gen)}` + (st.commit ? ` · by the run of commit ${st.commit}` : " · by a local run")}</p>
      {runs && h ? <><Strip runs={runs} /><p className={cx("devstate", h.level)}><i />{h.text}</p></>
        : fromGh ? <p className="meta">{r === "error" ? "The runs could not be read from GitHub (offline or rate limit)." : "Loading the runs…"}</p> : null}
      {st.failures.length ? <pre className="devfail">{st.failures.join("\n")}</pre> : <p className="devok">✓ No failures in the last run</p>}
      {/* a run that worked but looks suspicious (layout changes, lists gone empty); no line when there are none */}
      {warnings.map((w, i) => <p key={i} className="devstate warn"><i />{w}</p>)}
      <p className="meta">{`Next nightly run about ${fmt.stamp.format(nextRun())}` + (devFlag("Date") ? " · a pretend date is on, so ages here are shifted" : "")}</p>
    </section>
  );
}

/** the build this page came from: its run's steps, the layers, the counts and the raw files */
function Build({ st, own, up, rot }: { st: Stat; own: Event[]; up: Event[]; rot: Event[] }) {
  const { data } = useData();
  const { gen } = useAge();
  const insta = data.clubs.filter(c => (c.instagram || []).length).length;
  return (
    <>
      {/* the version is package.json's at build time */}
      <p className="meta">{`App version ${version} · ${import.meta.env.MODE} build · built ${stampAgo(APP_BUILT)} · ${appCommit}.`}</p>
      <p className="meta">{`The events were read ${stampAgo(gen)}` + (st.commit ? ` by the run of commit ${st.commit}` : "") + "; the run below is that one. The clubs are read every night (GitHub often starts it hours late) and on a push of the scraper or the club list; a push of the app alone reuses the last events."}</p>
      {st.run?.startsWith("https://github.com/") ? <Run url={st.run} /> : null}
      <Instagram st={st} insta={insta} />
      {/* news and projects that could not be fetched: the last list stays, the run stays green */}
      {st.notes ? <Fold title="Side lists not updated" items={st.notes.map(n => <span key={n}>{n}</span>)} /> : null}
      <div className="facts devfacts">
        <Count label="upcoming" n={up.length} />
        <Count label="in the app" n={own.length} />
        <Count label="international" n={own.filter(e => e.clubs.includes("international")).length} />
        <Count label="Rotary layer" n={rot.length} />
        <Count label="members only" n={own.filter(e => e.members).length} />
        <Count label="cancelled" n={own.filter(e => e.cancelled).length} />
      </div>
      <div className="links">
        <Link label="Releases" to={`${REPO}/releases`} />
        <Link label="status.json" to="status.json" />
        <Link label="events.json" to="events.json" />
        <Link label="Map" to={href("map")} />
      </div>
    </>
  );
}

/** an Off / On control for a preview switch; reads the key itself, not devFlag(), so it shows what is stored */
/** Sets a preview switch and reloads. The switches only count while developer mode is on (lib/dev), and this screen also opens
 *  without it (#/dev typed in, or after an app reset): turning one on turns developer mode on, or it would silently do nothing. */
function preview<K extends PreviewKey | "rac.devDate">(k: K, v: StoreKeys[K]): void {
  store.set(k, v);
  if (v) store.set("rac.dev", true);
  reload();
}

function Switch({ k }: { k: PreviewKey }) {
  const on = store.get("rac.dev", false) && !!store.get(k, false);  // what is in effect, not what is stored
  const pick = (v: boolean) => preview(k, v);
  return (
    <div className="seg">
      <button type="button" aria-pressed={!on} onClick={() => pick(false)}>Off</button>
      <button type="button" aria-pressed={on} onClick={() => pick(true)}>On</button>
    </div>
  );
}

/** plays it right here, whatever the date and page; says why when the device setting keeps it away */
const playEgg = (k: "aug1" | "zibele") => matchMedia("(prefers-reduced-motion: reduce)").matches ? toast("Reduce motion is on on this device, so it is skipped") : playFestive(k);

function Preview() {
  const day = devFlag("Date") || "";  // what is in effect: nothing while developer mode is off
  const setDay = (v: string) => preview("rac.devDate", v);
  const [hat, setHat] = useState(false), [bingo, setBingo] = useState(false);
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
      <Row label="Play an Easter egg">
        <div className="tools">
          <Btn label="1 August" onClick={() => playEgg("aug1")} />
          <Btn label="Zibelemärit" onClick={() => playEgg("zibele")} />
          <Link label="Gotthard bunker" to="#/map?bunker" />
          <Btn label="Sorting hat" onClick={() => setHat(true)} />
          {hat && <Sorting onClose={() => setHat(false)} />}
          <Btn label="Event bingo" onClick={() => setBingo(true)} />
          {bingo && <Bingo onClose={() => setBingo(false)} />}
        </div>
      </Row>
      <Row label="Year in review">
        <div className="tools">
          <Link label={racYearLabel(racYear() - 1)} to={href("review")} />
          <Link label={racYearLabel(racYear()) + " so far"} to={href("review", null, "y=" + racYear())} />
        </div>
      </Row>
      <Row label="Home's line today"><span className="meta">{dayLine().text}</span></Row>
      <p className="meta">A "did you know" a day; a line of its own on 23 Feb, 13 Mar, 19 Apr, 4 May, 1 Jul, 1 Aug, 29 Sep, 24 Oct, 5 Nov and the fourth Monday of November, and the theme of the Rotary month on the first of most months. Set the pretend date above to see one.</p>
      <p className="meta">Home offers the year in review from 1 to 14 July (set the pretend date above).</p>
      <p className="meta">By date they play once per page load: the firework on Home on 1 August, the confetti on the Bern club page on the fourth Monday of November (2026-11-23). Never with "reduce motion" on.</p>
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
  const { data } = useData();
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

/** upcoming events per club id, the Rotary districts included */
function upcomingBy(own: Event[], rot: Event[]): Record<string, number> {
  const upBy: Record<string, number> = {};
  for (const e of [...own, ...rot]) if (!isPast(e)) for (const c of e.clubs) upBy[c] = (upBy[c] || 0) + 1;
  return upBy;
}

/** one line per club, the Rotary districts included whether or not their layer is switched on */
function Clubs({ st, own, rot, rotClubs }: { st: Stat; own: Event[]; rot: Event[]; rotClubs: Club[] }) {
  const { data } = useData();
  const upBy = upcomingBy(own, rot);
  const all = [...data.clubs.filter(c => c.source !== "rotary"), ...rotClubs];
  const line = (c: Club) => {
    const s: Partial<Status["clubs"][string]> = st.clubs[c.id] || {};
    const unreadable = st.unreadable?.[c.id];  // agenda items whose date the feed could not read
    const ig = st.instagram?.clubs[c.id];  // only for clubs with an Instagram link, while the layer ran
    return `${upBy[c.id] || 0} upcoming · ${s.events ?? "?"} in history` + (s.cancelled ? ` · ${s.cancelled} cancelled` : "") + (s.without_detail ? ` · ${s.without_detail} without details` : "") + (unreadable ? ` · ${unreadable} with no readable date` : "")
      + (ig == null ? "" : typeof ig === "number" ? ` · ${ig} Instagram posts` : ` · Instagram: ${ig}`);
  };
  return <>{all.map(c => <div key={c.id} className="devclub"><Chip c={c} /><span>{line(c)}</span><a href={c.id + ".ics"}>.ics</a></div>)}</>;
}

/** Every calendar feed with its upcoming count: all clubs (Rotaract only, like all.ics), then one per club by district, the
 *  international pseudo-club and the Rotary districts (listed whether or not their layer is on). The public Subscribe screen only
 *  offers the personal ones. */
function Feeds({ own, up, rot, rotClubs }: { own: Event[]; up: Event[]; rot: Event[]; rotClubs: Club[] }) {
  const { data } = useData();
  const upBy = upcomingBy(own, rot);
  const group = (name: string, clubs: Club[]) => clubs.length ? [<h3 key={name}>{name}</h3>, ...clubs.map(c => <FeedRow key={c.id} c={c} link count={upBy[c.id] || 0} />)] : null;
  const inDistrict = (d: string) => data.clubs.filter(c => c.district === d && !c.source).sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="feeds">
      <FeedRow name={t("sp_all_feed")} count={up.length} />
      {DISTRICT_IDS.map(d => group(t(DISTRICTS[d].key), inDistrict(d)))}
      {group(t("national"), inDistrict(""))}
      {group(tx("intl").h, data.clubs.filter(c => c.source === "international"))}
      {group(t("rotary_feeds"), rotClubs)}
    </div>
  );
}

/** On a phone, which way of opening Google's and Outlook's "add this calendar" page stays in the browser instead of landing in the
 *  calendar app? Tap each on the phone in question; the flow uses the one marked "in use" (components/Subscribe.tsx, static/go.html). */
function LinkLab() {
  const { webcal } = feedUrls("all.ics");
  const g = "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal);
  const o = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(webcal)}&name=Rotaract`;
  const intent = (u: string) => `intent://${u.replace(/^https:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
  const u = new URL(g);
  return (
    <>
      <p className="meta">Tap each on your phone and note where it lands: in the browser (good) or in the calendar app (bad).</p>
      <div className="links">
        <Link label="1 · Google: plain link" to={g} />
        <a className="linkbtn" href={goUrl(g)} target="_blank" rel="noopener">2 · Google: helper page (in use)</a>
        <form method="get" action={u.origin + u.pathname} target="_blank"><input type="hidden" name="cid" value={u.searchParams.get("cid") ?? ""} /><button type="submit" className="linkbtn">3 · Google: form you submit</button></form>
        <a className="linkbtn" href={intent(g)}>4 · Google: Chrome intent</a>
        <Btn label="5 · Google: by script, 6 s after the tap" onClick={() => setTimeout(() => { location.href = g; }, 6000)} />
        <Link label="6 · Outlook: plain link" to={o} />
        <a className="linkbtn" href={goUrl(o)} target="_blank" rel="noopener">7 · Outlook: helper page (in use)</a>
      </div>
      <p className="meta devua">{navigator.userAgent}</p>
    </>
  );
}

// the pages under #/dev/<id>: title, one line for the overview's card, icon
const PAGES = {
  runs: ["Runs", "Every build of the last weeks, green or not", "refresh"],
  commits: ["Commits", "What changed in the app, and when", "book"],
  build: ["This build", "Its run's steps, layers, counts and files", "info"],
  links: ["Link lab", "Which calendar link stays in the browser on a phone", "ext"],
  preview: ["Preview on this device", "Guest view, new marks, a pretend date", "phone"],
  device: ["This device", "Service worker, cache and stored settings", "laptop"],
  checks: ["Content checks", "What clubs could fix on Polaris", "alert"],
  clubs: ["Clubs and layers", "One line per club and district", "wheel"],
  feeds: ["Calendar feeds", "Every feed, per club and district", "calendar"],
} as const satisfies Record<string, [string, string, IconName]>;
type PageId = keyof typeof PAGES;

export default function Dev({ route }: ScreenProps) {
  const D = useData();
  const st = useStatus();
  const [dev, setDev] = useState<Device | null>(null);
  useEffect(() => {
    readDevice().then(setDev);
  }, []);
  const own = D.data.events.filter(e => e.layer !== "rotary");
  const up = own.filter(e => !isPast(e));
  const rot = D.rotary;
  const id = route.params.id in PAGES ? route.params.id as PageId : null;
  // the page fills once status.json (and the device) are in, so nothing jumps
  const ready = st && dev;
  if (id) {
    const body = !ready ? null : {
      runs: () => <Runs run={st.run} />,
      commits: () => <Commits />,
      build: () => <Build st={st} own={own} up={up} rot={rot.events} />,
      links: () => <LinkLab />,
      preview: () => <Preview />,
      device: () => <DeviceInfo dev={dev} />,
      checks: () => <div className="qa"><Checks own={own} up={up} /></div>,
      clubs: () => <div><Clubs st={st} own={own} rot={rot.events} rotClubs={rot.clubs} /></div>,
      feeds: () => <Feeds own={own} up={up} rot={rot.events} rotClubs={rot.clubs} />,
    }[id]();
    return (
      <main className="wrap settings dev">
        <a className="devback" href={href("dev")}>‹ Developer</a>
        <h1>{PAGES[id][0]}</h1>
        <section className="glass">{body}</section>
      </main>
    );
  }
  return (
    <main className="wrap settings dev">
      <h1>Developer</h1>
      <p className="lead">For the people who run this app. English only. Everything here affects this device alone.</p>
      {ready ? <Health st={st} /> : null}
      {(Object.entries(PAGES) as [PageId, readonly [string, string, IconName]][]).map(([k, [title, sub, ic]]) => <MoreLink key={k} to={href("dev", k)} title={title} sub={sub} ic={ic} />)}
      <div id="foot">{ready && <Footer source />}</div>
    </main>
  );
}
