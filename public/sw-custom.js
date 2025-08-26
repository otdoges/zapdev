// Custom service worker optimizations for ZapDev
const CACHE_NAME = 'zapdev-v1.0.0';
const CRITICAL_CACHE = 'zapdev-critical-v1.0.0';
const STATIC_CACHE = 'zapdev-static-v1.0.0';
const API_CACHE = 'zapdev-api-v1.0.0';

// Resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
const CRITICAL_RESOURCES = [
  '/',           // SPA entry
  '/index.html', // optional, if served
];

// Resources to cache on first request
const STATIC_RESOURCES = [
  '/favicon.ico',
  '/favicon.svg',
  '/manifest.json',
  '/og-image.svg',
];

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CRITICAL_CACHE)
      .then(cache => {
        return cache.addAll(CRITICAL_RESOURCES.map(url => 
          new Request(url, { cache: 'reload' })
        ));
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== CRITICAL_CACHE && 
              cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/hono/')) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            // Cache successful GET requests for 5 minutes
            if (event.request.method === 'GET' && response.ok) {
              const responseClone = response.clone();
              const expirationTime = Date.now() + (5 * 60 * 1000); // 5 minutes
              const extendedResponse = new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: {
                  ...responseClone.headers,
                  'sw-cache-expires': expirationTime,
                }
              });
              cache.put(event.request, extendedResponse);
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                const expirationTime = cachedResponse.headers.get('sw-cache-expires');
                if (!expirationTime || Date.now() < parseInt(expirationTime)) {
                  return cachedResponse;
                }
              }
              throw new Error('Network failed and no valid cache available');
            });
          });
      })
    );
    return;
  }

  // Handle static assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.open(CRITICAL_CACHE).then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Fallback to cached index.html for SPA routing
            return cache.match('/') || 
                   cache.match('/index.html') ||
                   new Response('Offline - Please check your connection', {
                     status: 200,
                     headers: { 'Content-Type': 'text/html' }
                   });
          });
      })
    );
    return;
  }

  // Default: network first for everything else
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any offline actions when connection is restored
  console.log('Background sync triggered');
}

// Push notifications (if needed later)
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      vibrate: [200, 100, 200],
      data: { url: '/' }
    };
    
    event.waitUntil(
      self.registration.showNotification('ZapDev', options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});