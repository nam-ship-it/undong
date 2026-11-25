// 인터넷 없이도 열리도록 파일을 저장해 둔다. 인터넷이 되면 항상 새 버전을 먼저 받는다.
const CACHE = 'undong-v1';
const FILES = ['./', './index.html', './core.js', './manifest.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
