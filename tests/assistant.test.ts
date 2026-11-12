import crypto from "node:crypto";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  analyzeSpendingBehavior,
  buildCompactFinanceContext,
  evaluateActionBehaviorWarning,
  generateLocalAssistantReply,
  parseNaturalTransactionCommand,
  type AssistantLedgerSnapshot
} from "@/lib/assistantEngine";
import { manilaDateKey } from "@/lib/core";
import {
  sendAssistantMessage,
  resetAssistantClientForTest
} from "@/lib/assistantClient";
import { localChatApiPlugin } from "../vite.config";
import {
  verifyFirebaseIdToken,
  resetCertCacheForTest,
  TokenVerificationError
} from "../api/_lib/verifyFirebaseToken";
import { resetServerRateLimiterForTest } from "../api/_lib/rateLimiter";
import { sanitizeGeminiResponse } from "../api/_lib/chatProtocol";
import { handleChatRequest } from "../api/chat";

function createTestRsaCertPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
  return { privateKey, publicKey };
}

function signTestJwt(
  payload: Record<string, unknown>,
  privateKey: string,
  kid = "key_1"
): string {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", kid, typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${body}`);
  signer.end();
  const sig = signer.sign(privateKey).toString("base64url");
  return `${header}.${body}.${sig}`;
}

function createMockReqRes(options: {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}) {
  const req = new IncomingMessage(new Socket()) as IncomingMessage & { body?: unknown };
  req.method = options.method || "POST";
  req.headers = { ...options.headers };
  req.body = options.body;

  const responseHeaders = new Map<string, string>();
  let rawBody = "";
  const res = new ServerResponse(req);
  res.setHeader = (name: string, value: number | string | readonly string[]) => {
    responseHeaders.set(name.toLowerCase(), Array.isArray(value) ? value.join(",") : String(value));
    return res;
  };
  res.end = ((chunk?: unknown) => {
    if (chunk) rawBody += String(chunk);
    return res;
  }) as ServerResponse["end"];

  return {
    req,
    res,
    getStatus: () => res.statusCode,
    getHeader: (name: string) => responseHeaders.get(name.toLowerCase()),
    getJson: () => (rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {})
  };
}

function makeSnapshot(overrides: Partial<AssistantLedgerSnapshot> = {}): AssistantLedgerSnapshot {
  return {
    entries: [],
    budget: 10_000,
    budgetCycle: "monthly",
    wallets: ["Cash", "GCash", "Maya", "Land Bank"],
    walletBalances: { Cash: 2000, GCash: 3000, Maya: 1500, "Land Bank": 8000 },
    overallBalance: 14_500,
    bills: [],
    utangList: [],
    savingsGoals: [],
    categoryBudgets: [],
    preferredWallet: "Cash",
    ...overrides
  };
}

describe("Tipid Coach spending behavior warnings & natural-language command parser", () => {
  it("flags critical budget overrun, high luho ratio, category over-limit, and bills crunch", () => {
    const today = manilaDateKey(new Date()) || "2026-04-01";
    const snap = makeSnapshot({
      budget: 5000,
      overallBalance: 1200,
      walletBalances: { Cash: 1200 },
      wallets: ["Cash"],
      entries: [
        {
          id: "e1",
          type: "expense",
          amount: 3200,
          desc: "Online shopping haul",
          category: "Shopping",
          method: "Cash",
          spendType: "luho",
          date: today
        },
        {
          id: "e2",
          type: "expense",
          amount: 2100,
          desc: "Grocery & bills",
          category: "Groceries",
          method: "Cash",
          spendType: "need",
          date: today
        }
      ],
      categoryBudgets: [{ id: "cb1", category: "Shopping", limitAmount: 2000 }],
      bills: [
        {
          id: "b1",
          title: "Meralco",
          amount: 2500,
          dueDate: today,
          category: "Bills & Utilities",
          status: "Unpaid"
        }
      ]
    });

    const warnings = analyzeSpendingBehavior(snap, "tl");
    const ids = warnings.map((w) => w.id);
    expect(ids).toContain("budget-over");
    expect(ids).toContain("cat-over");
    expect(ids).toContain("luho-ratio");
    expect(ids).toContain("bills-crunch");

    const ctx = buildCompactFinanceContext(snap, warnings);
    expect(ctx.luhoSharePct).toBe(60);
    expect(ctx.spentInCycle).toBe(5300);
    expect(ctx.activeWarnings.length).toBeGreaterThanOrEqual(3);
  });

  it("stays quiet when spending is healthy and balanced", () => {
    const today = manilaDateKey(new Date()) || "2026-04-01";
    const snap = makeSnapshot({
      budget: 20_000,
      overallBalance: 18_000,
      entries: [
        {
          id: "e1",
          type: "expense",
          amount: 450,
          desc: "Grocery",
          category: "Groceries",
          method: "Cash",
          spendType: "need",
          date: today
        }
      ]
    });

    expect(analyzeSpendingBehavior(snap, "en")).toEqual([]);
  });

  it("parses Taglish and English expense/income log commands accurately", () => {
    const wallets = ["Cash", "GCash", "Maya", "Land Bank"];

    const [coffee] = parseNaturalTransactionCommand("Bili kape 160 starbucks gcash luho", wallets);
    expect(coffee).toMatchObject({
      type: "expense",
      amount: 160,
      category: "Food & Dining",
      method: "GCash",
      spendType: "luho"
    });

    const [salary] = parseNaturalTransactionCommand(
      "Log kita 12.5k sahod sa Land Bank",
      wallets
    );
    expect(salary).toMatchObject({
      type: "income",
      amount: 12_500,
      category: "Kita",
      method: "Land Bank"
    });

    const multi = parseNaturalTransactionCommand(
      "Log 120 lunch cash and 650 grocery maya",
      wallets
    );
    expect(multi).toHaveLength(2);
    expect(multi[0].method).toBe("Cash");
    expect(multi[1].method).toBe("Maya");
    expect(multi[1].category).toBe("Groceries");

    // Questions should not turn into false log drafts
    expect(parseNaturalTransactionCommand("Safe ba gumastos ng 1000?", wallets)).toEqual([]);
  });

  it("warns immediately when a proposed expense exceeds wallet funds or hurts spending goals", () => {
    const snap = makeSnapshot({
      walletBalances: { Cash: 300, GCash: 3000 },
      overallBalance: 3300
    });

    const walletWarning = evaluateActionBehaviorWarning(
      {
        type: "expense",
        amount: 500,
        desc: "Dinner",
        category: "Food & Dining",
        method: "Cash",
        spendType: "need"
      },
      snap,
      "en"
    );
    expect(walletWarning?.level).toBe("critical");
    expect(walletWarning?.title).toContain("Cash");

    const local = generateLocalAssistantReply("Log 250 grab maya", makeSnapshot(), "tl");
    expect(local.proposedActions).toHaveLength(1);
    expect(local.proposedActions[0].category).toBe("Transportation");
    expect(local.proposedActions[0].method).toBe("Maya");
  });
});

describe("Vercel /api/chat security, Firebase JWT auth, rate limiting & Gemini sanitation", () => {
  beforeEach(() => {
    resetCertCacheForTest();
    resetServerRateLimiterForTest();
    resetAssistantClientForTest();
  });

  it("verifies signed Firebase RS256 tokens and rejects expired or forged tokens", async () => {
    const { privateKey, publicKey } = createTestRsaCertPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const validToken = signTestJwt(
      {
        aud: "expensestracker-18d2b",
        iss: "https://securetoken.google.com/expensestracker-18d2b",
        sub: "user_123",
        exp: nowSec + 3600,
        iat: nowSec - 10,
        auth_time: nowSec - 10
      },
      privateKey
    );

    const verified = await verifyFirebaseIdToken(validToken, {
      certsOverride: { key_1: publicKey }
    });
    expect(verified.uid).toBe("user_123");

    const expiredToken = signTestJwt(
      {
        aud: "expensestracker-18d2b",
        iss: "https://securetoken.google.com/expensestracker-18d2b",
        sub: "user_123",
        exp: nowSec - 60,
        iat: nowSec - 3600,
        auth_time: nowSec - 3600
      },
      privateKey
    );

    await expect(
      verifyFirebaseIdToken(expiredToken, { certsOverride: { key_1: publicKey } })
    ).rejects.toThrow(TokenVerificationError);

    const wrongAudience = signTestJwt(
      {
        aud: "another-project",
        iss: "https://securetoken.google.com/another-project",
        sub: "user_123",
        exp: nowSec + 3600,
        iat: nowSec - 10,
        auth_time: nowSec - 10
      },
      privateKey
    );
    await expect(
      verifyFirebaseIdToken(wrongAudience, { certsOverride: { key_1: publicKey } })
    ).rejects.toThrow("audience");
  });

  it("enforces authentication, method allowlist, rate limits, and Gemini key isolation in /api/chat", async () => {
    const { privateKey, publicKey } = createTestRsaCertPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const token = signTestJwt(
      {
        aud: "expensestracker-18d2b",
        iss: "https://securetoken.google.com/expensestracker-18d2b",
        sub: "uid_chat_1",
        exp: nowSec + 3600,
        iat: nowSec - 5,
        auth_time: nowSec - 5
      },
      privateKey
    );

    // Reject non-POST
    const getCase = createMockReqRes({ method: "GET" });
    await handleChatRequest(getCase.req, getCase.res);
    expect(getCase.getStatus()).toBe(405);

    // Reject missing auth token
    const noAuthCase = createMockReqRes({ method: "POST", body: { message: "hi" } });
    await handleChatRequest(noAuthCase.req, noAuthCase.res);
    expect(noAuthCase.getStatus()).toBe(401);

    // Authenticated request invokes Gemini with x-goog-api-key header & sanitizes structured JSON
    let capturedEndpoint = "";
    let capturedApiKeyHeader = "";
    const fetchMock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedEndpoint = String(url);
      const headers = init?.headers as Record<string, string>;
      capturedApiKeyHeader = headers["x-goog-api-key"] || "";
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      reply: "Inihanda ko na ang kape log mo.",
                      warning: {
                        level: "warning",
                        title: "Luho alert",
                        detail: "Nag-40% na ang Luho share mo."
                      },
                      proposedActions: [
                        {
                          type: "expense",
                          amount: 165,
                          desc: "Iced coffee",
                          category: "Food & Dining",
                          method: "gcash",
                          spendType: "luho"
                        },
                        {
                          type: "expense",
                          amount: -50,
                          desc: "Invalid negative",
                          category: "Food & Dining",
                          method: "GCash",
                          spendType: "need"
                        }
                      ]
                    })
                  }
                ]
              }
            }
          ]
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as unknown as typeof fetch;

    const okCase = createMockReqRes({
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "x-forwarded-for": "203.0.113.10"
      },
      body: {
        message: "Log 165 coffee sa gcash luho",
        lang: "tl",
        context: {
          wallets: [
            { name: "Cash", balance: 1000 },
            { name: "GCash", balance: 2500 }
          ]
        }
      }
    });

    await handleChatRequest(okCase.req, okCase.res, {
      apiKey: "secret-gemini-test-key",
      certsOverride: { key_1: publicKey },
      fetchFn: fetchMock
    });

    expect(okCase.getStatus()).toBe(200);
    expect(okCase.getHeader("cache-control")).toContain("no-store");
    expect(capturedEndpoint).not.toContain("secret-gemini-test-key");
    expect(capturedApiKeyHeader).toBe("secret-gemini-test-key");

    const json = okCase.getJson();
    expect(json.reply).toBe("Inihanda ko na ang kape log mo.");
    const actions = json.proposedActions as Array<Record<string, unknown>>;
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      type: "expense",
      amount: 165,
      category: "Food & Dining",
      method: "GCash",
      spendType: "luho"
    });
  });

  it("sanitizes untrusted Gemini categories/wallets and rejects invalid amounts", () => {
    const clean = sanitizeGeminiResponse(
      JSON.stringify({
        reply: "Test\u0000\u202Eclean",
        warning: { level: "none", title: "", detail: "" },
        proposedActions: [
          {
            type: "expense",
            amount: 200,
            desc: "Lunch",
            category: "HackedCategory",
            method: "UnknownBank",
            spendType: "need"
          }
        ]
      }),
      ["Cash", "GCash"],
      "en"
    );

    expect(clean.reply).toBe("Test clean");
    expect(clean.warning).toBeNull();
    expect(clean.proposedActions[0].category).toBe("Other");
    expect(clean.proposedActions[0].method).toBe("Cash");
  });

  it("enforces server-side per-UID rate limits with 429 and falls back cleanly on the client", async () => {
    const { privateKey, publicKey } = createTestRsaCertPair();
    const nowSec = Math.floor(Date.now() / 1000);
    const token = signTestJwt(
      {
        aud: "expensestracker-18d2b",
        iss: "https://securetoken.google.com/expensestracker-18d2b",
        sub: "uid_rate_limit",
        exp: nowSec + 3600,
        iat: nowSec - 5,
        auth_time: nowSec - 5
      },
      privateKey
    );

    for (let i = 0; i < 15; i += 1) {
      const c = createMockReqRes({
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        body: { message: "check" }
      });
      await handleChatRequest(c.req, c.res, {
        apiKey: "",
        certsOverride: { key_1: publicKey }
      });
      expect(c.getStatus()).toBe(503);
    }

    const blocked = createMockReqRes({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { message: "check again" }
    });
    await handleChatRequest(blocked.req, blocked.res, {
      apiKey: "",
      certsOverride: { key_1: publicKey }
    });
    expect(blocked.getStatus()).toBe(429);
    expect(Number(blocked.getHeader("retry-after"))).toBeGreaterThan(0);

    // Client fallback test when offline / unauthenticated
    const fallback = await sendAssistantMessage({
      message: "Log 320 dinner sa GCash",
      history: [],
      snapshot: makeSnapshot(),
      lang: "tl"
    });
    expect(fallback.mode).toBe("local");
    expect(fallback.proposedActions[0]).toMatchObject({
      type: "expense",
      amount: 320,
      method: "GCash",
      category: "Food & Dining"
    });
  });

  it("handles Vite local dev/preview /api/chat cleanly without 404 errors and caches 404 static fallback", async () => {
    const prevGeminiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const plugin = localChatApiPlugin();
      const devHandlers: Array<
        (req: IncomingMessage, res: ServerResponse, next: () => void) => void
      > = [];
      const previewHandlers: Array<
        (req: IncomingMessage, res: ServerResponse, next: () => void) => void
      > = [];

      const devHook = plugin.configureServer as
        | ((server: { config: { mode: string }; middlewares: { use: (fn: unknown) => void } }) => void)
        | undefined;
      devHook?.({
        config: { mode: "development" },
        middlewares: {
          use(fn: unknown) {
            devHandlers.push(fn as (typeof devHandlers)[number]);
          }
        }
      });

      const previewHook = plugin.configurePreviewServer as
        | ((server: { middlewares: { use: (fn: unknown) => void } }) => void)
        | undefined;
      previewHook?.({
        middlewares: {
          use(fn: unknown) {
            previewHandlers.push(fn as (typeof previewHandlers)[number]);
          }
        }
      });

      expect(devHandlers).toHaveLength(1);
      expect(previewHandlers).toHaveLength(1);

      // 1. Passes unrelated URLs through next()
      const unrelated = createMockReqRes({ method: "GET", headers: {} });
      unrelated.req.url = "/dashboard.html";
      const nextSpy = vi.fn();
      devHandlers[0](unrelated.req, unrelated.res, nextSpy);
      expect(nextSpy).toHaveBeenCalledTimes(1);

      // 2. Returns 405 on GET /api/chat
      const wrongMethod = createMockReqRes({ method: "GET" });
      wrongMethod.req.url = "/api/chat";
      devHandlers[0](wrongMethod.req, wrongMethod.res, vi.fn());
      expect(wrongMethod.getStatus()).toBe(405);

      // 3. Returns HTTP 200 { mode: "local" } on POST /api/chat when unconfigured locally
      const postDev = createMockReqRes({ method: "POST", body: { message: "hi" } });
      postDev.req.url = "/api/chat";
      devHandlers[0](postDev.req, postDev.res, vi.fn());
      expect(postDev.getStatus()).toBe(200);
      expect(postDev.getJson()).toMatchObject({ mode: "local", code: "ai/not-configured" });

      const postPreview = createMockReqRes({ method: "POST", body: { message: "hi" } });
      postPreview.req.url = "/api/chat";
      previewHandlers[0](postPreview.req, postPreview.res, vi.fn());
      expect(postPreview.getStatus()).toBe(200);
      expect(postPreview.getJson()).toMatchObject({ mode: "local", code: "preview/local-only" });
    } finally {
      if (prevGeminiKey !== undefined) {
        process.env.GEMINI_API_KEY = prevGeminiKey;
      }
    }

    // 4. Client handles 200 { mode: "local" } seamlessly
    const localDirectiveFetch = vi.fn(async () =>
      new Response(JSON.stringify({ mode: "local", code: "ai/not-configured" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    ) as unknown as typeof fetch;

    const localTurn = await sendAssistantMessage({
      message: "hi",
      history: [],
      snapshot: makeSnapshot(),
      lang: "en",
      getIdToken: async () => "fake-jwt",
      fetchFn: localDirectiveFetch
    });
    expect(localTurn.mode).toBe("local");
    expect(localTurn.reply).toContain("Quick financial snapshot");
    expect(localDirectiveFetch).toHaveBeenCalledTimes(1);

    // 5. Client stops re-posting after a 404 on plain static hosts within the same session
    const notFoundFetch = vi.fn(async () =>
      new Response("Not Found", { status: 404 })
    ) as unknown as typeof fetch;

    const first404 = await sendAssistantMessage({
      message: "hi",
      history: [],
      snapshot: makeSnapshot(),
      lang: "en",
      getIdToken: async () => "fake-jwt",
      fetchFn: notFoundFetch
    });
    const secondAfter404 = await sendAssistantMessage({
      message: "budget?",
      history: [],
      snapshot: makeSnapshot(),
      lang: "en",
      getIdToken: async () => "fake-jwt",
      fetchFn: notFoundFetch
    });
    expect(first404.mode).toBe("local");
    expect(secondAfter404.mode).toBe("local");
    expect(notFoundFetch).toHaveBeenCalledTimes(1);
  });
});
