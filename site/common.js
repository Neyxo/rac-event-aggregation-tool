// Shared by every page: DOM helpers, storage, club colours/crests, settings, the location guess, and the "your club / find your club" block.
const $ = id => document.getElementById(id);
function el(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v; else if (k === "style") n.style.cssText = v; else n.setAttribute(k, v);
  }
  for (const c of children) if (c != null && c !== false) n.append(c);
  return n;
}
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let toastTimer;
function toast(msg, action) {
  const tt = $("toast"); if (!tt) return;
  tt.replaceChildren(msg);
  if (action) { const b = el("button", { type: "button" }, action.label); b.addEventListener("click", action.fn); tt.append(b); }
  tt.classList.add("show"); clearTimeout(toastTimer);
  if (!action) toastTimer = setTimeout(() => tt.classList.remove("show"), 2200);
}
const fold = s => (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
function onColor(hex) { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.5 ? "#1f1c26" : "#fff"; }
function km(a, b) {
  const rad = x => x * Math.PI / 180, dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}
async function geocode(text) {
  const url = "https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&sr=4326&limit=1&searchText=" + encodeURIComponent(text);
  const r = (await (await fetch(url)).json()).results?.[0];
  return r ? { coords: [r.attrs.lat, r.attrs.lon], label: r.attrs.label.replace(/<[^>]+>/g, "") } : null;
}
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function setTheme(next) { store.set("rac.theme", next); document.documentElement.dataset.theme = next; }

// --- data + clubs
const D = { data: null, clubs: {}, settings: { home: "", also: [] }, saved: new Set() };
async function loadData() {
  D.data = await (await fetch("events.json", { cache: "no-cache" })).json();
  for (const c of D.data.clubs) D.clubs[c.id] = c;
  D.saved = new Set(store.get("rac.saved", []));
  const old = store.get("rac.prefs", null);
  D.settings = store.get("rac.settings", old?.clubs?.length ? { home: old.clubs[0], also: old.clubs.slice(1) } : { home: "", also: [] });
  D.settings.also = (D.settings.also || []).filter(id => D.clubs[id] && id !== D.settings.home);
  if (!D.clubs[D.settings.home]) D.settings.home = "";
  if (old) { localStorage.removeItem("rac.prefs"); store.set("rac.settings", D.settings); }
  return D.data;
}
function saveSettings() { store.set("rac.settings", D.settings); }
function myClubs() { return [D.settings.home, ...D.settings.also].filter(id => D.clubs[id]); }
function club(id) { return D.clubs[id] || { id, name: id, short: id, color: "#d41367", logo: "" }; }
function clubStyle(id) { const c = club(id).color || "#d41367"; return `--c:${c};--on-c:${onColor(c)}`; }
function clubMark(c) { return c.logo ? el("img", { src: c.logo, alt: "", loading: "lazy" }) : el("span", { class: "dot" }); }
function clubChip(id, extra = "") { const c = club(id); return el("a", { class: "tag " + extra, href: "club.html?id=" + id, style: clubStyle(id), "aria-label": c.name }, clubMark(c), c.short); }
function clubLabel(id) { const c = club(id); return c.name + (c.district ? ` (D${c.district})` : ""); }
const fmt = {
  day: new Intl.DateTimeFormat(LOCALE, { day: "numeric" }), mon: new Intl.DateTimeFormat(LOCALE, { month: "short" }),
  month: new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }), wd: new Intl.DateTimeFormat(LOCALE, { weekday: "short" }),
  wdl: new Intl.DateTimeFormat(LOCALE, { weekday: "long" }), time: new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" }),
  full: new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  stamp: new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
};
function whenShort(e) { const s = new Date(e.start), en = new Date(e.end); return e.allday ? fmt.wdl.format(s) + " · " + t("all_day") : `${fmt.wd.format(s)} ${fmt.time.format(s)}` + (sameDay(s, en) ? "–" + fmt.time.format(en) : ""); }
function placeShort(e) { return (e.location || "").split(",")[0]; }
function isPast(e) { return new Date(e.end) < new Date(); }

// --- the event card (final design): frosted date pane over the club crest, one meta line, picture, star. The card opens the event page.
const starSvg = () => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", "m12 3 2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.5l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8z"); s.append(p); return s; };
function starButton(e, onChange) {
  const b = el("button", { class: "star", type: "button", "aria-pressed": String(D.saved.has(e.id)), "aria-label": t("save") + ": " + e.title }, starSvg());
  b.addEventListener("click", ev => {
    ev.preventDefault(); ev.stopPropagation();
    D.saved.has(e.id) ? D.saved.delete(e.id) : D.saved.add(e.id);
    store.set("rac.saved", [...D.saved]);
    b.setAttribute("aria-pressed", String(D.saved.has(e.id)));
    toast(D.saved.has(e.id) ? t("saved") : t("unsaved"));
    onChange?.();
  });
  return b;
}
function eventCard(e, i = 0, onChange) {
  const s = new Date(e.start), lead = club(e.clubs[0]);
  const a = el("a", { class: "event" + (e.cancelled ? " cancelled" : ""), href: "event.html?id=" + e.id, style: clubStyle(e.clubs[0]) + `;--i:${Math.min(i, 12)}`, id: "ev-" + e.id },
    lead.logo ? el("img", { class: "wm", src: lead.logo, alt: "", "aria-hidden": "true", loading: "lazy" }) : null,
    el("div", { class: "date", "aria-hidden": "true" }, el("b", {}, fmt.day.format(s)), el("span", {}, fmt.mon.format(s))),
    el("div", { class: "body" },
      el("h4", {}, e.cancelled ? el("span", { class: "badge" }, t("cancelled")) : null, e.title),
      el("div", { class: "meta" }, whenShort(e) + (e.location ? " · " + placeShort(e) : "")),
      el("div", { class: "tags" }, ...e.clubs.map(c => clubChip(c)))),
    el("div", { class: "side" }, e.image ? el("img", { class: "thumb", src: e.image, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null, starButton(e, onChange)));
  return a;
}

// --- location guess for first visits and the "find your club" block: approximate position of the connection, no permission prompt, nothing stored
async function guessPosition() {
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 3500);
    let r = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctl.signal }).then(r => r.json()).catch(() => null);
    if (!r?.latitude) r = await fetch("https://ipwho.is/", { signal: ctl.signal }).then(r => r.json()).catch(() => null);
    const here = [Number(r?.latitude), Number(r?.longitude)];
    if (here[0] && ["CH", "LI"].includes(r.country_code)) return here;
  } catch {}
  return null;
}
function nearestClubs(here, n = 3, maxKm = 1e9) {
  return D.data.clubs.filter(c => c.coords && c.district).map(c => ({ c, d: km(here, c.coords) })).filter(x => x.d <= maxKm).sort((a, b) => a.d - b.d).slice(0, n);
}
async function guessClubs() {
  const here = await guessPosition();
  if (here) { const near = nearestClubs(here, 2, 35); if (near.length) return near.map(x => x.c.id); }
  return { fr: ["fribourg", "geneve-international"], it: ["ticino"], en: ["zurich-international", "geneve-international"] }[LANG] || [];
}

// --- call to action: "your club" with the next event when set, "find your club" otherwise
function ctaBlock() {
  const home = D.settings.home && D.clubs[D.settings.home];
  if (home) {
    const e = D.data.events.find(e => e.clubs.includes(home.id) && !isPast(e));
    const box = el("div", { class: "cta", style: clubStyle(home.id) }, el("div", { class: "k" }, t("your_club")),
      el("div", { class: "rc" }, clubMark(home), el("div", {}, el("b", {}, home.name), el("span", {}, e ? `${fmt.wd.format(new Date(e.start))} ${fmt.day.format(new Date(e.start))}. ${fmt.mon.format(new Date(e.start))} · ${e.title}` : t("cp_none"))),
        el("a", { class: "go", href: e ? "event.html?id=" + e.id : "club.html?id=" + home.id }, t("go"))));
    return box;
  }
  const input = el("input", { class: "in", type: "text", placeholder: t("ab_find_ph"), "aria-label": t("ab_find_ph"), autocomplete: "off" });
  const go = el("button", { class: "go", type: "button" }, t("ab_find_btn")), near = el("div", { class: "near" }), hint = el("div", { class: "hint" });
  const show = here => near.replaceChildren(...nearestClubs(here, 3).map(({ c, d }) => el("a", { class: "nc", href: "club.html?id=" + c.id, style: clubStyle(c.id) }, clubMark(c), el("span", {}, c.short, el("small", {}, Math.round(d) + " km")))));
  const find = async () => { const q = input.value.trim(); if (!q) return; hint.textContent = t("locating"); try { const hit = await geocode(q); if (!hit) { hint.textContent = t("place_nf"); return; } hint.textContent = "📍 " + hit.label; show(hit.coords); } catch { hint.textContent = t("place_err"); } };
  go.addEventListener("click", find); input.addEventListener("keydown", ev => { if (ev.key === "Enter") find(); });
  guessPosition().then(here => { if (here && !near.children.length) show(here); });
  return el("div", { class: "cta new" }, el("div", { class: "k" }, t("ab_find_title")), el("div", { class: "find" }, input, go), hint, near);
}

// --- service worker: register, and offer a refresh when a newer app shell was fetched in the background
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("message", ev => { if (ev.data?.type === "updated") toast(t("new_version"), { label: t("refresh"), fn: () => location.reload() }); });
}
