/* Quran Pak service worker — keeps the reader usable offline once installed. */

var CACHE = 'quranpak-v1';
var SHELL = [
  './',
  './index.html',
  './css/style.css?v=3',
  './js/app.js',
  './js/firebase-config.js',
  './manifest.webmanifest',
  './assets/favicon.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/reciters/alafasy.jpg',
  './assets/reciters/abdulbasit.jpg',
  './assets/reciters/husary.png',
  './assets/reciters/minshawi.jpg',
  './assets/reciters/sudais.jpg',
  './data/surahs.json'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { /* optional asset missing */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        return key === CACHE ? null : caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function cachePut(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  var copy = response.clone();
  caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
  return response;
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  // Audio and fonts come from other origins — never cache those.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.slice(-6) === '/sw.js') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        cachePut('./index.html', response.clone());
        return response;
      }).catch(function () {
        return caches.match('./index.html', { ignoreSearch: true }).then(function (cached) {
          return cached || caches.match('./');
        });
      })
    );
    return;
  }

  // Quran JSON is large and rarely changes: serve cached first, refresh behind.
  if (url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(request).then(function (response) {
          return cachePut(request, response);
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then(function (response) {
      return cachePut(request, response);
    }).catch(function () {
      return caches.match(request, { ignoreSearch: true });
    })
  );
});
