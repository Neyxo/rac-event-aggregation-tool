// Home (your clubs, or explore mode) and Discover (all of Rotaract with filters). Lists only; the month lives on calendar.html.
const PAGE = document.body.dataset.page; // "home" | "discover"
const DISTRICTS = { "1980": t("d1980"), "1990": t("d1990"), "2000": t("d2000") };
const S = { view: "all", clubSel: new Set(), distSel: new Set(), center: null, centerLabel: "" };
applyI18n();

function scopeClubs() { return PAGE === "home" ? myClubs() : null; }

// --- home banner, or explore mode for people without a club
function renderHome() {
  const box = $("home"); if (!box) return;
  const mine = myClubs();
  if (!mine.length) {
    const tips = t("tips"), tip = tips[Math.floor(Date.now() / 864e5) % tips.length];
    box.replaceChildren(
      el("div", { class: "explore glass" }, el("div", { class: "k" }, t("explore_title")), el("p", {}, t("explore_lead")), el("div", { class: "links" }, el("a", { class: "primary", href: "about.html" }, t("explore_all")), el("a", { href: "settings.html" }, t("choose_clubs")))),
      el("div", { class: "tip glass" }, el("div", { class: "k" }, t("tip_of_day")), el("p", {}, tip)),
      ctaBlock());
    $("listTitle").textContent = t("explore_near");
    return;
  }
  const lead = club(D.settings.home || mine[0]);
  box.replaceChildren(el("div", { class: "home-in", style: clubStyle(lead.id) },
    lead.logo ? el("img", { class: "crest", src: lead.logo, alt: "" }) : null,
    el("div", { class: "ht" }, el("div", { class: "meta" }, t("home_banner")), el("h2", {}, el("a", { href: "club.html?id=" + lead.id }, lead.name)),
      mine.length > 1 ? el("div", { class: "also" }, ...mine.slice(1).map(id => { const c = club(id); return el("a", { class: "mini glass", href: "club.html?id=" + id, title: c.name, style: clubStyle(id) }, clubMark(c), c.short); })) : null),
    el("a", { class: "ghost glass", href: "settings.html" }, t("change"))));
}

// --- filters (discover)
function hint(text) { const h = $("placeHint"); if (!h) return; h.textContent = text; h.hidden = !text; }
async function setPlace(text) { hint(""); S.center = null; if (text.trim()) { try { const hit = await geocode(text); if (hit) { S.center = hit.coords; S.centerLabel = hit.label; hint("📍 " + hit.label); } else hint(t("place_nf")); } catch { hint(t("place_err")); } } if (S.center && $("radius") && !$("radius").value) $("radius").value = "25"; render(); }
function locateMe() { if (!navigator.geolocation) { toast(t("loc_none")); return; } hint(t("locating")); navigator.geolocation.getCurrentPosition(pos => { S.center = [pos.coords.latitude, pos.coords.longitude]; S.centerLabel = t("you"); if ($("place")) $("place").value = ""; hint(t("your_location")); if ($("radius") && !$("radius").value) $("radius").value = "25"; render(); }, () => { hint(t("loc_na")); if (S.view === "near") setView("all"); }); }
function toggleIn(set, id) { set.has(id) ? set.delete(id) : set.add(id); renderClubChips(); render(); }
function renderClubChips() {
  const drow = $("districts"), row = $("clubs"); if (!drow || !row) return;
  drow.replaceChildren(el("span", { class: "rowlabel" }, t("district")));
  const dall = el("button", { class: "chip district", type: "button", "aria-pressed": String(S.distSel.size === 0) }, t("all")); dall.addEventListener("click", () => { S.distSel.clear(); renderClubChips(); render(); }); drow.append(dall);
  for (const [d, name] of Object.entries(DISTRICTS)) { const b = el("button", { class: "chip district", type: "button", "aria-pressed": String(S.distSel.has(d)), title: name }, name); b.addEventListener("click", () => toggleIn(S.distSel, d)); drow.append(b); }
  row.replaceChildren(el("span", { class: "rowlabel" }, t("clubs")));
  const all = el("button", { class: "chip", type: "button", "aria-pressed": String(S.clubSel.size === 0) }, t("all")); all.addEventListener("click", () => { S.clubSel.clear(); renderClubChips(); render(); }); row.append(all);
  for (const c of D.data.clubs) { if (S.distSel.size && !S.distSel.has(c.district)) continue; const b = el("button", { class: "chip club", type: "button", style: clubStyle(c.id), "aria-pressed": String(S.clubSel.has(c.id)), "aria-label": c.name }, clubMark(c), c.short); b.addEventListener("click", () => toggleIn(S.clubSel, c.id)); row.append(b); }
  const n = S.distSel.size + (S.clubSel.size ? 1 : 0) + ($("place")?.value ? 1 : 0) + ($("radius")?.value ? 1 : 0);
  if ($("fcount")) { $("fcount").textContent = n; $("fcount").hidden = !n; }
}
function togglePanel(open) { const p = $("panel"); if (!p) return; const o = open ?? p.hidden; p.hidden = !o; $("fbtn").setAttribute("aria-expanded", String(o)); }
function setView(v) { S.view = v; for (const b of $("views").querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.view === v)); if (v === "near" && !S.center) locateMe(); else render(); }
function weekendRange(now) { const sat = startOfDay(now); sat.setDate(sat.getDate() + ((6 - sat.getDay()) % 7)); if (now.getDay() === 0) sat.setDate(sat.getDate() - 7); const end = new Date(sat); end.setDate(end.getDate() + 2); return [sat, end]; }
function baseMatches(e) {
  const mine = scopeClubs(); if (mine && mine.length && !e.clubs.some(c => mine.includes(c))) return false;
  if (S.distSel.size && !e.clubs.some(c => S.distSel.has(club(c).district))) return false;
  if (S.clubSel.size && !e.clubs.some(c => S.clubSel.has(c))) return false;
  const q = fold($("q")?.value.trim()); if (q) { const hay = fold([e.title, e.description, e.location, ...e.clubs.map(c => club(c).name)].join(" ")); if (!q.split(/\s+/).every(w => hay.includes(w))) return false; }
  return true;
}
function distanceOf(e) { return S.center && e.coords ? km(S.center, e.coords) : null; }
function withinRadius(e) { const radius = Number($("radius")?.value) || null, use = S.center && (radius || S.view === "near"); if (!use) return true; if (!e.coords) return false; return distanceOf(e) <= (radius || 25); }

function render() {
  if (!D.data) return;
  const out = $("results"); out.replaceChildren(); out.removeAttribute("aria-busy");
  const now = new Date(), in7 = new Date(now.getTime() + 7 * 864e5), [wkStart, wkEnd] = weekendRange(now);
  let noLocation = 0; const matches = [];
  const explore = PAGE === "home" && !myClubs().length;
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
  const shown = explore && S.view === "all" ? matches.slice(0, 12) : matches;
  const parts = [t("s_" + S.view, { n: nEvents(matches.length) })];
  const radius = Number($("radius")?.value) || (S.view === "near" ? 25 : null);
  if (S.center && radius) parts.push(t("within", { r: radius, place: S.centerLabel }));
  if (noLocation) parts.push(t("no_location", { n: noLocation }));
  $("summary").textContent = parts.join(" · ");
  if (!matches.length) { const btn = el("button", { type: "button" }, t("show_all")); btn.addEventListener("click", clearFilters); out.append(el("div", { class: "empty" }, S.view === "saved" ? t("empty_saved") : t("empty"), el("br"), btn)); }
  let month = "", i = 0;
  for (const e of shown) { const m = fmt.month.format(new Date(e.start)); if (m !== month) { out.append(el("h3", {}, m)); month = m; } out.append(eventCard(e, i++, () => { if (S.view === "saved") render(); })); }
  if (shown.length < matches.length) out.append(el("div", { class: "links", style: "justify-content:center" }, el("a", { href: "discover.html" }, t("discover_cta"))));
  $("clear").hidden = !($("q")?.value || S.clubSel.size || S.distSel.size || $("place")?.value || $("radius")?.value || S.view !== "all");
  const p = new URLSearchParams();
  if ($("q")?.value) p.set("q", $("q").value); if (S.distSel.size) p.set("d", [...S.distSel].join(",")); if (S.clubSel.size) p.set("clubs", [...S.clubSel].join(","));
  if ($("place")?.value) p.set("place", $("place").value); if ($("radius")?.value) p.set("r", $("radius").value); if (S.view !== "all") p.set("view", S.view);
  history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
}
function clearFilters() { if ($("q")) $("q").value = ""; if ($("place")) $("place").value = ""; if ($("radius")) $("radius").value = ""; hint(""); S.center = null; S.clubSel.clear(); S.distSel.clear(); renderClubChips(); setView("all"); }

// --- onboarding (first visit on home)
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
async function onboarding() {
  const dlg = $("ob"), body = $("obBody"), guessP = guessClubs();
  const s = { home: "", also: [] };
  let member = null, step = 0, guess = [];
  const steps = () => member === false ? 3 : 4;
  const finish = () => { D.settings = s; saveSettings(); store.set("rac.onboarded", true); dlg.close(); renderHome(); render(); if (myClubs().length) toast(t("ob_showing", { clubs: myClubs().map(id => club(id).short).join(", ") })); };
  const feedRow = (c, file) => { const https = new URL(file, location.href).href, webcal = https.replace(/^https?:/, "webcal:"); return el("div", { class: "feed" }, el("div", { class: "name", style: c.id ? clubStyle(c.id) : "" }, c.id ? clubMark(c) : null, c.name), el("div", { class: "l" }, el("a", { href: webcal }, t("apple")), el("a", { href: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal), target: "_blank", rel: "noopener" }, t("google")), el("a", { href: https }, ".ics"))); };
  const nav = (nextLabel, skip) => el("div", { class: "nav" }, skip ? el("button", { class: "skip", type: "button" }, skip) : el("span"), el("button", { class: "btn", type: "button" }, nextLabel));
  const installStep = () => { let how; if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) how = el("p", {}, t("ob_installed")); else if (installPrompt) { how = el("button", { class: "install-btn", type: "button" }, t("inst_btn")); how.addEventListener("click", async () => { installPrompt.prompt(); await installPrompt.userChoice; finish(); }); } else how = el("p", { class: "meta" }, t("inst_text"), " ", el("a", { href: "settings.html#install" }, t("settings"))); return how; };
  const draw = () => {
    body.replaceChildren(el("div", { class: "bar2", "aria-hidden": "true" }, ...Array.from({ length: steps() }, (_, i) => el("i", { class: i <= step ? "on" : "" }))));
    const h2 = el("h2", { id: "obTitle", tabindex: "-1" });
    if (step === 0) {
      h2.textContent = t("ob_welcome");
      const yes = el("button", { class: "btn big", type: "button" }, t("ob_member")), no = el("button", { class: "btn big alt", type: "button" }, t("ob_guest"));
      yes.addEventListener("click", async () => { member = true; guess = await guessP; s.home = guess[0] || ""; s.also = guess.slice(1); step = 1; draw(); });
      no.addEventListener("click", async () => { member = false; guess = await guessP; step = 1; draw(); });
      body.append(h2, el("p", {}, t("ob_member_q")), el("div", { class: "choice" }, yes, no));
    } else if (member && step === 1) {
      const n = nav(t("next"), t("skip")); n.lastChild.addEventListener("click", () => { step = 2; draw(); }); n.firstChild.addEventListener("click", finish);
      h2.textContent = t("ob_q");
      body.append(h2, el("p", {}, s.home ? t("ob_pre") : t("ob_pick")), el("h3", {}, t("ob_main")), clubChips(s.home, id => { s.home = id; s.also = s.also.filter(x => x !== id); draw(); }, { single: true }), el("h3", {}, t("ob_also")), clubChips(new Set(s.also), id => { s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id]; draw(); }, { exclude: [s.home] }), n);
    } else if (member && step === 2) {
      const ids = [s.home, ...s.also].filter(id => D.clubs[id]);
      const n = nav(t("next"), t("not_now")); n.lastChild.addEventListener("click", () => { step = 3; draw(); }); n.firstChild.addEventListener("click", () => { step = 3; draw(); });
      h2.textContent = t("ob_sub");
      body.append(h2, el("p", {}, t("ob_sub_text")), el("div", { class: "feeds stack" }, ...ids.map(id => feedRow(club(id), id + ".ics")), ids.length ? el("p", { class: "meta", style: "margin:4px 0 0" }, t("ob_or")) : null, feedRow({ name: t("all_feed_short") }, "all.ics"), el("p", { class: "meta", style: "margin:6px 0 0" }, t("ob_help"), el("a", { href: "subscribe.html", target: "_blank" }, t("ob_help_link")))), n);
    } else if (!member && step === 1) {
      const n = nav(t("next"), t("skip")); n.lastChild.addEventListener("click", () => { step = 2; draw(); }); n.firstChild.addEventListener("click", finish);
      h2.textContent = t("ob_guest_title");
      const near = guess.length ? guess : D.data.clubs.filter(c => c.district).slice(0, 4).map(c => c.id);
      body.append(h2, el("p", {}, t("ob_guest_text")), el("h3", {}, t("ob_follow")), clubChips(new Set(s.also), id => { s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id]; draw(); }, { only: near }), el("div", { class: "links", style: "margin-top:10px" }, el("a", { href: "about.html" }, t("explore_all"))), n);
    } else {
      const n = nav(t("done"), null); n.lastChild.addEventListener("click", finish);
      h2.textContent = t("ob_inst");
      body.append(h2, el("p", {}, t("ob_inst_text")), installStep(), n, el("div", { class: "credit" }, t("credit_short")));
    }
    h2.focus();
  };
  draw(); dlg.addEventListener("cancel", ev => { ev.preventDefault(); finish(); }, { once: true }); dlg.showModal(); $("obTitle").focus();
}

// --- boot
async function init() {
  chrome(PAGE);
  try { await loadData(); } catch { $("summary").textContent = t("offline"); $("results").replaceChildren(); return; }
  const generated = new Date(D.data.generated);
  if (Date.now() - generated > 30 * 3600e3) { $("stale").textContent = t("stale", { t: fmt.stamp.format(generated) }); $("stale").hidden = false; }
  $("foot").replaceChildren(el("div", { class: "meta" }, t("updated", { t: fmt.stamp.format(generated) }) + " · " + t("members_only")), footer());
  const p = new URLSearchParams(location.search);
  if (p.get("event")) { location.replace("event.html?id=" + encodeURIComponent(p.get("event"))); return; }
  const shared = [...p.keys()].some(k => k !== "lang");
  if ($("q")) $("q").value = p.get("q") || "";
  if ($("radius")) $("radius").value = p.get("r") || "";
  if ($("place")) $("place").value = p.get("place") || "";
  S.clubSel = new Set((p.get("clubs") || "").split(",").filter(c => D.clubs[c]));
  S.distSel = new Set((p.get("d") || "").split(",").filter(d => DISTRICTS[d]));
  renderHome(); renderClubChips();
  $("fbtn")?.addEventListener("click", () => togglePanel());
  let timer; $("q")?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 150); });
  $("radius")?.addEventListener("change", () => { renderClubChips(); render(); });
  $("place")?.addEventListener("change", () => { renderClubChips(); setPlace($("place").value); });
  $("place")?.addEventListener("keydown", ev => { if (ev.key === "Enter") $("place").blur(); });
  $("locate")?.addEventListener("click", locateMe);
  $("clear").addEventListener("click", clearFilters);
  for (const b of $("views").querySelectorAll(".chip")) b.addEventListener("click", () => setView(b.dataset.view));
  if ($("place")?.value) await setPlace($("place").value);
  S.view = p.get("view") || "all";
  for (const b of $("views").querySelectorAll(".chip")) b.setAttribute("aria-pressed", String(b.dataset.view === S.view));
  if (S.view === "near" && !S.center) locateMe(); else render();
  if (PAGE === "home" && !shared && !store.get("rac.onboarded", false)) onboarding();
}
init();
