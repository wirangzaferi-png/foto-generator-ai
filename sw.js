/* ===== WIRANZA AI — Service Worker ===== */
/* Cache-first untuk aset statis, network-first untuk halaman utama.
   Naikkan CACHE_VERSION setiap kali kamu update index.html/manifest/icon
   supaya pengguna lama otomatis dapat versi terbaru. */

const CACHE_VERSION = 'wiranza-ai-v17';
const CACHE_NAME = `${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ---------- INSTALL: precache aset inti ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch((err) => {
        // Jangan sampai gagal precache satu file mem-block seluruh install.
        console.warn('[SW] precache gagal sebagian:', err);
      })
      .then(() => self.skipWaiting())
  );
});

/* ---------- ACTIVATE: bersihkan cache versi lama ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya tangani GET; biarkan request lain (POST ke API AI, dll) lewat langsung ke network.
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Jangan cache request lintas-origin (mis. panggilan ke API Gemini/Claude).
  if (url.origin !== self.location.origin) return;

  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    // Network-first untuk dokumen HTML, supaya update selalu didahulukan saat online,
    // dan tetap bisa dibuka saat offline lewat cache.
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first untuk aset statis (icon, manifest, font, dll).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
