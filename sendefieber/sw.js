// Sendefieber – Offline-Cache (Version bei jedem Release erhöhen)
const CACHE = 'sendefieber-v2';
const FILES = ['./', 'index.html', 'style.css', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'js/main.js', 'js/sim.js', 'js/gfx.js', 'js/data.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('sendefieber-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Netz zuerst, damit Updates ankommen; offline aus dem Cache
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
