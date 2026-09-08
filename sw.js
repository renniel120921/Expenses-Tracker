// sw.js — Tipid service worker
//
// Two caches:
//   CACHE_NAME    — the app shell (this site's own HTML/JS/icons), kept
//                   fresh with a network-first strategy.
//   RUNTIME_CACHE — third-party CDN scripts required to boot offline
//                   (React, Babel, Tailwind, SweetAlert2, Chart.js, Firebase SDK),
//                   kept with stale-while-revalidate so the app can still
//                   boot when offline.
//
// Bump BOTH version numbers below whenever you change the file list or want
// old clients to drop their cached copies.
const CACHE_VERSION = 'v19';
const CACHE_NAME = `tipid-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tipid-runtime-${CACHE_VERSION}`;

// Core application shell assets required to render and operate the offline UI
const CORE_SHELL = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/dashboard.html',
  '/chart.html',
  '/history.html',
  '/profile.html',
  '/allowance.html',
  '/bills.html',
  '/grocery.html',
  '/installments.html',
  '/scanner.html',
  '/utang.html',
  '/app.css',
  '/app-utils.js',
  '/firebase.js',
  '/firebase-auth.js',
  '/firebase-data.js',
  '/components/navbar.js',
  '/components/DashboardSummary.js',
  '/components/ExpenseChart.js',
  '/components/ExpenseForm.js',
  '/components/ExpenseItem.js',
  '/components/ExpenseList.js',
  '/components/AllowanceCalculator.js',
  '/components/BillsCenter.js',
  '/components/GroceryList.js',
  '/components/InstallmentTracker.js',
  '/components/OnboardingModal.js',
  '/components/ReceiptScanner.js',
  '/components/UtangTracker.js',
  '/manifest.json',
  '/assets/logo.svg',
  '/assets/logo-512.png',
  '/assets/favicon-32.png',
];

// Optional decorative mascot and illustration assets; installation is non-critical
const OPTIONAL_SHELL = [
  '/assets/allowance_mascot.png',
  '/assets/bills_mascot.png',
  '/assets/chart_mascot.png',
  '/assets/greetings_mascot.png',
  '/assets/history_mascot.png',
  '/assets/login_mascot.png',
  '/assets/signup_mascot.png',
  '/assets/tipid_mascot.png',
  '/assets/tipid_mascot_full.png',
  '/assets/sleeping_mascot.png',
  '/assets/wakeup_mascot.png',
  '/assets/working_mascot.png',
];

// Verified third-party CDN hosts required for offline script rendering
const RUNTIME_HOSTS = [
  'cdn.tailwindcss.com',
  'unpkg.com',
  'cdn.jsdelivr.net',
];

// Database and authentication endpoints that must NEVER be cached
const PRIVATE_API_HOSTS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'accounts.google.com',
];

function isPrivateOrApiRequest(url) {
  if (PRIVATE_API_HOSTS.includes(url.hostname)) return true;
  if (url.hostname.endsWith('.firebaseio.com') || url.hostname === 'firebaseio.com') return true;
  if (url.hostname.endsWith('.firebaseapp.com') || url.hostname === 'firebaseapp.com') return true;
  return false;
}

function isRuntimeCacheable(url) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
  if (isPrivateOrApiRequest(url)) return false;

  if (RUNTIME_HOSTS.includes(url.hostname)) return true;
  // Firebase SDK static bundles live under gstatic.com/firebasejs/
  if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) return true;

  return false;
}

// --- install: precache core shell and optional assets ----------------------
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Core shell caching: required for offline UI
      const corePromises = CORE_SHELL.map(async url => {
        try {
          await cache.add(url);
        } catch (err) {
          console.error(`[sw] Core shell asset failed to cache: ${url}`, err);
        }
      });
      await Promise.all(corePromises);

      // Optional shell caching: failures do not block installation
      const optionalPromises = OPTIONAL_SHELL.map(async url => {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn(`[sw] Optional asset unavailable for cache: ${url}`, err);
        }
      });
      await Promise.all(optionalPromises);

      await self.skipWaiting();
    })()
  );
});

// --- activate: drop old Tipid caches, take control immediately -------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => (name.startsWith('tipid-shell-') || name.startsWith('tipid-runtime-')) &&
                            name !== CACHE_NAME && name !== RUNTIME_CACHE)
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

  let url;
  try {
    url = new URL(request.url);
  } catch (_) {
    return;
  }

  // Only handle HTTP/HTTPS (ignore chrome-extension:, blob:, etc.)
  if (!url.protocol.startsWith('http')) return;

  // Never intercept private financial/auth/API endpoints
  if (isPrivateOrApiRequest(url)) return;

  // Same-origin shell requests: network-first
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Offline-required third-party CDN scripts: stale-while-revalidate
  if (isRuntimeCacheable(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // All other cross-origin requests (fonts, telemetry, external images) pass through normally
});

// Same-origin app shell: prefer network, fall back to cache or safe offline response
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Navigation fallback: try cached /index.html, then safe HTML Response
    if (request.mode === 'navigate') {
      const fallback = await cache.match('/index.html');
      if (fallback) return fallback;

      return new Response(
        '<!DOCTYPE html><html lang="fil"><head><meta charset="utf-8"><title>Offline — Tipid</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;text-align:center;padding:3rem 1.5rem;color:#15231c;background:#f4f6f3;"><h1 style="font-size:1.5rem;font-weight:700;">Kasalukuyang Offline</h1><p style="margin-top:1rem;color:#5f6f66;">Walang internet connection. Pakisubukang muli kapag may signal na.</p></body></html>',
        { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Static assets fallback: explicit 503 (never return index.html for scripts/styles/images)
    return new Response('Offline or resource unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

// Third-party CDN scripts: serve cached copy if available, revalidate in background;
// if no cache, wait for network or return explicit 503 Response
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
    .catch(err => {
      console.warn(`[sw] Stale-while-revalidate fetch failed for ${request.url}:`, err);
      return null;
    });

  if (cached) {
    return cached;
  }

  const networkResponse = await networkFetch;
  if (networkResponse instanceof Response) {
    return networkResponse;
  }

  // Guaranteed valid Response object if network fails and nothing is cached
  return new Response('Offline or resource unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
