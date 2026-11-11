import { computed, ref } from "vue";

export interface OfflineWriteResult {
  queuedOffline: boolean;
}

export interface OfflineWriteOptions {
  /** Maximum wait before treating an online write on flaky networks as queued offline. */
  lieFiTimeoutMs?: number;
  /** Invoked if a background queued write later fails when reconnecting. */
  onBackgroundError?: (err: unknown) => void;
}

export const networkOnline = ref<boolean>(
  typeof navigator === "undefined" ? true : navigator.onLine !== false
);

/** Count of mutations initiated locally that have not yet been server-acknowledged. */
export const queuedWriteCount = ref<number>(0);

/** Map of active Firestore subscriptions currently reporting snap.metadata.hasPendingWrites. */
const pendingSources = new Map<string, boolean>();
const cachedSources = new Map<string, boolean>();

export const hasPendingSnapshotWrites = ref<boolean>(false);
export const servingFromCache = ref<boolean>(false);
export const justSynced = ref<boolean>(false);
export const lastSyncedAt = ref<number | null>(null);
export const syncErrorMsg = ref<string>("");

let justSyncedTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;
let sawPendingThisSession = false;

export const hasPendingSync = computed(
  () => queuedWriteCount.value > 0 || hasPendingSnapshotWrites.value
);

function recomputeSnapshotFlags(): void {
  let pending = false;
  let allFromCache = cachedSources.size > 0;

  for (const val of pendingSources.values()) {
    if (val) pending = true;
  }
  for (const val of cachedSources.values()) {
    if (!val) {
      allFromCache = false;
      break;
    }
  }

  const wasPending = hasPendingSnapshotWrites.value;
  hasPendingSnapshotWrites.value = pending;
  servingFromCache.value = allFromCache;

  if (pending) {
    sawPendingThisSession = true;
  } else if (wasPending && sawPendingThisSession && networkOnline.value) {
    triggerJustSynced();
  }
}

export function triggerJustSynced(): void {
  lastSyncedAt.value = Date.now();
  sawPendingThisSession = false;
  justSynced.value = true;
  if (justSyncedTimer) clearTimeout(justSyncedTimer);
  justSyncedTimer = setTimeout(() => {
    justSynced.value = false;
    justSyncedTimer = null;
  }, 3200);
}

export function updateSnapshotSyncState(
  source: string,
  hasPendingWrites: boolean,
  fromCache: boolean
): void {
  pendingSources.set(source, Boolean(hasPendingWrites));
  cachedSources.set(source, Boolean(fromCache));
  recomputeSnapshotFlags();
}

export function clearSnapshotSyncSource(source: string): void {
  pendingSources.delete(source);
  cachedSources.delete(source);
  recomputeSnapshotFlags();
}

export function initNetworkListeners(): void {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;

  const syncFlag = () => {
    networkOnline.value = typeof navigator === "undefined" ? true : navigator.onLine !== false;
  };
  window.addEventListener("online", syncFlag);
  window.addEventListener("offline", syncFlag);
  syncFlag();
}

/**
 * Executes a validated Firestore mutation safely under online, offline, and slow ("Lie-Fi")
 * network conditions.
 *
 * When offline, Firestore persists writes synchronously into its IndexedDB local cache and updates
 * `onSnapshot` listeners immediately, while delaying resolution of the write Promise until the
 * backend acknowledges it. Awaiting the raw Promise offline freezes modal forms indefinitely.
 */
export async function executeOfflineAwareWrite<T>(
  writeFactory: () => Promise<T>,
  options: OfflineWriteOptions = {}
): Promise<OfflineWriteResult> {
  initNetworkListeners();
  syncErrorMsg.value = "";
  const currentlyOffline = typeof navigator !== "undefined" && navigator.onLine === false;
  const offlineYieldMs = 40;
  const lieFiTimeoutMs = options.lieFiTimeoutMs ?? 1800;

  let settled = false;
  let resolvedEarly = false;

  queuedWriteCount.value += 1;
  sawPendingThisSession = sawPendingThisSession || currentlyOffline;

  const rawPromise = Promise.resolve().then(() => writeFactory());

  const monitored = rawPromise.then(
    () => {
      settled = true;
      queuedWriteCount.value = Math.max(0, queuedWriteCount.value - 1);
      if (resolvedEarly && queuedWriteCount.value === 0 && !hasPendingSnapshotWrites.value) {
        triggerJustSynced();
      }
      return { queuedOffline: false } as OfflineWriteResult;
    },
    (err: unknown) => {
      settled = true;
      queuedWriteCount.value = Math.max(0, queuedWriteCount.value - 1);
      if (resolvedEarly) {
        const msg = err instanceof Error ? err.message : String(err || "Sync error");
        syncErrorMsg.value = msg;
        options.onBackgroundError?.(err);
        return { queuedOffline: true } as OfflineWriteResult;
      }
      throw err;
    }
  );

  const waitMs = currentlyOffline ? offlineYieldMs : lieFiTimeoutMs;

  let timerId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<OfflineWriteResult>((resolve) => {
    timerId = setTimeout(() => {
      if (!settled) {
        resolvedEarly = true;
        sawPendingThisSession = true;
        resolve({ queuedOffline: true });
      }
    }, waitMs);
  });

  try {
    return await Promise.race([monitored, timeoutPromise]);
  } finally {
    if (timerId) clearTimeout(timerId);
  }
}

export function notifyWriteResult(
  pushToastFn: (message: string, variant?: "info" | "success" | "error") => void,
  result: OfflineWriteResult,
  onlineMessage: string,
  offlineMessage: string
): void {
  pushToastFn(result.queuedOffline ? offlineMessage : onlineMessage, result.queuedOffline ? "info" : "success");
}

export function resetOfflineSyncForTest(): void {
  queuedWriteCount.value = 0;
  pendingSources.clear();
  cachedSources.clear();
  hasPendingSnapshotWrites.value = false;
  servingFromCache.value = false;
  justSynced.value = false;
  lastSyncedAt.value = null;
  syncErrorMsg.value = "";
  sawPendingThisSession = false;
  if (justSyncedTimer) {
    clearTimeout(justSyncedTimer);
    justSyncedTimer = null;
  }
  networkOnline.value = typeof navigator === "undefined" ? true : navigator.onLine !== false;
}
