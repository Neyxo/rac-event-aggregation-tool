// The rules, in order:
// 1. events.json and status.json: a cached copy younger than 30 minutes is answered from the cache without touching the network
//    (switching screens or reopening the app costs nothing). Older: network first, the cached copy when offline or the server errs.
//    The fetch time is stored on the cached copy itself (header x-sw-fetched), so it survives the worker being stopped.
// 2. The hashed Vite assets (assets/*): cache first. A hashed name never changes content, so a cached one can never be stale.
// 3. Everything else on this origin (index.html, share pages, icons): network first, the cache as the offline fallback, and the cached
//    copy after 2.5 s on a slow network. Every successful fetch refreshes the cache, so a new deploy shows on the next load: no versions,
//    no "new version" prompt. A page opened with ?lang= or ?welcome falls back to the cached app page when offline.
// Only ok responses are cached; other origins (maps, geocoding, pictures) are never touched.
// index.html, the icons, the scripts and styles index.html names, and events.json / status.json are fetched on install. The cache of the old multi-page site ("rac-events": its pages, common.js ...)
// is deleted on activate, so a slow network can never get an old page back.
// ponytail: old hashed assets stay in the cache after a deploy (a few hundred kB each time the code changes); prune by name if it grows.
const CACHE = "rac-app";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "rotaract.svg", "icon-180.png", "icon-192.png", "icon-512.png"];
const DATA = /\/(events|status)\.json$/;
const FRESH = 30 * 60e3;

self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  // "reload": past the browser's HTTP cache, which could still hold the old site's index.html
  await c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })));
  // The page that registered this worker loaded its scripts, styles and events.json before the worker was there to see them: fetch them
  // now, or the very first visit would not work offline (a blank page) and the next load would still go to the network for the data.
  // Not fatal: the next load fills the cache anyway.
  try {
    const html = await (await c.match("index.html")).text();
    await c.addAll([...new Set([...html.matchAll(/(?:src|href)="(?:\.\/)?(assets\/[^"]+)"/g)].map(m => m[1]))]);
  } catch { /* offline or mid-deploy */ }
  await Promise.all(["events.json", "status.json"].map(u => data(new Request(new URL(u, location).href)).catch(() => {})));
  await self.skipWaiting();
})()));
// only the old site's cache by name: Cache Storage is per origin, and other projects on the same github.io origin keep theirs
self.addEventListener("activate", e => e.waitUntil(caches.delete("rac-events").then(() => self.clients.claim())));

async function data(req) {
  const c = await caches.open(CACHE), key = req.url.split("?")[0], hit = await c.match(key);
  if (hit && Date.now() - Number(hit.headers.get("x-sw-fetched") || 0) < FRESH) return hit;
  try {
    const r = await fetch(key, { cache: "no-cache" });
    if (!r.ok) return hit || r;
    const h = new Headers(r.headers); h.set("x-sw-fetched", String(Date.now()));
    await c.put(key, new Response(await r.clone().blob(), { status: r.status, statusText: r.statusText, headers: h }));
    return r;
  } catch (err) {
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  if (hit) return hit;
  const r = await fetch(req);
  if (r.ok) c.put(req, r.clone());
  return r;
}

async function networkFirst(req) {
  const c = await caches.open(CACHE), nav = req.mode === "navigate";
  const hit = await c.match(req) || (nav ? await c.match(req, { ignoreSearch: true }) : undefined);
  // "no-cache" revalidates with the server, so the browser's own HTTP cache can't hand back last week's index.html
  const net = fetch(nav ? req.url : req, { cache: "no-cache" }).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
  if (!hit) return net;
  // a slow connection gets the cached copy after 2.5 s; the network copy still lands in the cache for next time
  return Promise.race([net.catch(() => hit), new Promise(res => setTimeout(() => res(hit), 2500))]);
}

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(DATA.test(url.pathname) ? data(e.request) : url.pathname.includes("/assets/") ? cacheFirst(e.request) : networkFirst(e.request));
});
