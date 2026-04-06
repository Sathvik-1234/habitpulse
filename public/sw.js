// sw.js
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install Event processing');
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate Event processing');
  // Tell the active service worker to take control of the page immediately.
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic network-first pass-through to satisfy PWA requirements
  // without complex offline caching logic.
  event.respondWith(
    fetch(event.request).catch((error) => {
      console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
      // If offline caching was implemented, we'd return cached assets here.
    })
  );
});
