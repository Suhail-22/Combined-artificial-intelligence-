self.addEventListener('install', (e) => {
  // Force the waiting service worker to become the active service worker.
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Tell the active service worker to take control of the page immediately.
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  // Pass through to network - do not cache to avoid TSX compilation issues
  e.respondWith(fetch(e.request));
});