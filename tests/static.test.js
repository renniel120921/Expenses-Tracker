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

  // Connect-src origins
  const connectMatch = csp.match(/connect-src ([^;]+);/);
  assert.ok(connectMatch, "connect-src directive exists");
  const connectSources = connectMatch[1].split(/\s+/);

  // No wildcards in connect-src
  assert.ok(!connectSources.includes("*"), "connect-src does not contain *");
  assert.ok(!connectSources.includes("https:"), "connect-src does not contain broad https:");
  assert.ok(!connectSources.includes("data:"), "connect-src does not contain data:");

  // Required CDN origins
  for (const origin of [
    "https://cdn.tailwindcss.com",
    "https://unpkg.com",
    "https://cdn.jsdelivr.net",
    "https://www.gstatic.com",
  ]) {
    assert.ok(connectSources.includes(origin), `connect-src includes ${origin}`);
  }
});

test("Service Worker implements safe precache, response guarantees, and private API exclusions", () => {
  const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");

  // Cache version
  assert.match(sw, /CACHE_VERSION\s*=\s*'v19'/);

  // Split shell assets
  assert.match(sw, /const CORE_SHELL\s*=\s*\[/);
  assert.match(sw, /const OPTIONAL_SHELL\s*=\s*\[/);

  // Private API exclusions
  assert.match(sw, /firestore\.googleapis\.com/);
  assert.match(sw, /identitytoolkit\.googleapis\.com/);
  assert.match(sw, /securetoken\.googleapis\.com/);
  assert.match(sw, /isPrivateOrApiRequest/);

  // No unsafe catch pattern
  assert.doesNotMatch(sw, /\.catch\(\s*\(\)\s*=>\s*cached\s*\)/);
  assert.doesNotMatch(sw, /\.catch\(console\.error\)/);

  // Guaranteed Response fallback
  assert.match(sw, /return new Response\(/);

  // Deletes only tipid caches
  assert.match(sw, /tipid-shell-/);
  assert.match(sw, /tipid-runtime-/);
});

test("layout constraints and landing main maintain desktop responsiveness", () => {
  const css = fs.readFileSync(path.join(root, "app.css"), "utf8");
  assert.doesNotMatch(css, /main\s*\{\s*max-width:/);
  assert.match(css, /\.tipid-container\s*\{/);

  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  assert.match(indexHtml, /<main[^>]*landing-main[^>]*w-full[^>]*max-w-none/);
});
