// Dimbadimba Game - Service Worker

// Increment this version number whenever you make significant changes
const CACHE_VERSION = 3;
const CACHE_NAME = `dimbadimba-game-v${CACHE_VERSION}`;

// Assets to cache on install
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-16x16.png',
  './icons/icon-32x32.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-192x192.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './images/dimbadimba.png'
];

// Critical assets that should always be fetched from network first
const NETWORK_FIRST_ASSETS = [
  './index.html',
  './style.css',
  './script.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log(`Service Worker installing (v${CACHE_VERSION})`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching game assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting()) // Force activation on all clients
  );
});

// Activate event - clean old caches and take control immediately
self.addEventListener('activate', event => {
  console.log(`Service Worker activating (v${CACHE_VERSION})`);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('Service worker now controls all clients');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - Use different strategies based on the asset type
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const pathname = requestUrl.pathname;
  
  // For same-origin requests only
  if (requestUrl.origin === self.location.origin) {
    
    // Check if this is a critical asset that should be network-first
    const isNetworkFirstAsset = NETWORK_FIRST_ASSETS.some(asset => {
      // Convert both to relative paths for comparison
      const assetPath = new URL(asset, self.location.origin).pathname;
      return pathname === assetPath || pathname === '/' || pathname === '/index.html';
    });
    
    if (isNetworkFirstAsset) {
      // Use network-first strategy for critical assets
      event.respondWith(networkFirstStrategy(event.request));
    } else {
      // Use cache-first strategy for other assets
      event.respondWith(cacheFirstStrategy(event.request));
    }
  }
});

// Network-first strategy: try network, fall back to cache
function networkFirstStrategy(request) {
  return fetch(request)
    .then(response => {
      // Cache the updated version
      const responseToCache = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(request, responseToCache);
      });
      return response;
    })
    .catch(() => {
      console.log('Network request failed, falling back to cache', request.url);
      return caches.match(request);
    });
}

// Cache-first strategy: try cache, fall back to network
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then(response => {
      // Return cached response if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetchAndCache(request);
    });
}

// Helper function to fetch and cache resources
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // Cache new successful responses
      if (response.status === 200 && response.type === 'basic') {
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(request, responseToCache);
          });
      }
      return response;
    });
}

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service worker skipping waiting phase');
    self.skipWaiting();
  }
});

// Send message to clients when an update is found
self.addEventListener('updatefound', event => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'UPDATE_FOUND',
        version: CACHE_VERSION
      });
    });
  });
}); 