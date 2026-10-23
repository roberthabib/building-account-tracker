const CACHE_NAME = "building-account-tracker-v191";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/styles.css",
  "./src/app.js",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./data/seed.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Only cache same-origin app-shell requests. Cross-origin calls (Supabase
  // REST/Auth, Google Apps Script, Drive) must always hit the network so we
  // never serve stale database reads or pollute the cache.
  if (new URL(event.request.url).origin !== self.location.origin) return;
  // Help videos are large and only fetched on demand: never cache them (and
  // let the browser handle their range requests directly).
  if (new URL(event.request.url).pathname.includes("/videos/")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});

// Phone notifications (see api/push.js). Payload: { title, body, url }.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(
    self.registration.showNotification(data.title || "Building Account Tracker", {
      body: data.body || "",
      icon: "./assets/icon-192.png",
      badge: "./assets/icon-192.png",
      vibrate: [180, 80, 180],
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      requireInteraction: false,
      silent: false,
      timestamp: Date.now(),
      data: { url: data.url || "./" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open && new URL(target).search && "navigate" in open) return open.navigate(target).then((w) => (w || open).focus()).catch(() => open.focus());
      if (open) return open.focus();
      return self.clients.openWindow(target);
    }),
  );
});
