/* ============================================================
   DisNotify — sw.js  (service worker)

   Handles two things:
     1. Offline app shell (cache-first for static assets)
     2. Web Push: receives the payload your backend sends and
        renders the OS notification.

   ── WHAT YOU STILL NEED TO DO ──────────────────────────────
   • Nothing here is a stub — this file is complete.
   • Your backend must send a JSON push payload shaped like:
       { title, body, url, tag, image }
     from backend/notifications/push.js.
   • Bump CACHE_VERSION whenever you ship new CSS/JS, otherwise
     returning users keep the old cached files.
   ============================================================ */

const CACHE_VERSION = 'disnotify-v1';
const SHELL = [
  'index.html', 'product.html', 'watchlist.html', 'alerts.html', 'settings.html', 'trends.html',
  'css/base.css', 'css/layout.css', 'css/components.css',
  'js/config.js', 'js/ui.js', 'js/api.js', 'js/layout.js', 'js/icons.js',
  'js/cards.js', 'js/store.js', 'js/chart.js', 'js/mock-data.js',
  'manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first for /api (prices must be fresh).
   Stale-while-revalidate for the shell: paint instantly from cache,
   then refresh the cache in the background so the NEXT load is current.
   This is why an edit sometimes needs two reloads to appear in dev —
   it is also why users never see a broken half-updated app. */
self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  if (request.url.includes('/api/')) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  e.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => cached || caches.match('index.html'));
      return cached || network;
    })
  );
});

/* ---------- Web Push ---------- */
self.addEventListener('push', (e) => {
  let data = { title: 'DisNotify', body: 'A price you watch has changed.' };
  try { data = { ...data, ...e.data.json() }; } catch { if (e.data) data.body = e.data.text(); }

  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'assets/icon-192.png',
    badge: 'assets/icon-192.png',
    image: data.image,
    tag: data.tag || 'disnotify-deal',
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || 'index.html' },
    actions: [
      { action: 'open', title: 'View deal' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || 'index.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const open = list.find(c => 'focus' in c);
      return open ? open.focus().then(c => c.navigate(url)) : self.clients.openWindow(url);
    })
  );
});
