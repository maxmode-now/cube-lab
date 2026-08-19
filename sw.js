const STATIC = 'cube-static-v1.9';
const RUNTIME = 'cube-runtime-v1.9';

const PRECACHE = [
  './index.html',
  './manifest.json',
  './cube-solver.js',
  './beginner-solver.js',
  './cube-math.js',
  './cube-engine.js',
  './cube-timer.js',
  './cube-scan.js',
  './lessons.js',
  './f2l-cases.js',
  './oll-cases-data.js',
  './oll-cases.js',
  './pll-cases-data.js',
  './pll-cases.js',
  './solver-worker.js',
  './vendor/cube.js',
  './vendor/solve.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];

function isCdn(url) {
  return url.hostname === 'unpkg.com'
    || url.hostname.endsWith('.unpkg.com')
    || url.hostname === 'cdn.jsdelivr.net'
    || url.hostname.endsWith('.jsdelivr.net');
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== STATIC && k !== RUNTIME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok) {
          const cache = await caches.open(STATIC);
          const path = url.pathname;
          if (path === '/' || path === '/index.html') cache.put('./index.html', res.clone());
          else cache.put(req, res.clone());
        }
        return res;
      } catch (e) {
        const hit = await caches.match(req);
        if (hit) return hit;
        const path = url.pathname;
        if (path === '/' || path === '/index.html') {
          return caches.match('./index.html');
        }
        return Response.error();
      }
    })());
    return;
  }

  const local = url.origin === self.location.origin;
  if (!local && !isCdn(url)) return;

  event.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        if (!res.ok) return res;
        const copy = res.clone();
        caches.open(local ? STATIC : RUNTIME).then(cache => cache.put(req, copy));
        return res;
      });
    })
  );
});
