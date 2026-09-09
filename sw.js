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
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const acceptHeader = event.request.headers.get("accept") || "";
  const isHTML = event.request.mode === "navigate" || acceptHeader.includes("text/html");

  if (isHTML) {
    // Network-first untuk halaman utama: selalu ambil versi TERBARU selama online.
    // Cache cuma dipakai sebagai cadangan kalau sedang offline / server tidak bisa dihubungi.
    // Dengan cara ini, CACHE_NAME di atas tidak perlu diubah setiap kali upload file baru.
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => cached || caches.match("./index.html"));
        })
    );
    return;
  }

  // Untuk asset lain (manifest, icon, dll) tetap cache-first supaya hemat kuota & tetap cepat.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {

            if (
              response &&
              response.status === 200 &&
              response.type !== "opaque"
            ) {

              const responseClone = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }

            return response;
          })
          .catch(() => {
            return caches.match("./index.html");
          });
      })
  );
});
