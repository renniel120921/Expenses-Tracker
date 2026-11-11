import { describe, it, expect, beforeEach } from "vitest";
import {
  addMonthsClamped,
  buildTransactionsCsv,
  cleanText,
  csvEscapeCell,
  dayDiffFromKeys,
  entryDate,
  formatDateKeyReadable,
  formatPeso,
  fromCentavos,
  isDateKey,
  manilaDateKey,
  money,
  parseDateKey,
  storageKey,
  sumMoney,
  toCentavos,
  walletBalances
} from "@/lib/core";
import { parseTransactionSms } from "@/lib/smsParser";
import {
  disableBiometrics,
  isBiometricEnabled,
  isSessionUnlocked,
  setBiometricEnabled,
  setPasscode,
  verifyPasscode
} from "@/lib/biometrics";
import type { TransactionEntry } from "@/types/finance";

describe("Financial integer centavo math", () => {
  it("converts monetary amounts accurately without IEEE-754 float drift", () => {
    expect(toCentavos(0.1)).toBe(10);
    expect(toCentavos("19.99")).toBe(1999);
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(money(12.345)).toBe(12.35);
    expect(fromCentavos(1050)).toBe(10.5);
  });

  it("rejects non-positive values by default and honors allowZero/allowNegative", () => {
    expect(() => toCentavos(0)).toThrow(RangeError);
    expect(() => toCentavos(-5)).toThrow(RangeError);
    expect(() => toCentavos("")).toThrow(TypeError);
    expect(toCentavos(0, { allowZero: true })).toBe(0);
    expect(toCentavos(-25.5, { allowNegative: true })).toBe(-2550);
  });

  it("reconciles wallet balances across base balances, income, and expenses", () => {
    const balances = walletBalances(
      [
        { type: "income", method: "GCash", amount: 1500.5 },
        { type: "expense", method: "GCash", amount: 250.25 },
        { type: "expense", method: "Cash", amount: 99.99 }
      ],
      { Cash: 500, GCash: 100 }
    );
    expect(balances.GCash).toBe(1350.25);
    expect(balances.Cash).toBe(400.01);
  });
});

describe("Dates, storage isolation, formatting, and CSV injection defense", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("clamps month overflow cleanly (Jan 31 + 1 month -> Feb 28)", () => {
    const next = addMonthsClamped("2026-01-31", 1);
    expect(next).not.toBeNull();
    expect(manilaDateKey(next!)).toBe("2026-02-28");
  });

  it("validates strict YYYY-MM-DD calendar keys", () => {
    expect(isDateKey("2026-02-28")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-13-01")).toBe(false);
  });

  it("parses and diffs plain calendar keys without timezone or DST drift", () => {
    expect(parseDateKey("2026-11-15")).toEqual({ year: 2026, month: 11, day: 15 });
    expect(parseDateKey("2026-02-30")).toBeNull();
    expect(dayDiffFromKeys("2026-11-15", "2026-11-11")).toBe(4);
    expect(dayDiffFromKeys("2026-11-09", "2026-11-11")).toBe(-2);
    expect(dayDiffFromKeys("2026-03-01", "2024-02-29")).toBe(731);
    expect(formatDateKeyReadable("2026-11-15")).toContain("Nov");
  });

  it("scopes per-user storage keys safely", () => {
    expect(storageKey("user_123", "lang")).toBe("tipid_user_user_123_lang");
    expect(() => storageKey("../bad", "lang")).not.toThrow();
    expect(storageKey("../bad", "lang")).toBe("tipid_user_bad_lang");
    expect(() => storageKey("", "lang")).toThrow(TypeError);
  });

  it("parses entryDate across string dates and Firestore-style timestamps", () => {
    expect(entryDate({ date: "2026-05-01" })?.toISOString().slice(0, 10)).toBe("2026-04-30"); // 2026-05-01T00:00+08:00
    expect(entryDate({ createdAt: { toMillis: () => 1700000000000 } })?.getTime()).toBe(1700000000000);
    expect(cleanText("  Lunch  ", "Desc", 50)).toBe("Lunch");
    expect(formatPeso(1234.5)).toContain("1,234.50");
    expect(formatPeso(1234, true)).toBe("1,234");
  });

  it("neutralizes OWASP CSV formula injection prefixes", () => {
    expect(csvEscapeCell("=SUM(A1:A5)")).toBe("\"'=SUM(A1:A5)\"");
    expect(csvEscapeCell("+cmd|' /C calc'!A0")).toBe("\"'+cmd|' /C calc'!A0\"");
    expect(csvEscapeCell("-100+2")).toBe("\"'-100+2\"");
    expect(csvEscapeCell("@IMPORTXML")).toBe("\"'@IMPORTXML\"");

    const sample: TransactionEntry[] = [
      {
        id: "1",
        type: "expense",
        desc: '=HYPERLINK("https://evil.test","click")',
        amount: 42.5,
        category: "Food & Dining",
        method: "GCash",
        spendType: "need",
        date: "2026-06-15"
      }
    ];
    const csv = buildTransactionsCsv(sample);
    expect(csv).toContain("\"'=HYPERLINK");
    expect(csv.split("\n")).toHaveLength(2);
  });
});

describe("SMS quick-parser & local passcode lock", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("extracts amount, wallet, direction, and category from PH bank/e-wallet SMS", () => {
    const parsed = parseTransactionSms(
      "You have paid PHP 1,245.50 via GCash to Jollibee Ayala on 06/12/2026.",
      ["Cash", "GCash", "Maya"]
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.amount).toBe("1245.50");
    expect(parsed!.method).toBe("GCash");
    expect(parsed!.type).toBe("expense");
    expect(parsed!.category).toBe("Food & Dining");
    expect(parsed!.desc).toContain("Jollibee");
  });

  it("sets and verifies salted PIN passcodes per user", async () => {
    const uid = "user_pin_test";
    await setPasscode(uid, "2580");
    setBiometricEnabled(uid, true);

    expect(isBiometricEnabled(uid)).toBe(true);
    expect(isSessionUnlocked(uid)).toBe(false);
    expect(await verifyPasscode(uid, "9999")).toBe(false);
    expect(isSessionUnlocked(uid)).toBe(false);
    expect(await verifyPasscode(uid, "2580")).toBe(true);
    expect(isSessionUnlocked(uid)).toBe(true);

    disableBiometrics(uid);
    expect(isBiometricEnabled(uid)).toBe(false);
  });
});
