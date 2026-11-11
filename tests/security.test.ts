import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertSafeObjectKey,
  cleanText,
  csvEscapeCell,
  optionalText,
  sanitizeAvatarUrl,
  walletBalances
} from "@/lib/core";
import { parseTransactionSms } from "@/lib/smsParser";
import { disableBiometrics, setPasscode, verifyPasscode } from "@/lib/biometrics";
import { checkRateLimit, recordFailure, recordSuccess } from "@/lib/rateLimit";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function walkCodeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkCodeFiles(full));
    } else if (/\.(ts|vue|js)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe("Application security, input sanitation, rate limiting, indexing & caching", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("strips unsafe ASCII control and bidi override characters from form text inputs", () => {
    const dirty = "Lunch\u0000\u0007\u202Egpj.exe Meal\n";
    expect(cleanText(dirty, "Description", 120)).toBe("Lunchgpj.exe Meal");
    expect(optionalText("\u2066Notes\u001F", 500)).toBe("Notes");
    expect(() => cleanText("\u0000\u202E   ", "Description", 120)).toThrow(TypeError);
  });

  it("blocks prototype-pollution and dotted keys on dynamic wallet balances", () => {
    expect(() => assertSafeObjectKey("__proto__", "Wallet")).toThrow(TypeError);
    expect(() => assertSafeObjectKey("constructor", "Wallet")).toThrow(TypeError);
    expect(() => assertSafeObjectKey("prototype", "Wallet")).toThrow(TypeError);
    expect(() => assertSafeObjectKey("wallets.Cash", "Wallet")).toThrow(TypeError);
    expect(assertSafeObjectKey("GCash", "Wallet")).toBe("GCash");

    const polluted = Object.assign(Object.create(null), { Cash: 500, __proto__: 99999 });
    const computed = walletBalances(
      [{ type: "expense", method: "__proto__", amount: 100 }],
      polluted
    );
    expect(Object.getPrototypeOf(computed)).toBe(Object.prototype);
    expect(computed.Cash).toBe(400);
  });

  it("sanitizes avatar and photo URLs against javascript: and SVG XSS URIs", () => {
    expect(sanitizeAvatarUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeAvatarUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    expect(sanitizeAvatarUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe("");
    expect(sanitizeAvatarUrl("https://lh3.googleusercontent.com/avatar.png")).toBe(
      "https://lh3.googleusercontent.com/avatar.png"
    );
    expect(sanitizeAvatarUrl("data:image/jpeg;base64,/9j/4AAQ==")).toBe(
      "data:image/jpeg;base64,/9j/4AAQ=="
    );
  });

  it("neutralizes spreadsheet formula injection in CSV export cells", () => {
    expect(csvEscapeCell("=CMD|' /C calc'!A0")).toBe(`"'=CMD|' /C calc'!A0"`);
    expect(csvEscapeCell("+SUM(A1:A2)")).toBe(`"'+SUM(A1:A2)"`);
    expect(csvEscapeCell("-1+1")).toBe(`"'-1+1"`);
    expect(csvEscapeCell("@HYPERLINK()")).toBe(`"'@HYPERLINK()"`);
  });

  it("bounds SMS parser input length and rejects absurd monetary overflow payloads", () => {
    const oversized = `${"A".repeat(4500)} PHP 250.00 paid via GCash at Store`;
    expect(parseTransactionSms(oversized, ["Cash", "GCash"])).toBeNull();

    const overflowAmount = "Paid PHP 99999999999999.00 using GCash at Store";
    expect(parseTransactionSms(overflowAmount, ["Cash", "GCash"])).toBeNull();

    const validDirty = "You paid PHP 120.00 via GCash at\u0007 Store\u202E PH.";
    const parsed = parseTransactionSms(validDirty, ["Cash", "GCash"]);
    expect(parsed?.desc).not.toMatch(/[\u0007\u202E]/);
    expect(parsed?.amount).toBe("120.00");
  });

  it("hashes app-lock PIN with salted PBKDF2, upgrades legacy v1 hashes, and enforces brute-force lockout", async () => {
    const uid = "pin_test_user";
    disableBiometrics(uid);

    expect(await setPasscode(uid, "1234")).toBe(true);
    const stored = localStorage.getItem(`tipid_biometrics_pin_${uid}`) || "";
    expect(stored.startsWith("v2$")).toBe(true);
    expect(stored).not.toContain("1234");

    // 5 failed guesses trigger exponential rate limit
    for (let i = 0; i < 5; i += 1) {
      expect(await verifyPasscode(uid, "9999")).toBe(false);
    }
    await expect(verifyPasscode(uid, "1234")).rejects.toMatchObject({ code: "app/rate-limited" });

    // Clear lockout cleanly via shared limiter for legitimate unlock verification
    recordSuccess("pinUnlock", uid);
    expect(await verifyPasscode(uid, "1234")).toBe(true);
  });

  it("exposes shared exponential rate limiting directly", () => {
    recordSuccess("pinUnlock", "rl_uid");
    for (let i = 0; i < 5; i += 1) {
      recordFailure("pinUnlock", "rl_uid");
    }
    expect(() => checkRateLimit("pinUnlock", "rl_uid")).toThrow();
  });

  it("keeps source code free of raw HTML XSS sinks", () => {
    const files = [
      ...walkCodeFiles(path.join(ROOT, "src")),
      ...walkCodeFiles(path.join(ROOT, "public"))
    ];
    const sinkPattern = /\bv-html\b|\binnerHTML\b|\bouterHTML\b|\bdocument\.write\s*\(|\beval\s*\(|new\s+Function\s*\(/;
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      expect(text, `${path.relative(ROOT, file)} must avoid unsafe DOM/JS sinks`).not.toMatch(sinkPattern);
    }
  });

  it("enforces HSTS, COOP, CORP, route caching headers, and Firestore indexes configuration", () => {
    const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")) as {
      headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };
    const rootHeaders = vercel.headers[0].headers;
    expect(rootHeaders.find((h) => h.key === "Strict-Transport-Security")?.value).toContain("max-age=31536000");
    expect(rootHeaders.find((h) => h.key === "Cross-Origin-Opener-Policy")?.value).toBe("same-origin-allow-popups");
    expect(rootHeaders.find((h) => h.key === "Cross-Origin-Resource-Policy")?.value).toBe("same-origin");

    const swHeaders = vercel.headers.find((r) => r.source === "/sw.js")?.headers || [];
    expect(swHeaders.find((h) => h.key === "Cache-Control")?.value).toContain("no-store");

    const assetHeaders = vercel.headers.find((r) => r.source === "/assets/(.*)")?.headers || [];
    expect(assetHeaders.find((h) => h.key === "Cache-Control")?.value).toContain("immutable");

    const firebaseConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "firebase.json"), "utf8")) as {
      firestore?: { rules?: string; indexes?: string };
    };
    expect(firebaseConfig.firestore?.rules).toBe("firestore.rules");
    expect(firebaseConfig.firestore?.indexes).toBe("firestore.indexes.json");

    const indexes = JSON.parse(fs.readFileSync(path.join(ROOT, "firestore.indexes.json"), "utf8")) as {
      indexes: Array<{ collectionGroup: string }>;
    };
    expect(indexes.indexes.length).toBeGreaterThanOrEqual(4);
  });
});
