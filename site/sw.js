// Network first for everything on this origin, the cache only as the offline (or slow-network) fallback.
// Every successful fetch refreshes the cache, so a new deploy shows on the next load: no versions, no "new version" prompt, no hard refresh.
const CACHE = "rac-events";
const SHELL = ["./", "index.html", "discover.html", "calendar.html", "event.html", "club.html", "about.html", "about-more.html", "family.html", "public.html", "settings.html", "subscribe.html", "app.css", "i18n.js", "common.js", "app.js", "calendar.js", "manifest.webmanifest", "icon.svg", "rotaract.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

async function networkFirst(req) {
  const c = await caches.open(CACHE), hit = await c.match(req);
  // "no-cache" revalidates with the server, so the browser's own HTTP cache can't hand back last week's app.css
  const net = fetch(req.mode === "navigate" ? req.url : req, { cache: "no-cache" }).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
  if (!hit) return net;
  // a slow connection gets the cached copy after 2.5 s; the network copy still lands in the cache for next time
  return Promise.race([net.catch(() => hit), new Promise(res => setTimeout(() => res(hit), 2500))]);
}

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(networkFirst(e.request));
});
