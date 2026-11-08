// App shell: serve from cache, refresh in the background and tell the page when the shell changed.
// Events: network first, cache as offline fallback. No version bumps needed: every successful fetch updates the cache.
const CACHE = "rac-events";
const SHELL = ["./", "index.html", "discover.html", "calendar.html", "event.html", "club.html", "about.html", "settings.html", "subscribe.html", "app.css", "i18n.js", "common.js", "app.js", "calendar.js", "manifest.webmanifest", "icon.svg", "rotaract.svg", "icon-192.png", "icon-512.png"];
const SHELL_FILES = /\/(index\.html|discover\.html|calendar\.html|event\.html|club\.html|about\.html|settings\.html|app\.css|i18n\.js|common\.js|app\.js|calendar\.js)?$/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

async function refresh(req, notify) {
  const c = await caches.open(CACHE), old = await c.match(req);
  const r = await fetch(req);
  if (r.ok) {
    await c.put(req, r.clone());
    const tag = x => x && (x.headers.get("etag") || x.headers.get("last-modified"));
    if (notify && old && tag(old) && tag(old) !== tag(r)) {
      for (const client of await self.clients.matchAll()) client.postMessage({ type: "updated" });
    }
  }
  return r;
}

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.endsWith("events.json") || url.pathname.endsWith("status.json")) {
    e.respondWith(refresh(e.request, false).catch(() => caches.match(e.request)));
  } else {
    const shell = SHELL_FILES.test(url.pathname);
    e.respondWith(caches.match(e.request).then(hit => {
      const net = refresh(e.request, shell).catch(() => hit);
      return hit || net;
    }));
  }
});
