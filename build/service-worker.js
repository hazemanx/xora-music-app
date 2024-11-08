const CACHE_NAME = 'xora-music-cache-v2';
const AUDIO_CACHE_NAME = 'xora-audio-cache-v2';
const PLAYLIST_CACHE_NAME = 'xora-playlist-cache-v1';
const DB_NAME = 'xora-offline-db';
const STORE_NAME = 'audio-metadata';

// Expanded assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.chunk.css',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
  '/icons/offline-icon.png'
];

// Install event - cache static assets and create IndexedDB
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then(cache => cache.addAll(STATIC_ASSETS)),
      initializeDB()
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && 
                          name !== AUDIO_CACHE_NAME && 
                          name !== PLAYLIST_CACHE_NAME)
            .map(name => caches.delete(name))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Enhanced fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle audio files
  if (event.request.url.endsWith('.mp3')) {
    event.respondWith(handleAudioFetch(event.request));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(event.request));
    return;
  }

  // Handle playlist requests
  if (url.pathname.includes('/playlists/')) {
    event.respondWith(handlePlaylistRequest(event.request));
    return;
  }

  // Default static asset handling
  event.respondWith(handleStaticAsset(event.request));
});

// Enhanced audio fetching with progressive enhancement
async function handleAudioFetch(request) {
  try {
    // Check IndexedDB first for metadata
    const metadata = await getAudioMetadata(request.url);
    
    // Check cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Update metadata if needed
      if (metadata) {
        cachedResponse.headers.set('X-Audio-Metadata', JSON.stringify(metadata));
      }
      return cachedResponse;
    }

    // Fetch from network
    const response = await fetch(request);
    const cache = await caches.open(AUDIO_CACHE_NAME);
    
    // Clone response for processing
    const responseToCache = response.clone();
    
    // Process audio data if needed
    if (response.ok) {
      const audioData = await response.arrayBuffer();
      // Store in IndexedDB
      await storeAudioMetadata(request.url, {
        size: audioData.byteLength,
        timestamp: Date.now(),
        type: response.headers.get('content-type')
      });
      
      // Cache processed response
      await cache.put(request, new Response(audioData, {
        status: 200,
        headers: response.headers
      }));
    }

    return responseToCache;
  } catch (error) {
    console.error('Audio fetch failed:', error);
    return caches.match('/offline.html');
  }
}

// Enhanced API request handling
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PLAYLIST_CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }
    throw new Error('API request failed');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(
      JSON.stringify({ error: 'Offline Mode - Data Unavailable' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Playlist handling
async function handlePlaylistRequest(request) {
  try {
    const cache = await caches.open(PLAYLIST_CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Return cached playlist if offline
    if (!navigator.onLine && cachedResponse) {
      return cachedResponse;
    }

    // Fetch fresh playlist
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
      return response;
    }
    
    // Fallback to cached version
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error('Playlist unavailable');
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Playlist Unavailable Offline' }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Static asset handling
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    if (response.ok && !request.url.includes('chrome-extension')) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
      return response;
    }
    return response;
  } catch (error) {
    return caches.match('/offline.html');
  }
}

// IndexedDB initialization
async function initializeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      }
    };
  });
}

// Audio metadata storage
async function storeAudioMetadata(url, metadata) {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({ url, ...metadata });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Audio metadata retrieval
async function getAudioMetadata(url) {
  const db = await initializeDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(url);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Background sync registration
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-playlists') {
    event.waitUntil(syncPlaylists());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('XORA Music Update', options)
  );
});