'use strict';

const CACHE = 'alaska-v1';

// Static shell — precached on install
const PRECACHE = [
  '/',
  '/css/styles.css',
  '/js/data.js',
  '/js/app.js',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // API + Socket.io: always network, never cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io/')) return;

  // Same-origin static assets: stale-while-revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE).then(async cache => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then(res => {
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        }).catch(() => null);
        return cached ?? (await networkFetch);
      })
    );
    return;
  }

  // External (Google Fonts, Tabler CDN, Unsplash): cache-first
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      } catch {
        return Response.error();
      }
    })
  );
});
