// 인터넷 없이도 열리도록 파일을 저장해 둔다. 인터넷이 되면 항상 새 버전을 먼저 받는다.
const CACHE = 'undong-v8';
const FILES = ['./', './index.html', './core.js', './manifest.json'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('fetch', e => {
  e.respondWith(
    // 휴대폰에 남은 예전 파일 대신 항상 서버에 새 버전이 있는지 확인
    fetch(e.request, { cache: 'no-cache' })
      .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request))
  );
});
