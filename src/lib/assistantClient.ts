import { auth } from "@/lib/auth";
import {
  analyzeSpendingBehavior,
  buildCompactFinanceContext,
  generateLocalAssistantReply,
  type AssistantLedgerSnapshot,
  type AssistantTurnResponse,
  type ProposedChatAction
} from "@/lib/assistantEngine";
import { CATEGORIES } from "@/lib/core";
import type { LanguageCode } from "@/types/finance";

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

const MAX_RETRIES = 0;
let staticEndpointUnavailable = false;

export function resetAssistantClientForTest(): void {
  staticEndpointUnavailable = false;
}

function sanitizeClientActions(
  actions: unknown,
  wallets: readonly string[]
): ProposedChatAction[] {
  if (!Array.isArray(actions)) return [];
  const validWallets = new Set(wallets);
  const defaultWallet = wallets[0] || "Cash";
  const out: ProposedChatAction[] = [];

  for (const item of actions.slice(0, 3)) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const type = raw.type === "income" ? "income" : "expense";
    const amount = Number(raw.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const desc = String(raw.desc || "").trim().slice(0, 120);
    if (!desc) continue;
    const rawCat = String(raw.category || "Other");
    const category = type === "income" ? "Kita" : CATEGORIES.includes(rawCat) ? rawCat : "Other";
    const rawWallet = String(raw.method || defaultWallet);
    const method = validWallets.has(rawWallet) ? rawWallet : defaultWallet;
    const spendType = type === "expense" && raw.spendType === "luho" ? "luho" : "need";
    out.push({ type, amount: Math.round(amount * 100) / 100, desc, category, method, spendType });
  }
  return out;
}

/**
 * Sends a financial chat prompt to the authenticated Vercel `/api/chat` backend when online,
 * falling back seamlessly to the deterministic on-device engine if offline or unconfigured.
 */
export async function sendAssistantMessage(params: {
  message: string;
  history: ChatHistoryTurn[];
  snapshot: AssistantLedgerSnapshot;
  lang: LanguageCode;
  fetchFn?: typeof fetch;
  getIdToken?: () => Promise<string | null>;
}): Promise<AssistantTurnResponse> {
  const { message, history, snapshot, lang, fetchFn = fetch, getIdToken } = params;

  const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;

  if (isOffline || staticEndpointUnavailable) {
    return generateLocalAssistantReply(message, snapshot, lang);
  }

  let idToken = "";
  try {
    if (getIdToken) {
      idToken = (await getIdToken()) || "";
    } else if (auth.currentUser) {
      idToken = await auth.currentUser.getIdToken();
    }
  } catch {
    return generateLocalAssistantReply(message, snapshot, lang);
  }
  if (!idToken) {
    return generateLocalAssistantReply(message, snapshot, lang);
  }

  const warnings = analyzeSpendingBehavior(snapshot, lang);
  const context = buildCompactFinanceContext(snapshot, warnings);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetchFn("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          message,
          lang,
          history: history.slice(-8),
          context
        }),
        signal: AbortSignal.timeout(20_000)
      });

      if (res.status === 429) {
        const retryJson = (await res.json().catch(() => ({}))) as { retryAfterSec?: number };
        const waitSec = retryJson.retryAfterSec ? `${retryJson.retryAfterSec}s` : "a few seconds";
        const local = generateLocalAssistantReply(message, snapshot, lang);
        return {
          ...local,
          reply:
            lang === "tl"
              ? `Saglit lang — na-rate-limit muna ang cloud AI (${waitSec}), pero heto ang sagot gamit ang local Tipid analyzer:\n\n${local.reply}`
              : `Cloud AI rate limit reached (retry in ${waitSec}), so I answered using the local Tipid analyzer:\n\n${local.reply}`
        };
      }

      if (res.status === 404) {
        staticEndpointUnavailable = true;
        return generateLocalAssistantReply(message, snapshot, lang);
      }

      if (!res.ok) {
        return generateLocalAssistantReply(message, snapshot, lang);
      }

      const data = (await res.json()) as {
        mode?: unknown;
        reply?: unknown;
        warning?: AssistantTurnResponse["warning"];
        proposedActions?: unknown;
      };

      if (data.mode === "local") {
        return generateLocalAssistantReply(message, snapshot, lang);
      }

      const replyText = typeof data.reply === "string" ? data.reply.trim() : "";
      if (!replyText) {
        return generateLocalAssistantReply(message, snapshot, lang);
      }

      const proposedActions = sanitizeClientActions(data.proposedActions, snapshot.wallets);
      const localWarnings = analyzeSpendingBehavior(snapshot, lang);

      // Prefer Gemini's warning if non-empty, otherwise fall back to deterministic top warning
      const aiWarning =
        data.warning && data.warning.level && data.warning.level !== "none"
          ? {
              level: data.warning.level,
              title: String(data.warning.title || ""),
              detail: String(data.warning.detail || "")
            }
          : localWarnings[0]
            ? {
                level: localWarnings[0].severity,
                title: localWarnings[0].title,
                detail: localWarnings[0].detail
              }
            : null;

      return {
        reply: replyText,
        warning: aiWarning,
        proposedActions,
        mode: "ai"
      };
    } catch {
      return generateLocalAssistantReply(message, snapshot, lang);
    }
  }

  return generateLocalAssistantReply(message, snapshot, lang);
}
