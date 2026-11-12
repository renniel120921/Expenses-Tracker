import crypto from "node:crypto";

const FIREBASE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const DEFAULT_PROJECT_ID = "expensestracker-18d2b";
const MAX_TOKEN_LENGTH = 8192;
const CLOCK_SKEW_SEC = 300;
const DEFAULT_CERT_TTL_MS = 3_600_000;

interface CertCache {
  certs: Record<string, string>;
  expiresAtMs: number;
}

export class TokenVerificationError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export interface VerifyTokenOptions {
  projectId?: string;
  nowMs?: number;
  certsOverride?: Record<string, string>;
  fetchFn?: typeof fetch;
}

let certCache: CertCache | null = null;

function decodeBase64Url(segment: string): Buffer {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4;
  const padded = pad === 0 ? normalized : normalized + "=".repeat(4 - pad);
  return Buffer.from(padded, "base64");
}

function parseMaxAgeMs(cacheControlHeader: string | null): number {
  if (!cacheControlHeader) return DEFAULT_CERT_TTL_MS;
  const match = /max-age=(\d+)/i.exec(cacheControlHeader);
  if (!match?.[1]) return DEFAULT_CERT_TTL_MS;
  const sec = Number(match[1]);
  return Number.isFinite(sec) && sec > 60 ? sec * 1000 : DEFAULT_CERT_TTL_MS;
}

async function fetchGoogleCerts(
  fetchFn: typeof fetch,
  forceRefresh = false,
  nowMs = Date.now()
): Promise<Record<string, string>> {
  if (!forceRefresh && certCache && certCache.expiresAtMs > nowMs) {
    return certCache.certs;
  }

  const res = await fetchFn(FIREBASE_CERTS_URL, {
    method: "GET",
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) {
    throw new TokenVerificationError("Unable to fetch Firebase public certificates", 503);
  }
  const certs = (await res.json()) as Record<string, string>;
  if (!certs || typeof certs !== "object") {
    throw new TokenVerificationError("Malformed Firebase public certificate payload", 503);
  }

  certCache = {
    certs,
    expiresAtMs: nowMs + parseMaxAgeMs(res.headers.get("cache-control"))
  };
  return certs;
}

export function resetCertCacheForTest(): void {
  certCache = null;
}

/**
 * Cryptographically verifies a Firebase Auth ID token against Google's official X.509 certificates
 * and checks audience, issuer, subject UID, and timestamps.
 */
export async function verifyFirebaseIdToken(
  rawToken: string,
  options: VerifyTokenOptions = {}
): Promise<{ uid: string }> {
  const token = String(rawToken || "").trim();
  if (!token || token.length > MAX_TOKEN_LENGTH) {
    throw new TokenVerificationError("Missing or malformed authorization token");
  }

  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new TokenVerificationError("Invalid JWT format");
  }

  let header: { alg?: unknown; kid?: unknown };
  let payload: {
    aud?: unknown;
    iss?: unknown;
    sub?: unknown;
    exp?: unknown;
    iat?: unknown;
    auth_time?: unknown;
  };
  try {
    header = JSON.parse(decodeBase64Url(parts[0]).toString("utf8")) as typeof header;
    payload = JSON.parse(decodeBase64Url(parts[1]).toString("utf8")) as typeof payload;
  } catch {
    throw new TokenVerificationError("Unreadable token encoding");
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) {
    throw new TokenVerificationError("Unsupported token signature metadata");
  }

  const projectId =
    (options.projectId || process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID).trim() ||
    DEFAULT_PROJECT_ID;
  const nowMs = options.nowMs ?? Date.now();
  const nowSec = Math.floor(nowMs / 1000);

  if (payload.aud !== projectId) {
    throw new TokenVerificationError("Token audience mismatch");
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new TokenVerificationError("Token issuer mismatch");
  }
  if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128) {
    throw new TokenVerificationError("Invalid token subject");
  }

  const exp = Number(payload.exp);
  const iat = Number(payload.iat);
  const authTime = payload.auth_time !== undefined ? Number(payload.auth_time) : iat;

  if (!Number.isFinite(exp) || exp <= nowSec) {
    throw new TokenVerificationError("Session token expired");
  }
  if (!Number.isFinite(iat) || iat > nowSec + CLOCK_SKEW_SEC) {
    throw new TokenVerificationError("Invalid token issued-at time");
  }
  if (!Number.isFinite(authTime) || authTime > nowSec + CLOCK_SKEW_SEC) {
    throw new TokenVerificationError("Invalid token authentication time");
  }

  const fetchFn = options.fetchFn || fetch;
  let certs = options.certsOverride ?? (await fetchGoogleCerts(fetchFn, false, nowMs));
  let pem = certs[header.kid];
  if (!pem && !options.certsOverride) {
    certs = await fetchGoogleCerts(fetchFn, true, nowMs);
    pem = certs[header.kid];
  }
  if (!pem) {
    throw new TokenVerificationError("Unknown token signing key");
  }

  const signedContent = `${parts[0]}.${parts[1]}`;
  const signature = decodeBase64Url(parts[2]);
  const verifier = crypto.createVerify("RSA-SHA256");
  verifier.update(signedContent);
  verifier.end();

  let verified = false;
  try {
    verified = verifier.verify(pem, signature);
  } catch {
    verified = false;
  }
  if (!verified) {
    throw new TokenVerificationError("Invalid token signature");
  }

  return { uid: payload.sub };
}
