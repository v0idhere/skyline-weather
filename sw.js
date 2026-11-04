// Network first for everything (so updates show right away); when offline, falls back to
// the last saved copy of the app and of the weather data.
const SHELL = "skyline-shell-v1";
const DATA = "skyline-data-v1";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-192.png", "icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;

  if (url.hostname.endsWith("open-meteo.com") || url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          if (res.ok) caches.open(url.origin === location.origin ? SHELL : DATA).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
