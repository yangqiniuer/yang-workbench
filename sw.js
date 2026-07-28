const CACHE_NAME = 'daily-plan-v13';
const ASSETS = [
  './',
  './index.html',
  './pc.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 只对同源请求做缓存处理；外部信源链接（新华网、东方财富等）直接走网络
  if (url.origin !== self.location.origin) return;

  // HTML / 导航请求：网络优先，保证每天更新的内容及时生效；离线时回退缓存
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // 其他静态资源：缓存优先，加载更快
  event.respondWith(
    caches.match(req).then((r) => r || fetch(req))
  );
});
