import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  clearSnapshotSyncSource,
  executeOfflineAwareWrite,
  hasPendingSnapshotWrites,
  hasPendingSync,
  justSynced,
  queuedWriteCount,
  resetOfflineSyncForTest,
  servingFromCache,
  syncErrorMsg,
  updateSnapshotSyncState
} from "@/lib/offlineSync";

describe("Offline-first Firestore write queue and sync telemetry", () => {
  const originalOnLine = navigator.onLine;

  function setNavigatorOnLine(val: boolean) {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      get: () => val
    });
  }

  beforeEach(() => {
    resetOfflineSyncForTest();
    setNavigatorOnLine(true);
  });

  afterEach(() => {
    setNavigatorOnLine(originalOnLine);
    vi.useRealTimers();
  });

  it("completes online mutations directly without flagging offline queue", async () => {
    const res = await executeOfflineAwareWrite(async () => ({ ok: true }));
    expect(res).toEqual({ queuedOffline: false });
    expect(queuedWriteCount.value).toBe(0);
    expect(hasPendingSync.value).toBe(false);
  });

  it("propagates errors synchronously when online", async () => {
    await expect(
      executeOfflineAwareWrite(async () => {
        throw new Error("permission-denied");
      })
    ).rejects.toThrow("permission-denied");
    expect(queuedWriteCount.value).toBe(0);
  });

  it("resolves offline writes promptly instead of hanging modals and triggers justSynced upon reconnect flush", async () => {
    setNavigatorOnLine(false);
    let resolveServerCommit!: () => void;
    const pendingCommit = new Promise<void>((resolve) => {
      resolveServerCommit = resolve;
    });

    const res = await executeOfflineAwareWrite(() => pendingCommit);
    expect(res).toEqual({ queuedOffline: true });
    expect(queuedWriteCount.value).toBe(1);
    expect(hasPendingSync.value).toBe(true);

    setNavigatorOnLine(true);
    resolveServerCommit();
    await Promise.resolve();
    await Promise.resolve();

    expect(queuedWriteCount.value).toBe(0);
    expect(hasPendingSync.value).toBe(false);
    expect(justSynced.value).toBe(true);
  });

  it("falls back gracefully on flaky Lie-Fi timeouts and captures deferred sync failures", async () => {
    const onBackgroundError = vi.fn();
    let rejectCommit!: (err: Error) => void;
    const stalledCommit = new Promise<void>((_, reject) => {
      rejectCommit = reject;
    });

    const res = await executeOfflineAwareWrite(() => stalledCommit, {
      lieFiTimeoutMs: 25,
      onBackgroundError
    });
    expect(res).toEqual({ queuedOffline: true });
    expect(queuedWriteCount.value).toBe(1);

    rejectCommit(new Error("deferred rule failure"));
    await Promise.resolve();
    await Promise.resolve();

    expect(queuedWriteCount.value).toBe(0);
    expect(syncErrorMsg.value).toBe("deferred rule failure");
    expect(onBackgroundError).toHaveBeenCalledTimes(1);
  });

  it("tracks multi-source Firestore snapshot cache and pending-write metadata", () => {
    updateSnapshotSyncState("entries", true, true);
    updateSnapshotSyncState("bills", false, true);

    expect(hasPendingSnapshotWrites.value).toBe(true);
    expect(servingFromCache.value).toBe(true);
    expect(hasPendingSync.value).toBe(true);

    updateSnapshotSyncState("entries", false, false);
    expect(hasPendingSnapshotWrites.value).toBe(false);
    expect(servingFromCache.value).toBe(false);
    expect(justSynced.value).toBe(true);

    clearSnapshotSyncSource("entries");
    clearSnapshotSyncSource("bills");
  });
});
