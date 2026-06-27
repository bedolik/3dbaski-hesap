// Sürümü her güncellemede elle artır (v3 → v4 …); eski cache otomatik geçersiz olur.
const CACHE_NAME = '3d-print-calculator-v3';
const ASSETS = [
  '.',
  'index.html',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // yeni SW beklemeden devreye girsin
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // açık sekmeleri hemen kontrol et
  );
});

// Network-first: önce ağdan en güncel sürümü çek, başarısızsa (offline) cache'ten ver.
self.addEventListener('fetch', event => {
  const req = event.request;

  // Yalnızca GET ve aynı origin'deki uygulama dosyalarını yönet; gerisi normal aksın.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(response => {
        // Güncel yanıtı cache'e yaz (sonraki offline kullanım için).
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(req).then(cached => cached || caches.match('index.html')))
  );
});
