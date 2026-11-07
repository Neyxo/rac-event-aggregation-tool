// App shell: serve from cache, refresh in the background. Events: network first, cache as offline fallback.
// No version bumps needed: every successful fetch updates the cache.
const CACHE = "rac-events";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  const refresh = caches.open(CACHE).then(c => fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }));
  if (url.pathname.endsWith("events.json")) {
    e.respondWith(refresh.catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || refresh).then(r => { refresh.catch(() => {}); return r; }));
  }
});
