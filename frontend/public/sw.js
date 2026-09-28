// Otewe Service Worker
// Plain JS, no dependencies

// Cache versioning
const CACHE_VERSION = 'v3';
const STATIC_CACHE = `otewe-static-${CACHE_VERSION}`;
const MASTER_DATA_CACHE = `otewe-master-data-${CACHE_VERSION}`;
const TILES_CACHE = `otewe-tiles-${CACHE_VERSION}`;

// Cache limits
const MASTER_DATA_MAX_ENTRIES = 100;
const MASTER_DATA_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const TILES_MAX_ENTRIES = 300;
const TILES_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Parse API origin from query string
const swUrl = new URL(self.location.href);
const apiOriginParam = swUrl.searchParams.get('api');
let apiOrigin = null;

if (apiOriginParam) {
  try {
    const apiUrl = new URL(apiOriginParam);
    // Allow http only for localhost/127.0.0.1
    const isLocalhost = apiUrl.hostname === 'localhost' || apiUrl.hostname === '127.0.0.1';
    const isHttps = apiUrl.protocol === 'https:';
    if (isHttps || isLocalhost) {
      apiOrigin = apiUrl.origin;
    }
  } catch (e) {
    console.warn('[SW] Invalid API origin in query string:', apiOriginParam);
  }
}

// Master data endpoint patterns (precise path matching, not prefix)
// Excludes /api/halte/nearby and /api/health explicitly
const MASTER_DATA_PATTERNS = [
  /^\/api\/moda$/,
  /^\/api\/halte$/,
  /^\/api\/halte\/[^\/]+$/,
  /^\/api\/rute$/,
  /^\/api\/rute\/[^\/]+$/,
  /^\/api\/tarif$/,
  /^\/api\/tarif\/[^\/]+$/,
];

// Path prefix data admin yang menunjang master data
const ADMIN_DATA_PATH_PREFIXES = ['/api/halte', '/api/rute', '/api/moda', '/api/tarif'];

// OSM tile pattern
const OSM_TILE_PATTERN_RESOLVED = /^https?:\/\/[a-c]\.tile\.openstreetmap\.org\/\d+\/\d+\/\d+\.png$/;

// Helper: check if URL matches master data pattern
function isMasterDataRequest(url) {
  if (!apiOrigin || url.origin !== apiOrigin) return false;
  const pathname = url.pathname;

  // Explicit exclusions
  if (pathname === '/api/halte/nearby' || pathname === '/api/health') {
    return false;
  }

  return MASTER_DATA_PATTERNS.some(pattern => pattern.test(pathname));
}

// Helper: check if URL is admin or auth write operation
function isAdminWriteRequest(url, method) {
  if (!apiOrigin || url.origin !== apiOrigin) return false;
  const pathname = url.pathname;

  // Non-GET methods to admin endpoints (halte, rute, moda, tarif)
  if (method !== 'GET' && ADMIN_DATA_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

// Helper: invalidate master data cache on write operations
async function invalidateMasterDataCache(pathname) {
  const prefix = ADMIN_DATA_PATH_PREFIXES.find((item) => pathname.startsWith(item));
  if (!prefix) return;

  try {
    const cache = await caches.open(MASTER_DATA_CACHE);
    const keys = await cache.keys();

    for (const request of keys) {
      const url = new URL(request.url);
      if (url.pathname.startsWith(prefix)) {
        await cache.delete(request);
      }
    }
  } catch (e) {
    console.warn('[SW] Error invalidating cache:', e);
  }
}

// Helper: check if response is cacheable (for master data)
function isCacheableResponse(response) {
  if (!response || response.status !== 200) return false;

  const type = response.type;
  if (type !== 'basic' && type !== 'cors') return false;

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) return false;

  // Check for Set-Cookie
  if (response.headers.get('set-cookie')) return false;

  // Check Cache-Control for no-store or private
  const cacheControl = response.headers.get('cache-control') || '';
  if (cacheControl.includes('no-store') || cacheControl.includes('private')) return false;

  return true;
}

// Helper: clean old caches
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE, MASTER_DATA_CACHE, TILES_CACHE];

  for (const cacheName of cacheNames) {
    if (!currentCaches.includes(cacheName)) {
      await caches.delete(cacheName);
    }
  }
}

// Helper: enforce cache size limit and TTL
async function enforceCacheLimits(cacheName, maxEntries, maxAgeMs) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    // Delete oldest entries beyond limit
    if (keys.length > maxEntries) {
      const keysToDelete = keys.slice(0, keys.length - maxEntries);
      for (const key of keysToDelete) {
        await cache.delete(key);
      }
    }

    // Enforce TTL
    const now = Date.now();
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const timestamp = response.headers.get('sw-timestamp');
        if (timestamp && (now - parseInt(timestamp)) > maxAgeMs) {
          await cache.delete(key);
        }
      }
    }
  } catch (e) {
    console.warn('[SW] Error enforcing cache limits:', e);
  }
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Precache offline page and icons
      const staticCache = await caches.open(STATIC_CACHE);
      await staticCache.addAll([
        '/offline',
        '/manifest.webmanifest',
        '/logo/favicon-192.png',
        '/logo/favicon-512.png',
        '/logo/favicon-180.png',
      ]);

      // Precache aset (CSS/chunk) yang dibutuhkan halaman offline supaya
      // tampil lengkap saat koneksi mati
      try {
        const offlineResponse = await fetch('/offline');
        const html = await offlineResponse.text();
        const assets = Array.from(new Set(html.match(/\/_next\/static\/[^"'\\\s<>]+/g) || []));
        if (assets.length > 0) {
          await staticCache.addAll(assets);
        }
      } catch (e) {
        console.warn('[SW] Gagal precache aset halaman offline:', e);
      }

      // Buat seluruh cache workspace segera terlihat di DevTools
      await caches.open(MASTER_DATA_CACHE);
      await caches.open(TILES_CACHE);
      await self.skipWaiting();
    })()
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await cleanOldCaches();
      await self.clients.claim();
    })()
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') {
    // Handle write operations to invalidate cache
    if (isAdminWriteRequest(url, request.method)) {
      event.respondWith(
        fetch(request).then(async (response) => {
          if (response.ok) {
            await invalidateMasterDataCache(url.pathname);
          }
          return response;
        })
      );
      return;
    }
    return;
  }

  // 1. Static assets: cache-first
  if (url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/favicon-') ||
    url.pathname.startsWith('/logo/favicon-')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              caches
                .open(STATIC_CACHE)
                .then((cache) => cache.put(request, response.clone()))
                .catch(() => {});
            }
            return response;
          })
          .catch(() => new Response('', { status: 504 }));
      })
    );
    return;
  }

  // 1.5. manifest.webmanifest: network-first
  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, response.clone()))
            .catch(() => {});
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        return cached || new Response('{}', {
          status: 503,
          headers: { 'Content-Type': 'application/manifest+json' },
        });
      })
    );
    return;
  }

  // 2. OSM tiles: cache-first with limits
  if (OSM_TILE_PATTERN_RESOLVED.test(url.href)) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            const responseToCache = response.clone();
            const tilesCache = await caches.open(TILES_CACHE);
            // Add timestamp for TTL
            const headers = new Headers(responseToCache.headers);
            headers.append('sw-timestamp', Date.now().toString());
            const modifiedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers
            });
            await tilesCache.put(request, modifiedResponse);
            await enforceCacheLimits(TILES_CACHE, TILES_MAX_ENTRIES, TILES_MAX_AGE_MS);
          }
          return response;
        } catch (e) {
          return cached || new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // 3. Master data API: stale-while-revalidate
  if (isMasterDataRequest(url)) {
    event.respondWith(
      caches.open(MASTER_DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        // Fetch from network
        const networkPromise = fetch(request).then(async (response) => {
          if (isCacheableResponse(response)) {
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.append('sw-timestamp', Date.now().toString());
            const modifiedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers
            });
            await cache.put(request, modifiedResponse);
            await enforceCacheLimits(MASTER_DATA_CACHE, MASTER_DATA_MAX_ENTRIES, MASTER_DATA_MAX_AGE_MS);
          }
          return response;
        }).catch(() => null);

        // Return cached immediately if available, then revalidate in background
        if (cached) {
          event.waitUntil(
            networkPromise.then((response) => {
              if (response && isCacheableResponse(response)) {
                const responseToCache = response.clone();
                const headers = new Headers(responseToCache.headers);
                headers.append('sw-timestamp', Date.now().toString());
                const modifiedResponse = new Response(responseToCache.body, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers
                });
                cache.put(request, modifiedResponse);
              }
            })
          );
          return cached;
        }

        // No cache, wait for network
        const networkResponse = await networkPromise;
        return networkResponse || new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // 4. Navigation to public pages: network-first with offline fallback
  if (request.mode === 'navigate') {
    // Exclude admin routes
    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return; // Let it pass through to network
    }

    // Allow navigation to public pages and user pages
    const allowedPaths = ['/', '/beranda', '/cara-kerja', '/tentang', '/cari-rute', '/profil', '/login', '/register', '/lupa-password', '/reset-password'];
    const isAllowed = allowedPaths.some(path => url.pathname === path || url.pathname.startsWith(path + '/'));

    if (isAllowed) {
      event.respondWith(
        fetch(request).then((response) => {
          return response;
        }).catch(() => {
          return caches.match('/offline').then((cached) => {
            return cached || new Response('Offline', { status: 503 });
          });
        })
      );
      return;
    }
  }

  // 5. All other requests: pass through to network
  // (including /api/auth/*, /api/routing/*, /api/health, all non-allowlisted API)
});

// Message handler for cache cleanup (e.g., on logout)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      (async () => {
        await caches.delete(MASTER_DATA_CACHE);
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => client.postMessage({ type: 'CACHE_CLEARED' }));
      })()
    );
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
  }
});
