const CACHE_NAME = 'xora-music-cache-v1';
const AUDIO_CACHE_NAME = 'xora-audio-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  // Add other critical assets here
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.endsWith('.mp3')) {
    event.respondWith(cacheAudioFirst(event.request));
  } else {
    event.respondWith(cacheAssetsFirst(event.request));
  }
});

function cacheAudioFirst(request) {
  return caches.open(AUDIO_CACHE_NAME).then((cache) => {
    return cache.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((networkResponse) => {
        cache.put(request, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function cacheAssetsFirst(request) {
  return caches.match(request)
    .then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok && !request.url.includes('chrome-extension')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      });
    });
}