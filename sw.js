const CACHE_NAME = "wiranza-ai-cache";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

// Strategi NETWORK-FIRST: selalu coba ambil versi terbaru dari server dulu.
// Cache cuma dipakai sebagai cadangan kalau benar-benar offline/network gagal.
// Dengan begini, tidak perlu lagi menaikkan nomor versi CACHE_NAME setiap update —
// versi terbaru otomatis terpakai selama perangkat online.
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (
          response &&
          response.status === 200 &&
          response.type !== "opaque"
        ) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          return cachedResponse || caches.match("./index.html");
        });
      })
  );
});
