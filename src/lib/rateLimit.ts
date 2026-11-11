export type RateAction = "login" | "signUp" | "resetPassword" | "pinUnlock";

const RATE_LIMITS: Record<RateAction, { maxAttempts: number; windowMs: number; baseLockMs: number }> = {
  login: { maxAttempts: 5, windowMs: 5 * 60 * 1000, baseLockMs: 30 * 1000 },
  signUp: { maxAttempts: 5, windowMs: 15 * 60 * 1000, baseLockMs: 60 * 1000 },
  resetPassword: { maxAttempts: 3, windowMs: 10 * 60 * 1000, baseLockMs: 60 * 1000 },
  pinUnlock: { maxAttempts: 5, windowMs: 5 * 60 * 1000, baseLockMs: 30 * 1000 }
};

const MAX_LOCK_MS = 15 * 60 * 1000;

interface RateRecord {
  count: number;
  windowStart: number;
  lockUntil: number;
  strikes: number;
}

export class TipidRateLimitError extends Error {
  code = "app/rate-limited" as const;
  secondsLeft: number;

  constructor(secondsLeft: number) {
    super("rate-limited");
    this.secondsLeft = secondsLeft;
  }
}

function hashIdent(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function rlKey(action: RateAction, ident: string): string {
  return `tipid_rl_${action}_${hashIdent(ident)}`;
}

function readRecord(key: string): RateRecord | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as RateRecord) : null;
  } catch {
    return null;
  }
}

function writeRecord(key: string, data: RateRecord): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Fail open only when Web Storage is unavailable
  }
}

export function checkRateLimit(action: RateAction, ident: string): void {
  const cfg = RATE_LIMITS[action];
  const key = rlKey(action, ident);
  const now = Date.now();
  const rec = readRecord(key);
  if (!rec) return;

  if (rec.lockUntil && now < rec.lockUntil) {
    throw new TipidRateLimitError(Math.ceil((rec.lockUntil - now) / 1000));
  }
  if (now - rec.windowStart > cfg.windowMs) {
    writeRecord(key, { count: 0, windowStart: now, lockUntil: 0, strikes: rec.strikes || 0 });
  }
}

export function recordFailure(action: RateAction, ident: string): void {
  const cfg = RATE_LIMITS[action];
  const key = rlKey(action, ident);
  const now = Date.now();
  const rec: RateRecord = readRecord(key) || { count: 0, windowStart: now, lockUntil: 0, strikes: 0 };

  if (now - rec.windowStart > cfg.windowMs) {
    rec.count = 0;
    rec.windowStart = now;
  }
  rec.count += 1;

  if (rec.count >= cfg.maxAttempts) {
    rec.strikes = (rec.strikes || 0) + 1;
    rec.lockUntil = now + Math.min(cfg.baseLockMs * 2 ** (rec.strikes - 1), MAX_LOCK_MS);
    rec.count = 0;
    rec.windowStart = now;
  }
  writeRecord(key, rec);
}

export function recordSuccess(action: RateAction, ident: string): void {
  writeRecord(rlKey(action, ident), { count: 0, windowStart: Date.now(), lockUntil: 0, strikes: 0 });
}
