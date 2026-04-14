const CACHE_NAME = "product-finder-pro-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.PNG"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req).catch(() => caches.match("./index.html")))
    );
    return;
  }

  if (url.hostname.includes("google.com") || url.hostname.includes("googleusercontent.com")) {
    event.respondWith(fetch(req).catch(() => caches.match("./index.html")));
  }
});