import { auth } from "@/lib/auth";
import {
  analyzeSpendingBehavior,
  buildCompactFinanceContext,
  clipUnsafeText,
  generateLocalAssistantReply,
  type AssistantLedgerSnapshot,
  type AssistantTurnResponse,
  type ProposedChatAction
} from "@/lib/assistantEngine";
import { CATEGORIES, manilaDateKey } from "@/lib/core";
import type {
  BillRecurrence,
  BudgetCycle,
  LanguageCode,
  SavingsGoalColor
} from "@/types/finance";

export interface ChatHistoryTurn {
  role: "user" | "assistant";
  text: string;
}

const MAX_RETRIES = 0;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const BILL_RECURRENCES = new Set<BillRecurrence>([
  "none",
  "weekly",
  "monthly",
  "quarterly",
  "yearly"
]);
const GOAL_COLORS = new Set<SavingsGoalColor>(["emerald", "blue", "amber", "violet", "rose"]);
let staticEndpointUnavailable = false;

export function resetAssistantClientForTest(): void {
  staticEndpointUnavailable = false;
}

function positiveRoundedAmount(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

function nonNegativeRoundedAmount(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

function sanitizeClientActions(
  actions: unknown,
  snapshot: AssistantLedgerSnapshot
): ProposedChatAction[] {
  if (!Array.isArray(actions)) return [];
  const wallets = snapshot.wallets.length > 0 ? snapshot.wallets : ["Cash"];
  const validWallets = new Set(wallets);
  const defaultWallet = wallets[0] || "Cash";
  const defaultToday = manilaDateKey(new Date()) || "2026-01-01";
  const out: ProposedChatAction[] = [];

  for (const item of actions.slice(0, 3)) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const rawType = String(raw.type || "expense");

    if (rawType === "transfer") {
      const amount = positiveRoundedAmount(raw.amount);
      if (!amount) continue;
      const fromMethod = validWallets.has(String(raw.fromMethod || ""))
        ? String(raw.fromMethod)
        : defaultWallet;
      const toMethod = validWallets.has(String(raw.toMethod || ""))
        ? String(raw.toMethod)
        : defaultWallet;
      if (fromMethod === toMethod) continue;
      const desc = clipUnsafeText(raw.desc, 120) || `${fromMethod} -> ${toMethod}`;
      const note = clipUnsafeText(raw.note, 200);
      out.push({
        type: "transfer",
        amount,
        desc,
        fromMethod,
        toMethod,
        ...(note ? { note } : {})
      });
      continue;
    }

    if (rawType === "bill") {
      const amount = positiveRoundedAmount(raw.amount);
      const title = clipUnsafeText(raw.title, 120);
      if (!amount || !title) continue;
      const dueRaw = clipUnsafeText(raw.dueDate, 20);
      const dueDate = ISO_DATE_RE.test(dueRaw) ? dueRaw : defaultToday;
      const recRaw = String(raw.recurrence || "none") as BillRecurrence;
      const recurrence = BILL_RECURRENCES.has(recRaw) ? recRaw : "none";
      const category = clipUnsafeText(raw.category, 40) || "Bills";
      const notes = clipUnsafeText(raw.notes, 240);
      out.push({
        type: "bill",
        title,
        amount,
        dueDate,
        category,
        recurrence,
        ...(notes ? { notes } : {})
      });
      continue;
    }

    if (rawType === "mark_bill_paid") {
      const billId = clipUnsafeText(raw.billId, 64);
      const titleHint = clipUnsafeText(raw.title, 80).toLowerCase();
      const matched =
        snapshot.bills.find((b) => b.status !== "Paid" && b.id === billId) ||
        snapshot.bills.find(
          (b) => b.status !== "Paid" && titleHint && b.title.toLowerCase().includes(titleHint)
        );
      if (!matched) continue;
      out.push({
        type: "mark_bill_paid",
        billId: matched.id,
        title: matched.title,
        amount: matched.amount,
        dueDate: matched.dueDate || defaultToday,
        recurrence: matched.recurrence || "none",
        category: matched.category || "Bills"
      });
      continue;
    }

    if (rawType === "utang") {
      const amount = positiveRoundedAmount(raw.amount);
      const name = clipUnsafeText(raw.name, 100);
      if (!amount || !name) continue;
      const direction = raw.direction === "i_owe" ? "i_owe" : "owed_to_me";
      const dueRaw = clipUnsafeText(raw.dueDate, 20);
      const dueDate = ISO_DATE_RE.test(dueRaw) ? dueRaw : undefined;
      const notes = clipUnsafeText(raw.notes, 240);
      out.push({
        type: "utang",
        name,
        amount,
        direction,
        ...(dueDate ? { dueDate } : {}),
        ...(notes ? { notes } : {})
      });
      continue;
    }

    if (rawType === "settle_utang") {
      const utangId = clipUnsafeText(raw.utangId, 64);
      const nameHint = clipUnsafeText(raw.name, 80).toLowerCase();
      const matched =
        snapshot.utangList.find((u) => u.status !== "Paid" && u.id === utangId) ||
        snapshot.utangList.find(
          (u) => u.status !== "Paid" && nameHint && u.name.toLowerCase().includes(nameHint)
        );
      if (!matched) continue;
      out.push({
        type: "settle_utang",
        utangId: matched.id,
        name: matched.name,
        amount: matched.amount,
        direction: matched.direction
      });
      continue;
    }

    if (rawType === "savings_goal") {
      const name = clipUnsafeText(raw.name, 80);
      const targetAmount = positiveRoundedAmount(raw.targetAmount);
      if (!name || !targetAmount) continue;
      const savedAmount = nonNegativeRoundedAmount(raw.savedAmount) ?? 0;
      const walletRaw = clipUnsafeText(raw.wallet, 40);
      const wallet = validWallets.has(walletRaw) ? walletRaw : undefined;
      const dateRaw = clipUnsafeText(raw.targetDate, 20);
      const targetDate = ISO_DATE_RE.test(dateRaw) ? dateRaw : undefined;
      const colorRaw = String(raw.color || "emerald") as SavingsGoalColor;
      const color = GOAL_COLORS.has(colorRaw) ? colorRaw : "emerald";
      out.push({
        type: "savings_goal",
        name,
        targetAmount,
        savedAmount,
        ...(wallet ? { wallet } : {}),
        ...(targetDate ? { targetDate } : {}),
        color
      });
      continue;
    }

    if (rawType === "savings_deposit") {
      const amount = positiveRoundedAmount(raw.amount);
      if (!amount) continue;
      const goalId = clipUnsafeText(raw.goalId, 64);
      const nameHint = clipUnsafeText(raw.goalName, 80).toLowerCase();
      const matched =
        snapshot.savingsGoals.find((g) => g.id === goalId) ||
        snapshot.savingsGoals.find((g) => nameHint && g.name.toLowerCase().includes(nameHint));
      if (!matched) continue;
      const deductRaw = clipUnsafeText(raw.deductFromWallet, 40);
      const deductFromWallet = validWallets.has(deductRaw) ? deductRaw : undefined;
      out.push({
        type: "savings_deposit",
        goalId: matched.id,
        goalName: matched.name,
        amount,
        ...(deductFromWallet ? { deductFromWallet } : {})
      });
      continue;
    }

    if (rawType === "set_budget") {
      const amount = nonNegativeRoundedAmount(raw.amount);
      if (amount === null) continue;
      const budgetCycle: BudgetCycle | undefined =
        raw.budgetCycle === "kinsenas"
          ? "kinsenas"
          : raw.budgetCycle === "monthly"
            ? "monthly"
            : undefined;
      out.push({
        type: "set_budget",
        amount,
        ...(budgetCycle ? { budgetCycle } : {})
      });
      continue;
    }

    if (rawType === "category_budget") {
      const limitAmount = positiveRoundedAmount(raw.limitAmount);
      if (!limitAmount) continue;
      const rawCat = String(raw.category || "Other");
      const category = CATEGORIES.includes(rawCat) ? rawCat : "Other";
      const existing = snapshot.categoryBudgets.find((b) => b.category === category);
      out.push({
        type: "category_budget",
        ...(existing ? { budgetId: existing.id } : {}),
        category,
        limitAmount
      });
      continue;
    }

    // Standard expense / income
    const type = rawType === "income" ? "income" : "expense";
    const amount = positiveRoundedAmount(raw.amount);
    if (!amount) continue;
    const desc = clipUnsafeText(raw.desc, 120);
    if (!desc) continue;
    const rawCat = String(raw.category || "Other");
    const category = type === "income" ? "Kita" : CATEGORIES.includes(rawCat) ? rawCat : "Other";
    const rawWallet = String(raw.method || defaultWallet);
    const method = validWallets.has(rawWallet) ? rawWallet : defaultWallet;
    const spendType = type === "expense" && raw.spendType === "luho" ? "luho" : "need";
    out.push({ type, amount, desc, category, method, spendType });
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
          history: history.slice(-10),
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

      const proposedActions = sanitizeClientActions(data.proposedActions, snapshot);
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
