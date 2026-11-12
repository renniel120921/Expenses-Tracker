import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildTransactionsCsv,
  deriveWalletBaseBalance,
  sumActiveWalletsBalance,
  walletBalances
} from "@/lib/core";
import {
  computeCategoryBudgetStatuses,
  computeNextBillDueDate,
  computeSafeToSpendMetrics,
  computeSavingsJarProgress,
  resolveBudgetCycleWindow
} from "@/lib/planMath";
import type { TransactionEntry } from "@/types/finance";

const addDocMock = vi.fn();
const setDocMock = vi.fn();
const updateDocMock = vi.fn();
const batchUpdateMock = vi.fn();
const batchSetMock = vi.fn();
const batchCommitMock = vi.fn();
const onSnapshotMock = vi.fn();
let docCounter = 0;

vi.mock("@/lib/firebase", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  collection: (_db: unknown, ...segments: string[]) => segments.join("/"),
  doc: (_dbOrCol: unknown, ...segments: string[]) =>
    segments.length > 0 ? segments.join("/") : `auto_doc_${++docCounter}`,
  addDoc: (...args: unknown[]) => addDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  deleteDoc: vi.fn(),
  deleteField: () => "DELETE_FIELD",
  increment: (n: number) => ({ __increment: n }),
  writeBatch: () => ({
    update: batchUpdateMock,
    set: batchSetMock,
    commit: batchCommitMock
  }),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => "SERVER_TS",
  terminate: vi.fn(),
  clearIndexedDbPersistence: vi.fn(),
  waitForPendingWrites: vi.fn()
}));

import {
  addSavingsGoal,
  addTransfer,
  depositToSavingsGoal,
  isPermissionDeniedError,
  markBillPaidAndScheduleNext,
  saveCategoryBudget,
  setBudgetCycle,
  subscribeCategoryBudgets,
  subscribeSavingsGoals
} from "@/lib/data";

describe("Wallet transfers math and CSV export", () => {
  it("moves funds between wallets without changing combined liquidity", () => {
    const entries: Partial<TransactionEntry>[] = [
      { type: "income", method: "Cash", amount: 5000 },
      { type: "transfer", method: "Cash", toMethod: "GCash", amount: 1250.5 },
      { type: "expense", method: "GCash", amount: 250.5 }
    ];

    const balances = walletBalances(entries, { Cash: 0, GCash: 100 });
    expect(balances.Cash).toBe(3749.5);
    expect(balances.GCash).toBe(1100);
    expect(sumActiveWalletsBalance(["Cash", "GCash"], balances)).toBe(4849.5);
  });

  it("accounts for incoming and outgoing transfers when deriving wallet base balance", () => {
    const entries: Partial<TransactionEntry>[] = [
      { type: "transfer", method: "BPI", toMethod: "GCash", amount: 2000 },
      { type: "expense", method: "GCash", amount: 500 }
    ];
    // GCash net from entries = +2000 - 500 = +1500. To reach current 2300, base must be 800.
    expect(deriveWalletBaseBalance(entries, "GCash", 2300)).toBe(800);
    // BPI net from entries = -2000. To reach current 1000, base must be 3000.
    expect(deriveWalletBaseBalance(entries, "BPI", 1000)).toBe(3000);
  });

  it("formats From -> To wallets cleanly in exported CSV", () => {
    const csv = buildTransactionsCsv([
      {
        id: "t1",
        type: "transfer",
        desc: "Cash-in GCash",
        amount: 1000,
        category: "Transfer",
        method: "Cash",
        toMethod: "GCash",
        date: "2026-11-12"
      }
    ]);
    expect(csv).toContain('"Cash -> GCash"');
    expect(csv).toContain('"transfer"');
  });
});

describe("Recurring bill due-date scheduling", () => {
  it("computes next due dates and clamps end-of-month dates across leap and non-leap years", () => {
    expect(computeNextBillDueDate("2026-11-01", "none")).toBeNull();
    expect(computeNextBillDueDate("2026-11-01", "weekly")).toBe("2026-11-08");
    expect(computeNextBillDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(computeNextBillDueDate("2024-01-31", "monthly")).toBe("2024-02-29");
    expect(computeNextBillDueDate("2026-11-30", "quarterly")).toBe("2027-02-28");
    expect(computeNextBillDueDate("2024-02-29", "yearly")).toBe("2025-02-28");
  });
});

describe("Budget cycles, category envelopes, and safe-to-spend calculations", () => {
  it("resolves monthly and kinsenas cycle windows accurately", () => {
    const firstHalf = resolveBudgetCycleWindow("2026-02-10", "kinsenas");
    expect(firstHalf).toEqual({
      cycle: "kinsenas",
      startKey: "2026-02-01",
      endKey: "2026-02-15",
      totalDays: 15,
      elapsedDays: 10,
      remainingDays: 6
    });

    const secondHalf = resolveBudgetCycleWindow("2026-02-20", "kinsenas");
    expect(secondHalf).toEqual({
      cycle: "kinsenas",
      startKey: "2026-02-16",
      endKey: "2026-02-28",
      totalDays: 13,
      elapsedDays: 5,
      remainingDays: 9
    });

    const monthly = resolveBudgetCycleWindow("2026-11-12", "monthly");
    expect(monthly.startKey).toBe("2026-11-01");
    expect(monthly.endKey).toBe("2026-11-30");
    expect(monthly.remainingDays).toBe(19);
  });

  it("ignores transfers and income when computing category envelope utilization", () => {
    const entries: TransactionEntry[] = [
      { id: "e1", type: "expense", desc: "Lunch", amount: 850, category: "Food & Dining", method: "Cash", date: "2026-11-05" },
      { id: "e2", type: "transfer", desc: "Move", amount: 5000, category: "Food & Dining", method: "Cash", toMethod: "GCash", date: "2026-11-06" },
      { id: "e3", type: "income", desc: "Refund", amount: 1000, category: "Food & Dining", method: "Cash", date: "2026-11-07" },
      { id: "e4", type: "expense", desc: "Grab", amount: 650, category: "Transportation", method: "GCash", date: "2026-11-10" },
      { id: "e5", type: "expense", desc: "Old", amount: 999, category: "Food & Dining", method: "Cash", date: "2026-10-31" }
    ];
    const result = computeCategoryBudgetStatuses({
      entries,
      budgets: [
        { id: "b1", category: "Food & Dining", limitAmount: 1000 },
        { id: "b2", category: "Transportation", limitAmount: 500 }
      ],
      cycleStartKey: "2026-11-01",
      cycleEndKey: "2026-11-15",
      warningThresholdPct: 80
    });

    expect(result.totalPeriodExpense).toBe(1500);
    expect(result.statuses[0]).toMatchObject({ category: "Food & Dining", spentAmount: 850, pct: 85, state: "warning" });
    expect(result.statuses[1]).toMatchObject({ category: "Transportation", spentAmount: 650, remainingAmount: -150, state: "over" });
  });

  it("computes Safe-to-Spend daily allowance and Free Cash After Unpaid Bills", () => {
    const metrics = computeSafeToSpendMetrics({
      capAmount: 10000,
      spentAmount: 3000,
      remainingDays: 7,
      activeLiquidityBalance: 8500,
      unpaidBillsInCycle: 2200.5
    });
    expect(metrics.remainingBudget).toBe(7000);
    expect(metrics.dailySafeSpend).toBe(1000);
    expect(metrics.freeAfterBills).toBe(6299.5);
  });
});

describe("Savings jars pace and milestone progress", () => {
  it("computes daily/payday saving pace and milestone tiers accurately", () => {
    const progress = computeSavingsJarProgress(
      { id: "g1", targetAmount: 12000, savedAmount: 6000, targetDate: "2026-12-12" },
      "2026-11-12"
    );
    expect(progress.pct).toBe(50);
    expect(progress.milestone).toBe(50);
    expect(progress.daysRemaining).toBe(30);
    expect(progress.suggestedDaily).toBe(200);
    expect(progress.suggestedPayday).toBe(3000);
    expect(progress.isCompleted).toBe(false);

    const completed = computeSavingsJarProgress(
      { id: "g2", targetAmount: 5000, savedAmount: 5500, targetDate: "2026-12-01" },
      "2026-11-12"
    );
    expect(completed.pct).toBe(100);
    expect(completed.milestone).toBe(100);
    expect(completed.isCompleted).toBe(true);
    expect(completed.suggestedDaily).toBeNull();
  });
});

describe("Planning and transfer Firestore write contracts", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    setDocMock.mockReset();
    updateDocMock.mockReset();
    batchUpdateMock.mockReset();
    batchSetMock.mockReset();
    batchCommitMock.mockReset();
    onSnapshotMock.mockReset();
    onSnapshotMock.mockReturnValue(() => {});
    docCounter = 0;
  });

  it("writes atomic transfer entries and rejects identical wallets", async () => {
    addDocMock.mockResolvedValueOnce({ id: "tx_transfer" });
    await addTransfer("user_abc", {
      amount: 1500,
      fromMethod: "Cash",
      toMethod: "GCash"
    });
    expect(addDocMock).toHaveBeenCalledWith("users/user_abc/expenses", {
      type: "transfer",
      desc: "Cash -> GCash",
      amount: 1500,
      category: "Transfer",
      method: "Cash",
      toMethod: "GCash",
      note: "",
      createdAt: "SERVER_TS"
    });

    await expect(
      addTransfer("user_abc", { amount: 500, fromMethod: "Cash", toMethod: "Cash" })
    ).rejects.toThrow(RangeError);
  });

  it("atomically marks recurring bills paid and schedules the next due occurrence", async () => {
    batchCommitMock.mockResolvedValueOnce(undefined);
    const { nextDueDate } = await markBillPaidAndScheduleNext("user_abc", {
      id: "bill_1",
      title: "Fiber",
      amount: 1699,
      dueDate: "2026-11-30",
      category: "Internet & Mobile",
      notes: "Acct 9",
      recurrence: "monthly",
      status: "Unpaid"
    });

    expect(nextDueDate).toBe("2026-12-30");
    expect(batchUpdateMock).toHaveBeenCalledWith("users/user_abc/bills/bill_1", {
      status: "Paid",
      updatedAt: "SERVER_TS"
    });
    expect(batchSetMock).toHaveBeenCalledWith("auto_doc_1", {
      title: "Fiber",
      amount: 1699,
      dueDate: "2026-12-30",
      category: "Internet & Mobile",
      notes: "Acct 9",
      recurrence: "monthly",
      status: "Unpaid",
      createdAt: "SERVER_TS"
    });
  });

  it("creates savings jars, deposits atomically with optional wallet deduction, and sets cycle/envelopes", async () => {
    addDocMock.mockResolvedValueOnce({ id: "jar_1" });
    await addSavingsGoal("user_abc", {
      name: "Emergency Fund",
      targetAmount: 20000,
      savedAmount: 2500,
      wallet: "GCash",
      targetDate: "2027-06-01",
      color: "emerald"
    });
    expect(addDocMock).toHaveBeenCalledWith("users/user_abc/savingsGoals", {
      name: "Emergency Fund",
      targetAmount: 20000,
      savedAmount: 2500,
      wallet: "GCash",
      targetDate: "2027-06-01",
      color: "emerald",
      createdAt: "SERVER_TS",
      updatedAt: "SERVER_TS"
    });

    batchCommitMock.mockResolvedValueOnce(undefined);
    await depositToSavingsGoal(
      "user_abc",
      { id: "jar_1", name: "Emergency Fund" },
      500,
      { deductFromWallet: "GCash" }
    );
    expect(batchUpdateMock).toHaveBeenCalledWith("users/user_abc/savingsGoals/jar_1", {
      savedAmount: { __increment: 500 },
      updatedAt: "SERVER_TS"
    });
    expect(batchSetMock).toHaveBeenCalledWith("auto_doc_1", {
      type: "expense",
      desc: "Savings: Emergency Fund",
      amount: 500,
      category: "Savings",
      method: "GCash",
      spendType: "need",
      createdAt: "SERVER_TS"
    });

    await saveCategoryBudget("user_abc", { category: "Food & Dining", limitAmount: 4500 });
    expect(addDocMock).toHaveBeenLastCalledWith("users/user_abc/categoryBudgets", {
      category: "Food & Dining",
      limitAmount: 4500,
      createdAt: "SERVER_TS",
      updatedAt: "SERVER_TS"
    });

    await setBudgetCycle("user_abc", "kinsenas");
    expect(setDocMock).toHaveBeenCalledWith(
      "users/user_abc",
      { budgetCycle: "kinsenas" },
      { merge: true }
    );
  });

  it("handles permission-denied errors gracefully on optional planning subscriptions", () => {
    expect(isPermissionDeniedError({ code: "permission-denied" })).toBe(true);
    expect(isPermissionDeniedError({ code: "firestore/permission-denied" })).toBe(true);
    expect(isPermissionDeniedError(new Error("Missing or insufficient permissions."))).toBe(true);
    expect(isPermissionDeniedError(new Error("Network offline"))).toBe(false);

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const permErr = Object.assign(new Error("Missing or insufficient permissions."), {
        code: "permission-denied"
      });
      onSnapshotMock.mockImplementation((_q: unknown, _opts: unknown, _next: unknown, onErr: (e: unknown) => void) => {
        onErr(permErr);
        return () => {};
      });

      const jarValues: unknown[] = [];
      const budgetValues: unknown[] = [];
      const jarErrors: unknown[] = [];
      const budgetErrors: unknown[] = [];

      const unsubJars = subscribeSavingsGoals("user_abc", (v) => jarValues.push(v), (e) => jarErrors.push(e));
      const unsubBudgets = subscribeCategoryBudgets("user_abc", (v) => budgetValues.push(v), (e) => budgetErrors.push(e));
      unsubJars();
      unsubBudgets();

      expect(jarValues).toEqual([[]]);
      expect(budgetValues).toEqual([[]]);
      expect(jarErrors).toEqual([permErr]);
      expect(budgetErrors).toEqual([permErr]);
      expect(errSpy).not.toHaveBeenCalled();
    } finally {
      errSpy.mockRestore();
      warnSpy.mockRestore();
    }
  });
});
