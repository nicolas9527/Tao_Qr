const CACHE_NAME = "qr-tool-ios-pwa-v3";

// Cache các file local (same-origin). KHÔNG cache CDN ở đây để tránh lỗi addAll.
const CORE = [
  "./",
  "./index.html",
  "./manifest.json",     // bạn đang dùng manifest.json -> sửa đúng tên
  "./sw.js",
  "./icon.PNG"
];

// Cài đặt: cache core
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE))
  );
  self.skipWaiting();
});

// Kích hoạt: xoá cache cũ
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const req = event.request;
  const url = new URL(req.url);

  // Chỉ xử lý same-origin (file của bạn)
  if (url.origin !== self.location.origin) {
    return; // để CDN chạy thẳng network
  }

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html") ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith("/index.html");

  // 1) HTML: NETWORK-FIRST để luôn cập nhật
  if (isHTML) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match("./index.html")))
    );
    return;
  }

  // 2) File tĩnh: CACHE-FIRST (nhanh + offline)
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});