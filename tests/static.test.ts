import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const KEPT_PAGES = [
  "index.html",
  "login.html",
  "signup.html",
  "dashboard.html",
  "history.html",
  "chart.html",
  "bills.html",
  "utang.html",
  "profile.html"
];

const RETIRED_PAGES = [
  "allowance.html",
  "installments.html",
  "grocery.html",
  "scanner.html"
];

describe("MPA entry pages, CSP hardening, and retired-page cleanup", () => {
  it("contains all 9 clean Vite MPA HTML entries without legacy CDNs or inline scripts", () => {
    for (const page of KEPT_PAGES) {
      const fullPath = path.join(ROOT, page);
      expect(fs.existsSync(fullPath), `${page} should exist`).toBe(true);

      const html = fs.readFileSync(fullPath, "utf8");
      expect(html).toContain('name="color-scheme" content="light dark"');
      expect(html).toContain('src="/theme-init.js"');
      expect(html).toContain('rel="manifest" href="/manifest.json"');
      expect(html).toContain('type="module" src="/src/entries/');
      expect(html).not.toContain("unpkg.com");
      expect(html).not.toContain("babel");
      expect(html).not.toContain("sweetalert2");
      expect(html).not.toContain("tailwind.config");
    }
  });

  it("removes retired legacy pages and preserves Vercel redirects for bookmarks", () => {
    for (const retired of RETIRED_PAGES) {
      expect(fs.existsSync(path.join(ROOT, retired)), `${retired} should be removed`).toBe(false);
    }

    const vercelRaw = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8");
    const vercel = JSON.parse(vercelRaw) as {
      outputDirectory?: string;
      redirects?: Array<{ source: string; destination: string }>;
      headers?: Array<{ headers: Array<{ key: string; value: string }> }>;
    };

    expect(vercel.outputDirectory).toBe("dist");
    for (const retired of RETIRED_PAGES) {
      expect(vercel.redirects?.some((r) => r.source === `/${retired}`)).toBe(true);
    }

    const cspHeader = vercel.headers?.[0]?.headers.find((h) => h.key === "Content-Security-Policy")?.value || "";
    expect(cspHeader).toContain("script-src 'self'");
    expect(cspHeader).not.toContain("'unsafe-eval'");
    expect(cspHeader).not.toContain("cdn.tailwindcss.com");
    expect(cspHeader).not.toContain("unpkg.com");
  });

  it("keeps real icon assets in public/assets without mascot slop", () => {
    const assetFiles = fs.readdirSync(path.join(ROOT, "public/assets"));
    expect(assetFiles).toContain("logo.svg");
    expect(assetFiles).toContain("logo-192.png");
    expect(assetFiles).toContain("logo-512.png");
    expect(assetFiles).toContain("apple-touch-icon.png");
    expect(assetFiles).toContain("favicon-32.png");
    expect(assetFiles.some((f) => /tippy/i.test(f))).toBe(false);
  });

  it("uses system font stack in main.css per HIG direction", () => {
    const css = fs.readFileSync(path.join(ROOT, "src/styles/main.css"), "utf8");
    expect(css).toContain("-apple-system");
    expect(css).toContain("light-dark(");
    expect(css).toContain(':root:has(> head > meta[name="color-scheme"][content="dark"])');
    expect(css).not.toContain("@view-transition");
  });

  it("avoids <search> HTML element collision with @lucide/vue Search icon across Vue templates", () => {
    for (const dir of ["src/pages", "src/components"]) {
      const files = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".vue"));
      for (const file of files) {
        const sfc = fs.readFileSync(path.join(ROOT, dir, file), "utf8");
        expect(sfc, `${dir}/${file} must use role="search" instead of <search>`).not.toMatch(/<search[\s>]/);
      }
    }
  });

  it("ensures all internal HTML links resolve to valid MPA pages and aliases /analytics.html", () => {
    const vercelRaw = fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8");
    const vercel = JSON.parse(vercelRaw) as {
      redirects?: Array<{ source: string; destination: string }>;
    };
    expect(vercel.redirects?.some((r) => r.source === "/analytics.html" && r.destination === "/chart.html")).toBe(true);

    const validTargets = new Set([...KEPT_PAGES, "analytics.html"]);
    const linkPattern = /href="([a-z0-9_-]+\.html)(?:[?#][^"]*)?"/gi;
    for (const dir of ["src/pages", "src/components"]) {
      const files = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith(".vue"));
      for (const file of files) {
        const sfc = fs.readFileSync(path.join(ROOT, dir, file), "utf8");
        for (const match of sfc.matchAll(linkPattern)) {
          const target = match[1];
          expect(validTargets.has(target), `${dir}/${file} links to unknown page ${target}`).toBe(true);
        }
      }
    }
  });
});
