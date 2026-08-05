// sw.js — Tipid service worker
//
// Two caches:
//   CACHE_NAME    — the app shell (this site's own HTML/JS/icons), kept
//                   fresh with a network-first strategy.
//   RUNTIME_CACHE — third-party CDN scripts the app depends on to render
//                   (React, Babel, Tailwind, fonts, the Firebase SDK),
//                   kept with stale-while-revalidate so the app can still
//                   boot when offline.
//
// Bump BOTH version numbers below whenever you change the file list or want
// old clients to drop their cached copies.
const CACHE_VERSION = 'v5'; // Bumped to v4 to force full shell caching
const CACHE_NAME = `tipid-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tipid-runtime-${CACHE_VERSION}`;

const APP_SHELL = [
  '/',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/chart.html',
  '/history.html',
  '/profile.html',
  '/firebase.js',
  '/firebase-auth.js',
  '/firebase-data.js',
  '/components/navbar.js',
  '/components/DashboardSummary.js',
  '/components/ExpenseChart.js',
  '/components/ExpenseForm.js',
  '/components/ExpenseItem.js',
  '/components/ExpenseList.js',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo-512.png',
  '/assets/favicon-32.png',
];

// Cross-origin hosts we're willing to cache.
const RUNTIME_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net', // Added for Chart.js and SweetAlert2
];

function isRuntimeCacheable(url) {
  if (RUNTIME_HOSTS.includes(url.hostname)) return true;
  // Firebase's SDK bundles live under gstatic/firebasejs/.
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) return true;
  return false;
}

// --- install: precache the app shell ---------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Tinitiyak natin na mai-save ang bawat asset kasama ang index.html
        return Promise.all(
          APP_SHELL.map(url => {
            return cache.add(url).catch(err => {
              console.warn(`Failed to cache: ${url}`, err);
            });
          })
        );
      })
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

// Lets a page force an update immediately
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// --- fetch -------------------------------------------------------------------
self.addEventListener('fetch', event => {
  const { request } = event;

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
});

// Same-origin app shell: prefer the network so signed-in users always get the latest code.
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

// Third-party CDN assets: serve the cached copy instantly if we have one.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then(response => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);
  return cached || networkFetch;
}
