import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const docMock = vi.fn((_db: unknown, ...segments: string[]) => segments.join("/"));
const onSnapshotMock = vi.fn();
const runTransactionMock = vi.fn();

vi.mock("@/lib/firebase", () => ({
  db: {}
}));

vi.mock("firebase/firestore", () => ({
  doc: (db: unknown, ...segments: string[]) => docMock(db, ...segments),
  onSnapshot: (...args: unknown[]) => onSnapshotMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  serverTimestamp: () => "SERVER_TS"
}));

import {
  ensureUserCountedInStats,
  readCachedPublicStats,
  resetPublicStatsForTest,
  subscribePublicUserCount,
  writeCachedPublicStats
} from "@/lib/publicStats";

describe("Public registered-user counter and offline cache", () => {
  const originalOnLine = navigator.onLine;

  function setNavigatorOnLine(val: boolean) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => val
    });
  }

  beforeEach(() => {
    localStorage.clear();
    resetPublicStatsForTest();
    docMock.mockClear();
    onSnapshotMock.mockReset();
    runTransactionMock.mockReset();
    setNavigatorOnLine(true);
  });

  afterEach(() => {
    setNavigatorOnLine(originalOnLine);
  });

  it("caches and validates non-negative integer user counts safely", () => {
    writeCachedPublicStats({ totalUsers: 42.9 });
    expect(readCachedPublicStats()).toEqual({ totalUsers: 42, updatedAt: undefined });

    localStorage.setItem("tipid_public_stats_cache", "{bad json");
    expect(readCachedPublicStats()).toBeNull();

    localStorage.setItem("tipid_public_stats_cache", JSON.stringify({ totalUsers: -5 }));
    expect(readCachedPublicStats()).toBeNull();
  });

  it("atomically marks users/{uid}.statsCounted and increments appStats/public once", async () => {
    const txSet = vi.fn();
    runTransactionMock.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<boolean>) => {
      const tx = {
        get: vi.fn(async (ref: string) => {
          if (ref === "users/user_1") return { exists: () => false, data: () => undefined };
          return { exists: () => true, data: () => ({ totalUsers: 19 }) };
        }),
        set: txSet
      };
      return fn(tx);
    });

    const incremented = await ensureUserCountedInStats("user_1");
    expect(incremented).toBe(true);
    expect(txSet).toHaveBeenCalledWith("users/user_1", { statsCounted: true }, { merge: true });
    expect(txSet).toHaveBeenCalledWith("appStats/public", { totalUsers: 20, updatedAt: "SERVER_TS" });
    expect(readCachedPublicStats()?.totalUsers).toBe(20);

    // Repeat invocation in same session is skipped cleanly
    const repeat = await ensureUserCountedInStats("user_1");
    expect(repeat).toBe(false);
    expect(runTransactionMock).toHaveBeenCalledTimes(1);
  });

  it("skips counting cleanly while offline or when user is already counted", async () => {
    setNavigatorOnLine(false);
    expect(await ensureUserCountedInStats("user_offline")).toBe(false);
    expect(runTransactionMock).not.toHaveBeenCalled();

    setNavigatorOnLine(true);
    const txSet = vi.fn();
    runTransactionMock.mockImplementation(async (_db: unknown, fn: (tx: unknown) => Promise<boolean>) => {
      const tx = {
        get: vi.fn(async () => ({ exists: () => true, data: () => ({ statsCounted: true }) })),
        set: txSet
      };
      return fn(tx);
    });

    expect(await ensureUserCountedInStats("user_2")).toBe(false);
    expect(txSet).not.toHaveBeenCalled();
  });

  it("emits cached user count offline and falls back cleanly on Firestore permission errors", () => {
    writeCachedPublicStats({ totalUsers: 12 });
    const received: Array<{ totalUsers: number | null; source: string; errorCode?: string }> = [];

    onSnapshotMock.mockImplementation((_ref: unknown, _opts: unknown, _onNext: unknown, onErr: (err: unknown) => void) => {
      onErr({ code: "permission-denied" });
      return () => {};
    });

    subscribePublicUserCount((snap) => received.push(snap));

    expect(received[0]).toEqual({ totalUsers: 12, source: "cache" });
    expect(received[1]).toEqual({ totalUsers: 12, source: "cache", errorCode: "permission-denied" });
  });
});
