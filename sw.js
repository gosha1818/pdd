// Офлайн-кэш: основные файлы сразу, картинки — по мере просмотра (и фоном докачиваются).
const CACHE = 'pdd24-v1';
const CORE = ['./', './index.html', './questions.js', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
    // докачать все картинки в фоне, чтобы работало без интернета
    try {
      const c = await caches.open(CACHE);
      const txt = await (await c.match('./questions.js')).text();
      const imgs = [...new Set([...txt.matchAll(/"img":"([^"]+)"/g)].map(m => './images/' + m[1]))];
      for (const u of imgs) { if (!(await c.match(u))) { try { await c.add(u); } catch (_) {} } }
    } catch (_) {}
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && new URL(e.request.url).origin === location.origin) { const cl = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
    return r;
  })));
});
