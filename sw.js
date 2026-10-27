// Sube este número en cada actualización para que los móviles avisen de la nueva versión.
const VERSION = 'v2';
const CACHE = 'lotr-todo-' + VERSION;
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    // Migración desde la primera versión (que no tenía aviso): activar de inmediato.
    if (await caches.has('lotr-todo-v1')) self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k !== CACHE && k.startsWith('lotr-todo-')) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  e.respondWith(
    caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(res => {
      const same = new URL(r.url).origin === location.origin;
      if (res.ok && (same || r.url.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(r, copy));
      }
      return res;
    }).catch(() => r.mode === 'navigate' ? caches.match('./index.html') : undefined))
  );
});
