import { defineConfig, loadEnv, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";

const MPA_INPUTS = {
  index: path.resolve(__dirname, "index.html"),
  login: path.resolve(__dirname, "login.html"),
  signup: path.resolve(__dirname, "signup.html"),
  dashboard: path.resolve(__dirname, "dashboard.html"),
  history: path.resolve(__dirname, "history.html"),
  chart: path.resolve(__dirname, "chart.html"),
  plan: path.resolve(__dirname, "plan.html"),
  bills: path.resolve(__dirname, "bills.html"),
  utang: path.resolve(__dirname, "utang.html"),
  profile: path.resolve(__dirname, "profile.html")
};

function collectFiles(dir: string, root: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, root));
    } else {
      const rel = "/" + path.relative(root, fullPath).replace(/\\/g, "/");
      if (rel !== "/sw.js") results.push(rel);
    }
  }
  return results;
}

function tipidServiceWorkerPlugin(): Plugin {
  return {
    name: "tipid-service-worker",
    closeBundle() {
      const distDir = path.resolve(__dirname, "dist");
      if (!fs.existsSync(distDir)) return;

      const shellAssets = ["/", ...collectFiles(distDir, distDir)].sort();
      const cacheVersion = `v${Date.now()}`;
      const swSource = `// Generated service worker for Tipid Expense Tracker
const CACHE_VERSION = '${cacheVersion}';
const CACHE_NAME = 'tipid-shell-' + CACHE_VERSION;
const CORE_SHELL = ${JSON.stringify(Array.from(new Set(shellAssets)), null, 2)};

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

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE_SHELL.map(async (url) => {
      try { await cache.add(url); } catch (_) {}
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => (name.startsWith('tipid-shell-') || name.startsWith('tipid-runtime-')) && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const type = typeof event.data === 'string' ? event.data : event.data?.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch { return; }
  if (!url.protocol.startsWith('http')) return;
  if (isPrivateOrApiRequest(url)) return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js') return;

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirstWithTimeout(request, url, 2200));
});

const OFFLINE_ROUTE_ALIASES = {
  '/': '/index.html',
  '/analytics': '/chart.html',
  '/analytics.html': '/chart.html',
  '/allowance.html': '/dashboard.html',
  '/installments.html': '/bills.html',
  '/grocery.html': '/dashboard.html',
  '/scanner.html': '/dashboard.html',
};

async function matchCachedNavigation(cache, request, url) {
  const direct = await cache.match(request, { ignoreSearch: true });
  if (direct) return direct;

  const mappedPath = OFFLINE_ROUTE_ALIASES[url.pathname];
  if (mappedPath) {
    const mapped = await cache.match(mappedPath);
    if (mapped) return mapped;
  }

  return cache.match('/index.html');
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline asset unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

async function networkFirstWithTimeout(request, url, timeoutMs) {
  const cache = await caches.open(CACHE_NAME);
  const isNav = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';

  try {
    const fetchPromise = fetch(request).then((response) => {
      if (response && response.ok && response.type === 'basic') {
        cache.put(isNav ? url.pathname : request, response.clone());
      }
      return response;
    });

    if (isNav) {
      const response = await Promise.race([
        fetchPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('network-timeout')), timeoutMs))
      ]);
      return response;
    }

    return await fetchPromise;
  } catch {
    const cached = isNav
      ? await matchCachedNavigation(cache, request, url)
      : await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;

    if (request.mode === 'navigate') {
      return new Response(
        '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline — Tipid</title></head><body style="margin:0;min-height:100dvh;display:grid;place-items:center;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#0D1611;background:#F1F3EF;padding:1.5rem;"><main style="max-width:24rem;width:100%;background:#FFFFFF;border:1px solid rgba(13,22,17,.08);border-radius:1.5rem;padding:1.75rem;text-align:center;box-shadow:0 12px 32px -12px rgba(13,22,17,.12);"><div style="width:2.75rem;height:2.75rem;margin:0 auto .875rem;border-radius:.875rem;background:#0B3A2B;color:#fff;display:grid;place-items:center;font-weight:700;">T</div><h1 style="margin:0;font-size:1.125rem;font-weight:700;">You are currently offline</h1><p style="margin:.625rem 0 1.25rem;font-size:.875rem;line-height:1.5;color:#45554C;">Cached Tipid screens work offline. Reconnect when ready to sync your latest updates.</p><div style="display:flex;gap:.5rem;justify-content:center;"><a href="/dashboard.html" style="padding:.625rem 1rem;border-radius:.75rem;background:#146348;color:#fff;font-size:.8125rem;font-weight:600;text-decoration:none;">Open Workspace</a><a href="/index.html" style="padding:.625rem 1rem;border-radius:.75rem;border:1px solid rgba(13,22,17,.16);color:#0D1611;font-size:.8125rem;font-weight:600;text-decoration:none;">Home</a></div></main></body></html>',
        { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
`;
      fs.writeFileSync(path.join(distDir, "sw.js"), swSource, "utf8");
    }
  };
}

function analyticsAliasPlugin(): Plugin {
  const redirectMiddleware = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void
  ) => {
    const rawUrl = req.url || "";
    const [pathname, search] = rawUrl.split("?");
    if (pathname === "/analytics.html" || pathname === "/analytics") {
      res.statusCode = 302;
      res.setHeader("Location", search ? `/chart.html?${search}` : "/chart.html");
      res.end();
      return;
    }
    next();
  };

  return {
    name: "tipid-analytics-alias",
    configureServer(server) {
      server.middlewares.use(redirectMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirectMiddleware);
    }
  };
}

function sendLocalChatJson(res: ServerResponse, statusCode: number, body: unknown, allowPost = false): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (allowPost) res.setHeader("Allow", "POST");
  res.end(JSON.stringify(body));
}

export function localChatApiPlugin(options?: {
  loadEnvFn?: (mode: string, envDir: string, prefixes: string | string[]) => Record<string, string>;
}): Plugin {
  const resolveEnv = options?.loadEnvFn ?? loadEnv;
  return {
    name: "tipid-local-chat-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (pathname !== "/api/chat") {
          next();
          return;
        }

        if (req.method !== "POST") {
          sendLocalChatJson(
            res,
            405,
            { code: "method-not-allowed", error: "Method not allowed" },
            true
          );
          return;
        }

        const env = resolveEnv(server.config.mode || "development", process.cwd(), "");
        const apiKey = (env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();

        if (!apiKey) {
          req.resume();
          sendLocalChatJson(res, 200, { mode: "local", code: "ai/not-configured" });
          return;
        }

        void (async () => {
          try {
            const chatMod = (await server.ssrLoadModule("/api/chat.ts")) as {
              handleChatRequest?: (
                r: IncomingMessage,
                s: ServerResponse,
                deps: { apiKey?: string; model?: string; projectId?: string }
              ) => Promise<void>;
            };
            if (typeof chatMod.handleChatRequest === "function") {
              await chatMod.handleChatRequest(req, res, {
                apiKey,
                model: env.GEMINI_MODEL || process.env.GEMINI_MODEL,
                projectId: env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
              });
              return;
            }
          } catch (err) {
            console.error("[TipidDev] /api/chat middleware error:", err);
          }

          if (!res.writableEnded) {
            sendLocalChatJson(res, 200, { mode: "local", code: "ai/dev-fallback" });
          }
        })();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || "").split("?")[0];
        if (pathname !== "/api/chat") {
          next();
          return;
        }
        if (req.method !== "POST") {
          sendLocalChatJson(
            res,
            405,
            { code: "method-not-allowed", error: "Method not allowed" },
            true
          );
          return;
        }
        req.resume();
        sendLocalChatJson(res, 200, { mode: "local", code: "preview/local-only" });
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), analyticsAliasPlugin(), localChatApiPlugin(), tipidServiceWorkerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: MPA_INPUTS,
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/chart.js")) return "vendor-chartjs";
          if (id.includes("node_modules/@firebase/firestore") || id.includes("node_modules/firebase/firestore")) {
            return "vendor-firestore";
          }
          if (id.includes("node_modules/@firebase/auth") || id.includes("node_modules/firebase/auth")) {
            return "vendor-firebase-auth";
          }
          if (id.includes("node_modules/@firebase/") || id.includes("node_modules/firebase/")) {
            return "vendor-firebase-core";
          }
          if (id.includes("node_modules/vue/") || id.includes("node_modules/@vue/")) {
            return "vendor-vue";
          }
          if (id.includes("node_modules/@lucide/")) {
            return "vendor-icons";
          }
          return undefined;
        }
      }
    }
  }
});
