/* খাতা service worker.

   Bump BUILD on every release. The old worker was cache-first over the app
   shell with a hardcoded cache name, which meant anyone who had installed the
   app would keep running the version they first loaded — a fix could ship and
   never reach them. The shell is now network-first: when there is a
   connection you always get the current code, and the cache is only a
   fallback, so offline still works exactly as before. */

const BUILD = '2026-08-24.1';
const CACHE = `khata-${BUILD}`;

const SHELL = [
  './', './index.html', './app.css', './fonts.css',
  './js/app.js', './js/vault.js', './js/calc.js',
  './manifest.webmanifest', './icon.svg',
  './icon-192.png', './icon-512.png', './icon-180.png',
  /* Precached, or the first offline launch would fall back to system fonts and
     the whole app would reflow. Fetched once, then never again — the filenames
     carry no hash, but the font files themselves never change. */
  './fonts/hind-400-bengali.woff2', './fonts/hind-600-bengali.woff2',
  './fonts/hind-400-latin.woff2', './fonts/hind-600-latin.woff2',
  './fonts/inter-400-latin.woff2', './fonts/inter-500-latin.woff2', './fonts/inter-600-latin.woff2',
  './fonts/hanken-600-latin.woff2', './fonts/hanken-700-latin.woff2',
  './fonts/jbmono-500-latin.woff2',
];

/* Files whose freshness matters. Anything else same-origin is cache-first. */
const isShell = url =>
  url.origin === location.origin &&
  (url.pathname.endsWith('/') || /\.(html|css|js|webmanifest)$/.test(url.pathname));

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      /* addAll would fetch through the browser HTTP cache, so a brand new
         BUILD could precache the very files it was bumped to replace. Each
         file is asked for directly instead, and one failure does not sink
         the rest. */
      .then(c => Promise.all(SHELL.map(u =>
        fetch(u, { cache: 'reload', credentials: 'same-origin' })
          .then(r => (r.ok ? c.put(u, r) : null))
          .catch(() => null))))
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
    /* `cache: 'reload'` matters more than it looks. Plain fetch(e.request)
       still consults the browser HTTP cache, and neither this server nor
       GitHub Pages sends no-cache on these files — so a released fix could sit
       behind a stale copy for minutes even though this branch is network-first
       and BUILD was bumped. This asks the network directly.

       The redirect mode is the other half, and it is not a nicety. Fetching by
       URL string follows redirects, so the answer comes back with .redirected
       true — and respondWith() treats a redirected response as a network error
       whenever the request did not ask to follow, which is every navigation
       the browser makes. The page then dies as a bare ERR_FAILED with the
       worker still installed and still intercepting, so reloading only repeats
       it. That is not hypothetical: pointing Pages at a custom domain made
       github.io answer 301, and every copy already installed on the old
       address went dark. Asking for the redirect rather than following it
       hands the browser an opaqueredirect, which it is allowed to follow on
       its own. Subresources may not be answered that way, so they keep
       following as before. */
    const net = fetch(url.href, {
      cache: 'reload',
      credentials: 'same-origin',
      redirect: e.request.mode === 'navigate' ? 'manual' : 'follow',
    });
    e.respondWith(net.catch(() => caches.match(e.request).then(hit => hit || Response.error())));
    /* The copy kept for offline has to be written under waitUntil. Left as a
       bare .then the browser is free to stop this worker the moment the
       response is handed over, and the write is dropped — which is how an
       offline launch could still show code from a release or two ago. */
    e.waitUntil(
      net.then(res => (res.ok ? caches.open(CACHE).then(c => c.put(e.request, res.clone())) : null))
        .catch(() => {})
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
