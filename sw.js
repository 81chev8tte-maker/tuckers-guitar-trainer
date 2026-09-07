const CACHE = 'family-music-quest-v2.6.9';
const CORE = [
  './',
  './index.html',
  './styles.css?v=2.6.9',
  './piano.css?v=2.6.9',
  './piano-songbook.css?v=2.6.9',
  './profiles.css?v=2.6.9',
  './diagnostics.css?v=2.6.9',
  './diagnostics-layer.css?v=2.6.9',
  './profiles.js?v=2.6.9',
  './practice-tools.js?v=2.6.9',
  './practice-intelligence.js?v=2.6.9',
  './hardware-services.js?v=2.6.9',
  './gameplay-rules.js?v=2.6.9',
  './guitar-songbook.js?v=2.6.9',
  './app.js?v=2.6.9',
  './piano-songbook.js?v=2.6.9',
  './piano-lessons.js?v=2.6.9',
  './midi-analysis.js?v=2.6.9',
  './piano.js?v=2.6.9',
  './diagnostics.js?v=2.6.9',
  './guided-hardware-acceptance.js?v=2.6.9',
  './manifest.webmanifest?v=2.6.9',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/@coderline/alphatab@1.8.4/dist/alphaTab.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => Promise.all(CORE.map(url => cache.add(url).catch(() => null))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(async () => {
        return (await caches.match(event.request)) || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
