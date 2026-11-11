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

import { addUtang, deleteUtang, reopenUtang, settleUtang, updateUtang } from "@/lib/data";

describe("Utang CRUD validation and Firestore contract", () => {
  beforeEach(() => {
    addDocMock.mockReset();
    updateDocMock.mockReset();
    deleteDocMock.mockReset();
  });

  it("writes sanitized new debt records matching Firestore security rules", async () => {
    addDocMock.mockResolvedValueOnce({ id: "utang-1" });
    await addUtang("user_abc", {
      name: "  Carlo Mendoza  ",
      amount: 450.256,
      direction: "owed_to_me",
      dueDate: "2026-11-20",
      notes: "  Split lunch  "
    });

    expect(addDocMock).toHaveBeenCalledWith("users/user_abc/utang", {
      name: "Carlo Mendoza",
      amount: 450.26,
      direction: "owed_to_me",
      dueDate: "2026-11-20",
      notes: "Split lunch",
      status: "Unpaid",
      createdAt: "SERVER_TS"
    });
  });

  it("updates existing records (including partial repayment balances) with strict validation", async () => {
    await updateUtang("user_abc", "doc_1", {
      name: "Maria Santos",
      amount: 300,
      direction: "i_owe",
      dueDate: null,
      notes: "Remaining half"
    });

    expect(updateDocMock).toHaveBeenCalledWith("users/user_abc/utang/doc_1", {
      name: "Maria Santos",
      amount: 300,
      direction: "i_owe",
      dueDate: null,
      notes: "Remaining half",
      updatedAt: "SERVER_TS"
    });
  });

  it("settles, reopens (clearing settledAt), and deletes records cleanly", async () => {
    await settleUtang("user_abc", "doc_1");
    expect(updateDocMock).toHaveBeenCalledWith("users/user_abc/utang/doc_1", {
      status: "Paid",
      settledAt: "SERVER_TS"
    });

    await reopenUtang("user_abc", "doc_1");
    expect(updateDocMock).toHaveBeenLastCalledWith("users/user_abc/utang/doc_1", {
      status: "Unpaid",
      settledAt: null
    });

    await deleteUtang("user_abc", "doc_1");
    expect(deleteDocMock).toHaveBeenCalledWith("users/user_abc/utang/doc_1");
  });

  it("rejects empty names, zero/negative amounts, invalid dates, and path traversal IDs", async () => {
    await expect(
      addUtang("user/bad", { name: "Test", amount: 100, direction: "owed_to_me" })
    ).rejects.toThrow(TypeError);

    await expect(
      addUtang("user_abc", { name: "   ", amount: 100, direction: "owed_to_me" })
    ).rejects.toThrow(TypeError);

    await expect(
      updateUtang("user_abc", "doc_1", { name: "Test", amount: 0, direction: "i_owe" })
    ).rejects.toThrow(RangeError);

    await expect(
      addUtang("user_abc", { name: "Test", amount: 50, direction: "owed_to_me", dueDate: "2026-02-30" })
    ).rejects.toThrow(TypeError);

    await expect(deleteUtang("user_abc", "doc/slash")).rejects.toThrow(TypeError);
  });
});
