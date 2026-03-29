const CACHE = 'pacman-v7';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './src/main.js',
  './src/renderer.js',
  './src/maze.js',
  './src/pacman.js',
  './src/ghost.js',
  './src/ghosts/blinky.js',
  './src/ghosts/pinky.js',
  './src/ghosts/inky.js',
  './src/ghosts/clyde.js',
  './src/audio.js',
  './src/score.js',
  './src/input.js',
  './src/attract.js',
  './src/charselect.js',
  './src/fruit.js',
  './src/intermission.js',
  './src/skinstorage.js',
  './src/customskin.js',
  './src/skinedit.js',
  './src/hiscore.js',
  './src/bonusgame.js',
  './src/config.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
