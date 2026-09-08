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
