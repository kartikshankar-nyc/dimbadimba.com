// Dimbadimba Game - Service Worker

const CACHE_NAME = 'dimbadimba-game-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/favicon-16.png',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching game assets');
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
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
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', event => {
  // Strip query parameters for cache matching
  const requestUrl = new URL(event.request.url);
  const cacheKey = requestUrl.origin + requestUrl.pathname;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If exact match found, return it
        if (response) {
          return response;
        }
        
        // Check if a version without query params is in cache
        if (requestUrl.search) {
          return caches.match(cacheKey)
            .then(strippedResponse => {
              // Return cached version without query or fetch from network
              return strippedResponse || fetchAndCache(event.request);
            });
        }
        
        // Fetch and cache if not found
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Fallback for game assets
        if (event.request.url.includes('/game/')) {
          return caches.match('/index.html');
        }
      })
  );
});

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
            
            // Also cache a version without query params
            const requestUrl = new URL(request.url);
            if (requestUrl.search) {
              const strippedUrl = requestUrl.origin + requestUrl.pathname;
              cache.put(new Request(strippedUrl), response.clone());
            }
          });
      }
      return response;
    });
} 