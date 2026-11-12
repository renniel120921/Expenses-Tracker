import type { IncomingMessage, ServerResponse } from "node:http";
import { verifyFirebaseIdToken, TokenVerificationError } from "./_lib/verifyFirebaseToken.js";
import { checkServerRateLimit } from "./_lib/rateLimiter.js";
import {
  buildGeminiRequestBody,
  parseClientChatPayload,
  sanitizeGeminiResponse
} from "./_lib/chatProtocol.js";

const MAX_BODY_BYTES = 48 * 1024;
const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";
const FAST_FALLBACK_MODELS = ["gemini-flash-lite-latest", "gemini-3.5-flash-lite"] as const;
const SLOW_HANGING_ALIASES = new Set(["gemini-flash-latest", "gemini-3.8-flash"]);
const VALID_MODEL_RE = /^[a-zA-Z0-9._-]{3,64}$/;

export interface VercelNodeRequest extends IncomingMessage {
  body?: unknown;
}

export interface ChatHandlerDeps {
  fetchFn?: typeof fetch;
  apiKey?: string;
  model?: string;
  projectId?: string;
  certsOverride?: Record<string, string>;
  nowMs?: number;
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown, extraHeaders: Record<string, string> = {}): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("X-Content-Type-Options", "nosniff");
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: VercelNodeRequest): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === "string") {
      if (Buffer.byteLength(req.body, "utf8") > MAX_BODY_BYTES) {
        throw new TokenVerificationError("Request payload too large", 413);
      }
      return JSON.parse(req.body);
    }
    const serializedLen = Buffer.byteLength(JSON.stringify(req.body ?? null), "utf8");
    if (serializedLen > MAX_BODY_BYTES) {
      throw new TokenVerificationError("Request payload too large", 413);
    }
    return req.body;
  }

  if (req.readableEnded) {
    return {};
  }

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > MAX_BODY_BYTES) {
      throw new TokenVerificationError("Request payload too large", 413);
    }
    chunks.push(buf);
  }
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text ? JSON.parse(text) : {};
}

function extractClientIp(req: IncomingMessage): string {
  const fwd = req.headers["x-forwarded-for"];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  if (typeof raw === "string" && raw.trim()) {
    return raw.split(",")[0].trim().slice(0, 64);
  }
  return String(req.socket?.remoteAddress || "").slice(0, 64);
}

/**
 * Handles POST /api/chat invocations cleanly with Firebase Auth token verification,
 * sliding-window rate limits, server-side Gemini API isolation, and strict JSON validation.
 */
export async function handleChatRequest(
  req: VercelNodeRequest,
  res: ServerResponse,
  deps: ChatHandlerDeps = {}
): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { code: "method-not-allowed", error: "Method not allowed" }, { Allow: "POST" });
    return;
  }

  const authHeader = req.headers.authorization;
  const bearer = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!bearer) {
    sendJson(res, 401, { code: "auth/missing-token", error: "Authentication required" });
    return;
  }

  let uid: string;
  try {
    const verified = await verifyFirebaseIdToken(bearer, {
      projectId: deps.projectId,
      nowMs: deps.nowMs,
      certsOverride: deps.certsOverride,
      fetchFn: deps.fetchFn
    });
    uid = verified.uid;
  } catch (err) {
    const status = err instanceof TokenVerificationError ? err.status : 401;
    sendJson(res, status, {
      code: "auth/invalid-token",
      error: status === 503 ? "Auth verification unavailable" : "Invalid session token"
    });
    return;
  }

  const rate = checkServerRateLimit(uid, extractClientIp(req), deps.nowMs);
  if (!rate.allowed) {
    sendJson(
      res,
      429,
      {
        code: "rate-limited",
        error: "Too many assistant requests. Please wait a moment.",
        retryAfterSec: rate.retryAfterSec
      },
      { "Retry-After": String(rate.retryAfterSec) }
    );
    return;
  }

  let body: unknown;
  try {
    body = await readJsonBody(req);
  } catch (err) {
    const status = err instanceof TokenVerificationError ? err.status : 400;
    sendJson(res, status, { code: "bad-request", error: "Invalid JSON request body" });
    return;
  }

  let parsed;
  try {
    parsed = parseClientChatPayload(body);
  } catch (err) {
    sendJson(res, 400, {
      code: "invalid-input",
      error: err instanceof Error ? err.message : "Invalid chat payload"
    });
    return;
  }

  const apiKey = (deps.apiKey ?? process.env.GEMINI_API_KEY ?? "").trim();
  if (!apiKey) {
    sendJson(res, 503, {
      code: "ai/not-configured",
      error: "AI service key not configured on server"
    });
    return;
  }

  const requestedRaw = (deps.model ?? process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL).trim();
  const validRequested = VALID_MODEL_RE.test(requestedRaw) ? requestedRaw : DEFAULT_GEMINI_MODEL;
  const candidateModels: string[] = [];
  if (!SLOW_HANGING_ALIASES.has(validRequested)) {
    candidateModels.push(validRequested);
  }
  for (const fallbackModel of FAST_FALLBACK_MODELS) {
    if (!candidateModels.includes(fallbackModel)) {
      candidateModels.push(fallbackModel);
    }
  }

  const fetchFn = deps.fetchFn || fetch;
  const geminiBody = JSON.stringify(buildGeminiRequestBody(parsed));
  let sawUpstreamError = false;
  let sawTimeout = false;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const aiRes = await fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: geminiBody,
        signal: AbortSignal.timeout(7500)
      });

      if (!aiRes.ok) {
        sawUpstreamError = true;
        continue;
      }

      const aiJson = (await aiRes.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const rawText = aiJson?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const walletNames = parsed.context.wallets.map((w) => w.name);
      const result = sanitizeGeminiResponse(rawText, walletNames, parsed.lang, parsed.context);

      sendJson(res, 200, { ...result, mode: "ai" });
      return;
    } catch {
      sawTimeout = true;
    }
  }

  if (sawUpstreamError && !sawTimeout) {
    sendJson(res, 502, {
      code: "ai/upstream-error",
      error: "Assistant temporarily unavailable"
    });
    return;
  }

  sendJson(res, 504, {
    code: "ai/timeout",
    error: "Assistant timed out"
  });
}

export default async function handler(req: VercelNodeRequest, res: ServerResponse): Promise<void> {
  try {
    await handleChatRequest(req, res);
  } catch (err) {
    console.error(
      "[TipidChat] Unhandled handler error:",
      err instanceof Error ? err.name : "UnknownError"
    );
    if (!res.writableEnded) {
      sendJson(res, 500, { code: "internal-error", error: "Assistant temporarily unavailable" });
    }
  }
}
