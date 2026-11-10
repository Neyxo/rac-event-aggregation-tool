// Home (your clubs, or explore mode) and Discover (all of Rotaract with filters). Lists only; the month lives on calendar.html.
const PAGE = document.body.dataset.page; // "home" | "discover"
const DISTRICTS = { "1980": t("d1980"), "1990": t("d1990"), "2000": t("d2000") };
const S = { view: "all", clubSel: new Set(), distSel: new Set(), center: null, centerLabel: "" };
applyI18n();

function scopeClubs() { return PAGE === "home" ? myClubs() : null; }

// --- home banner, or explore mode for people without a club
function renderHome() {
  const box = $("home"); if (!box) return;
  document.querySelectorAll(".hn").forEach(n => n.remove());
  const mine = myClubs();
  if (!mine.length) {
    const tips = t("tips"), tip = tips[Math.floor(Date.now() / 864e5) % tips.length];
    const start = el("button", { class: "primary", type: "button" }, t("ob_start")); start.addEventListener("click", onboarding);
    box.replaceChildren(
      el("div", { class: "explore glass" }, el("div", { class: "k" }, t("explore_title")), el("p", {}, t("explore_lead")), el("div", { class: "links" }, start, el("a", { href: "about.html" }, t("explore_all")))),
      el("div", { class: "tip glass" }, el("div", { class: "k" }, t("tip_of_day")), el("p", {}, tip.replace("{n}", nClubs()))),
      ctaBlock());
    $("listTitle").textContent = t("explore_near");
    return;
  }
  // personal overview: greeting, the next event, what changed, deadlines and saved events; the list below skips the next event
  const mineEv = D.data.events.filter(e => e.clubs.some(c => mine.includes(c)) && !isPast(e)), next = mineEv[0];
  const today = startOfDay(new Date()), dayN = d => Math.round((startOfDay(d) - today) / 864e5);
  const cols = [D.settings.home || mine[0], ...mine.filter(id => id !== (D.settings.home || mine[0]))];
  wash(...cols.slice(0, 3).map(id => club(id).color), "#d41367", "#0067c8");
  // what changed since the last visit: ids and start times seen one visit ago (visits closer than an hour count as one)
  const seen = store.get("rac.seen", null), cur = Object.fromEntries(mineEv.map(e => [e.id, e.start])), prev = seen && Date.now() - seen.at > 36e5 ? (store.set("rac.seenPrev", seen.map), seen.map) : store.get("rac.seenPrev", null);
  if (!seen || Date.now() - seen.at > 36e5) store.set("rac.seen", { at: Date.now(), map: cur });
  D.newIds = new Set(prev ? Object.keys(cur).filter(id => !(id in prev)) : []);
  const moved = prev ? Object.keys(cur).filter(id => id in prev && prev[id] !== cur[id]).length : 0;
  const deadlines = mineEv.filter(e => e.deadline && dayN(e.deadline) >= 0 && dayN(e.deadline) <= 21).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 3);
  const saved = mineEv.filter(e => D.saved.has(e.id)).slice(0, 3);
  const h = new Date().getHours(), week = mineEv.filter(e => dayN(e.start) < 7).length;
  const row = (e, label, soon) => el("a", { class: "r" + (soon ? " soon" : ""), href: "event.html?id=" + e.id, style: clubStyle(e.clubs[0]) }, el("i"), el("span", {}, e.title), el("b", {}, label));
  const dLabel = n => n === 0 ? t("today") : n === 1 ? t("tomorrow") : t("d_short", { n });
  S.skip = next?.id;
  const news = mine.flatMap(id => club(id).news || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  fill(box,
    el("div", { class: "hello" }, el("h1", {}, (h < 11 ? t("greet_morning") : h < 18 ? t("greet_day") : t("greet_evening")) + " 👋"),
      el("p", { class: "sub" }, week === 0 ? t("wk_none") : week === 1 ? t("wk_one") : t("wk_events", { n: week })),
      el("div", { class: "chips" }, ...cols.map(id => { const c = club(id); return el("a", { class: "mini glass" + (id === cols[0] ? " main" : ""), href: "club.html?id=" + id, style: clubStyle(id) }, clubMark(c), c.short); }))),
    next ? nextUp(next, t("next_event") + " · " + club(next.clubs[0]).short) : null,
    D.newIds.size || moved ? el("a", { class: "news glass", href: "#results" }, el("b", {}, t("news_new", { n: D.newIds.size })), el("span", {}, " " + t("news_rest") + (moved ? " · " + t("news_moved", { n: moved }) : "")), icon("back")) : null,
    el("div", { class: "panes" },
      el("div", { class: "pane glass" }, el("div", { class: "k" }, t("deadline_h")), ...(deadlines.length ? deadlines.map(e => { const n = dayN(e.deadline); return row(e, dLabel(n), n <= 2); }) : [el("p", { class: "m" }, t("none_open"))])),
      el("div", { class: "pane glass" }, el("div", { class: "k" }, icon("star"), t("saved_h")), ...(saved.length ? saved.map(e => row(e, dLabel(dayN(e.start)))) : [el("p", { class: "m" }, t("none_open"))]))));
  // heading and strip sit in the main flow next to the list title (not inside #home or a wrapper): the heading then stays stuck until the title pushes it
  if (news.length) box.after(el("h3", { class: "sh hn" }, t("news")), Object.assign(newsStrip(news), { className: "strip teasers hn" }));
  $("listTitle").textContent = t("home_soon");
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
  for (const id of S.clubSel) { const c = club(id); const b = el("button", { class: "chip club", type: "button", style: clubStyle(id), "aria-pressed": "true", "aria-label": c.name }, clubMark(c), c.short); b.addEventListener("click", () => toggleIn(S.clubSel, id)); row.append(b); }
  const pick = el("button", { class: "chip", type: "button" }, t("change"));
  pick.addEventListener("click", () => popup(t("clubs"), redraw => clubChips(S.clubSel, id => { toggleIn(S.clubSel, id); redraw(); }, { only: S.distSel.size ? D.data.clubs.filter(c => S.distSel.has(c.district)).map(c => c.id) : null })));
  row.append(pick);
  const n = S.distSel.size + (S.clubSel.size ? 1 : 0) + ($("place")?.value ? 1 : 0) + ($("radius")?.value ? 1 : 0);
  if ($("fcount")) { $("fcount").textContent = n; $("fcount").hidden = !n; }
}
function togglePanel(open) { const p = $("panel"); if (!p) return; const o = open ?? p.hidden; p.hidden = !o; $("fbtn").setAttribute("aria-expanded", String(o)); }
function setView(v) { S.view = v; for (const b of $("views").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.view === v)); if (v === "near" && !S.center) locateMe(); else render(); }
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
    if (S.view === "all" && e.id === S.skip) continue;
    if (!withinRadius(e)) { if (!e.coords) noLocation++; continue; }
    matches.push(e);
  }
  if (S.view === "past") matches.reverse();
  const shown = explore && S.view === "all" ? matches.slice(0, 12) : matches;
  const parts = [nEvents(matches.length)];  // the title and the pressed view already say which events
  const radius = Number($("radius")?.value) || (S.view === "near" ? 25 : null);
  if (S.center && radius) parts.push(t("within", { r: radius, place: S.centerLabel }));
  if (noLocation) parts.push(t("no_location", { n: noLocation }));
  $("summary").textContent = parts.join(" · ");
  if (!matches.length) { const btn = el("button", { type: "button" }, t("show_all")); btn.addEventListener("click", clearFilters); out.append(el("div", { class: "empty" }, S.view === "saved" ? t("empty_saved") : t("empty"), el("br"), btn)); }
  let month = "", i = 0;
  for (const e of shown) { const m = fmt.month.format(new Date(e.start)); if (m !== month) { out.append(el("h3", { class: "sh" }, m)); month = m; } out.append(eventCard(e, i++, () => { if (S.view === "saved") render(); })); }
  if (shown.length < matches.length) out.append(el("div", { class: "links", style: "justify-content:center" }, el("a", { href: "discover.html" }, t("discover_cta"))));
  $("clear").hidden = !($("q")?.value || S.clubSel.size || S.distSel.size || $("place")?.value || $("radius")?.value || S.view !== "all");
  const p = new URLSearchParams();
  if ($("q")?.value) p.set("q", $("q").value); if (S.distSel.size) p.set("d", [...S.distSel].join(",")); if (S.clubSel.size) p.set("clubs", [...S.clubSel].join(","));
  if ($("place")?.value) p.set("place", $("place").value); if ($("radius")?.value) p.set("r", $("radius").value); if (S.view !== "all") p.set("view", S.view);
  history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
  stickyHeads();
}
function clearFilters() { if ($("q")) $("q").value = ""; if ($("place")) $("place").value = ""; if ($("radius")) $("radius").value = ""; hint(""); S.center = null; S.clubSel.clear(); S.distSel.clear(); renderClubChips(); setView("all"); }

// --- onboarding (first visit on home)
let installPrompt = null;
window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; });
async function onboarding() {
  const dlg = $("ob"), body = $("obBody"), guessP = guessClubs();
  const s = { home: D.settings.home, also: [...D.settings.also] };
  let member = null, step = 0, guess = [];
  const steps = () => member === false ? 6 : 4;
  const finish = () => { D.settings = s; saveSettings(); store.set("rac.onboarded", true); dlg.close(); renderHome(); render(); if (myClubs().length) toast(t("ob_showing", { clubs: myClubs().map(id => club(id).short).join(", ") })); };
  const feedRow = (c, file) => { const https = new URL(file, location.href).href, webcal = https.replace(/^https?:/, "webcal:"); return el("div", { class: "feed" }, el("div", { class: "name", style: c.id ? clubStyle(c.id) : "" }, c.id ? clubMark(c) : null, c.name), el("div", { class: "l" }, el("a", { href: webcal }, t("apple")), el("a", { href: "https://calendar.google.com/calendar/r?cid=" + encodeURIComponent(webcal), target: "_blank", rel: "noopener" }, t("google")), el("a", { href: https }, ".ics"))); };
  const nav = (nextLabel, skip) => el("div", { class: "nav" }, skip ? el("button", { class: "skip", type: "button" }, skip) : el("span"), el("button", { class: "btn", type: "button" }, nextLabel));
  const installStep = () => { let how; if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) how = el("p", {}, t("ob_installed")); else if (installPrompt) { how = el("button", { class: "install-btn", type: "button" }, t("inst_btn")); how.addEventListener("click", async () => { installPrompt.prompt(); await installPrompt.userChoice; finish(); }); } else how = el("p", { class: "meta" }, t("inst_text"), " ", el("a", { href: "settings.html#install" }, t("settings"))); return how; };
  const draw = () => {
    dlg.classList.toggle("full", member === false);
    body.replaceChildren(el("div", { class: "bar2", "aria-hidden": "true" }, ...Array.from({ length: steps() }, (_, i) => el("i", { class: i <= step ? "on" : "" }))));
    const h2 = el("h2", { id: "obTitle", tabindex: "-1" });
    if (step === 0) {
      h2.textContent = t("ob_welcome");
      const yes = el("button", { class: "btn big", type: "button" }, t("ob_member")), no = el("button", { class: "btn big alt", type: "button" }, t("ob_guest"));
      yes.addEventListener("click", async () => { member = true; guess = await guessP; if (!s.home) { s.home = guess[0] || ""; s.also = guess.slice(1); } step = 1; draw(); });
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
    } else if (!member && step <= 3) {
      // three full-screen slides: who we are, what we do, how to start. Skip jumps to the clubs.
      const [k, col] = [["who", "#0067c8"], ["what", "#009739"], ["how", "#d41367"]][step - 1];
      const n = nav(t("next"), t("skip")); n.lastChild.addEventListener("click", () => { step++; draw(); }); n.firstChild.addEventListener("click", () => { step = 4; draw(); });
      h2.textContent = t("ob_" + k);
      body.append(el("div", { class: "slide", style: `--p:${col}` }, pillarPic(["learn", "help", "party"][step - 1]), h2,
        k === "what" ? el("div", { class: "pill" }, ...[["learn", "#0067c8"], ["help", "#009739"], ["party", "#d41367"]].map(([w, c]) => el("p", { style: `--p:${c}` }, el("b", {}, t("ab_" + w) + "."), " " + t("ab_" + w + "_t")))) : el("p", {}, t(k === "who" ? "ab_lead" : "ob_how_t"))), n);
    } else if (!member && step === 4) {
      const n = nav(t("next"), t("skip")); n.lastChild.addEventListener("click", () => { step = 5; draw(); }); n.firstChild.addEventListener("click", finish);
      h2.textContent = t("ob_follow");
      const near = guess.length ? guess : D.data.clubs.filter(c => c.district).slice(0, 4).map(c => c.id);
      body.append(h2, el("p", {}, t("ob_guest_text")), clubChips(new Set(s.also), id => { s.also = s.also.includes(id) ? s.also.filter(x => x !== id) : [...s.also, id]; draw(); }, { only: near }), n);
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
  try { await loadData(); } catch { return; }
  const generated = new Date(D.data.generated);
  if (Date.now() - generated > 30 * 3600e3) { $("stale").textContent = t("stale", { t: fmt.stamp.format(generated) }); $("stale").hidden = false; }
  $("foot").replaceChildren(el("div", { class: "meta" }, t("updated", { t: fmt.stamp.format(generated) }) + " · ", el("a", { href: "public.html" }, t("members_only"))), footer());
  const p = new URLSearchParams(location.search);
  if (p.get("event")) { location.replace("event.html?id=" + encodeURIComponent(p.get("event"))); return; }
  // A shared link with filters is about all of Rotaract, not "my clubs": Discover has the UI for it.
  if (PAGE === "home" && ["q", "clubs", "d", "place", "r"].some(k => p.has(k))) { location.replace("discover.html" + location.search); return; }
  const shared = [...p.keys()].some(k => k !== "lang" && k !== "welcome");
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
  for (const b of $("views").querySelectorAll("button")) b.addEventListener("click", () => setView(b.dataset.view));
  if ($("place")?.value) await setPlace($("place").value);
  S.view = p.get("view") || "all";
  for (const b of $("views").querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.view === S.view));
  if (S.view === "near" && !S.center) locateMe(); else render();
  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (PAGE === "home" && (p.has("welcome") || (installed && !shared && !store.get("rac.onboarded", false)))) onboarding();
}
init();
