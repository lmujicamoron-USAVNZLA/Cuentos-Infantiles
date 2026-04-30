const CACHE_NAME = 'story-creator-kids-v30';
const ASSETS = [
  'index.html',
  'dashboard.html',
  'style.css',
  'magic-v22.css',
  'logic-v22.js',
  'dashboard-logic.js',
  'firebase-init.js',
  'safety.js',
  'mascot.js',
  'assets/images/HistoryCreatorKids.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
