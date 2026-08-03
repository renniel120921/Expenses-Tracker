// sw.js — Tipid service worker
//
// Two caches:
//   CACHE_NAME    — the app shell (this site's own HTML/JS/icons), kept
//                    fresh with a network-first strategy.
//   RUNTIME_CACHE — third-party CDN scripts the app depends on to render
//                    (React, Babel, Tailwind, fonts, the Firebase SDK),
//                    kept with stale-while-revalidate so the app can still
//                    boot when offline.
//
// Bump BOTH version numbers below whenever you change the file list or want
// old clients to drop their cached copies — without a version bump, a
// returning visitor can keep serving last month's build forever.
const CACHE_VERSION = 'v2';
const CACHE_NAME = `tipid-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tipid-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo-512.png',
  '/assets/favicon-32.png',
];

// Cross-origin hosts we're willing to cache. Deliberately narrow — this is
// the CDN scripts/fonts the pages need to render, nothing else. Firebase's
// actual auth calls (identitytoolkit/securetoken.googleapis.com) are NOT on
// this list on purpose, so sign-in/sign-up requests are never touched by
// the cache and always hit the network fresh.
const RUNTIME_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.tailwindcss.com',
  'unpkg.com',
];

function isRuntimeCacheable(url) {
  if (RUNTIME_HOSTS.includes(url.hostname)) return true;
  // Firebase's SDK bundles (not its API calls) live under gstatic/firebasejs/.
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) return true;
  return false;
}

// --- install: precache the app shell ---------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache =>
        // allSettled so one missing/renamed file doesn't fail the whole install
        Promise.allSettled(APP_SHELL.map(url => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

// --- activate: drop old cache versions, take control immediately -----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Lets a page force an update immediately (e.g. from a "new version
// available" banner) instead of waiting for all tabs to close.
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// --- fetch -------------------------------------------------------------------
self.addEventListener('fetch', event => {
  const { request } = event;

  // Never intercept anything but plain GETs — POSTs (auth calls, form
  // submits, etc.) go straight to the network untouched, so nothing
  // sensitive ever ends up in Cache Storage.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isRuntimeCacheable(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else (Firebase auth endpoints, analytics, etc.) — leave
  // completely alone.
});

// Same-origin app shell: prefer the network so signed-in users always get
// the latest code; fall back to cache when offline, and to the cached
// index page for a full-page navigation with nothing cached at all.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}

// Third-party CDN assets: serve the cached copy instantly if we have one
// (these rarely change), and refresh it in the background for next time.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then(response => {
      // Cross-origin responses without CORS headers come back "opaque" —
      // still safe and useful to cache, we just can't inspect their status.
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || networkFetch;
}
