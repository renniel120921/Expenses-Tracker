const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pages = fs.readdirSync(root).filter(name => name.endsWith(".html"));

test("every page uses the shared foundation and PWA metadata", () => {
  assert.equal(pages.length, 13);
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.match(html, /<html lang="fil"/i, page);
    assert.match(html, /viewport-fit=cover/i, page);
    assert.match(html, /href="\/app\.css"/i, page);
    assert.match(html, /src="\/app-utils\.js"/i, page);
    assert.match(html, /href="\/manifest\.json"/i, page);
  }
});

test("all local HTML references exist", () => {
  const missing = [];
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"#?]+)[^"\s]*"/g)) {
      const ref = match[1];
      if (/^(?:https?:|mailto:|tel:|data:)/.test(ref)) continue;
      const target = ref.startsWith("/") ? path.join(root, ref.slice(1)) : path.resolve(root, path.dirname(page), ref);
      if (!fs.existsSync(target)) missing.push(`${page}: ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("confirmed financial and XSS regressions remain fixed", () => {
  const data = fs.readFileSync(path.join(root, "firebase-data.js"), "utf8");
  const chart = fs.readFileSync(path.join(root, "components/ExpenseChart.js"), "utf8");
  const summary = fs.readFileSync(path.join(root, "components/DashboardSummary.js"), "utf8");
  const expense = fs.readFileSync(path.join(root, "components/ExpenseItem.js"), "utf8");
  const bills = fs.readFileSync(path.join(root, "components/BillsCenter.js"), "utf8");
  assert.match(data, /spendType: core\.assertChoice/);
  assert.match(chart, /TipidCore\.entryDate\(e\)/);
  assert.match(summary, /e\.type === "expense"/);
  assert.doesNotMatch(expense, /html:\s*`[^`]*data\.desc/s);
  assert.doesNotMatch(bills, /htmlMsg/);
});

test("JSON configuration parses", () => {
  for (const file of ["manifest.json", "vercel.json", "firebase.json", "package.json"]) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(root, file), "utf8")), file);
  }
});

test("production runtime contains no analytics or tag-manager integration", () => {
  const productionFiles = [
    "firebase.js", "firebase-auth.js", "firebase-data.js", "sw.js", "vercel.json",
    ...pages,
    ...fs.readdirSync(path.join(root, "components")).filter(name => name.endsWith(".js")).map(name => path.join("components", name)),
  ];
  const source = productionFiles.map(file => fs.readFileSync(path.join(root, file), "utf8")).join("\n");
  for (const pattern of [
    /getAnalytics/,
    /firebase-analytics/,
    /\bgtag\s*\(/,
    /gtag\.js/,
    /googletagmanager/i,
    /google-analytics/i,
    /measurementId/,
    /\bdataLayer\b/,
    /G-XEPDS0FG10/,
  ]) assert.doesNotMatch(source, pattern);

  const auth = fs.readFileSync(path.join(root, "firebase-auth.js"), "utf8");
  assert.match(auth, /new GoogleAuthProvider\(\)/);
  assert.match(auth, /googleProvider\.setCustomParameters\(\{\s*prompt:\s*["']select_account["']/);
  assert.match(auth, /signInWithPopup\(auth, googleProvider\)/);
  assert.match(auth, /["']auth\/unauthorized-domain["']:\s*["'][^"']+["']/);
  assert.match(auth, /["']auth\/popup-blocked["']:\s*["'][^"']+["']/);
  assert.match(auth, /["']auth\/operation-not-supported-in-this-environment["']:\s*["'][^"']+["']/);
  assert.match(auth, /["']auth\/account-exists-with-different-credential["']:\s*["'][^"']+["']/);
  assert.doesNotMatch(auth, /signInWithRedirect|getRedirectResult/);
});

test("CSP policy in vercel.json is secure and permits required runtime origins", () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  const headerObj = vercel.headers[0].headers.find(h => h.key === "Content-Security-Policy");
  assert.ok(headerObj, "Content-Security-Policy header exists");
  const csp = headerObj.value;

  // Directive existence
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /form-action 'self'/);
  assert.match(csp, /manifest-src 'self'/);
  assert.match(csp, /worker-src 'self' blob:/);
  assert.doesNotMatch(csp, /worker-src[^;]*cdn\.jsdelivr\.net/);

  // Script-src origins
  const scriptMatch = csp.match(/script-src ([^;]+);/);
  assert.ok(scriptMatch, "script-src directive exists");
  const scriptSources = scriptMatch[1].split(/\s+/);
  assert.ok(scriptSources.includes("https://apis.google.com"), "script-src retains the Google Auth API origin");
  assert.ok(!scriptSources.includes("https://www.googletagmanager.com"), "script-src excludes Google Tag Manager");

  // Connect-src origins
  const connectMatch = csp.match(/connect-src ([^;]+);/);
  assert.ok(connectMatch, "connect-src directive exists");
  const connectSources = connectMatch[1].split(/\s+/);

  // No wildcards in connect-src
  assert.ok(!connectSources.includes("*"), "connect-src does not contain *");
  assert.ok(!connectSources.includes("https:"), "connect-src does not contain broad https:");
  assert.ok(!connectSources.includes("data:"), "connect-src does not contain data:");
  assert.ok(!connectSources.includes("https://*.google.com"), "connect-src avoids a broad Google wildcard");
  assert.ok(connectSources.includes("https://accounts.google.com"), "connect-src retains the Google account origin");
  assert.ok(!connectSources.includes("wss://tipid-tracker-app.vercel.app"), "connect-src does not whitelist extension WebSocket");
  assert.doesNotMatch(csp, /\/ws\/ws/i, "CSP does not whitelist the extension live-reload endpoint");

  // Required runtime origins
  for (const origin of [
    "https://cdn.tailwindcss.com",
    "https://unpkg.com",
    "https://cdn.jsdelivr.net",
    "https://www.gstatic.com",
  ]) {
    assert.ok(connectSources.includes(origin), `connect-src includes ${origin}`);
  }

  for (const origin of ["https://www.google-analytics.com", "https://analytics.google.com", "https://region1.google-analytics.com"]) {
    assert.ok(!connectSources.includes(origin), `connect-src excludes ${origin}`);
  }

  // Img-src excludes analytics pixels
  const imgMatch = csp.match(/img-src ([^;]+);/);
  assert.ok(imgMatch, "img-src directive exists");
  const imgSources = imgMatch[1].split(/\s+/);
  assert.ok(!imgSources.includes("https://www.google-analytics.com"));
  assert.ok(!imgSources.includes("https://www.googletagmanager.com"));
});

test("Service Worker implements safe precache, response guarantees, and private API exclusions", () => {
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
  const client = fs.readFileSync(path.join(root, "app-utils.js"), "utf8");

  // Cache version
  assert.match(sw, /CACHE_VERSION\s*=\s*'v22'/);

  // Split shell assets
  assert.match(sw, /const CORE_SHELL\s*=\s*\[/);
  assert.match(sw, /const OPTIONAL_SHELL\s*=\s*\[/);

  // Private API exclusions remain while obsolete analytics rules are gone
  assert.match(sw, /firestore\.googleapis\.com/);
  assert.match(sw, /identitytoolkit\.googleapis\.com/);
  assert.match(sw, /securetoken\.googleapis\.com/);
  assert.match(sw, /accounts\.google\.com/);
  assert.doesNotMatch(sw.match(/const RUNTIME_HOSTS\s*=\s*\[[\s\S]*?\];/)?.[0] || "", /apis\.google\.com/);
  assert.doesNotMatch(sw, /googletagmanager|google-analytics|\/g\/collect/i);
  assert.match(sw, /isPrivateOrApiRequest/);

  // Updates wait until the current page explicitly accepts them.
  const installBlock = sw.slice(sw.indexOf("self.addEventListener('install'"), sw.indexOf("self.addEventListener('activate'"));
  assert.doesNotMatch(installBlock, /skipWaiting/);
  assert.match(sw, /event\.data\?\.type/);
  assert.match(sw, /type === 'SKIP_WAITING'\) self\.skipWaiting\(\)/);
  assert.match(client, /navigator\.serviceWorker\.controller/);
  assert.match(client, /registration\.waiting/);
  assert.match(client, /postMessage\(\{ type: "SKIP_WAITING" \}\)/);
  assert.match(client, /updateReloadStarted = true;\s*window\.location\.reload\(\)/);
  for (const page of pages) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, page), "utf8"), /navigator\.serviceWorker\.register/,
      `${page} must use the shared update registration`);
  }

  // No unsafe catch pattern
  assert.doesNotMatch(sw, /\.catch\(\s*\(\)\s*=>\s*cached\s*\)/);
  assert.doesNotMatch(sw, /\.catch\(console\.error\)/);

  // Guaranteed Response fallback
  assert.match(sw, /return new Response\(/);

  // Deletes only tipid caches
  assert.match(sw, /tipid-shell-/);
  assert.match(sw, /tipid-runtime-/);
});

test("no dev live-reload or websocket scripts exist in application files", () => {
  for (const page of pages) {
    const html = fs.readFileSync(path.join(root, page), "utf8");
    assert.doesNotMatch(html, /reload\.js/i, `${page} contains reload.js`);
    assert.doesNotMatch(html, /\/ws\/ws/i, `${page} contains /ws/ws`);
    assert.doesNotMatch(html, /new\s+WebSocket\(/i, `${page} contains WebSocket`);
  }
});

test("layout constraints and landing main maintain desktop responsiveness", () => {
  const css = fs.readFileSync(path.join(root, "app.css"), "utf8");
  assert.doesNotMatch(css, /main\s*\{\s*max-width:/);
  assert.match(css, /\.tipid-container\s*\{/);

  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(indexHtml, /<main[^>]*landing-main[^>]*w-full[^>]*max-w-none/);
});
