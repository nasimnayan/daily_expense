/* খাতা service worker.

   Bump BUILD on every release. The old worker was cache-first over the app
   shell with a hardcoded cache name, which meant anyone who had installed the
   app would keep running the version they first loaded — a fix could ship and
   never reach them. The shell is now network-first: when there is a
   connection you always get the current code, and the cache is only a
   fallback, so offline still works exactly as before. */

const BUILD = '2026-07-28.2';
const CACHE = `khata-${BUILD}`;

const SHELL = [
  './', './index.html', './app.css',
  './js/app.js', './js/vault.js', './js/calc.js',
  './manifest.webmanifest', './icon.svg',
];

/* Files whose freshness matters. Anything else same-origin is cache-first. */
const isShell = url =>
  url.origin === location.origin &&
  (url.pathname.endsWith('/') || /\.(html|css|js|webmanifest)$/.test(url.pathname));

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())   // a single 404 must not block install
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname === 'api.github.com') return;   // sync calls: never cached, never intercepted
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;      // let anything third-party go straight out

  if (isShell(url)) {
    e.respondWith(
      /* `cache: 'reload'` matters more than it looks. Plain fetch(e.request)
         still consults the browser HTTP cache, and neither this server nor
         GitHub Pages sends no-cache on these files — so a released fix could
         sit behind a stale copy for minutes even though this branch is
         network-first and BUILD was bumped. This asks the network directly. */
      fetch(url.href, { cache: 'reload', credentials: 'same-origin' })
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || Response.error()))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    }))
  );
});
