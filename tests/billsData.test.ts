import { describe, it, expect, beforeEach, vi } from "vitest";

const addDocMock = vi.fn();
const updateDocMock = vi.fn();
const deleteDocMock = vi.fn();
const collectionMock = vi.fn((_db: unknown, ...segments: string[]) => segments.join("/"));
const docMock = vi.fn((_db: unknown, ...segments: string[]) => segments.join("/"));

vi.mock("@/lib/firebase", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  collection: (db: unknown, ...segments: string[]) => collectionMock(db, ...segments),
  doc: (db: unknown, ...segments: string[]) => docMock(db, ...segments),
  addDoc: (...args: unknown[]) => addDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  deleteDoc: (...args: unknown[]) => deleteDocMock(...args),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => () => {}),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => "SERVER_TS",
  terminate: vi.fn(),
  clearIndexedDbPersistence: vi.fn(),
  waitForPendingWrites: vi.fn()
}));

import { addBill, deleteBill, updateBill, updateBillStatus } from "@/lib/data";

describe("Bills CRUD validation and Firestore contract", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
  });

  it("writes sanitized new bills matching Firestore rules", async () => {
    addDocMock.mockResolvedValueOnce({ id: "bill-1" });
    await addBill("user_abc", {
      title: "  SpayLater  ",
      amount: 425,
      dueDate: "2026-11-15",
      category: "Utang / Loan",
      notes: "  Monthly installment  "
    });

    expect(addDocMock).toHaveBeenCalledWith("users/user_abc/bills", {
      title: "SpayLater",
      amount: 425,
      dueDate: "2026-11-15",
      category: "Utang / Loan",
      notes: "Monthly installment",
      recurrence: "none",
      status: "Unpaid",
      createdAt: "SERVER_TS"
    });
  });

  it("updates bill details, toggles Paid/Unpaid status, and deletes safely", async () => {
    await updateBill("user_abc", "bill_1", {
      title: "PLDT Fiber",
      amount: 1699.5,
      dueDate: "2026-11-28",
      category: "Internet & Mobile",
      recurrence: "monthly",
      notes: "Account 123"
    });

    expect(updateDocMock).toHaveBeenCalledWith("users/user_abc/bills/bill_1", {
      title: "PLDT Fiber",
      amount: 1699.5,
      dueDate: "2026-11-28",
      category: "Internet & Mobile",
      notes: "Account 123",
      recurrence: "monthly",
      updatedAt: "SERVER_TS"
    });

    await updateBillStatus("user_abc", "bill_1", "Paid");
    expect(updateDocMock).toHaveBeenLastCalledWith("users/user_abc/bills/bill_1", { status: "Paid" });

    await deleteBill("user_abc", "bill_1");
    expect(deleteDocMock).toHaveBeenCalledWith("users/user_abc/bills/bill_1");
  });

  it("rejects empty titles, invalid amounts, invalid dates, and path traversal IDs", async () => {
    await expect(
      addBill("user_abc", { title: "   ", amount: 100, dueDate: "2026-11-15", category: "Utilities" })
    ).rejects.toThrow(TypeError);

    await expect(
      updateBill("user_abc", "bill_1", { title: "Bill", amount: 0, dueDate: "2026-11-15", category: "Utilities" })
    ).rejects.toThrow(RangeError);

    await expect(
      addBill("user_abc", { title: "Bill", amount: 100, dueDate: "2026-02-30", category: "Utilities" })
    ).rejects.toThrow(TypeError);

    await expect(deleteBill("user/bad", "bill_1")).rejects.toThrow(TypeError);
  });
});
