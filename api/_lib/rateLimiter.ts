const MAX_TRACKED_KEYS = 2000;

interface RateRule {
  windowMs: number;
  maxRequests: number;
}

const UID_RULES: readonly RateRule[] = [
  { windowMs: 60_000, maxRequests: 15 },
  { windowMs: 3_600_000, maxRequests: 60 }
];

const IP_RULES: readonly RateRule[] = [{ windowMs: 60_000, maxRequests: 30 }];

const buckets = new Map<string, number[]>();

function trimOldestBucketIfNeeded(): void {
  if (buckets.size < MAX_TRACKED_KEYS) return;
  const oldestKey = buckets.keys().next().value;
  if (oldestKey) buckets.delete(oldestKey);
}

function checkRuleBucket(
  key: string,
  rules: readonly RateRule[],
  nowMs: number
): { allowed: boolean; retryAfterSec: number } {
  const maxWindowMs = rules[rules.length - 1]?.windowMs ?? 60_000;
  const existing = (buckets.get(key) || []).filter((ts) => nowMs - ts < maxWindowMs);

  let maxWaitMs = 0;
  for (const rule of rules) {
    const inWindow = existing.filter((ts) => nowMs - ts < rule.windowMs);
    if (inWindow.length >= rule.maxRequests) {
      const oldestInWindow = inWindow[0] ?? nowMs;
      maxWaitMs = Math.max(maxWaitMs, rule.windowMs - (nowMs - oldestInWindow));
    }
  }

  if (maxWaitMs > 0) {
    buckets.set(key, existing);
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil(maxWaitMs / 1000)) };
  }

  trimOldestBucketIfNeeded();
  existing.push(nowMs);
  buckets.set(key, existing);
  return { allowed: true, retryAfterSec: 0 };
}

/** Enforces sliding-window per-UID and per-IP quotas on AI chat invocations. */
export function checkServerRateLimit(
  uid: string,
  clientIp: string,
  nowMs = Date.now()
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const uidCheck = checkRuleBucket(`uid:${uid}`, UID_RULES, nowMs);
  if (!uidCheck.allowed) {
    return { allowed: false, retryAfterSec: uidCheck.retryAfterSec };
  }

  if (clientIp) {
    const ipCheck = checkRuleBucket(`ip:${clientIp}`, IP_RULES, nowMs);
    if (!ipCheck.allowed) {
      return { allowed: false, retryAfterSec: ipCheck.retryAfterSec };
    }
  }

  return { allowed: true };
}

export function resetServerRateLimiterForTest(): void {
  buckets.clear();
}
