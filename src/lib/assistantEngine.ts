import {
  CATEGORIES,
  MAX_MONEY_CENTAVOS,
  entryDate,
  formatPeso,
  fromCentavos,
  manilaDateKey,
  stripUnsafeText,
  toCentavos
} from "@/lib/core";
import {
  computeCategoryBudgetStatuses,
  computeSafeToSpendMetrics,
  resolveBudgetCycleWindow
} from "@/lib/planMath";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import type {
  BillRecord,
  BudgetCycle,
  CategoryBudgetRecord,
  LanguageCode,
  SavingsGoalRecord,
  SpendType,
  TransactionEntry,
  UtangRecord
} from "@/types/finance";

export type WarningLevel = "none" | "watch" | "warning" | "critical";

export interface SpendingBehaviorWarning {
  id: string;
  severity: Exclude<WarningLevel, "none">;
  title: string;
  detail: string;
}

export interface AssistantBehaviorAlert {
  level: WarningLevel;
  title: string;
  detail: string;
}

export interface ProposedChatAction {
  type: "expense" | "income";
  amount: number;
  desc: string;
  category: string;
  method: string;
  spendType: SpendType;
}

export interface AssistantLedgerSnapshot {
  entries: TransactionEntry[];
  budget: number | null;
  budgetCycle: BudgetCycle;
  wallets: string[];
  walletBalances: Record<string, number>;
  overallBalance: number;
  bills: BillRecord[];
  utangList: UtangRecord[];
  savingsGoals: SavingsGoalRecord[];
  categoryBudgets: CategoryBudgetRecord[];
  preferredWallet?: string;
}

export interface AssistantTurnResponse {
  reply: string;
  warning: AssistantBehaviorAlert | null;
  proposedActions: ProposedChatAction[];
  mode: "ai" | "local";
}

export interface CompactLedgerContextPayload {
  cycleLabel: string;
  remainingDays: number;
  elapsedDays: number;
  totalDays: number;
  budgetCap: number | null;
  spentInCycle: number;
  remainingBudget: number | null;
  dailySafeSpend: number | null;
  luhoSharePct: number;
  luhoSpendInCycle: number;
  needSpendInCycle: number;
  cycleIncome: number;
  overallBalance: number;
  unpaidBillsTotal: number;
  unpaidUtangToMe: number;
  unpaidUtangIOwe: number;
  wallets: Array<{ name: string; balance: number }>;
  topCategories: Array<{ category: string; spent: number; limit: number | null }>;
  activeWarnings: Array<{ severity: string; title: string; detail: string }>;
  recentEntries: Array<{
    type: "expense" | "income" | "transfer";
    amount: number;
    category: string;
    method: string;
    spendType?: string;
    desc: string;
    date: string;
  }>;
}

const MAX_PESO_VALUE = MAX_MONEY_CENTAVOS / 100;

function clipUnsafeText(value: unknown, maxLen: number): string {
  return stripUnsafeText(value).trim().slice(0, maxLen);
}

function shiftManilaKey(dateKey: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + deltaDays));
  return `${String(d.getUTCFullYear()).padStart(4, "0")}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function safeCents(value: unknown, allowNegative = false): number {
  try {
    return toCentavos(value, { allowZero: true, allowNegative });
  } catch {
    return 0;
  }
}

function summarizeCycleLedger(snapshot: AssistantLedgerSnapshot, now: Date) {
  const todayKey = manilaDateKey(now) || "2026-01-01";
  const window = resolveBudgetCycleWindow(todayKey, snapshot.budgetCycle);
  const last7Start = shiftManilaKey(todayKey, -6);
  const prev7Start = shiftManilaKey(todayKey, -13);
  const prev7End = shiftManilaKey(todayKey, -7);
  const last3Start = shiftManilaKey(todayKey, -2);

  let cycleExpenseCents = 0;
  let cycleIncomeCents = 0;
  let luhoCents = 0;
  let needCents = 0;
  let cycleExpenseCount = 0;
  let recent7Cents = 0;
  let prev7Cents = 0;
  let recentLuhoCount3d = 0;

  const categoryTotals = new Map<string, number>();

  for (const entry of snapshot.entries) {
    const key = manilaDateKey(entryDate(entry) || entry.date || "");
    if (!key) continue;
    const cents = safeCents(entry.amount);
    if (cents <= 0) continue;

    if (entry.type === "expense") {
      if (key >= window.startKey && key <= window.endKey) {
        cycleExpenseCents += cents;
        cycleExpenseCount += 1;
        if (entry.spendType === "luho") {
          luhoCents += cents;
        } else {
          needCents += cents;
        }
        const cat = entry.category || "Other";
        categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + cents);
      }
      if (key >= last7Start && key <= todayKey) {
        recent7Cents += cents;
      } else if (key >= prev7Start && key <= prev7End) {
        prev7Cents += cents;
      }
      if (key >= last3Start && key <= todayKey && entry.spendType === "luho") {
        recentLuhoCount3d += 1;
      }
    } else if (entry.type === "income") {
      if (key >= window.startKey && key <= window.endKey) {
        cycleIncomeCents += cents;
      }
    }
  }

  const { statuses: categoryStatuses } = computeCategoryBudgetStatuses({
    entries: snapshot.entries,
    budgets: snapshot.categoryBudgets,
    cycleStartKey: window.startKey,
    cycleEndKey: window.endKey
  });

  let unpaidBillsCents = 0;
  let unpaidBillsDueInCycleCents = 0;
  for (const bill of snapshot.bills) {
    if (bill.status === "Paid") continue;
    const billCents = safeCents(bill.amount);
    unpaidBillsCents += billCents;
    if (!bill.dueDate || bill.dueDate <= window.endKey) {
      unpaidBillsDueInCycleCents += billCents;
    }
  }

  const safeMetrics =
    snapshot.budget !== null && snapshot.budget > 0
      ? computeSafeToSpendMetrics({
          capAmount: snapshot.budget,
          spentAmount: fromCentavos(cycleExpenseCents),
          remainingDays: window.remainingDays,
          activeLiquidityBalance: snapshot.overallBalance,
          unpaidBillsInCycle: fromCentavos(unpaidBillsDueInCycleCents)
        })
      : null;

  let unpaidToMeCents = 0;
  let unpaidIOweCents = 0;
  for (const item of snapshot.utangList) {
    if (item.status === "Paid") continue;
    if (item.direction === "owed_to_me") {
      unpaidToMeCents += safeCents(item.amount);
    } else {
      unpaidIOweCents += safeCents(item.amount);
    }
  }

  const luhoSharePct =
    cycleExpenseCents > 0 ? Math.round((luhoCents / cycleExpenseCents) * 100) : 0;

  return {
    window,
    cycleExpenseCents,
    cycleIncomeCents,
    luhoCents,
    needCents,
    luhoSharePct,
    cycleExpenseCount,
    recent7Cents,
    prev7Cents,
    recentLuhoCount3d,
    categoryTotals,
    categoryStatuses,
    safeMetrics,
    unpaidBillsCents,
    unpaidToMeCents,
    unpaidIOweCents
  };
}

/**
 * Evaluates objective spending-behavior risks from current ledger data so the assistant
 * can proactively warn users in both online AI mode and offline fallback mode.
 */
export function analyzeSpendingBehavior(
  snapshot: AssistantLedgerSnapshot,
  lang: LanguageCode = "en",
  now: Date = new Date()
): SpendingBehaviorWarning[] {
  const isTl = lang === "tl";
  const s = summarizeCycleLedger(snapshot, now);
  const warnings: SpendingBehaviorWarning[] = [];

  // 1. Cycle budget overrun or burn-rate pace warning
  if (s.safeMetrics && s.safeMetrics.capAmount > 0) {
    const capCents = safeCents(s.safeMetrics.capAmount);
    const spentCents = safeCents(s.safeMetrics.spentAmount);
    const spentPct = capCents > 0 ? Math.round((spentCents / capCents) * 100) : 0;
    const elapsedPct = Math.round((s.window.elapsedDays / Math.max(1, s.window.totalDays)) * 100);

    if (s.safeMetrics.isOverBudget) {
      const overAmount = Math.abs(s.safeMetrics.remainingBudget);
      warnings.push({
        id: "budget-over",
        severity: "critical",
        title: isTl ? "Lagpas ka na sa budget cap" : "Budget limit exceeded",
        detail: isTl
          ? `Lumagpas ka ng ₱${formatPeso(overAmount)} sa ₱${formatPeso(s.safeMetrics.capAmount)} budget ngayong cycle (${spentPct}% nagamit). Iwasan muna ang hindi kailangang gastos.`
          : `You exceeded your ₱${formatPeso(s.safeMetrics.capAmount)} cycle budget by ₱${formatPeso(overAmount)} (${spentPct}% used). Pause non-essential spending.`
      });
    } else if (spentPct >= 80 || (spentPct >= elapsedPct + 20 && spentPct >= 55)) {
      warnings.push({
        id: "budget-pace",
        severity: "warning",
        title: isTl ? "Mabilis ang ubos ng budget mo" : "High budget burn rate",
        detail: isTl
          ? `${spentPct}% ng budget ang nagastos na pero nasa ${elapsedPct}% pa lang ng cycle (${s.window.remainingDays} araw pa natitira, ₱${formatPeso(s.safeMetrics.dailySafeSpend)}/day safe limit).`
          : `You've used ${spentPct}% of your budget only ${elapsedPct}% into the cycle (${s.window.remainingDays} days left, ₱${formatPeso(s.safeMetrics.dailySafeSpend)}/day safe spend).`
      });
    }
  }

  // 2. Category budget caps exceeded or near limit
  const overCats = s.categoryStatuses.filter((c) => c.state === "over");
  const warnCats = s.categoryStatuses.filter((c) => c.state === "warning");
  if (overCats.length > 0) {
    const topOver = overCats[0];
    warnings.push({
      id: "cat-over",
      severity: "critical",
      title: isTl ? `Over-limit sa ${topOver.category}` : `${topOver.category} cap exceeded`,
      detail: isTl
        ? `₱${formatPeso(topOver.spentAmount)} ang nagastos sa ${topOver.category} vs ₱${formatPeso(topOver.limitAmount)} cap.`
        : `Spent ₱${formatPeso(topOver.spentAmount)} on ${topOver.category} vs a ₱${formatPeso(topOver.limitAmount)} limit.`
    });
  } else if (warnCats.length > 0) {
    const topWarn = warnCats[0];
    warnings.push({
      id: "cat-warn",
      severity: "warning",
      title: isTl ? `Malapit na sa limit ang ${topWarn.category}` : `${topWarn.category} budget at ${topWarn.pct}%`,
      detail: isTl
        ? `₱${formatPeso(topWarn.remainingAmount)} na lang ang natitira sa ${topWarn.category} cap mo ngayong cycle.`
        : `Only ₱${formatPeso(topWarn.remainingAmount)} remaining in your ${topWarn.category} cap this cycle.`
    });
  }

  // 3. Elevated Luho / Wants ratio
  if (
    (s.cycleExpenseCount >= 3 || s.cycleExpenseCents >= 100_000) &&
    s.luhoSharePct >= 35
  ) {
    const isCritical = s.luhoSharePct >= 50;
    warnings.push({
      id: "luho-ratio",
      severity: isCritical ? "critical" : "warning",
      title: isTl
        ? `Mataas ang Luho gastos (${s.luhoSharePct}%)`
        : `High Wants/Luho share (${s.luhoSharePct}%)`,
      detail: isTl
        ? `₱${formatPeso(fromCentavos(s.luhoCents))} ng ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} gastos ngayong cycle ay napunta sa Luho/Wants. Subukang ibalik sa Essentials o Savings.`
        : `₱${formatPeso(fromCentavos(s.luhoCents))} out of ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} spent this cycle went to Wants/Luho. Shift next purchases to essentials.`
    });
  } else if (s.recentLuhoCount3d >= 3) {
    warnings.push({
      id: "luho-streak",
      severity: "watch",
      title: isTl ? "Sunod-sunod ang Luho purchases" : "Frequent discretionary buys",
      detail: isTl
        ? `May ${s.recentLuhoCount3d} Luho transactions ka sa nakaraang 3 araw. Mag-cooling-off muna bago ang next impulse buy.`
        : `You logged ${s.recentLuhoCount3d} Wants/Luho entries in the last 3 days. Consider a 24-hour pause before extra purchases.`
    });
  }

  // 4. Unpaid bills vs liquid wallet balance crunch
  const liquidCents = safeCents(snapshot.overallBalance, true);
  if (s.unpaidBillsCents > 0 && s.unpaidBillsCents > liquidCents) {
    warnings.push({
      id: "bills-crunch",
      severity: "critical",
      title: isTl ? "Kulang ang balanse para sa unpaid bills" : "Unpaid bills exceed wallet balance",
      detail: isTl
        ? `May ₱${formatPeso(fromCentavos(s.unpaidBillsCents))} unpaid bills ka laban sa ₱${formatPeso(snapshot.overallBalance)} total wallet balance.`
        : `You have ₱${formatPeso(fromCentavos(s.unpaidBillsCents))} in unpaid bills against ₱${formatPeso(snapshot.overallBalance)} total wallet balance.`
    });
  }

  // 5. Trailing 7-day spike vs previous 7 days
  if (s.recent7Cents >= 100_000 && s.prev7Cents >= 20_000 && s.recent7Cents * 10 >= s.prev7Cents * 16) {
    warnings.push({
      id: "spend-spike",
      severity: "watch",
      title: isTl ? "Biglang tumaas ang gastos ngayong linggo" : "7-day spending spike detected",
      detail: isTl
        ? `Umabot sa ₱${formatPeso(fromCentavos(s.recent7Cents))} ang gastos mo nitong 7 araw vs ₱${formatPeso(fromCentavos(s.prev7Cents))} noong nakaraang linggo.`
        : `Your last 7 days totaled ₱${formatPeso(fromCentavos(s.recent7Cents))}, sharply higher than ₱${formatPeso(fromCentavos(s.prev7Cents))} the prior 7 days.`
    });
  }

  const rank: Record<Exclude<WarningLevel, "none">, number> = {
    critical: 0,
    warning: 1,
    watch: 2
  };
  return warnings.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

/** Builds a compact, PII-free financial summary payload for the AI endpoint. */
export function buildCompactFinanceContext(
  snapshot: AssistantLedgerSnapshot,
  warnings: SpendingBehaviorWarning[],
  now: Date = new Date()
): CompactLedgerContextPayload {
  const s = summarizeCycleLedger(snapshot, now);
  const limitByCategory = new Map(
    snapshot.categoryBudgets.map((b) => [b.category, b.limitAmount])
  );

  const topCategories = Array.from(s.categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([category, cents]) => ({
      category,
      spent: fromCentavos(cents),
      limit: limitByCategory.get(category) ?? null
    }));

  const recentEntries = snapshot.entries.slice(0, 10).map((e) => ({
    type: e.type,
    amount: fromCentavos(safeCents(e.amount)),
    category: e.category || "Other",
    method: e.method || "Cash",
    ...(e.type === "expense" && e.spendType ? { spendType: e.spendType } : {}),
    desc: clipUnsafeText(e.desc || e.note || "", 60),
    date: manilaDateKey(entryDate(e) || e.date || "") || ""
  }));

  return {
    cycleLabel:
      snapshot.budgetCycle === "kinsenas"
        ? `Kinsenas (${s.window.startKey} to ${s.window.endKey})`
        : `Monthly (${s.window.startKey} to ${s.window.endKey})`,
    remainingDays: s.window.remainingDays,
    elapsedDays: s.window.elapsedDays,
    totalDays: s.window.totalDays,
    budgetCap: snapshot.budget,
    spentInCycle: fromCentavos(s.cycleExpenseCents),
    remainingBudget: s.safeMetrics ? s.safeMetrics.remainingBudget : null,
    dailySafeSpend: s.safeMetrics ? s.safeMetrics.dailySafeSpend : null,
    luhoSharePct: s.luhoSharePct,
    luhoSpendInCycle: fromCentavos(s.luhoCents),
    needSpendInCycle: fromCentavos(s.needCents),
    cycleIncome: fromCentavos(s.cycleIncomeCents),
    overallBalance: snapshot.overallBalance,
    unpaidBillsTotal: fromCentavos(s.unpaidBillsCents),
    unpaidUtangToMe: fromCentavos(s.unpaidToMeCents),
    unpaidUtangIOwe: fromCentavos(s.unpaidIOweCents),
    wallets: snapshot.wallets.map((w) => ({
      name: w,
      balance: snapshot.walletBalances[w] ?? 0
    })),
    topCategories,
    activeWarnings: warnings.slice(0, 4).map((w) => ({
      severity: w.severity,
      title: w.title,
      detail: w.detail
    })),
    recentEntries
  };
}

const INCOME_CUE_RE =
  /\b(income|kita|sahod|sweldo|salary|payout|payroll|freelance|commission|komisyon|bonus|refund|reimburse|allowance|baon|received|natanggap|pumasok|nagpasok|benta|sold|cash[\s-]*in)\b/i;

const EXPENSE_CUE_RE =
  /\b(expense|expenses|gastos|nagastos|bili|bumili|binili|bayad|nagbayad|binayaran|spent|paid|bought|order|umorder|grab|angkas|moveit|lunch|dinner|breakfast|almusal|tanghalian|hapunan|merienda|kape|coffee|milktea|milk tea|grocery|groceries|load|data|bill|bills|shopee|lazada|tiktok|utang payment|log|i-log|mag-log|add|record|ilagay)\b/i;

const LUHO_CUE_RE =
  /\b(luho|want|wants|treat|milktea|milk tea|boba|starbucks|dessert|cake|ice cream|shopee|lazada|tiktok shop|mall|shopping|cinema|sine|movie|netflix|spotify|game|gaming|valorant|mlbb|skins|beer|inom|bar|samgyup|buffet|cravings|budol|gadget)\b/i;

const NEED_CUE_RE = /\b(need|needs|essential|essentials|kailangan)\b/i;

function resolveWalletFromText(
  text: string,
  wallets: readonly string[],
  preferredWallet?: string
): { method: string; matchedTokenRegex?: RegExp } {
  const candidates = wallets.length > 0 ? wallets : ["Cash"];

  // Sort longer wallet names first so "UnionBank" matches before "Bank" or "BDO"
  const indexed = candidates
    .map((wallet) => {
      const visual = resolveWalletVisual(wallet);
      const compact = wallet.toLowerCase().replace(/\s+/g, "");
      const visualCompact = visual.displayName.toLowerCase().replace(/\s+/g, "");
      const aliases = Array.from(new Set([wallet, visual.displayName, compact, visualCompact]));
      return { wallet, aliases };
    })
    .sort((a, b) => b.wallet.length - a.wallet.length);

  for (const item of indexed) {
    for (const alias of item.aliases) {
      if (!alias) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "i");
      if (re.test(text)) {
        return {
          method: item.wallet,
          matchedTokenRegex: new RegExp(`(?:\\b(?:sa|galing|via|using|gamit|mula sa|from|to|in)\\s+)?\\b${escaped}\\b`, "gi")
        };
      }
    }
  }

  if (preferredWallet && candidates.includes(preferredWallet)) {
    return { method: preferredWallet };
  }
  return { method: candidates[0] || "Cash" };
}

function inferExpenseCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/\b(meralco|maynilad|manila water|kuryente|tubig|pldt|converge|fiber|internet|wifi|rent|upa|electric|bill|bills|utility|utilities)\b/i.test(lower)) {
    return "Bills & Utilities";
  }
  if (/\b(jollibee|mcdo|chowking|mang inasal|starbucks|kape|coffee|milktea|milk tea|boba|lunch|dinner|breakfast|almusal|tanghalian|hapunan|merienda|food|pagkain|foodpanda|grabfood|ulam|snack|kain|kumain|samgyup|restaurant|cafe|tea)\b/i.test(lower)) {
    return "Food & Dining";
  }
  if (/\b(grab|angkas|joyride|moveit|jeep|jeepney|tricycle|trike|fx|uv|bus|mrt|lrt|lrt1|lrt2|pamasahe|fare|commute|beep|gas|gasolina|petron|shell|caltex|toll|easytrip|autosweep|parking)\b/i.test(lower)) {
    return "Transportation";
  }
  if (/\b(load|promo|data|prepaid|smart|globe|dito|tnt|tm|sun)\b/i.test(lower)) {
    return "Mobile & Data";
  }
  if (/\b(grocery|groceries|puregold|savemore|sm supermarket|robinsons supermarket|snr|landmart|palengke|wet market|bigas)\b/i.test(lower)) {
    return "Groceries";
  }
  if (/\b(shopee|lazada|tiktok shop|mall|uniqlo|zara|shopping|clothes|damit|sapatos|shoes|bag|budol|gadget)\b/i.test(lower)) {
    return "Shopping";
  }
  if (/\b(savings|ipon|emergency fund|deposit jar)\b/i.test(lower)) {
    return "Savings";
  }
  if (/\b(mercury|watsons|southstar|gamot|medicine|vitamins|doctor|clinic|hospital|checkup|dental)\b/i.test(lower)) {
    return "Healthcare";
  }
  if (/\b(cinema|movie|sine|netflix|spotify|disney|game|gaming|valorant|mlbb|steam|concert|beer|inom|bar)\b/i.test(lower)) {
    return "Entertainment";
  }
  return "Other";
}

function extractAmountFromClause(clause: string): { amount: number; matched: string } | null {
  const match = /(?:(?:php|₱|p)\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(k)?\b/i.exec(clause);
  if (!match) return null;

  const whole = match[1].replace(/,/g, "");
  const frac = match[2] ? `.${match[2]}` : "";
  let num = Number(`${whole}${frac}`);
  if (match[3]?.toLowerCase() === "k") {
    num *= 1000;
  }
  if (!Number.isFinite(num) || num <= 0 || num > MAX_PESO_VALUE) return null;
  return {
    amount: Math.round(num * 100) / 100,
    matched: match[0]
  };
}

function cleanDescription(
  clause: string,
  matchedAmount: string,
  walletRegex: RegExp | undefined,
  fallbackType: "expense" | "income",
  category: string
): string {
  let cleaned = clause.replace(matchedAmount, " ");
  if (walletRegex) {
    cleaned = cleaned.replace(walletRegex, " ");
  }
  cleaned = cleaned
    .replace(
      /\b(paki|pakilog|paki-log|please|pls|can you|pwede|puwede|mo|ako|ko|sana|mag-log|i-log|ilog|log|add|record|ilagay|dagdag|ng|ang|yung|sa|galing|via|using|gamit|mula|spent|spend|paid|pay|bought|buy|got|received|earned|bumili|bili|nagbayad|bayad|nagastos|luho|want|wants|need|needs|expense|expenses|income|kita)\b/gi,
      " "
    )
    .replace(/[^\p{L}\p{N}\s&'./-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || cleaned.length < 2) {
    if (fallbackType === "income") return "Income";
    return CATEGORIES.includes(category) && category !== "Other" ? category : "Expense";
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 120);
}

/**
 * Parses natural Taglish or English chat commands into structured expense/income drafts
 * (supports single or multi-item commands, e.g. "Log 150 lunch cash at 85 jeep gcash").
 */
export function parseNaturalTransactionCommand(
  rawText: string,
  wallets: readonly string[],
  preferredWallet?: string
): ProposedChatAction[] {
  const cleanText = clipUnsafeText(rawText, 600);
  if (!cleanText) return [];

  // Reject pure questions that ask about totals unless they explicitly say log/add/record
  const isPureQuestion =
    /\?$/.test(cleanText) && !/\b(log|i-log|ilog|mag-log|add|record|pakilog|paki-log|ilagay)\b/i.test(cleanText);
  if (isPureQuestion) return [];

  // Split multi-item instructions only when every candidate chunk actually carries a numeric amount
  const rawSegments = cleanText
    .split(/(?:\r?\n|[;,]|\s+\b(?:and|at)\b\s+)/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const segmentsWithAmounts = rawSegments.filter((seg) => extractAmountFromClause(seg) !== null);
  const clauses =
    segmentsWithAmounts.length >= 2 && segmentsWithAmounts.length === rawSegments.length
      ? rawSegments.slice(0, 3)
      : [cleanText];

  const actions: ProposedChatAction[] = [];

  for (const clause of clauses) {
    const amt = extractAmountFromClause(clause);
    if (!amt) continue;

    const hasIncome = INCOME_CUE_RE.test(clause);
    const hasExpense = EXPENSE_CUE_RE.test(clause) || LUHO_CUE_RE.test(clause) || NEED_CUE_RE.test(clause);
    const hasExplicitCommand = /\b(log|i-log|ilog|mag-log|add|record|pakilog|paki-log|ilagay|spent|paid|bought|bumili|nagbayad|nagastos|received|natanggap)\b/i.test(clause);

    // Avoid hijacking conversational Q&A numbers (like "safe ba gumastos ng 1000?")
    if (!hasIncome && !hasExpense && !hasExplicitCommand) continue;
    if (/\b(safe|pwede ba|puwede ba|magkano|what if|kung gumastos|overspending)\b/i.test(clause) && !hasExplicitCommand) {
      continue;
    }

    const type: "expense" | "income" = hasIncome && !LUHO_CUE_RE.test(clause) ? "income" : "expense";
    const { method, matchedTokenRegex } = resolveWalletFromText(clause, wallets, preferredWallet);
    const category = type === "income" ? "Kita" : inferExpenseCategory(clause);

    let spendType: SpendType = "need";
    if (type === "expense") {
      if (NEED_CUE_RE.test(clause)) {
        spendType = "need";
      } else if (LUHO_CUE_RE.test(clause)) {
        spendType = "luho";
      }
    }

    const desc = cleanDescription(clause, amt.matched, matchedTokenRegex, type, category);
    actions.push({
      type,
      amount: amt.amount,
      desc,
      category,
      method,
      spendType
    });
  }

  return actions;
}

/**
 * Evaluates immediate spending impact of a newly logged or proposed expense
 * and returns a contextual behavior warning when it crosses risk thresholds.
 */
export function evaluateActionBehaviorWarning(
  action: ProposedChatAction,
  snapshot: AssistantLedgerSnapshot,
  lang: LanguageCode = "en",
  alreadySaved = false
): AssistantBehaviorAlert | null {
  if (action.type !== "expense") return null;
  const isTl = lang === "tl";
  const walletBalance = snapshot.walletBalances[action.method] ?? 0;

  if (!alreadySaved && action.amount > walletBalance) {
    return {
      level: "critical",
      title: isTl ? `Kulang ang balanse sa ${action.method}` : `Insufficient ${action.method} balance`,
      detail: isTl
        ? `₱${formatPeso(walletBalance)} lang ang nasa ${action.method} mo, kaya kulang ng ₱${formatPeso(action.amount - walletBalance)}. Palitan ang wallet bago i-save.`
        : `${action.method} only has ₱${formatPeso(walletBalance)} available (short by ₱${formatPeso(action.amount - walletBalance)}). Switch wallets before saving.`
    };
  }

  const simulatedEntries: TransactionEntry[] = alreadySaved
    ? snapshot.entries
    : [
        {
          id: "__preview__",
          type: "expense",
          amount: action.amount,
          desc: action.desc,
          category: action.category,
          method: action.method,
          spendType: action.spendType,
          date: manilaDateKey(new Date()) || undefined
        },
        ...snapshot.entries
      ];

  const warnings = analyzeSpendingBehavior(
    { ...snapshot, entries: simulatedEntries },
    lang
  );
  if (warnings.length === 0) return null;

  const top = warnings[0];
  return {
    level: top.severity,
    title: top.title,
    detail: top.detail
  };
}

/**
 * Provides smart offline / on-device answers, transaction parsing, and spending warnings
 * whenever the serverless AI endpoint is offline, rate-limited, or unconfigured.
 */
export function generateLocalAssistantReply(
  rawMessage: string,
  snapshot: AssistantLedgerSnapshot,
  lang: LanguageCode = "en"
): AssistantTurnResponse {
  const isTl = lang === "tl";
  const warnings = analyzeSpendingBehavior(snapshot, lang);
  const proposedActions = parseNaturalTransactionCommand(
    rawMessage,
    snapshot.wallets,
    snapshot.preferredWallet
  );

  if (proposedActions.length > 0) {
    const summaryParts = proposedActions.map((a) => {
      const sign = a.type === "income" ? "+" : "-";
      const tag = a.type === "expense" ? ` (${a.category} · ${a.spendType === "luho" ? "Luho" : "Need"})` : "";
      return `${sign}₱${formatPeso(a.amount)} · ${a.desc} via ${resolveWalletVisual(a.method).displayName}${tag}`;
    });

    const draftWarning = evaluateActionBehaviorWarning(proposedActions[0], snapshot, lang, false);

    const reply = isTl
      ? `Inihanda ko na ${proposedActions.length > 1 ? `ang ${proposedActions.length} entries` : "ito"} para sa iyo:\n${summaryParts.join("\n")}\n\nPindutin ang "Confirm & Save" sa card sa ibaba para pumasok sa ledger.`
      : `Prepared ${proposedActions.length > 1 ? `${proposedActions.length} draft entries` : "your entry"}:\n${summaryParts.join("\n")}\n\nTap "Confirm & Save" below to add it to your ledger.`;

    return {
      reply,
      warning: draftWarning,
      proposedActions,
      mode: "local"
    };
  }

  const lower = clipUnsafeText(rawMessage, 600).toLowerCase();
  const s = summarizeCycleLedger(snapshot, new Date());
  const topWarning: AssistantBehaviorAlert | null = warnings[0]
    ? { level: warnings[0].severity, title: warnings[0].title, detail: warnings[0].detail }
    : null;

  // Intent 1: Spending behavior / overspending / warnings / analyze
  if (/\b(overspend|warning|habit|behavior|lug|luho|analyze|kamusta gastos|kumusta gastos|check spend|gastos ko)\b/i.test(lower)) {
    const cycleSpent = formatPeso(fromCentavos(s.cycleExpenseCents));
    const luhoSpent = formatPeso(fromCentavos(s.luhoCents));
    const needSpent = formatPeso(fromCentavos(s.needCents));
    const topCats = Array.from(s.categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, cents]) => `${cat}: ₱${formatPeso(fromCentavos(cents))}`)
      .join(", ");

    const reply = isTl
      ? `Spending check para sa ${snapshot.budgetCycle === "kinsenas" ? "Kinsenas" : "Buwanang"} cycle:\n• Kabuuang gastos: ₱${cycleSpent} (Needs ₱${needSpent} · Luho ₱${luhoSpent} / ${s.luhoSharePct}%)\n${topCats ? `• Top categories: ${topCats}\n` : ""}${warnings.length === 0 ? "• Mukhang maayos ang takbo ng spending behavior mo ngayon." : `• May ${warnings.length} spending alert na kailangang bantayan (tingnan sa warning box).`}`
      : `Spending behavior check for this ${snapshot.budgetCycle} cycle:\n• Total spent: ₱${cycleSpent} (Essentials ₱${needSpent} · Wants/Luho ₱${luhoSpent} / ${s.luhoSharePct}%)\n${topCats ? `• Top categories: ${topCats}\n` : ""}${warnings.length === 0 ? "• Your spending pace and Wants share look healthy right now." : `• ${warnings.length} behavior warning(s) flagged — see the alert below.`}`;

    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // Intent 2: Safe-to-spend / remaining budget
  if (/\b(safe|budget|natitira|matitira|pwede pang|puwede pang|limit|cap|kinsenas)\b/i.test(lower)) {
    if (!s.safeMetrics) {
      const reply = isTl
        ? `Wala ka pang naka-set na budget cap ngayon. Kabuuang gastos sa cycle: ₱${formatPeso(fromCentavos(s.cycleExpenseCents))}, at total liquid balance: ₱${formatPeso(snapshot.overallBalance)}. Puwede kang mag-set ng budget cap sa Dashboard o Plan page.`
        : `You do not have a budget cap set yet. Cycle spending is ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} with ₱${formatPeso(snapshot.overallBalance)} across active wallets. Set a budget cap in Dashboard or Plan anytime.`;
      return { reply, warning: topWarning, proposedActions: [], mode: "local" };
    }

    const m = s.safeMetrics;
    const reply = isTl
      ? `Budget status (${snapshot.budgetCycle === "kinsenas" ? "Kinsenas" : "Monthly"} · ${s.window.remainingDays} araw pa):\n• Nagastos: ₱${formatPeso(m.spentAmount)} / ₱${formatPeso(m.capAmount)}\n• Natitira: ₱${formatPeso(m.remainingBudget)}\n• Safe daily spend: ₱${formatPeso(m.dailySafeSpend)}/araw\n• Unpaid bills sa cycle: ₱${formatPeso(m.unpaidBillsInCycle)} (Free after bills: ₱${formatPeso(m.freeAfterBills)})`
      : `Budget status (${snapshot.budgetCycle} · ${s.window.remainingDays} days left):\n• Spent: ₱${formatPeso(m.spentAmount)} / ₱${formatPeso(m.capAmount)}\n• Remaining: ₱${formatPeso(m.remainingBudget)}\n• Daily safe spend: ₱${formatPeso(m.dailySafeSpend)}/day\n• Unpaid bills this cycle: ₱${formatPeso(m.unpaidBillsInCycle)} (Free after bills: ₱${formatPeso(m.freeAfterBills)})`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // Intent 3: Bills & Utang
  if (/\b(bill|bills|bayarin|due|utang|singil|utang ko|may utang)\b/i.test(lower)) {
    const unpaidBillsCount = snapshot.bills.filter((b) => b.status !== "Paid").length;
    const reply = isTl
      ? `Bills & Utang summary:\n• Unpaid/Overdue bills: ${unpaidBillsCount} item(s), total ₱${formatPeso(fromCentavos(s.unpaidBillsCents))}\n• Singilin sa iba (Owed to you): ₱${formatPeso(fromCentavos(s.unpaidToMeCents))}\n• Babayaran mo (You owe): ₱${formatPeso(fromCentavos(s.unpaidIOweCents))}`
      : `Bills & Utang summary:\n• Unpaid/Overdue bills: ${unpaidBillsCount} item(s) totaling ₱${formatPeso(fromCentavos(s.unpaidBillsCents))}\n• Receivables (Owed to you): ₱${formatPeso(fromCentavos(s.unpaidToMeCents))}\n• Payables (You owe): ₱${formatPeso(fromCentavos(s.unpaidIOweCents))}`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // Intent 4: Wallets / Balances / Jars
  if (/\b(wallet|wallets|balanse|balance|pera|cash|gcash|maya|bank|jar|jars|savings|ipon)\b/i.test(lower)) {
    const walletList = snapshot.wallets
      .map((w) => `• ${resolveWalletVisual(w).displayName}: ₱${formatPeso(snapshot.walletBalances[w] ?? 0)}`)
      .join("\n");
    const jarSummary =
      snapshot.savingsGoals.length > 0
        ? `\n\n${isTl ? "Savings Jars" : "Savings Jars"}: ${snapshot.savingsGoals.length} active`
        : "";
    const reply = isTl
      ? `Total liquid balance mo ay ₱${formatPeso(snapshot.overallBalance)}:\n${walletList}${jarSummary}`
      : `Your total liquid balance is ₱${formatPeso(snapshot.overallBalance)}:\n${walletList}${jarSummary}`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // Helpful fallback summary + command guide
  const reply = isTl
    ? `Narito ang quick snapshot mo ngayon:\n• Total Balance: ₱${formatPeso(snapshot.overallBalance)}\n• Gastos ngayong cycle: ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} (${s.luhoSharePct}% Luho)\n\nPuwede mo akong utusang mag-log tulad ng:\n- "Log 150 lunch sa Cash"\n- "Nag-Grab 185 galing GCash"\n- "Log kita 12000 sahod sa Land Bank"\nO magtanong: "Am I overspending?" / "Safe to spend?"`
    : `Quick financial snapshot:\n• Total Balance: ₱${formatPeso(snapshot.overallBalance)}\n• Cycle Spending: ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} (${s.luhoSharePct}% Wants/Luho)\n\nTry instructing me to log directly, like:\n- "Log 150 lunch via Cash"\n- "Spent 185 Grab using GCash"\n- "Log income 12000 salary to Land Bank"\nOr ask: "Am I overspending?" / "Safe to spend?"`;

  return { reply, warning: topWarning, proposedActions: [], mode: "local" };
}
