import { beforeEach, describe, expect, it, vi } from "vitest";

const batchUpdateMock = vi.fn();
const batchSetMock = vi.fn();
const batchCommitMock = vi.fn(async () => undefined);
const writeBatchMock = vi.fn(() => ({
  update: batchUpdateMock,
  set: batchSetMock,
  commit: batchCommitMock
}));
const updateDocMock = vi.fn(async (..._args: unknown[]) => undefined);

let autoIdCounter = 0;
const collectionMock = vi.fn((_db: unknown, ...segments: string[]) => segments.join("/"));
const docMock = vi.fn((target: unknown, ...segments: string[]) => {
  if (segments.length === 0 && typeof target === "string") {
    autoIdCounter += 1;
    return `${target}/auto-${autoIdCounter}`;
  }
  return segments.join("/");
});

vi.mock("@/lib/firebase", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  collection: (db: unknown, ...segments: string[]) => collectionMock(db, ...segments),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: vi.fn(),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  doc: (target: unknown, ...segments: string[]) => docMock(target, ...segments),
  setDoc: vi.fn(),
  writeBatch: () => writeBatchMock(),
  increment: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => "SERVER_TS",
  terminate: vi.fn(),
  clearIndexedDbPersistence: vi.fn(),
  waitForPendingWrites: vi.fn()
}));

import { walletBalances } from "@/lib/core";
import { markBillPaidAndScheduleNext } from "@/lib/data";
import type { BillRecord } from "@/types/finance";

describe("markBillPaidAndScheduleNext atomic wallet deduction", () => {
  beforeEach(() => {
    autoIdCounter = 0;
    batchUpdateMock.mockClear();
    batchSetMock.mockClear();
    batchCommitMock.mockClear();
    writeBatchMock.mockClear();
    updateDocMock.mockClear();
    collectionMock.mockClear();
    docMock.mockClear();
  });

  it("atomically marks a one-time bill Paid and deducts from the chosen ATM card", async () => {
    const bill: BillRecord = {
      id: "bill-1",
      title: "Meralco",
      amount: 1500.25,
      dueDate: "2026-11-15",
      category: "Utilities",
      recurrence: "none",
      status: "Unpaid",
      notes: ""
    };

    const res = await markBillPaidAndScheduleNext("user-1", bill, {
      deductFromWallet: "LandBank"
    });

    expect(res.nextDueDate).toBeNull();
    expect(res.deductedWallet).toBe("LandBank");
    expect(updateDocMock).not.toHaveBeenCalled();
    expect(writeBatchMock).toHaveBeenCalledTimes(1);
    expect(batchUpdateMock).toHaveBeenCalledWith("users/user-1/bills/bill-1", {
      status: "Paid",
      updatedAt: "SERVER_TS"
    });
    expect(batchSetMock).toHaveBeenCalledTimes(1);
    expect(batchSetMock).toHaveBeenCalledWith("users/user-1/expenses/auto-1", {
      type: "expense",
      desc: "Bill: Meralco",
      amount: 1500.25,
      category: "Utilities",
      method: "LandBank",
      spendType: "need",
      createdAt: "SERVER_TS"
    });
    expect(batchCommitMock).toHaveBeenCalledTimes(1);

    const writtenExpense = batchSetMock.mock.calls[0]?.[1] as {
      type: "expense";
      amount: number;
      method: string;
    };
    const nextBalances = walletBalances([writtenExpense], { LandBank: 5000.5, Cash: 200 });
    expect(nextBalances.LandBank).toBe(3500.25);
    expect(nextBalances.Cash).toBe(200);
  });

  it("combines bill settlement, wallet deduction, and next recurring bill into one batch", async () => {
    const recurringBill: BillRecord = {
      id: "bill-wifi",
      title: "Converge Fiber",
      amount: 1500,
      dueDate: "2026-11-10",
      category: "Utilities",
      recurrence: "monthly",
      status: "Unpaid",
      notes: "Auto debit"
    };

    const res = await markBillPaidAndScheduleNext("user-1", recurringBill, {
      deductFromWallet: "GoTyme"
    });

    expect(res.nextDueDate).toBe("2026-12-10");
    expect(res.deductedWallet).toBe("GoTyme");
    expect(batchUpdateMock).toHaveBeenCalledTimes(1);
    expect(batchSetMock).toHaveBeenCalledTimes(2);
    expect(batchSetMock.mock.calls[0]?.[1]).toMatchObject({
      type: "expense",
      desc: "Bill: Converge Fiber",
      amount: 1500,
      method: "GoTyme"
    });
    expect(batchSetMock.mock.calls[1]?.[1]).toMatchObject({
      title: "Converge Fiber",
      amount: 1500,
      dueDate: "2026-12-10",
      recurrence: "monthly",
      status: "Unpaid"
    });
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it("keeps lightweight single-doc status update when wallet deduction is skipped on non-recurring bill", async () => {
    const bill: BillRecord = {
      id: "bill-2",
      title: "Water",
      amount: 420,
      dueDate: "2026-11-20",
      category: "Utilities",
      recurrence: "none",
      status: "Unpaid",
      notes: ""
    };

    const res = await markBillPaidAndScheduleNext("user-1", bill, { deductFromWallet: null });

    expect(res.deductedWallet).toBeNull();
    expect(res.nextDueDate).toBeNull();
    expect(writeBatchMock).not.toHaveBeenCalled();
    expect(updateDocMock).toHaveBeenCalledWith("users/user-1/bills/bill-2", { status: "Paid" });
  });

  it("clamps long bill titles safely for expense descriptions and rejects unsafe wallet keys", async () => {
    const longTitleBill: BillRecord = {
      id: "bill-long",
      title: "A".repeat(120),
      amount: 99,
      dueDate: "2026-11-22",
      category: "Bills",
      recurrence: "none",
      status: "Unpaid",
      notes: ""
    };

    await markBillPaidAndScheduleNext("user-1", longTitleBill, { deductFromWallet: "Cash" });
    const written = batchSetMock.mock.calls[0]?.[1] as { desc: string };
    expect(written.desc.startsWith("Bill: A")).toBe(true);
    expect(written.desc.length).toBe(120);

    batchCommitMock.mockClear();
    await expect(
      markBillPaidAndScheduleNext("user-1", longTitleBill, { deductFromWallet: "__proto__" })
    ).rejects.toThrow();
    await expect(
      markBillPaidAndScheduleNext("user-1", longTitleBill, { deductFromWallet: "Bank.Dot" })
    ).rejects.toThrow();
    expect(batchCommitMock).not.toHaveBeenCalled();
  });
});
