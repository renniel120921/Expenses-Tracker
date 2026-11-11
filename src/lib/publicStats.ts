import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Unsubscribe
} from "firebase/firestore";
import { db } from "./firebase";
import type { PublicStats } from "@/types/finance";

const STATS_COLLECTION = "appStats";
const STATS_DOC_ID = "public";
const STATS_CACHE_KEY = "tipid_public_stats_cache";

export interface PublicUserCountSnapshot {
  totalUsers: number | null;
  source: "live" | "cache" | "unavailable";
  errorCode?: string;
}

const countedThisSession = new Set<string>();
const inFlightUids = new Set<string>();

export function readCachedPublicStats(): PublicStats | null {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { totalUsers?: unknown; updatedAt?: unknown };
    const n = Number(parsed?.totalUsers);
    if (!Number.isFinite(n) || n < 0) return null;
    return {
      totalUsers: Math.floor(n),
      updatedAt: parsed.updatedAt
    };
  } catch {
    return null;
  }
}

export function writeCachedPublicStats(stats: PublicStats): void {
  try {
    const count = Number(stats.totalUsers);
    if (!Number.isFinite(count) || count < 0) return;
    localStorage.setItem(
      STATS_CACHE_KEY,
      JSON.stringify({ totalUsers: Math.floor(count), cachedAt: Date.now() })
    );
  } catch {
    // ignore storage quota errors
  }
}

export function subscribePublicUserCount(
  cb: (snap: PublicUserCountSnapshot) => void
): Unsubscribe {
  const cached = readCachedPublicStats();
  if (cached !== null) {
    cb({ totalUsers: cached.totalUsers, source: "cache" });
  }

  const ref = doc(db, STATS_COLLECTION, STATS_DOC_ID);
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snap) => {
      if (!snap.exists()) {
        const fallback = readCachedPublicStats();
        cb({
          totalUsers: fallback ? fallback.totalUsers : 0,
          source: fallback ? "cache" : snap.metadata.fromCache ? "cache" : "live"
        });
        return;
      }

      const raw = snap.data() as { totalUsers?: unknown };
      const count = Math.max(0, Math.floor(Number(raw?.totalUsers) || 0));
      writeCachedPublicStats({ totalUsers: count });
      cb({
        totalUsers: count,
        source: snap.metadata.fromCache ? "cache" : "live"
      });
    },
    (err: unknown) => {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : undefined;
      if (import.meta.env.DEV && code === "permission-denied") {
        console.warn("[TipidStats] Read blocked for appStats/public — publish firestore.rules in Firebase Console.");
      }
      const fallback = readCachedPublicStats();
      if (fallback !== null) {
        cb({ totalUsers: fallback.totalUsers, source: "cache", errorCode: code });
      } else {
        cb({ totalUsers: null, source: "unavailable", errorCode: code });
      }
    }
  );
}

/**
 * Ensures the authenticated user's UID is counted once in `appStats/public.totalUsers`
 * inside an atomic Firestore transaction paired with `users/{uid}.statsCounted = true`.
 */
export async function ensureUserCountedInStats(uid: string): Promise<boolean> {
  const safeUid = String(uid || "").trim();
  if (!safeUid || safeUid.length > 128 || safeUid.includes("/")) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return false;
  if (countedThisSession.has(safeUid) || inFlightUids.has(safeUid)) return false;

  inFlightUids.add(safeUid);
  try {
    const userRef = doc(db, "users", safeUid);
    const statsRef = doc(db, STATS_COLLECTION, STATS_DOC_ID);

    const incremented = await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (userSnap.exists() && userSnap.data()?.statsCounted === true) {
        return false;
      }

      const statsSnap = await tx.get(statsRef);
      const currentTotal = statsSnap.exists()
        ? Math.max(0, Math.floor(Number(statsSnap.data()?.totalUsers) || 0))
        : 0;
      const nextTotal = currentTotal + 1;

      tx.set(
        userRef,
        {
          statsCounted: true
        },
        { merge: true }
      );
      tx.set(statsRef, {
        totalUsers: nextTotal,
        updatedAt: serverTimestamp()
      });

      writeCachedPublicStats({ totalUsers: nextTotal });
      return true;
    });

    countedThisSession.add(safeUid);
    return incremented;
  } catch {
    // Non-blocking: skipped if offline or Firestore rules await deployment
    return false;
  } finally {
    inFlightUids.delete(safeUid);
  }
}

export function resetPublicStatsForTest(): void {
  countedThisSession.clear();
  inFlightUids.clear();
}
