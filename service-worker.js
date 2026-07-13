/**
 * Dimbadimba Game Service Worker
 * Handles caching and offline functionality
 */

const CACHE_VERSION = 2;
const DEPLOY_TIMESTAMP = '1783960037032';
const CACHE_NAME = `dimbadimba-cache-v${CACHE_VERSION}-${DEPLOY_TIMESTAMP}`;

// Debug logging - shows in the service worker console in the browser
const DEBUG = true;
function swLog(message, ...args) {
  if (DEBUG) {
    console.log(`[Service Worker ${CACHE_VERSION}:${DEPLOY_TIMESTAMP}] ${message}`, ...args);
  }
}

// Assets to cache initially (these will be supplemented by the asset manifest)
const ASSETS = [
  './character-display.css',
  './enhancements.css',
  './icons/icon-128x128.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/icon-16x16.png',
  './icons/icon-192x192.png',
  './icons/icon-32x32.png',
  './icons/icon-384x384.png',
  './icons/icon-512x512.png',
  './icons/icon-72x72.png',
  './icons/icon-96x96.png',
  './images/dimbadimba.png',
  './index.html',
  './manifest.json',
  './script.js',
  './service-worker.js',
  './style.css'
];

// Install event - cache all needed assets
self.addEventListener('install', event => {
  swLog('Service worker installing...');
  
  // Load assets from the asset manifest if available
  event.waitUntil(
    fetch('./asset-manifest.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load asset manifest');
        }
        return response.json();
      })
      .then(manifest => {
        swLog(`Loaded asset manifest with ${Object.keys(manifest).length} entries`);
        
        // Get the hashed filenames for caching
        const hashedAssets = Object.values(manifest).map(path => `./${path}`);
        const allAssets = [...ASSETS, ...hashedAssets];
        
        swLog(`Caching ${allAssets.length} assets`);
        
        // Now open the cache and add all assets
        return caches.open(CACHE_NAME)
          .then(cache => {
            return cache.addAll(allAssets);
          });
      })
      .catch(error => {
        swLog('Error during installation:', error);
        
        // Fallback to just caching the basic assets if manifest is unavailable
        return caches.open(CACHE_NAME)
          .then(cache => {
            swLog('Falling back to basic asset caching');
            return cache.addAll(ASSETS);
          });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    swLog('Skip waiting message received, activating immediately');
    self.skipWaiting();
  }
});

// Instead, send update notifications when activated
self.addEventListener('activate', event => {
  swLog(`Activating service worker (v${CACHE_VERSION}, ${DEPLOY_TIMESTAMP})`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      swLog('Existing caches:', cacheNames);
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            swLog('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      swLog('Service worker now controls all clients');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  const requestUrl = new URL(event.request.url);
  const pathname = requestUrl.pathname;
  const isHtmlRequest = event.request.mode === 'navigate' || pathname.endsWith('.html') || pathname.endsWith('/');
  const isServiceWorkerRequest = pathname.endsWith('service-worker.js');
  const isManifestRequest = pathname.endsWith('asset-manifest.json');
  const isHashedAsset = /\.[0-9a-f]{8}\.(js|css|png|jpg|jpeg|gif|svg|mp3|wav|json)$/i.test(pathname);
  const isRuntimeCodeAsset = /\.(js|css)$/i.test(pathname) && !isHashedAsset;
  
  // Handle asset requests - content-hashed files can be cached forever
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // For non-HTML requests, return cached version immediately
        if (!isHtmlRequest &&
            !isServiceWorkerRequest &&
            !isManifestRequest &&
            !isRuntimeCodeAsset) {
          return cachedResponse;
        }
      }
      
      // If not cached or is HTML/service worker, fetch from network
      return fetch(event.request)
        .then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response - one to return, one to cache
          const responseToCache = response.clone();
          
          // Check if request URL includes a content hash (filename.hash.ext pattern)
          // Cache the fetched response 
          // Note: We always update the cache for HTML, service worker, and non-hashed runtime code
          const shouldCache = isHashedAsset || 
                              isHtmlRequest ||
                              isServiceWorkerRequest ||
                              isManifestRequest ||
                              isRuntimeCodeAsset;
                               
          if (shouldCache) {
            caches.open(CACHE_NAME)
              .then(cache => {
                swLog(`Caching fetch response for: ${event.request.url}`);
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                swLog('Error caching response:', err);
              });
          }
          
          return response;
        })
        .catch(error => {
          swLog(`Fetch failed for ${event.request.url}:`, error);
          
          // For navigation requests, try to return the cached index.html as fallback
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          
          // For other requests that fail, return cached version if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise let the error pass through
          throw error;
        });
    })
  );
});

// Listen for push notifications (if we add these later)
self.addEventListener('push', event => {
  swLog('Push notification received:', event);
  
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update available!',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-32x32.png',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Dimbadimba Game', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
}); 