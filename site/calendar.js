// Calendar page: the month fills the screen, no scrolling; tapping a day slides up a frosted sheet with that day's events.
const DAYMS = 864e5;
const C = { month: null, day: null, scope: "mine" };
applyI18n();
function events() { const mine = C.scope === "mine" ? myClubs() : []; return D.data.events.filter(e => !mine.length || e.clubs.some(c => mine.includes(c))); }
function render() {
  const now = new Date();
  if (!C.month) C.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const m = C.month, first = new Date(m), last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
  const lead = (first.getDay() + 6) % 7, gridStart = new Date(first); gridStart.setDate(1 - lead);
  const byDay = {};
  for (const e of events()) { const s = startOfDay(new Date(e.start)), end = new Date(e.end); for (let d = new Date(s); d < end || sameDay(d, s); d.setDate(d.getDate() + 1)) { if (d < gridStart || d > new Date(last.getTime() + 7 * DAYMS)) continue; (byDay[d.toDateString()] ||= []).push(e); if (e.allday && d >= end) break; } }
  $("mtitle").textContent = fmt.month.format(m);
  const grid = $("grid"); grid.replaceChildren(...t("dow").map(d => el("div", { class: "dow", role: "columnheader" }, d)));
  const cells = lead + last.getDate() > 35 ? 42 : 35; grid.style.setProperty("--rows", cells / 7);
  for (let i = 0; i < cells; i++) {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i);
    const evs = byDay[d.toDateString()] || [];
    const cell = el("button", { type: "button", class: "day" + (d.getMonth() !== m.getMonth() ? " other" : "") + (sameDay(d, now) ? " today" : ""), "aria-pressed": String(!!C.day && sameDay(d, C.day)), "aria-label": fmt.full.format(d) + ", " + t("n_on_day", { n: evs.length }) },
      el("span", { class: "n" }, d.getDate()),
      ...evs.slice(0, 3).map(e => el("span", { class: "ch", style: clubStyle(e.clubs[0]) + `;--crest:url("${club(e.clubs[0]).logo}")`, title: e.title }, el("i", {}, e.title))),
      evs.length > 3 ? el("span", { class: "more" }, `+${evs.length - 3}`) : null);
    cell.addEventListener("click", () => openDay(d, byDay[d.toDateString()] || []));
    grid.append(cell);
  }
}
function openDay(d, evs) {
  C.day = d; render();
  const sheet = $("sheet"), body = $("sheetBody");
  $("sheetTitle").textContent = fmt.full.format(d);
  body.replaceChildren(...(evs.length ? evs.map((e, i) => eventCard(e, i)) : [el("p", { class: "meta" }, t("no_events_day"))]));
  sheet.classList.add("open"); sheet.setAttribute("aria-hidden", "false");
}
function closeSheet() { C.day = null; $("sheet").classList.remove("open"); $("sheet").setAttribute("aria-hidden", "true"); render(); }
async function init() {
  chrome("calendar");
  await loadData();
  if (!myClubs().length) { C.scope = "all"; $("scope").hidden = true; }
  for (const b of $("scope").children) { b.setAttribute("aria-pressed", String(b.dataset.scope === C.scope)); b.addEventListener("click", () => { C.scope = b.dataset.scope; for (const x of $("scope").children) x.setAttribute("aria-pressed", String(x === b)); render(); }); }
  $("prev").addEventListener("click", () => { C.month = new Date(C.month.getFullYear(), C.month.getMonth() - 1, 1); render(); });
  $("next").addEventListener("click", () => { C.month = new Date(C.month.getFullYear(), C.month.getMonth() + 1, 1); render(); });
  $("todayBtn").addEventListener("click", () => { const n = new Date(); C.month = new Date(n.getFullYear(), n.getMonth(), 1); render(); const evs = events().filter(e => sameDay(new Date(e.start), n)); if (evs.length) openDay(startOfDay(n), evs); });
  $("sheetClose").addEventListener("click", closeSheet);
  $("sheet").addEventListener("click", ev => { if (ev.target === $("sheet")) closeSheet(); });
  addEventListener("keydown", ev => { if (ev.key === "Escape") closeSheet(); });
  // swipe down on the sheet handle closes it
  let y0 = null; $("sheetHandle").addEventListener("touchstart", ev => { y0 = ev.touches[0].clientY; }, { passive: true }); $("sheetHandle").addEventListener("touchend", ev => { if (y0 != null && ev.changedTouches[0].clientY - y0 > 40) closeSheet(); y0 = null; });
  render();
}
init();
