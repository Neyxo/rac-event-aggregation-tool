// Home (your clubs) and Discover (all of Rotaract) share this: list and month rendering, filters, settings, onboarding.
const PAGE = document.body.dataset.page; // "home" | "discover"
const DISTRICTS = { "1980": t("d1980"), "1990": t("d1990"), "2000": t("d2000") };
const S = { view: "all", mode: "list", clubSel: new Set(), distSel: new Set(), center: null, centerLabel: "", month: null, day: null };
applyI18n();

// --- scope: home shows your clubs, discover shows everything
function scopeClubs() { return PAGE === "home" ? myClubs() : null; }

// --- home banner
function renderHome() {
  const box = $("home"); if (!box) return;
  const mine = myClubs();
  if (!mine.length) {
    box.hidden = false;
    const b = el("button", { class: "ghost", type: "button" }, t("choose_clubs"));
    b.addEventListener("click", openSettings);
    box.replaceChildren(el("div", { class: "home-in empty", style: "--c:#d41367;--on-c:#fff" }, el("div", { class: "ht" }, el("h2", {}, t("no_clubs_yet")), el("div", { class: "meta" }, t("or_discover"))), b));
    return;
  }
  const lead = club(D.settings.home || mine[0]);
  const change = el("button", { class: "ghost", type: "button" }, t("change"));
  change.addEventListener("click", openSettings);
  box.hidden = false;
  box.replaceChildren(el("div", { class: "home-in", style: clubStyle(lead.id) },
    lead.logo ? el("img", { class: "crest", src: lead.logo, alt: "" }) : null,
    el("div", { class: "ht" }, el("div", { class: "meta" }, t("home_banner")), el("h2", {}, el("a", { href: "club.html?id=" + lead.id }, lead.name)),
      mine.length > 1 ? el("div", { class: "also" }, ...mine.slice(1).map(id => { const c = club(id); return el("a", { class: "mini", href: "club.html?id=" + id, title: c.name, style: clubStyle(id) }, clubMark(c), c.short); })) : null),
    change));
}

// --- settings sheet
function clubPicker(selected, onPick, { single = false, exclude = [] } = {}) {
  const chips = el("div", { class: "chips" });
  if (single) { const none = el("button", { class: "chip", type: "button", "aria-pressed": String(!selected) }, t("none")); none.addEventListener("click", () => onPick("")); chips.append(none); }
  for (const c of D.data.clubs) {
    if (exclude.includes(c.id)) continue;
    const on = single ? selected === c.id : selected.has(c.id);
    const b = el("button", { class: "chip club", type: "button", style: clubStyle(c.id), "aria-pressed": String(on), "aria-label": c.name }, clubMark(c), c.short);
    b.addEventListener("click", () => onPick(c.id));
    chips.append(b);
  }
  return chips;
}
function installBlock() {
  if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) return el("p", { class: "meta" }, t("inst_done"));
  if (installPrompt) { const b = el("button", { class: "install-btn", type: "button" }, t("inst_btn")); b.addEventListener("click", async () => { installPrompt.prompt(); await installPrompt.userChoice; }); return b; }
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const tabs = el("div", { class: "tabs", role: "tablist" }), steps = el("ol", { class: "steps" });
  const show = key => { for (const b of tabs.children) b.setAttribute("aria-selected", String(b.dataset.key === key)); steps.replaceChildren(...t("g_" + key).map(s => el("li", {}, s))); };
  for (const key of ["ios", "android", "desktop"]) { const b = el("button", { type: "button", role: "tab", "data-key": key }, t(key)); b.addEventListener("click", () => show(key)); tabs.append(b); }
  show(ios ? "ios" : /Android/.test(ua) ? "android" : "desktop");
  return el("div", {}, tabs, steps);
}
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
window.addEventListener("appinstalled", () => { installPrompt = null; toast("🎉"); });
function openSettings() {
  const dlg = $("settingsDlg"), body = $("setBody");
  const draw = () => {
    const s = D.settings;
    body.replaceChildren(
      el("h2", { id: "setTitle", tabindex: "-1" }, t("settings")), el("p", {}, t("set_hint")),
      el("h3", {}, t("main_club")), clubPicker(s.home, id => { s.home = id; s.also = s.also.filter(x => x !== id); saveSettings(); draw(); }, { single: true }),
      el("h3", {}, t("also_show")), clubPicker(new Set(s.also), id => { s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id]; saveSettings(); draw(); }, { exclude: [s.home] }),
      el("h3", {}, t("language")), langSelect(),
      el("h3", {}, t("appearance")), el("div", { class: "chips" }, ...[["light", t("theme_light")], ["dark", t("theme_dark")]].map(([k, name]) => { const b = el("button", { class: "chip", type: "button", "aria-pressed": String(document.documentElement.dataset.theme === k) }, name); b.addEventListener("click", () => { setTheme(k); draw(); }); return b; })),
      el("h3", {}, t("inst_title")), installBlock(),
      el("h3", {}, t("share_title")), el("p", { class: "meta" }, t("share_text")),
      (() => { const box = el("div", { class: "linkbox" }, el("input", { type: "text", readonly: "", value: location.origin + location.pathname.replace(/[^/]*$/, ""), "aria-label": t("share_title") }), el("button", { type: "button" }, t("copy"))); box.lastChild.addEventListener("click", async () => { await navigator.clipboard.writeText(box.firstChild.value); toast(t("copied")); }); return box; })(),
      el("div", { class: "links", style: "margin-top:14px" }, (() => { const b = el("button", { class: "linkbtn", type: "button" }, t("rerun")); b.addEventListener("click", () => { dlg.close(); onboarding(); }); return b; })(), el("a", { href: "about.html" }, t("about"))),
      (() => { const n = el("div", { class: "nav" }, el("span"), el("button", { class: "btn", type: "button" }, t("done"))); n.lastChild.addEventListener("click", () => dlg.close()); return n; })());
  };
  draw(); dlg.showModal(); $("setTitle").focus();
  dlg.addEventListener("close", () => { renderHome(); renderClubChips(); render(); }, { once: true });
}

// --- onboarding (first visit)
async function onboarding() {
  const dlg = $("ob"), body = $("obBody"), guess = await guessClubs();
  const s = { home: guess[0] || "", also: guess.slice(1) };
  let step = 0;
  const finish = () => { D.settings = s; saveSettings(); store.set("rac.onboarded", true); dlg.close(); renderHome(); renderClubChips(); render(); if (myClubs().length) toast(t("ob_showing", { clubs: myClubs().map(id => club(id).short).join(", ") })); };
  const feedRow = (c, file) => { const https = new URL(file, location.href).href, webcal = https.replace(/^https?:/, "webcal:"); return el("div", { class: "feed" }, el("div", { class: "name", style: c.id ? clubStyle(c.id) : "" }, c.id ? clubMark(c) : null, c.name), el("div", { class: "l" }, el("a", { href: webcal }, t("apple")), el("a", { href: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal), target: "_blank", rel: "noopener" }, t("google")), el("a", { href: https }, ".ics"))); };
  const draw = () => {
    body.replaceChildren(el("div", { class: "bar2", "aria-hidden": "true" }, ...[0, 1, 2].map(i => el("i", { class: i <= step ? "on" : "" }))));
    const nav = (nextLabel, skip) => el("div", { class: "nav" }, skip ? el("button", { class: "skip", type: "button" }, skip) : el("span"), el("button", { class: "btn", type: "button" }, nextLabel));
    const h2 = el("h2", { id: "obTitle", tabindex: "-1" });
    if (step === 0) {
      const n = nav(t("next"), t("skip")); n.lastChild.addEventListener("click", () => { step = 1; draw(); }); n.firstChild.addEventListener("click", finish);
      h2.textContent = t("ob_welcome");
      body.append(h2, el("p", {}, t("ob_q") + " " + (s.home ? t("ob_pre") : t("ob_pick"))), el("h3", {}, t("ob_main")), clubPicker(s.home, id => { s.home = id; s.also = s.also.filter(x => x !== id); draw(); }, { single: true }), el("h3", {}, t("ob_also")), clubPicker(new Set(s.also), id => { s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id]; draw(); }, { exclude: [s.home] }), n);
    } else if (step === 1) {
      const ids = [s.home, ...s.also].filter(id => D.clubs[id]);
      const n = nav(t("next"), t("not_now")); n.lastChild.addEventListener("click", () => { step = 2; draw(); }); n.firstChild.addEventListener("click", () => { step = 2; draw(); });
      h2.textContent = t("ob_sub");
      body.append(h2, el("p", {}, t("ob_sub_text")), el("div", { class: "feeds" }, ...ids.map(id => feedRow(club(id), id + ".ics")), ids.length ? el("p", { class: "meta", style: "margin:4px 0 0" }, t("ob_or")) : null, feedRow({ name: t("all_feed") }, "all.ics"), el("p", { class: "meta", style: "margin:6px 0 0" }, t("ob_help"), el("a", { href: "subscribe.html", target: "_blank" }, t("ob_help_link")))), n);
    } else {
      const n = nav(t("done"), installPrompt ? t("not_now") : null); n.lastChild.addEventListener("click", finish); if (installPrompt) n.firstChild.addEventListener("click", finish);
      h2.textContent = t("ob_inst");
      body.append(h2, el("p", {}, t("ob_inst_text")), installBlock(), n, el("div", { class: "credit" }, t("credit_short")));
    }
    h2.focus();
  };
  draw(); dlg.addEventListener("cancel", ev => { ev.preventDefault(); finish(); }, { once: true }); dlg.showModal(); $("obTitle").focus();
}

// --- filters (discover only: district, clubs, place)
function hint(text) { const h = $("placeHint"); if (!h) return; h.textContent = text; h.hidden = !text; }
async function setPlace(text) {
  hint(""); S.center = null;
  if (text.trim()) { try { const hit = await geocode(text); if (hit) { S.center = hit.coords; S.centerLabel = hit.label; hint("📍 " + hit.label); } else hint(t("place_nf")); } catch { hint(t("place_err")); } }
  if (S.center && $("radius") && !$("radius").value) $("radius").value = "25";
  render();
}
function locateMe() {
  if (!navigator.geolocation) { toast(t("loc_none")); return; }
  hint(t("locating"));
  navigator.geolocation.getCurrentPosition(pos => { S.center = [pos.coords.latitude, pos.coords.longitude]; S.centerLabel = t("you"); if ($("place")) $("place").value = ""; hint(t("your_location")); if ($("radius") && !$("radius").value) $("radius").value = "25"; render(); },
    () => { hint(t("loc_na")); if (S.view === "near") setView("all"); });
}
function toggleIn(set, id) { set.has(id) ? set.delete(id) : set.add(id); renderClubChips(); render(); }
function renderClubChips() {
  const drow = $("districts"), row = $("clubs"); if (!drow || !row) return;
  drow.replaceChildren(el("span", { class: "rowlabel" }, t("district")));
  const dall = el("button", { class: "chip district", type: "button", "aria-pressed": String(S.distSel.size === 0) }, t("all")); dall.addEventListener("click", () => { S.distSel.clear(); renderClubChips(); render(); }); drow.append(dall);
  for (const [d, name] of Object.entries(DISTRICTS)) { const b = el("button", { class: "chip district", type: "button", "aria-pressed": String(S.distSel.has(d)), title: name }, name); b.addEventListener("click", () => toggleIn(S.distSel, d)); drow.append(b); }
  row.replaceChildren(el("span", { class: "rowlabel" }, t("clubs")));
  const all = el("button", { class: "chip", type: "button", "aria-pressed": String(S.clubSel.size === 0) }, t("all")); all.addEventListener("click", () => { S.clubSel.clear(); renderClubChips(); render(); }); row.append(all);
  for (const c of D.data.clubs) {
    if (S.distSel.size && !S.distSel.has(c.district)) continue;
    const b = el("button", { class: "chip club", type: "button", style: clubStyle(c.id), "aria-pressed": String(S.clubSel.has(c.id)), "aria-label": c.name }, clubMark(c), c.short);
    b.addEventListener("click", () => toggleIn(S.clubSel, c.id)); row.append(b);
  }
  const n = S.distSel.size + (S.clubSel.size ? 1 : 0) + ($("place")?.value ? 1 : 0) + ($("radius")?.value ? 1 : 0);
  if ($("fcount")) { $("fcount").textContent = n; $("fcount").hidden = !n; }
}
function togglePanel(open) { const p = $("panel"); if (!p) return; const o = open ?? p.hidden; p.hidden = !o; $("fbtn").setAttribute("aria-expanded", String(o)); }

// --- views & modes
function setView(v) { S.view = v; for (const b of $("views").querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.view === v)); if (v === "near" && !S.center) locateMe(); else render(); }
function setMode(m) { S.mode = m; for (const b of document.querySelectorAll(".summary .seg button")) b.setAttribute("aria-pressed", String(b.dataset.mode === m)); for (const b of $("views").querySelectorAll(".chip")) b.style.display = m === "month" ? "none" : ""; render(); }
function weekendRange(now) { const sat = startOfDay(now); sat.setDate(sat.getDate() + ((6 - sat.getDay()) % 7)); if (now.getDay() === 0) sat.setDate(sat.getDate() - 7); const end = new Date(sat); end.setDate(end.getDate() + 2); return [sat, end]; }

// --- filtering shared by list and month
function baseMatches(e) {
  const mine = scopeClubs();
  if (mine && mine.length && !e.clubs.some(c => mine.includes(c))) return false;
  if (S.distSel.size && !e.clubs.some(c => S.distSel.has(club(c).district))) return false;
  if (S.clubSel.size && !e.clubs.some(c => S.clubSel.has(c))) return false;
  const q = fold($("q").value.trim());
  if (q) { const hay = fold([e.title, e.description, e.location, ...e.clubs.map(c => club(c).name)].join(" ")); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
  return true;
}
function distanceOf(e) { return S.center && e.coords ? km(S.center, e.coords) : null; }
function withinRadius(e) { const radius = Number($("radius")?.value) || null, use = S.center && (radius || S.view === "near"); if (!use) return true; if (!e.coords) return false; return distanceOf(e) <= (radius || 25); }

function list(events, byMonth = true) {
  const frag = document.createDocumentFragment(); let month = "", i = 0;
  for (const e of events) { const m = fmt.month.format(new Date(e.start)); if (byMonth && m !== month) { frag.append(el("h3", {}, m)); month = m; } frag.append(eventCard(e, i++, () => { if (S.view === "saved") render(); })); }
  return frag;
}
function renderList(out) {
  const now = new Date(), in7 = new Date(now.getTime() + 7 * 864e5), [wkStart, wkEnd] = weekendRange(now);
  let noLocation = 0; const matches = [];
  for (const e of D.data.events) {
    const start = new Date(e.start), past = isPast(e);
    if (S.view === "past" ? !past : past) continue;
    if (S.view === "week" && start > in7) continue;
    if (S.view === "weekend" && (start < wkStart || start >= wkEnd)) continue;
    if (S.view === "saved" && !D.saved.has(e.id)) continue;
    if (!baseMatches(e)) continue;
    if (!withinRadius(e)) { if (!e.coords) noLocation++; continue; }
    matches.push(e);
  }
  if (S.view === "past") matches.reverse();
  const n = matches.length, parts = [t("s_" + S.view, { n: nEvents(n) })];
  const radius = Number($("radius")?.value) || (S.view === "near" ? 25 : null);
  if (S.center && radius) parts.push(t("within", { r: radius, place: S.centerLabel }));
  if (noLocation) parts.push(t("no_location", { n: noLocation }));
  $("summary").textContent = parts.join(" · ");
  if (!n) { const btn = el("button", { type: "button" }, t("show_all")); btn.addEventListener("click", clearFilters); out.append(el("div", { class: "empty" }, S.view === "saved" ? t("empty_saved") : t("empty"), el("br"), btn)); }
  out.append(list(matches));
}

// --- month: chips carry their club's crest; the selected day is listed below
function renderMonth(out) {
  const now = new Date();
  if (!S.month) S.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const m = S.month, first = new Date(m), last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
  const lead = (first.getDay() + 6) % 7, gridStart = new Date(first); gridStart.setDate(1 - lead);
  const events = D.data.events.filter(e => baseMatches(e) && withinRadius(e)), byDay = {};
  for (const e of events) { const s = startOfDay(new Date(e.start)), end = new Date(e.end); for (let d = new Date(s); d < end || sameDay(d, s); d.setDate(d.getDate() + 1)) { if (d < gridStart || d > new Date(last.getTime() + 7 * 864e5)) continue; (byDay[d.toDateString()] ||= []).push(e); if (e.allday && d >= end) break; } }
  const inMonth = events.filter(e => { const s = new Date(e.start); return s >= first && s <= new Date(last.getTime() + 864e5); });
  $("summary").textContent = t("s_month", { n: nEvents(inMonth.length), m: fmt.month.format(m) });
  const prev = el("button", { type: "button", "aria-label": t("prev_month") }, "‹"), next = el("button", { type: "button", "aria-label": t("next_month") }, "›"), today = el("button", { type: "button" }, t("today"));
  prev.addEventListener("click", () => { S.month = new Date(m.getFullYear(), m.getMonth() - 1, 1); S.day = null; render(); });
  next.addEventListener("click", () => { S.month = new Date(m.getFullYear(), m.getMonth() + 1, 1); S.day = null; render(); });
  today.addEventListener("click", () => { S.month = new Date(now.getFullYear(), now.getMonth(), 1); S.day = startOfDay(now); render(); });
  const grid = el("div", { class: "grid", role: "grid" }, ...t("dow").map(d => el("div", { class: "dow", role: "columnheader" }, d)));
  const cells = lead + last.getDate() > 35 ? 42 : 35;
  if (!S.day) S.day = inMonth.length ? startOfDay(new Date((inMonth.find(e => !isPast(e)) || inMonth[0]).start)) : null;
  for (let i = 0; i < cells; i++) {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
    const evs = byDay[d.toDateString()] || [];
    const cell = el("button", { type: "button", class: "day" + (d.getMonth() !== m.getMonth() ? " other" : "") + (sameDay(d, now) ? " today" : ""), "aria-pressed": String(!!S.day && sameDay(d, S.day)), "aria-label": fmt.full.format(d) + ", " + t("n_on_day", { n: evs.length }) },
      el("span", { class: "n" }, d.getDate()),
      ...evs.slice(0, 3).map(e => el("span", { class: "ch", style: clubStyle(e.clubs[0]) + `;--crest:url("${club(e.clubs[0]).logo}")`, title: e.title }, el("i", {}, e.title))),
      evs.length > 3 ? el("span", { class: "more" }, `+${evs.length - 3}`) : null);
    cell.addEventListener("click", () => { S.day = S.day && sameDay(d, S.day) ? null : d; render(); });
    grid.append(cell);
  }
  out.append(el("div", { class: "month" }, el("div", { class: "mhead" }, prev, el("h2", {}, fmt.month.format(m)), el("div", {}, today, " ", next)), grid));
  const shown = S.day ? (byDay[S.day.toDateString()] || []) : inMonth;
  const dl = el("div", { class: "daylist" }, el("h3", {}, S.day ? fmt.full.format(S.day) : t("all_in", { m: fmt.month.format(m) })));
  dl.append(shown.length ? list(shown, false) : el("p", { class: "meta" }, t("no_day")));
  out.append(dl);
}

function render() {
  if (!D.data) return;
  const out = $("results"); out.replaceChildren(); out.removeAttribute("aria-busy");
  S.mode === "month" ? renderMonth(out) : renderList(out);
  $("clear").hidden = !($("q").value || S.clubSel.size || S.distSel.size || $("place")?.value || $("radius")?.value || S.view !== "all" || S.mode !== "list");
  const p = new URLSearchParams();
  if ($("q").value) p.set("q", $("q").value);
  if (S.distSel.size) p.set("d", [...S.distSel].join(","));
  if (S.clubSel.size) p.set("clubs", [...S.clubSel].join(","));
  if ($("place")?.value) p.set("place", $("place").value);
  if ($("radius")?.value) p.set("r", $("radius").value);
  if (S.view !== "all") p.set("view", S.view);
  if (S.mode !== "list") p.set("mode", S.mode);
  history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
}
function clearFilters() {
  $("q").value = ""; if ($("place")) $("place").value = ""; if ($("radius")) $("radius").value = ""; hint("");
  S.center = null; S.clubSel.clear(); S.distSel.clear(); S.day = null; S.month = null;
  renderClubChips(); setMode("list"); setView("all");
}

// --- boot
async function init() {
  $("settingsBtn").addEventListener("click", openSettings);
  $("share").addEventListener("click", async () => { const url = new URL(location.href); url.hash = ""; const data = { title: "Rotaract Events", text: t("share_app"), url: url.href }; if (navigator.share) { try { await navigator.share(data); } catch {} } else { await navigator.clipboard.writeText(url.href); toast(t("copied")); } });
  try { await loadData(); } catch { $("summary").textContent = t("offline"); $("results").replaceChildren(); return; }
  const generated = new Date(D.data.generated);
  if (Date.now() - generated > 30 * 3600e3) { $("stale").textContent = t("stale", { t: fmt.stamp.format(generated) }); $("stale").hidden = false; }
  $("footer").replaceChildren(t("updated", { t: fmt.stamp.format(generated) }) + " · " + t("members_only"), el("br"), t("made_by") + " · ", el("a", { href: "https://github.com/Neyxo/rac-event-aggregation-tool", target: "_blank", rel: "noopener" }, t("source")));

  const p = new URLSearchParams(location.search);
  if (p.get("event")) { location.replace("event.html?id=" + encodeURIComponent(p.get("event"))); return; } // old deep links
  const shared = [...p.keys()].some(k => k !== "lang");
  $("q").value = p.get("q") || "";
  if ($("radius")) $("radius").value = p.get("r") || "";
  if ($("place")) $("place").value = p.get("place") || "";
  S.clubSel = new Set((p.get("clubs") || "").split(",").filter(c => D.clubs[c]));
  S.distSel = new Set((p.get("d") || "").split(",").filter(d => DISTRICTS[d]));
  renderHome(); renderClubChips();
  $("fbtn")?.addEventListener("click", () => togglePanel());
  let timer; $("q").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 150); });
  $("radius")?.addEventListener("change", () => { renderClubChips(); render(); });
  $("place")?.addEventListener("change", () => { renderClubChips(); setPlace($("place").value); });
  $("place")?.addEventListener("keydown", ev => { if (ev.key === "Enter") $("place").blur(); });
  $("locate")?.addEventListener("click", locateMe);
  $("clear").addEventListener("click", clearFilters);
  for (const b of $("views").querySelectorAll(".chip")) b.addEventListener("click", () => setView(b.dataset.view));
  for (const b of document.querySelectorAll(".summary .seg button")) b.addEventListener("click", () => setMode(b.dataset.mode));
  if ($("place")?.value) await setPlace($("place").value);
  S.view = p.get("view") || "all";
  for (const b of $("views").querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.view === S.view));
  setMode(p.get("mode") === "month" ? "month" : "list");
  if (S.view === "near" && !S.center) locateMe();
  if (PAGE === "home" && !shared && !store.get("rac.onboarded", false)) onboarding();
}
init();
