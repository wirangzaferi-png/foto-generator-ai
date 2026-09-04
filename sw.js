/* ================= SERVICE WORKER — VERRY WIRANZA AI ================= */
/* Naikkan versi ini setiap kali ada update besar di index.html/manifest/icon,
   supaya cache lama otomatis dibersihkan dan pengguna dapat versi terbaru. */
const CACHE_VERSION = 'v18';
const CACHE_NAME = `wiranza-ai-${CACHE_VERSION}`;

/* App shell minimal — semua yang dibutuhkan agar app tetap bisa dibuka saat offline. */
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png'
];

/* ================= INSTALL ================= */
/* Simpan app shell ke cache saat SW pertama kali di-install. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.error('SW install gagal cache app shell:', err))
  );
  self.skipWaiting(); // langsung aktifkan SW baru tanpa nunggu tab lama ditutup
});

/* ================= ACTIVATE ================= */
/* Bersihkan cache versi lama supaya tidak menumpuk. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('wiranza-ai-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // ambil alih kontrol tab yang sudah terbuka
});

/* ================= FETCH ================= */
/* Strategi: network-first untuk halaman utama (biar update terbaru selalu diprioritaskan),
   cache-first untuk asset statis (icon/manifest), fallback ke cache kalau offline. */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya tangani GET request dari origin sendiri. Request lain (misal API AI ke luar) dibiarkan lewat langsung.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  const isHTMLPage = req.mode === 'navigate' || req.destination === 'document';

  if (isHTMLPage) {
    // Network-first: coba ambil versi terbaru dulu, kalau gagal (offline) baru pakai cache.
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

  // Cache-first untuk asset statis lain (manifest, icon, font, dll).
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return res;
        })
        .catch(() => cached); // kalau offline dan tidak ada di cache, biarkan gagal secara natural
    })
  );
});
