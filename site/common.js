// Shared by every page: DOM helpers, storage, club colours/crests, settings, the navigation chrome, the event card, the location guess and the call to action.
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
// replaceChildren() would print null as the text "null"; this drops null/false like el() does.
const fill = (n, ...children) => n.replaceChildren(...children.filter(c => c != null && c !== false));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
let toastTimer;
function toast(msg, action) {
  let tt = $("toast"); if (!tt) { tt = el("div", { class: "toast", id: "toast", role: "status" }); document.body.append(tt); }
  tt.replaceChildren(msg);
  if (action) { const b = el("button", { type: "button" }, action.label); b.addEventListener("click", action.fn); tt.append(b); }
  tt.classList.add("show"); clearTimeout(toastTimer);
  if (!action) toastTimer = setTimeout(() => tt.classList.remove("show"), 2200);
}
const fold = s => (s || "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
function onColor(hex) { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return (0.2126 * r + 0.7152 * g + 0.0722 * b) > 0.5 ? "#1f1c26" : "#fff"; }
function km(a, b) { const rad = x => x * Math.PI / 180, dLat = rad(b[0] - a[0]), dLon = rad(b[1] - a[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLon / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); }
async function geocode(text) { const url = "https://api3.geo.admin.ch/rest/services/api/SearchServer?type=locations&sr=4326&limit=1&searchText=" + encodeURIComponent(text); const r = (await (await fetch(url)).json()).results?.[0]; return r ? { coords: [r.attrs.lat, r.attrs.lon], label: r.attrs.label.replace(/<[^>]+>/g, "") } : null; }
const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function setTheme(next) { store.set("rac.theme", next); document.documentElement.dataset.theme = next; }
const ICON = {
  home: "M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z", discover: "M21 21l-4.3-4.3M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z", calendar: "M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01", settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  instagram: "M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM17.5 6.5h.01", linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  // the Rotary family page
  wheel: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 3v6M12 15v6M3 12h6M15 12h6", users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z", plane: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
  flag: "M4 22V4M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1", rings: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4", moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  heart: "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z", pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18", ext: "M14 3h7v7M21 3l-9 9M19 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5", back: "M15 18l-6-6 6-6", share: "M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13", star: "m12 3 2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.5l-5.7 3.1 1.2-6.4L2.8 9.7l6.4-.8z",
};
function icon(name, cls = "") { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true"); if (cls) s.setAttribute("class", cls); const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", ICON[name]); s.append(p); return s; }

// --- navigation chrome, identical on every page: top bar (logo · info · settings) and bottom tabs (home · discover · calendar)
function hbtn(name, href, label, on = false) { return el("a", { class: "hbtn" + (on ? " on" : ""), href, "aria-label": label, title: label }, icon(name), label === null ? null : el("span", {}, label)); }
function chrome(active, { back = false, extra = null } = {}) {
  const top = $("top");
  const left = back ? (() => { const a = hbtn("back", "./", null); a.setAttribute("aria-label", t("back")); a.addEventListener("click", ev => { if (history.length > 1) { ev.preventDefault(); history.back(); } }); return a; })() : null;
  top.replaceChildren(el("div", { class: "wrap bar" },
    el("div", { class: "lft" }, left, el("a", { class: "brand", href: "./", "aria-label": "Rotaract Events" }, el("img", { src: "rotaract.svg", alt: "Rotaract" }))),
    el("div", { class: "rgt" }, extra, hbtn("info", "about.html", t("info"), active === "about"), hbtn("settings", "settings.html", t("settings"), active === "settings"))));
  document.documentElement.style.setProperty("--stick", top.offsetHeight + "px");  // sticky section headings start under the top bar
  const tabs = $("tabs");
  if (tabs) tabs.replaceChildren(...[["home", "./"], ["discover", "discover.html"], ["calendar", "calendar.html"]].map(([k, href]) => el("a", { class: "tab" + (active === k ? " on" : ""), href, "aria-current": active === k ? "page" : null }, icon(k), el("span", {}, t(k)))));
}
function footer() { return el("footer", {}, t("made_by") + " · ", el("a", { href: "https://github.com/Neyxo/rac-event-aggregation-tool", target: "_blank", rel: "noopener" }, t("source"))); }

// --- data + clubs
const D = { data: null, clubs: {}, settings: { home: "", also: [] }, saved: new Set() };
async function loadData() {
  try {
    const r = await fetch("events.json", { cache: "no-cache" });
    if (!r.ok) throw new Error(r.status);
    D.data = await r.json();
  } catch (e) {
    // Offline on a first visit, or the site is broken: say so instead of a skeleton forever. Callers stop here.
    const retry = el("button", { type: "button" }, t("refresh")); retry.addEventListener("click", () => location.reload());
    document.querySelector("main")?.replaceChildren(el("div", { class: "empty" }, t("offline"), el("br"), retry));
    throw e;
  }
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
const nClubs = () => D.data.clubs.filter(c => c.district).length;
function clubLabel(id) { const c = club(id); return c.name + (c.district ? ` (D${c.district})` : ""); }
const fmt = {
  day: new Intl.DateTimeFormat(LOCALE, { day: "numeric" }), mon: new Intl.DateTimeFormat(LOCALE, { month: "short" }), month: new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric" }),
  wd: new Intl.DateTimeFormat(LOCALE, { weekday: "short" }), wdl: new Intl.DateTimeFormat(LOCALE, { weekday: "long" }), time: new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" }),
  full: new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), stamp: new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  dm: new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", month: "short" }), date: new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" }),
};
function whenShort(e) { const s = new Date(e.start), en = new Date(e.end); return e.allday ? fmt.wdl.format(s) + " · " + t("all_day") : `${fmt.wd.format(s)} ${fmt.time.format(s)}` + (sameDay(s, en) ? "–" + fmt.time.format(en) : ""); }
function placeShort(e) { return (e.location || "").split(",")[0]; }
function isPast(e) { return new Date(e.end) < new Date(); }
function datePane(e) { const s = new Date(e.start); return el("div", { class: "date glass", "aria-hidden": "true" }, el("b", {}, fmt.day.format(s)), el("span", {}, fmt.mon.format(s))); }

// --- the event card: colour wash, crest under a frosted date pane (fading out to the right), one meta line, picture, star. The card opens the event page.
function starButton(e, onChange) {
  const b = el("button", { class: "star", type: "button", "aria-pressed": String(D.saved.has(e.id)), "aria-label": t("save") + ": " + e.title }, icon("star"));
  b.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); D.saved.has(e.id) ? D.saved.delete(e.id) : D.saved.add(e.id); store.set("rac.saved", [...D.saved]); b.setAttribute("aria-pressed", String(D.saved.has(e.id))); toast(D.saved.has(e.id) ? t("saved") : t("unsaved")); onChange?.(); });
  return b;
}
// The "next up" pane used on the club page and the home page.
function nextUp(e, label = t("next_event")) {
  const days = Math.max(0, Math.round((startOfDay(e.start) - startOfDay(new Date())) / 864e5));
  return el("a", { class: "nx glass", href: "event.html?id=" + e.id, style: clubStyle(e.clubs[0]) },
    el("div", {}, el("div", { class: "k" }, label), el("div", { class: "cd" }, days === 0 ? t("today") : days === 1 ? t("tomorrow") : t("in_days", { n: days })), el("h4", {}, e.title), el("div", { class: "m" }, whenShort(e) + (e.location ? " · " + placeShort(e) : "")), el("span", { class: "ring" }, t("details") + " →")),
    e.image ? el("img", { src: e.image, alt: "", referrerpolicy: "no-referrer" }) : null);
}
function eventCard(e, i = 0, onChange) {
  const lead = club(e.clubs[0]);
  return el("a", { class: "event" + (e.cancelled ? " cancelled" : "") + (D.newIds?.has(e.id) ? " new" : ""), href: "event.html?id=" + e.id, style: clubStyle(e.clubs[0]) + `;--i:${Math.min(i, 12)}`, id: "ev-" + e.id },
    lead.logo ? el("img", { class: "wm", src: lead.logo, alt: "", "aria-hidden": "true", loading: "lazy" }) : null,
    datePane(e),
    el("div", { class: "body" }, el("h4", {}, e.cancelled ? el("span", { class: "badge" }, t("cancelled")) : null, e.title), el("div", { class: "meta" }, whenShort(e) + (e.location ? " · " + placeShort(e) : "")), el("div", { class: "tags" }, ...e.clubs.map(c => clubChip(c)))),
    el("div", { class: "side" }, starButton(e, onChange), e.image ? el("img", { class: "thumb", src: e.image, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null));
}

// --- location guess: approximate position of the connection, no permission prompt, nothing stored
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
function nearestClubs(here, n = 3, maxKm = 1e9) { return D.data.clubs.filter(c => c.coords && c.district).map(c => ({ c, d: km(here, c.coords) })).filter(x => x.d <= maxKm).sort((a, b) => a.d - b.d).slice(0, n); }
async function guessClubs() { const here = await guessPosition(); if (here) { const near = nearestClubs(here, 2, 35); if (near.length) return near.map(x => x.c.id); } return { fr: ["fribourg", "geneve-international"], it: ["ticino"], en: ["zurich-international", "geneve-international"] }[LANG] || []; }

// --- club tiles (settings, onboarding): crest + name, single (radio) or multi
function clubTiles(selected, onPick, { single = false, exclude = [] } = {}) {
  const grid = el("div", { class: "tiles", role: single ? "radiogroup" : "group" });
  if (single) { const none = el("button", { class: "tile none", type: "button", role: "radio", "aria-checked": String(!selected) }, el("b", {}, t("none"))); none.addEventListener("click", () => onPick("")); grid.append(none); }
  for (const c of D.data.clubs) {
    if (exclude.includes(c.id)) continue;
    const on = single ? selected === c.id : selected.has(c.id);
    const b = el("button", { class: "tile", type: "button", style: clubStyle(c.id), role: single ? "radio" : "checkbox", "aria-checked": String(on) }, clubMark(c), el("b", {}, c.short), el("span", {}, c.district ? "D" + c.district : t("national")));
    b.addEventListener("click", () => onPick(c.id));
    grid.append(b);
  }
  return grid;
}

// --- chip picker (flows, popups): wraps, no inner scrolling
function clubChips(selected, onPick, { single = false, exclude = [], only = null } = {}) {
  const box = el("div", { class: "chips" });
  if (single) { const none = el("button", { class: "chip", type: "button", "aria-pressed": String(!selected) }, t("none")); none.addEventListener("click", () => onPick("")); box.append(none); }
  for (const c of D.data.clubs) {
    if (exclude.includes(c.id) || (only && !only.includes(c.id))) continue;
    const on = single ? selected === c.id : selected.has(c.id);
    const b = el("button", { class: "chip club", type: "button", style: clubStyle(c.id), "aria-pressed": String(on), "aria-label": c.name }, clubMark(c), c.short);
    b.addEventListener("click", () => onPick(c.id)); box.append(b);
  }
  return box;
}
// a small popup with a title, some content and Done
function popup(title, build) {
  const dlg = el("dialog", { class: "ob" }), body = el("div", { class: "ob-in" });
  const draw = () => { body.replaceChildren(el("h2", { tabindex: "-1" }, title), build(draw), (() => { const n = el("div", { class: "nav" }, el("span"), el("button", { class: "btn", type: "button" }, t("done"))); n.lastChild.addEventListener("click", () => dlg.close()); return n; })()); };
  dlg.append(body); document.body.append(dlg); draw(); dlg.showModal(); body.firstChild.focus();
  dlg.addEventListener("close", () => dlg.remove());
  return dlg;
}

// --- call to action: "your club" with the next event when set, "find your club" otherwise
function ctaBlock() {
  const home = D.settings.home && D.clubs[D.settings.home];
  if (home) {
    const e = D.data.events.find(e => e.clubs.includes(home.id) && !isPast(e));
    return el("div", { class: "cta glass", style: clubStyle(home.id) }, el("div", { class: "k" }, t("your_club")),
      el("div", { class: "rc" }, clubMark(home), el("div", {}, el("b", {}, home.name), el("span", {}, e ? `${fmt.dm.format(new Date(e.start))} · ${e.title}` : t("cp_none"))), el("a", { class: "go", href: e ? "event.html?id=" + e.id : "club.html?id=" + home.id }, t("go"))));
  }
  const input = el("input", { class: "in", type: "text", placeholder: t("ab_find_ph"), "aria-label": t("ab_find_ph"), autocomplete: "off" });
  const go = el("button", { class: "go", type: "button" }, t("ab_find_btn")), near = el("div", { class: "near" }), hint = el("div", { class: "hint" });
  const show = here => near.replaceChildren(...nearestClubs(here, 3).map(({ c, d }) => el("a", { class: "nc", href: "club.html?id=" + c.id, style: clubStyle(c.id) }, clubMark(c), el("span", {}, c.short, el("small", {}, Math.round(d) + " km")))));
  const find = async () => { const q = input.value.trim(); if (!q) return; hint.textContent = t("locating"); try { const hit = await geocode(q); if (!hit) { hint.textContent = t("place_nf"); return; } hint.textContent = "📍 " + hit.label; show(hit.coords); } catch { hint.textContent = t("place_err"); } };
  go.addEventListener("click", find); input.addEventListener("keydown", ev => { if (ev.key === "Enter") find(); });
  guessPosition().then(here => { if (here && !near.children.length) show(here); });
  return el("div", { class: "cta glass new" }, el("div", { class: "k" }, t("ab_find_title")), el("div", { class: "find" }, input, go), hint, near);
}

// --- the hero (event head, club hero) sticks under the top bar and compacts as you scroll. The CSS reads --p, 0 → 1 over the first 80px of sticking (short, so it is rarely caught halfway).
function morphHead(node) {
  const sent = el("i", { class: "sent", "aria-hidden": "true" }); node.before(sent); node.classList.add("morph");
  const top = $("top").offsetHeight; node.style.top = top + "px";
  const tick = () => {
    const p = Math.min(1, Math.max(0, (top - sent.getBoundingClientRect().top) / 80)); node.style.setProperty("--p", p.toFixed(3)); node.classList.toggle("on", p > .5);
    // section headings stick right under the compact hero while it is there, under the top bar once it has scrolled off
    document.documentElement.style.setProperty("--stick", Math.round(Math.max(top, Math.min(node.getBoundingClientRect().bottom, top + node.offsetHeight))) + "px");
  };
  addEventListener("scroll", tick, { passive: true }); addEventListener("resize", tick); tick();
}

// --- month and section headings: frosted only while they are stuck under the bar or the compact hero
function stickyHeads() {
  const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stick")) || 63;
  for (const h of document.querySelectorAll("#results > h3, .clubpage > h3, .evpage > h3")) h.classList.toggle("stuck", h.getBoundingClientRect().top <= s + 1);
}
addEventListener("scroll", stickyHeads, { passive: true });

// --- pictures for Learn / Help / Celebrate: site/img/<k>.jpg when present, otherwise an event picture whose title fits (people doing things, not a poster)
const PILLAR_RE = {
  learn: /vortrag|talk|referat|besuch|visit|workshop|firm|company|entreprise|azienda|exkursion|führung/i,
  help: /hands.?on|projekt|project|projet|progetto|charity|spende|clean|sammel|freiwillig|volunt|bénévol|volontar|helfen/i,
  party: /stamm|party|fest|ap[ée]ro|weihnacht|christmas|noël|natale|dinner|grill|ball|gala|sommer|summer|été|estate/i,
};
function pillarPic(k) {
  const withPic = D.data.events.filter(e => e.image), fallback = (withPic.filter(e => PILLAR_RE[k].test(e.title)).at(-1) || withPic.at(-1))?.image;
  const im = el("img", { src: "img/" + k + ".jpg", alt: "", loading: "lazy" });
  im.addEventListener("error", () => { if (fallback && im.src !== fallback) { im.referrerPolicy = "no-referrer"; im.src = fallback; } });
  return im;
}

// --- news teasers: picture with the title on it, linking to the article on the club's site (only the link is stored)
function newsCard(n) { return el("a", { class: "nw", href: n.url, target: "_blank", rel: "noopener" }, n.image ? el("img", { src: n.image, alt: "", loading: "lazy", referrerpolicy: "no-referrer" }) : null, el("div", { class: "t" }, el("b", {}, n.title), n.date ? el("span", {}, fmt.date.format(new Date(n.date))) : null)); }
function newsStrip(items) { return el("div", { class: "strip teasers" }, ...items.map(newsCard)); }

// --- service worker
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
