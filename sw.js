// Service worker: зберігає Сонях на телефоні, щоб він працював без інтернету.
// Після будь-яких змін у файлах збільш номер версії, щоб телефони підтягнули оновлення.
const VERSION = 'sonyakh-v21';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './data/news.json',
  './data/thanks.json',
  './data/tips.json',
  './data/regions.json',
  './data/outages.json'
];
const FONTS = 'sonyakh-fonts';

self.addEventListener('install', (event) => {
  // cache: 'reload' — беремо файли свіжими з сервера, а не старі копії з кешу браузера
  // (GitHub Pages дозволяє браузеру 10 хвилин тримати старі версії)
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Шрифти Google: беремо збережені, у фоні оновлюємо
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(async (cache) => {
        const cached = await cache.match(request);
        const fresh = fetch(request).then((res) => { cache.put(request, res.clone()); return res; }).catch(() => cached);
        return cached || fresh;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Новини і подяки: спершу свіжі з мережі, без мережі останні збережені
  if (url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Усе інше: спершу збережене, щоб відкривалося миттєво і офлайн
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) =>
      cached || fetch(request).catch(() => caches.match('./index.html'))
    )
  );
});
