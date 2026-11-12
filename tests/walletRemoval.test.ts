import { describe, it, expect, beforeEach, vi } from "vitest";

const docMock = vi.fn((_db: unknown, ...segments: string[]) => segments.join("/"));
const setDocMock = vi.fn(async (..._args: unknown[]) => undefined);
const deleteFieldMock = vi.fn(() => "DELETE_FIELD_SENTINEL");

vi.mock("@/lib/firebase", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  deleteField: () => deleteFieldMock(),
  updateDoc: vi.fn(),
  doc: (db: unknown, ...segments: string[]) => docMock(db, ...segments),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: () => "SERVER_TS",
  terminate: vi.fn(),
  clearIndexedDbPersistence: vi.fn(),
  waitForPendingWrites: vi.fn()
}));

import { deriveWalletBaseBalance, sumActiveWalletsBalance, walletBalances } from "@/lib/core";
import { removeWallet } from "@/lib/data";

describe("Wallet removal & balance reconciliation", () => {
  beforeEach(() => {
    docMock.mockClear();
    setDocMock.mockClear();
    deleteFieldMock.mockClear();
  });

  it("derives centavo-exact base balance when reconciling or re-linking a removed card", () => {
    const entries = [
      { method: "GCash", type: "income" as const, amount: 500 },
      { method: "GCash", type: "expense" as const, amount: 120.4 },
      { method: "Cash", type: "expense" as const, amount: 50 }
    ];

    const baseForGCash = deriveWalletBaseBalance(entries, "GCash", 1000);
    expect(baseForGCash).toBe(620.4);

    const balancesAfterRelink = walletBalances(entries, { Cash: 100, GCash: baseForGCash });
    expect(balancesAfterRelink.GCash).toBe(1000);
  });

  it("keeps active net balance aligned with linked cards while preserving removed-card logs", () => {
    const entries = [
      { method: "LandBank", type: "income" as const, amount: 0.2 },
      { method: "BDO", type: "expense" as const, amount: 500 }
    ];

    // BDO was removed from Firestore wallets map, leaving Cash and LandBank active
    const balances = walletBalances(entries, { Cash: 10, LandBank: 0.1 });
    expect(balances.BDO).toBe(-500);
    expect(sumActiveWalletsBalance(["Cash", "LandBank"], balances)).toBe(10.3);
  });

  it("rejects removing Cash, invalid keys, and invalid user IDs", async () => {
    await expect(removeWallet("user-1", "Cash")).rejects.toThrow();
    await expect(removeWallet("user-1", " cash ")).rejects.toThrow();
    await expect(removeWallet("user-1", "__proto__")).rejects.toThrow();
    await expect(removeWallet("user-1", "BDO.Savings")).rejects.toThrow();
    await expect(removeWallet("user/1", "GCash")).rejects.toThrow();
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it("removes a linked card via Firestore deleteField merge write", async () => {
    const res = await removeWallet("user-1", "LandBank");
    expect(res).toEqual({ queuedOffline: false });
    expect(docMock).toHaveBeenCalledWith({}, "users", "user-1");
    expect(deleteFieldMock).toHaveBeenCalledTimes(1);
    expect(setDocMock).toHaveBeenCalledWith(
      "users/user-1",
      { wallets: { LandBank: "DELETE_FIELD_SENTINEL" } },
      { merge: true }
    );
  });
});
