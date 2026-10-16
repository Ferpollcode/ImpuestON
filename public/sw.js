const CACHE = 'impueston-v18';
const ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/impueston-logo.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => event.waitUntil(
  caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(r => r || caches.match('/'))));
});

self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'Vencimiento de hoy', {
    body: data.body || 'Tenés una obligación que vence hoy y no figura como pagada.',
    icon: '/impueston-icon.png', badge: '/impueston-icon.png', tag: data.tag || 'vencimiento-hoy',
    data: { url: data.url || '/?view=vencimientos&filter=hoy' },
    requireInteraction: true, vibrate: [180, 80, 180]
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
