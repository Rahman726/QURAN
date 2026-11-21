/* Quran Pak service worker — caches the whole reader (all surahs, translations,
   fonts) plus recitation audio as it is played, so it keeps working offline. */

var SHELL_CACHE = 'quranpak-shell-v2';
var FONT_CACHE = 'quranpak-fonts-v1';
var AUDIO_CACHE = 'quranpak-audio-v1';
var AUDIO_LIMIT = 600; // ayah audio files kept on the device
var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Inter:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600&display=swap';

var SHELL = [
  './',
  './index.html',
  './css/style.css?v=4',
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

function surahUrls() {
  var urls = [];
  for (var n = 1; n <= 114; n++) {
    urls.push('./data/surahs/' + String(n).padStart(3, '0') + '.json');
  }
  return urls;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise(function (_, reject) {
      setTimeout(function () { reject(new Error('timeout')); }, ms);
    })
  ]);
}

function addAllSafely(cache, urls) {
  return Promise.all(urls.map(function (url) {
    // One slow or missing file must never block the offline install.
    return withTimeout(cache.add(url), 15000).catch(function () {});
  }));
}

function precacheFonts() {
  return caches.open(FONT_CACHE).then(function (cache) {
    return withTimeout(fetch(FONT_CSS), 10000).then(function (response) {
      if (!response.ok) return null;
      var copy = response.clone();
      return copy.text().then(function (css) {
        var matches = css.match(/https:\/\/fonts\.gstatic\.com\/[^)"']+\.woff2/g) || [];
        return cache.put(FONT_CSS, response).then(function () {
          return Promise.all(matches.map(function (url) {
            return withTimeout(cache.add(url), 10000).catch(function () {});
          }));
        });
      });
    }).catch(function () {});
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return addAllSafely(cache, SHELL)
        .then(function () { return addAllSafely(cache, surahUrls()); })
        .then(precacheFonts);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key === SHELL_CACHE || key === FONT_CACHE || key === AUDIO_CACHE) return null;
        return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Keep the audio cache from growing without limit: oldest files go first. */
function trimAudioCache(cache) {
  return cache.keys().then(function (keys) {
    if (keys.length <= AUDIO_LIMIT) return null;
    var extra = keys.length - AUDIO_LIMIT;
    return Promise.all(keys.slice(0, extra).map(function (key) {
      return cache.delete(key);
    }));
  });
}

function cacheAudio(request, response) {
  if (!response || (!response.ok && response.type !== 'opaque')) return response;
  var copy = response.clone();
  caches.open(AUDIO_CACHE).then(function (cache) {
    cache.put(request, copy).then(function () { return trimAudioCache(cache); }).catch(function () {});
  }).catch(function () {});
  return response;
}

function cacheShell(request, response) {
  if (!response || !response.ok || response.type !== 'basic') return response;
  var copy = response.clone();
  caches.open(SHELL_CACHE).then(function (cache) { cache.put(request, copy); }).catch(function () {});
  return response;
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url = new URL(request.url);
  if (url.pathname.slice(-6) === '/sw.js') return;

  // Page loads: fresh copy when online, cached app when not.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        cacheShell('./index.html', response.clone());
        return response;
      }).catch(function () {
        return caches.match('./index.html', { ignoreSearch: true }).then(function (cached) {
          return cached || caches.match('./');
        });
      })
    );
    return;
  }

  // Recitation and translation audio: play from the device when saved.
  if (url.hostname === 'cdn.islamic.network') {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(function (cache) {
        return cache.match(request, { ignoreSearch: true }).then(function (cached) {
          if (cached) return cached;
          // Media requests ask for byte ranges; fetch the whole file so it can be stored.
          var full = new Request(request.url, { mode: 'no-cors', credentials: 'omit' });
          return fetch(full).then(function (response) {
            return cacheAudio(full, response);
          }).catch(function () {
            return fetch(request);
          });
        });
      })
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then(function (cache) {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return fetch(request).then(function (response) {
            var copy = response.clone();
            cache.put(request, copy).catch(function () {});
            return response;
          }).catch(function () { return cached; });
        });
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Quran text and translations: cached copies answer instantly, network refreshes.
  if (url.pathname.indexOf('/data/') !== -1) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then(function (cached) {
        var network = fetch(request).then(function (response) {
          return cacheShell(request, response);
        }).catch(function () { return cached; });
        return cached || network;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then(function (response) {
      return cacheShell(request, response);
    }).catch(function () {
      return caches.match(request, { ignoreSearch: true });
    })
  );
});
