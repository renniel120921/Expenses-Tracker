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
  computeSavingsJarProgress,
  resolveBudgetCycleWindow
} from "@/lib/planMath";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import type {
  BillRecurrence,
  BillRecord,
  BudgetCycle,
  CategoryBudgetRecord,
  LanguageCode,
  SavingsGoalColor,
  SavingsGoalRecord,
  SpendType,
  TransactionEntry,
  UtangDirection,
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

export type ProposedChatAction =
  | {
      type: "expense" | "income";
      amount: number;
      desc: string;
      category: string;
      method: string;
      spendType: SpendType;
    }
  | {
      type: "transfer";
      amount: number;
      desc: string;
      fromMethod: string;
      toMethod: string;
      note?: string;
    }
  | {
      type: "bill";
      title: string;
      amount: number;
      dueDate: string;
      category: string;
      recurrence: BillRecurrence;
      notes?: string;
    }
  | {
      type: "mark_bill_paid";
      billId: string;
      title: string;
      amount: number;
      dueDate: string;
      recurrence: BillRecurrence;
      category: string;
    }
  | {
      type: "utang";
      name: string;
      amount: number;
      direction: UtangDirection;
      dueDate?: string;
      notes?: string;
    }
  | {
      type: "settle_utang";
      utangId: string;
      name: string;
      amount: number;
      direction: UtangDirection;
    }
  | {
      type: "savings_goal";
      name: string;
      targetAmount: number;
      savedAmount: number;
      wallet?: string;
      targetDate?: string;
      color: SavingsGoalColor;
    }
  | {
      type: "savings_deposit";
      goalId: string;
      goalName: string;
      amount: number;
      deductFromWallet?: string;
    }
  | {
      type: "set_budget";
      amount: number;
      budgetCycle?: BudgetCycle;
    }
  | {
      type: "category_budget";
      budgetId?: string;
      category: string;
      limitAmount: number;
    };

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
  todayKey: string;
  budgetCycle: BudgetCycle;
  cycleStartKey: string;
  cycleEndKey: string;
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
  savingsTotal: number;
  unpaidBillsTotal: number;
  unpaidUtangToMe: number;
  unpaidUtangIOwe: number;
  wallets: Array<{ name: string; balance: number }>;
  topCategories: Array<{ category: string; spent: number; limit: number | null }>;
  unpaidBills: Array<{
    id: string;
    title: string;
    amount: number;
    dueDate: string;
    status: string;
    recurrence: BillRecurrence;
    category: string;
  }>;
  openUtang: Array<{
    id: string;
    name: string;
    amount: number;
    direction: UtangDirection;
    dueDate: string | null;
  }>;
  savingsJars: Array<{
    id: string;
    name: string;
    savedAmount: number;
    targetAmount: number;
    wallet: string | null;
    targetDate: string | null;
  }>;
  categoryBudgets: Array<{
    id: string;
    category: string;
    limitAmount: number;
    spentAmount: number;
    state: string;
  }>;
  activeWarnings: Array<{ severity: string; title: string; detail: string }>;
  recentEntries: Array<{
    type: "expense" | "income" | "transfer";
    amount: number;
    category: string;
    method: string;
    toMethod?: string;
    spendType?: string;
    desc: string;
    date: string;
  }>;
}

const MAX_PESO_VALUE = MAX_MONEY_CENTAVOS / 100;

export function clipUnsafeText(value: unknown, maxLen: number): string {
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

  let savingsTotalCents = 0;
  for (const jar of snapshot.savingsGoals) {
    savingsTotalCents += safeCents(jar.savedAmount);
  }

  const luhoSharePct =
    cycleExpenseCents > 0 ? Math.round((luhoCents / cycleExpenseCents) * 100) : 0;

  return {
    todayKey,
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
    unpaidIOweCents,
    savingsTotalCents
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

  const unpaidBills = snapshot.bills
    .filter((b) => b.status !== "Paid")
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      title: clipUnsafeText(b.title, 80),
      amount: fromCentavos(safeCents(b.amount)),
      dueDate: clipUnsafeText(b.dueDate || "", 20),
      status: b.dueDate && b.dueDate < s.todayKey ? "Overdue" : b.status || "Unpaid",
      recurrence: (b.recurrence || "none") as BillRecurrence,
      category: clipUnsafeText(b.category || "Bills", 40)
    }));

  const openUtang = snapshot.utangList
    .filter((u) => u.status !== "Paid")
    .slice(0, 8)
    .map((u) => ({
      id: u.id,
      name: clipUnsafeText(u.name, 60),
      amount: fromCentavos(safeCents(u.amount)),
      direction: (u.direction === "i_owe" ? "i_owe" : "owed_to_me") as UtangDirection,
      dueDate: u.dueDate ? clipUnsafeText(u.dueDate, 20) : null
    }));

  const savingsJars = snapshot.savingsGoals.slice(0, 8).map((g) => ({
    id: g.id,
    name: clipUnsafeText(g.name, 60),
    savedAmount: fromCentavos(safeCents(g.savedAmount)),
    targetAmount: fromCentavos(safeCents(g.targetAmount)),
    wallet: g.wallet ? clipUnsafeText(g.wallet, 40) : null,
    targetDate: g.targetDate ? clipUnsafeText(g.targetDate, 20) : null
  }));

  const categoryBudgets = s.categoryStatuses.slice(0, 10).map((c) => ({
    id: c.id,
    category: c.category,
    limitAmount: c.limitAmount,
    spentAmount: c.spentAmount,
    state: c.state
  }));

  const recentEntries = snapshot.entries.slice(0, 10).map((e) => ({
    type: e.type,
    amount: fromCentavos(safeCents(e.amount)),
    category: e.category || "Other",
    method: e.method || "Cash",
    ...(e.type === "transfer" && e.toMethod ? { toMethod: e.toMethod } : {}),
    ...(e.type === "expense" && e.spendType ? { spendType: e.spendType } : {}),
    desc: clipUnsafeText(e.desc || e.note || "", 60),
    date: manilaDateKey(entryDate(e) || e.date || "") || ""
  }));

  return {
    todayKey: s.todayKey,
    budgetCycle: snapshot.budgetCycle,
    cycleStartKey: s.window.startKey,
    cycleEndKey: s.window.endKey,
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
    savingsTotal: fromCentavos(s.savingsTotalCents),
    unpaidBillsTotal: fromCentavos(s.unpaidBillsCents),
    unpaidUtangToMe: fromCentavos(s.unpaidToMeCents),
    unpaidUtangIOwe: fromCentavos(s.unpaidIOweCents),
    wallets: snapshot.wallets.map((w) => ({
      name: w,
      balance: snapshot.walletBalances[w] ?? 0
    })),
    topCategories,
    unpaidBills,
    openUtang,
    savingsJars,
    categoryBudgets,
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

const TRANSFER_CUE_RE =
  /\b(transfer|lipat|ilipat|maglipat|move money|send to my|cash[\s-]*in to|withdraw to|pa-load sa wallet|from .+ to)\b/i;

function buildWalletIndex(wallets: readonly string[]) {
  const candidates = wallets.length > 0 ? wallets : ["Cash"];
  return candidates
    .map((wallet) => {
      const visual = resolveWalletVisual(wallet);
      const compact = wallet.toLowerCase().replace(/\s+/g, "");
      const visualCompact = visual.displayName.toLowerCase().replace(/\s+/g, "");
      const aliases = Array.from(new Set([wallet, visual.displayName, compact, visualCompact]));
      return { wallet, aliases };
    })
    .sort((a, b) => b.wallet.length - a.wallet.length);
}

function findMentionedWallets(text: string, wallets: readonly string[]): string[] {
  const indexed = buildWalletIndex(wallets);
  const hits: Array<{ wallet: string; index: number }> = [];
  for (const item of indexed) {
    let earliest = -1;
    for (const alias of item.aliases) {
      if (!alias) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const m = new RegExp(`\\b${escaped}\\b`, "i").exec(text);
      if (m && (earliest === -1 || m.index < earliest)) {
        earliest = m.index;
      }
    }
    if (earliest !== -1) {
      hits.push({ wallet: item.wallet, index: earliest });
    }
  }
  return hits.sort((a, b) => a.index - b.index).map((h) => h.wallet);
}

function resolveWalletFromText(
  text: string,
  wallets: readonly string[],
  preferredWallet?: string
): { method: string; matchedTokenRegex?: RegExp } {
  const candidates = wallets.length > 0 ? wallets : ["Cash"];
  const indexed = buildWalletIndex(candidates);

  for (const item of indexed) {
    for (const alias of item.aliases) {
      if (!alias) continue;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "i");
      if (re.test(text)) {
        return {
          method: item.wallet,
          matchedTokenRegex: new RegExp(
            `(?:\\b(?:sa|galing|via|using|gamit|mula sa|from|to|in)\\s+)?\\b${escaped}\\b`,
            "gi"
          )
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
  if (
    /\b(meralco|maynilad|manila water|kuryente|tubig|pldt|converge|fiber|internet|wifi|rent|upa|electric|bill|bills|utility|utilities)\b/i.test(
      lower
    )
  ) {
    return "Bills & Utilities";
  }
  if (
    /\b(jollibee|mcdo|chowking|mang inasal|starbucks|kape|coffee|milktea|milk tea|boba|lunch|dinner|breakfast|almusal|tanghalian|hapunan|merienda|food|pagkain|foodpanda|grabfood|ulam|snack|kain|kumain|samgyup|restaurant|cafe|tea)\b/i.test(
      lower
    )
  ) {
    return "Food & Dining";
  }
  if (
    /\b(grab|angkas|joyride|moveit|jeep|jeepney|tricycle|trike|fx|uv|bus|mrt|lrt|lrt1|lrt2|pamasahe|fare|commute|beep|gas|gasolina|petron|shell|caltex|toll|easytrip|autosweep|parking)\b/i.test(
      lower
    )
  ) {
    return "Transportation";
  }
  if (/\b(load|promo|data|prepaid|smart|globe|dito|tnt|tm|sun)\b/i.test(lower)) {
    return "Mobile & Data";
  }
  if (
    /\b(grocery|groceries|puregold|savemore|sm supermarket|robinsons supermarket|snr|landmart|palengke|wet market|bigas)\b/i.test(
      lower
    )
  ) {
    return "Groceries";
  }
  if (
    /\b(shopee|lazada|tiktok shop|mall|uniqlo|zara|shopping|clothes|damit|sapatos|shoes|bag|budol|gadget)\b/i.test(
      lower
    )
  ) {
    return "Shopping";
  }
  if (/\b(savings|ipon|emergency fund|deposit jar)\b/i.test(lower)) {
    return "Savings";
  }
  if (
    /\b(mercury|watsons|southstar|gamot|medicine|vitamins|doctor|clinic|hospital|checkup|dental)\b/i.test(
      lower
    )
  ) {
    return "Healthcare";
  }
  if (
    /\b(cinema|movie|sine|netflix|spotify|disney|game|gaming|valorant|mlbb|steam|concert|beer|inom|bar)\b/i.test(
      lower
    )
  ) {
    return "Entertainment";
  }
  return "Other";
}

function inferCategoryBudgetTarget(text: string): string | null {
  const lower = text.toLowerCase();
  const exact = CATEGORIES.find((cat) => lower.includes(cat.toLowerCase()));
  if (exact) return exact;
  if (/\b(food|dining|pagkain|kain)\b/i.test(lower)) return "Food & Dining";
  if (/\b(transpo|pamasahe|commute|grab|gas)\b/i.test(lower)) return "Transportation";
  if (/\b(bills|utilities|kuryente|tubig)\b/i.test(lower)) return "Bills & Utilities";
  if (/\b(mobile|data|load)\b/i.test(lower)) return "Mobile & Data";
  if (/\b(groceries|grocery)\b/i.test(lower)) return "Groceries";
  if (/\b(shopping|shopee|lazada)\b/i.test(lower)) return "Shopping";
  if (/\b(savings|ipon)\b/i.test(lower)) return "Savings";
  if (/\b(health|medical|medicine|gamot)\b/i.test(lower)) return "Healthcare";
  if (/\b(entertainment|movies|gaming|netflix)\b/i.test(lower)) return "Entertainment";
  return null;
}

function extractAmountFromClause(clause: string): { amount: number; matched: string } | null {
  // Prefer total line when parsing multi-line receipt text
  const receiptTotalMatch =
    /\b(?:grand\s+total|total\s+amount|amount\s+due|amount\s+paid|total)\s*[:=-]?\s*(?:php|₱|p)?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\b/i.exec(
      clause
    );
  const match =
    receiptTotalMatch ||
    /(?:(?:php|₱|p)\s*)?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*(k)?\b/i.exec(clause);
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

function extractReceiptOrSmsAction(
  cleanText: string,
  wallets: readonly string[],
  preferredWallet?: string
): Extract<ProposedChatAction, { type: "expense" | "income" }> | null {
  const isSmsOrReceipt =
    /\b(you have sent|you received|successful(?:ly)?\s+(?:paid|sent|transferred|received)|ref\.?\s*no\.?|reference\s*(?:no|id|#)|gcash\s+payment|pay\s+qr|amount\s+paid|grand\s+total|official\s+receipt|invoice|merchant|instapay|pesonet)\b/i.test(
      cleanText
    );
  if (!isSmsOrReceipt) return null;

  const amt = extractAmountFromClause(cleanText);
  if (!amt) return null;

  const isCredit =
    /\b(you\s+received|received\s+(?:php|₱|p)|credited\s+to|cash\s*in\s+successful|deposited)\b/i.test(
      cleanText
    ) && !/\b(you\s+have\s+sent|paid\s+(?:php|₱|p)|debited)\b/i.test(cleanText);

  const { method } = resolveWalletFromText(cleanText, wallets, preferredWallet);
  const merchantMatch =
    /\b(?:to|at|from)\s+([A-Za-z0-9&'.\-\s]{2,42}?)(?:\s+(?:on|via|using|ref|reference|with|,|\.)|$)/i.exec(
      cleanText
    );
  const merchant = merchantMatch ? clipUnsafeText(merchantMatch[1], 60) : "";

  if (isCredit) {
    return {
      type: "income",
      amount: amt.amount,
      desc: merchant ? `Received from ${merchant}` : "Received payment",
      category: "Kita",
      method,
      spendType: "need"
    };
  }

  const category = inferExpenseCategory(cleanText);
  const spendType: SpendType = LUHO_CUE_RE.test(cleanText) ? "luho" : "need";
  return {
    type: "expense",
    amount: amt.amount,
    desc: merchant || (category !== "Other" ? category : "Receipt / SMS payment"),
    category,
    method,
    spendType
  };
}

/**
 * Parses natural Taglish or English chat commands (as well as pasted SMS/receipt alerts)
 * into structured expense/income drafts.
 */
export function parseNaturalTransactionCommand(
  rawText: string,
  wallets: readonly string[],
  preferredWallet?: string
): Array<Extract<ProposedChatAction, { type: "expense" | "income" }>> {
  const cleanText = clipUnsafeText(rawText, 1200);
  if (!cleanText) return [];

  // Reject pure questions unless they explicitly request logging
  const isPureQuestion =
    /\?$/.test(cleanText) &&
    !/\b(log|i-log|ilog|mag-log|add|record|pakilog|paki-log|ilagay)\b/i.test(cleanText);
  if (isPureQuestion) return [];

  const smsOrReceipt = extractReceiptOrSmsAction(cleanText, wallets, preferredWallet);
  if (smsOrReceipt) {
    return [smsOrReceipt];
  }

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

  const actions: Array<Extract<ProposedChatAction, { type: "expense" | "income" }>> = [];

  for (const clause of clauses) {
    const amt = extractAmountFromClause(clause);
    if (!amt) continue;

    const hasIncome = INCOME_CUE_RE.test(clause);
    const hasExpense =
      EXPENSE_CUE_RE.test(clause) || LUHO_CUE_RE.test(clause) || NEED_CUE_RE.test(clause);
    const hasExplicitCommand =
      /\b(log|i-log|ilog|mag-log|add|record|pakilog|paki-log|ilagay|spent|paid|bought|bumili|nagbayad|nagastos|received|natanggap)\b/i.test(
        clause
      );

    // Avoid hijacking conversational Q&A numbers (like "safe ba gumastos ng 1000?")
    if (!hasIncome && !hasExpense && !hasExplicitCommand) continue;
    if (
      /\b(safe|pwede ba|puwede ba|magkano|what if|kung gumastos|overspending|afford|kaya ba|bilhin ko ba|should i buy|split|hatiin|allocate)\b/i.test(
        clause
      ) &&
      !hasExplicitCommand
    ) {
      continue;
    }

    const type: "expense" | "income" =
      hasIncome && !LUHO_CUE_RE.test(clause) ? "income" : "expense";
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

function extractIsoDate(text: string, fallbackKey: string): string {
  const iso = /\b(20\d{2}-\d{2}-\d{2})\b/.exec(text);
  if (iso) return iso[1];
  const dayMatch = /\b(?:every|tuwing|on|due)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i.exec(text);
  if (dayMatch) {
    const day = Math.max(1, Math.min(28, Number(dayMatch[1])));
    const prefix = fallbackKey.slice(0, 8);
    if (/^\d{4}-\d{2}-$/.test(prefix)) {
      return `${prefix}${String(day).padStart(2, "0")}`;
    }
  }
  return fallbackKey;
}

/**
 * Resolves richer ledger commands (transfers, bills, utang, savings jars, and budget rules)
 * against the user's current snapshot for offline / fallback intelligence.
 */
export function parseNaturalAssistantActions(
  rawText: string,
  snapshot: AssistantLedgerSnapshot,
  now: Date = new Date()
): ProposedChatAction[] {
  const cleanText = clipUnsafeText(rawText, 1200);
  if (!cleanText) return [];
  const lower = cleanText.toLowerCase();
  const todayKey = manilaDateKey(now) || "2026-01-01";

  const isPureQuestion =
    /\?$/.test(cleanText) &&
    !/\b(log|i-log|ilog|mag-log|add|record|pakilog|paki-log|ilagay|transfer|lipat|create|set|deposit|hulog|settle|paid na)\b/i.test(
      cleanText
    );
  if (isPureQuestion) return [];

  // 1. Wallet-to-wallet transfer
  const mentionedWallets = findMentionedWallets(cleanText, snapshot.wallets);
  if (
    mentionedWallets.length >= 2 &&
    (TRANSFER_CUE_RE.test(lower) || /\b(from|galing|mula)\b.+\b(to|sa|papunta)\b/i.test(lower))
  ) {
    const amt = extractAmountFromClause(cleanText);
    if (amt && mentionedWallets[0] !== mentionedWallets[1]) {
      return [
        {
          type: "transfer",
          amount: amt.amount,
          desc: `${mentionedWallets[0]} -> ${mentionedWallets[1]}`,
          fromMethod: mentionedWallets[0],
          toMethod: mentionedWallets[1]
        }
      ];
    }
  }

  // 2. Mark existing unpaid bill as Paid
  if (/\b(mark|paid na|nabayaran na|bayad na|pay bill)\b/i.test(lower) && /\bbill\b|meralco|maynilad|pldt|converge|internet|rent|upa|electric|water/i.test(lower)) {
    const matchedBill = snapshot.bills.find(
      (b) => b.status !== "Paid" && lower.includes(b.title.toLowerCase())
    );
    if (matchedBill) {
      return [
        {
          type: "mark_bill_paid",
          billId: matchedBill.id,
          title: matchedBill.title,
          amount: matchedBill.amount,
          dueDate: matchedBill.dueDate,
          recurrence: matchedBill.recurrence || "none",
          category: matchedBill.category || "Bills"
        }
      ];
    }
  }

  // 3. Add recurring / upcoming Bill
  if (
    /\b(add bill|new bill|create bill|remind bill|schedule bill|i-bill|lagay bill|upcoming bill)\b/i.test(
      lower
    )
  ) {
    const amt = extractAmountFromClause(cleanText);
    if (amt) {
      const titleClean = cleanText
        .replace(amt.matched, " ")
        .replace(
          /\b(add bill|new bill|create bill|remind bill|schedule bill|i-bill|lagay bill|upcoming bill|due|monthly|weekly|quarterly|yearly|bill|for|on|20\d{2}-\d{2}-\d{2})\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();
      const recurrence: BillRecurrence = /\bweekly\b/i.test(lower)
        ? "weekly"
        : /\bquarterly\b/i.test(lower)
          ? "quarterly"
          : /\byearly|annual\b/i.test(lower)
            ? "yearly"
            : /\bmonthly|buwanan\b/i.test(lower)
              ? "monthly"
              : "none";

      return [
        {
          type: "bill",
          title: clipUnsafeText(titleClean || "Bill reminder", 100),
          amount: amt.amount,
          dueDate: extractIsoDate(cleanText, todayKey),
          category: "Bills",
          recurrence
        }
      ];
    }
  }

  // 4. Settle existing Utang
  if (/\b(settle|nagbayad na|bayad na|nabayaran|settled)\b/i.test(lower)) {
    const matchedUtang = snapshot.utangList.find(
      (u) => u.status !== "Paid" && lower.includes(u.name.toLowerCase())
    );
    if (matchedUtang) {
      return [
        {
          type: "settle_utang",
          utangId: matchedUtang.id,
          name: matchedUtang.name,
          amount: matchedUtang.amount,
          direction: matchedUtang.direction
        }
      ];
    }
  }

  // 5. Add new Utang
  if (
    /\b(may utang|humiram|pinahiram|nanghiram|utang si|utang ko|add utang|record utang|i owe|owed me|lent to)\b/i.test(
      lower
    )
  ) {
    const amt = extractAmountFromClause(cleanText);
    if (amt) {
      const iOwe = /\b(i owe|utang ko|humiram ako|nanghiram ako|utang kay)\b/i.test(lower);
      const nameMatch = /\b(?:si|kay|to|from)\s+([A-Za-z][A-Za-z0-9\s.'-]{1,35}?)(?:\s+(?:ng|of|₱|php|\d|due|para|for)|$)/i.exec(
        cleanText
      );
      const personName = clipUnsafeText(nameMatch?.[1] || "Contact", 80);
      return [
        {
          type: "utang",
          name: personName,
          amount: amt.amount,
          direction: iOwe ? "i_owe" : "owed_to_me"
        }
      ];
    }
  }

  // 6. Deposit into an existing Savings Jar
  if (/\b(deposit|hulog|maghulog|lagay sa jar|add to jar|top up)\b/i.test(lower)) {
    const matchedJar = snapshot.savingsGoals.find((g) => lower.includes(g.name.toLowerCase()));
    const amt = extractAmountFromClause(cleanText);
    if (matchedJar && amt) {
      const fromWallet =
        mentionedWallets.length > 0 ? mentionedWallets[0] : matchedJar.wallet || undefined;
      return [
        {
          type: "savings_deposit",
          goalId: matchedJar.id,
          goalName: matchedJar.name,
          amount: amt.amount,
          ...(fromWallet ? { deductFromWallet: fromWallet } : {})
        }
      ];
    }
  }

  // 7. Create a new Savings Jar
  if (
    /\b(create|new|add|start|gawa)\b.+\b(savings\s*jar|savings\s*goal|ipon\s*jar|jar|goal)\b/i.test(
      lower
    )
  ) {
    const amt = extractAmountFromClause(cleanText);
    if (amt) {
      const nameClean = cleanText
        .replace(amt.matched, " ")
        .replace(
          /\b(create|new|add|start|gawa|ng|a|savings\s*jar|savings\s*goal|ipon\s*jar|jar|goal|target|worth|para\s*sa|for)\b/gi,
          " "
        )
        .replace(/\s+/g, " ")
        .trim();
      return [
        {
          type: "savings_goal",
          name: clipUnsafeText(nameClean || "Savings Goal", 80),
          targetAmount: amt.amount,
          savedAmount: 0,
          wallet: mentionedWallets[0] || undefined,
          color: "emerald"
        }
      ];
    }
  }

  // 8. Category budget limit or overall cycle budget cap
  const catTarget = inferCategoryBudgetTarget(cleanText);
  if (
    catTarget &&
    /\b(set|update|limit|cap|budget)\b/i.test(lower) &&
    /\b(limit|cap|budget)\b/i.test(lower)
  ) {
    const amt = extractAmountFromClause(cleanText);
    if (amt) {
      const existing = snapshot.categoryBudgets.find((b) => b.category === catTarget);
      return [
        {
          type: "category_budget",
          budgetId: existing?.id,
          category: catTarget,
          limitAmount: amt.amount
        }
      ];
    }
  }

  if (
    /\b(set|change|update|switch|palitan)\b.+\b(budget|cap|kinsenas|monthly cycle)\b/i.test(lower)
  ) {
    const amt = extractAmountFromClause(cleanText);
    const nextCycle: BudgetCycle | undefined = /\bkinsenas\b/i.test(lower)
      ? "kinsenas"
      : /\bmonthly\b/i.test(lower)
        ? "monthly"
        : undefined;
    if (amt || nextCycle) {
      return [
        {
          type: "set_budget",
          amount: amt ? amt.amount : snapshot.budget ?? 0,
          ...(nextCycle ? { budgetCycle: nextCycle } : {})
        }
      ];
    }
  }

  return parseNaturalTransactionCommand(cleanText, snapshot.wallets, snapshot.preferredWallet);
}

/**
 * Evaluates immediate spending impact of a newly logged or proposed action
 * and returns a contextual behavior warning when it crosses risk thresholds.
 */
export function evaluateActionBehaviorWarning(
  action: ProposedChatAction,
  snapshot: AssistantLedgerSnapshot,
  lang: LanguageCode = "en",
  alreadySaved = false
): AssistantBehaviorAlert | null {
  const isTl = lang === "tl";

  if (action.type === "transfer") {
    const srcBal = snapshot.walletBalances[action.fromMethod] ?? 0;
    if (!alreadySaved && action.amount > srcBal) {
      return {
        level: "critical",
        title: isTl
          ? `Kulang ang balanse sa ${action.fromMethod}`
          : `Insufficient ${action.fromMethod} balance`,
        detail: isTl
          ? `₱${formatPeso(srcBal)} lang ang nasa ${action.fromMethod}, kulang para ilipat ang ₱${formatPeso(action.amount)}.`
          : `${action.fromMethod} only holds ₱${formatPeso(srcBal)}, short for a ₱${formatPeso(action.amount)} transfer.`
      };
    }
    return null;
  }

  if (action.type === "savings_deposit") {
    if (action.deductFromWallet) {
      const srcBal = snapshot.walletBalances[action.deductFromWallet] ?? 0;
      if (!alreadySaved && action.amount > srcBal) {
        return {
          level: "critical",
          title: isTl
            ? `Kulang ang balanse sa ${action.deductFromWallet}`
            : `Insufficient ${action.deductFromWallet} balance`,
          detail: isTl
            ? `₱${formatPeso(srcBal)} lang ang laman ng ${action.deductFromWallet} para sa ₱${formatPeso(action.amount)} deposit.`
            : `${action.deductFromWallet} has ₱${formatPeso(srcBal)}, not enough to deduct ₱${formatPeso(action.amount)}.`
        };
      }
    }
    return null;
  }

  if (action.type !== "expense") return null;
  const walletBalance = snapshot.walletBalances[action.method] ?? 0;

  if (!alreadySaved && action.amount > walletBalance) {
    return {
      level: "critical",
      title: isTl
        ? `Kulang ang balanse sa ${action.method}`
        : `Insufficient ${action.method} balance`,
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

function detectEffectiveLanguage(rawMessage: string, fallback: LanguageCode): LanguageCode {
  if (
    /\b(sino|ano|magkano|paano|pwede|puwede|kaya ba|gastos|sahod|sweldo|kita|natitira|matitira|kamusta|kumusta|bakit|utang|bayad|ipon|hulog|lipat|salamat|oo|hindi|meron|wala|kailangan|luho)\b/i.test(
      rawMessage
    )
  ) {
    return "tl";
  }
  return fallback;
}

function buildActionPreparedSummary(actions: ProposedChatAction[], isTl: boolean): string {
  return actions
    .map((a) => {
      switch (a.type) {
        case "expense":
          return `-₱${formatPeso(a.amount)} · ${a.desc} via ${resolveWalletVisual(a.method).displayName} (${a.category} · ${a.spendType === "luho" ? "Luho" : "Need"})`;
        case "income":
          return `+₱${formatPeso(a.amount)} · ${a.desc} to ${resolveWalletVisual(a.method).displayName}`;
        case "transfer":
          return `₱${formatPeso(a.amount)} transfer · ${resolveWalletVisual(a.fromMethod).displayName} -> ${resolveWalletVisual(a.toMethod).displayName}`;
        case "bill":
          return `Bill: ${a.title} · ₱${formatPeso(a.amount)} (due ${a.dueDate}${a.recurrence !== "none" ? `, ${a.recurrence}` : ""})`;
        case "mark_bill_paid":
          return `${isTl ? "Bayaran ang bill" : "Mark bill paid"}: ${a.title} (₱${formatPeso(a.amount)})`;
        case "utang":
          return `Utang (${a.direction === "i_owe" ? (isTl ? "Utang mo" : "You owe") : (isTl ? "Pautang" : "Owed to you")}): ${a.name} · ₱${formatPeso(a.amount)}`;
        case "settle_utang":
          return `${isTl ? "I-settle ang utang" : "Settle utang"}: ${a.name} (₱${formatPeso(a.amount)})`;
        case "savings_goal":
          return `${isTl ? "Bagong Savings Jar" : "New Savings Jar"}: ${a.name} (target ₱${formatPeso(a.targetAmount)})`;
        case "savings_deposit":
          return `${isTl ? "Hulog sa Jar" : "Deposit to Jar"}: ${a.goalName} (+₱${formatPeso(a.amount)})`;
        case "set_budget":
          return `${isTl ? "Budget Cap" : "Cycle Budget"}: ₱${formatPeso(a.amount)}${a.budgetCycle ? ` (${a.budgetCycle})` : ""}`;
        case "category_budget":
          return `${isTl ? "Category Cap" : "Category Cap"}: ${a.category} (₱${formatPeso(a.limitAmount)})`;
      }
    })
    .join("\n");
}

function answerDeveloperQuestion(isTl: boolean): string {
  if (isTl) {
    return (
      "Si Renniel Salazar ang creator at developer ng Tipid app.\n\n" +
      "Binuo niya ang Tipid bilang isang kalmadong, trustworthy personal finance companion na inspired sa Apple Human Interface clarity pero naka-angkla sa totoong budget life ng mga Pilipino:\n" +
      "• May suporta sa Monthly at Kinsenas (1st–15th / 16th–end) budget cycles\n" +
      "• Malinaw na paghihiwalay ng Need vs. Wants/Luho para makita agad ang impulse habits\n" +
      "• Multi-wallet tracking (Cash, GCash, Maya, digital at traditional banks), Bills, Utang, at Savings Jars\n" +
      "• Engineered gamit ang integer-centavo accounting para walang rounding errors, offline-first PWA sync, optional 4-digit PIN lock, at per-user privacy.\n\n" +
      "Kung gusto mong makipag-ugnayan o magdagdag ng iba pang personal bio o links ni Renniel dito sa assistant, walang naka-save na public contact links sa app ngayon — pinoprotektahan din kasi ng Tipid ang privacy."
    );
  }
  return (
    "Tipid was created and developed by Renniel Salazar.\n\n" +
    "He designed and engineered Tipid from the ground up as a calm, trustworthy financial companion inspired by Apple Human Interface clarity and tailored specifically for everyday Filipino budgeting:\n" +
    "• Built for both Monthly and Kinsenas (1st–15th / 16th–end) pay cycles\n" +
    "• Explicit Need vs. Wants/Luho tracking so discretionary spending stays transparent\n" +
    "• Per-wallet accuracy across Cash, GCash, Maya, digital banks, and traditional banks — plus Bills, Utang, and Savings Jars\n" +
    "• Engineered with exact integer-centavo math (zero float drift), offline-first PWA support, optional 4-digit PIN lock, and strict per-user data isolation.\n\n" +
    "I keep only what Renniel intentionally includes in the app, so I don't store extra private biography or unverified contact links here."
  );
}

function answerAffordabilityQuestion(
  rawMessage: string,
  snapshot: AssistantLedgerSnapshot,
  isTl: boolean
): string {
  const s = summarizeCycleLedger(snapshot, new Date());
  const amt = extractAmountFromClause(rawMessage);
  if (!amt) {
    const safeDaily = s.safeMetrics ? `₱${formatPeso(s.safeMetrics.dailySafeSpend)}/day` : "no cap set yet";
    return isTl
      ? `Sabihin mo lang ang exact amount (hal. "Kaya ba bumili ng 1,500 shoes?") para ma-simulate ko gamit ang ₱${formatPeso(snapshot.overallBalance)} balance mo at ${safeDaily} limit!`
      : `Tell me the exact amount (for example, "Can I afford a ₱1,500 purchase?") and I'll test it against your ₱${formatPeso(snapshot.overallBalance)} balance and cycle allowance (${safeDaily}).`;
  }

  const priceCents = safeCents(amt.amount);
  const balCents = safeCents(snapshot.overallBalance, true);
  const afterBalCents = balCents - priceCents;
  const freeAfterBillsCents = balCents - s.unpaidBillsCents;
  const afterBillsAndPurchaseCents = freeAfterBillsCents - priceCents;

  const lines: string[] = [];
  if (afterBalCents < 0) {
    lines.push(
      isTl
        ? `Sa ngayon, medyo kapos muna ang ₱${formatPeso(amt.amount)} — ₱${formatPeso(snapshot.overallBalance)} lang ang total active wallets mo (kukulangin ng ₱${formatPeso(fromCentavos(-afterBalCents))}).`
        : `Right now ₱${formatPeso(amt.amount)} stretches past your total wallet balance of ₱${formatPeso(snapshot.overallBalance)} by ₱${formatPeso(fromCentavos(-afterBalCents))}.`
    );
  } else if (afterBillsAndPurchaseCents < 0 && s.unpaidBillsCents > 0) {
    lines.push(
      isTl
        ? `Ingat muna rito: kaya ng current cash (₱${formatPeso(snapshot.overallBalance)}), pero may ₱${formatPeso(fromCentavos(s.unpaidBillsCents))} unpaid bills ka pang kailangan bayaran — mababawasan ang pambill ng ₱${formatPeso(fromCentavos(-afterBillsAndPurchaseCents))}.`
        : `Careful with this one: you have ₱${formatPeso(snapshot.overallBalance)} on hand, but with ₱${formatPeso(fromCentavos(s.unpaidBillsCents))} in unpaid bills, buying this leaves you short for upcoming bills by ₱${formatPeso(fromCentavos(-afterBillsAndPurchaseCents))}.`
    );
  } else {
    lines.push(
      isTl
        ? `Good news — kaya ng wallet balance mo! Pagkatapos ng ₱${formatPeso(amt.amount)}, may ₱${formatPeso(fromCentavos(afterBalCents))} ka pa sa wallets${s.unpaidBillsCents > 0 ? ` (₱${formatPeso(fromCentavos(afterBillsAndPurchaseCents))} free cash matapos ang unpaid bills)` : ""}.`
        : `Your cash position can cover ₱${formatPeso(amt.amount)} — you'll still have ₱${formatPeso(fromCentavos(afterBalCents))} across wallets${s.unpaidBillsCents > 0 ? ` (₱${formatPeso(fromCentavos(afterBillsAndPurchaseCents))} free after unpaid bills)` : ""}.`
    );
  }

  if (s.safeMetrics && s.safeMetrics.capAmount > 0) {
    const capCents = safeCents(s.safeMetrics.capAmount);
    const newRemCents = capCents - (s.cycleExpenseCents + priceCents);
    const newDaily =
      newRemCents > 0
        ? fromCentavos(Math.floor(newRemCents / Math.max(1, s.window.remainingDays)))
        : 0;
    if (newRemCents < 0) {
      lines.push(
        isTl
          ? `• Budget impact: Lalagpas ka sa ₱${formatPeso(s.safeMetrics.capAmount)} cycle cap ng ₱${formatPeso(fromCentavos(-newRemCents))}. Kung Luho ito, mag-24-hour rule muna o hintayin ang next cycle.`
          : `• Budget check: This pushes you ₱${formatPeso(fromCentavos(-newRemCents))} over your ₱${formatPeso(s.safeMetrics.capAmount)} cycle cap. Consider waiting until next cycle if it's non-essential.`
      );
    } else {
      lines.push(
        isTl
          ? `• Budget impact: May ₱${formatPeso(fromCentavos(newRemCents))} pang natitira sa cycle cap, o ₱${formatPeso(newDaily)}/araw para sa huling ${s.window.remainingDays} araw.`
          : `• Budget check: Leaves ₱${formatPeso(fromCentavos(newRemCents))} in your cycle budget — roughly ₱${formatPeso(newDaily)}/day for the remaining ${s.window.remainingDays} days.`
      );
    }
  }

  return lines.join("\n");
}

function answerPaydayPlan(
  rawMessage: string,
  snapshot: AssistantLedgerSnapshot,
  isTl: boolean
): string {
  const s = summarizeCycleLedger(snapshot, new Date());
  const amt = extractAmountFromClause(rawMessage);
  const paydayPesos = amt ? amt.amount : snapshot.budget || (s.cycleIncomeCents > 0 ? fromCentavos(s.cycleIncomeCents) : 15000);
  const paydayCents = safeCents(paydayPesos);

  const billsPriorityCents = Math.min(paydayCents, s.unpaidBillsCents);
  const debtPriorityCents = Math.min(Math.max(0, paydayCents - billsPriorityCents), s.unpaidIOweCents);
  const remainingCents = Math.max(0, paydayCents - billsPriorityCents - debtPriorityCents);
  const needsCents = Math.round(remainingCents * 0.6);
  const savingsCents = Math.round(remainingCents * 0.25);
  const luhoCents = Math.max(0, remainingCents - needsCents - savingsCents);

  const topJar = snapshot.savingsGoals[0];
  if (isTl) {
    return (
      `Heto ang praktikal na hati para sa ₱${formatPeso(paydayPesos)}:\n` +
      (billsPriorityCents > 0 ? `• Unahin ang Unpaid Bills: ₱${formatPeso(fromCentavos(billsPriorityCents))}\n` : "") +
      (debtPriorityCents > 0 ? `• Bawas Utang (Payables): ₱${formatPeso(fromCentavos(debtPriorityCents))}\n` : "") +
      `• Essentials / Daily Needs (~60% ng tira): ₱${formatPeso(fromCentavos(needsCents))}\n` +
      `• Savings & Emergency (~25% ng tira): ₱${formatPeso(fromCentavos(savingsCents))}${topJar ? ` — good boost sa "${topJar.name}"` : ""}\n` +
      `• Guilt-Free Luho / Wants (~15% ng tira): ₱${formatPeso(fromCentavos(luhoCents))}\n\n` +
      `Gusto mo bang mag-draft ako ng deposit sa savings jar mo o transfer sa hiwalay na wallet?`
    );
  }
  return (
    `Here is a balanced game plan for ₱${formatPeso(paydayPesos)}:\n` +
    (billsPriorityCents > 0 ? `• Reserve for Unpaid Bills first: ₱${formatPeso(fromCentavos(billsPriorityCents))}\n` : "") +
    (debtPriorityCents > 0 ? `• Debt Paydown (Utang you owe): ₱${formatPeso(fromCentavos(debtPriorityCents))}\n` : "") +
    `• Essentials & Daily Living (~60% of free pay): ₱${formatPeso(fromCentavos(needsCents))}\n` +
    `• Savings & Jars (~25% of free pay): ₱${formatPeso(fromCentavos(savingsCents))}${topJar ? ` — solid top-up for "${topJar.name}"` : ""}\n` +
    `• Guilt-Free Wants / Luho (~15%): ₱${formatPeso(fromCentavos(luhoCents))}\n\n` +
    `Want me to prepare a wallet transfer or a savings jar deposit for any of these?`
  );
}

function answerAppGuide(isTl: boolean): string {
  if (isTl) {
    return (
      "Malugod kitang gagabayan sa paggamit ng Tipid app! Heto ang mga pangunahing kakayahan at benepisyo nito:\n\n" +
      "1. **Pribado at 100% Offline-Ready**\n" +
      "   • Hindi kailangan ng bank password o ATM PIN. Ikaw ang may buong kontrol sa iyong data.\n" +
      "   • Pwedeng mag-log kahit walang data o internet. Awtomatikong magsi-sync kapag online na.\n\n" +
      "2. **Totoong 3D ATM Cards & Wallets**\n" +
      "   • May authentic textures ang LandBank, BDO, BPI, GoTyme, Maya, at GCash.\n" +
      "   • Pindutin ang card para mag-3D flip at makita ang card details at balances.\n\n" +
      "3. **Smart Bills na may Auto-Deduct sa Card**\n" +
      "   • Magtakda ng recurring utilities o renta. Piliin kung anong ATM card ang pambayad at panoorin ang live auto-deduction animation.\n\n" +
      "4. **Safe-to-Spend & 50/30/20 Plan**\n" +
      "   • Real-time Safe-to-Spend calculation, Kinsenas/Monthly cycles, at virtual savings jars.\n\n" +
      "5. **Tipid Coach Assistant & Natural Commands**\n" +
      "   • Utusan ako tulad ng 'Log 150 kape via GCash' o mag-paste ng SMS/resibo. Lahat ay dadaan muna sa Confirm & Save draft.\n\n" +
      "💡 *Tip:* Pindutin ang 'Tour' sa itaas o 'Gabay sa App' sa Dashboard para sa animated interactive walkthrough!"
    );
  }
  return (
    "Here is your quick guide to mastering Tipid and its core benefits:\n\n" +
    "1. **100% Private & Offline-Ready**\n" +
    "   • Zero bank logins or ATM PINs required. Your financial records are private and user-owned.\n" +
    "   • Full offline support—record entries anywhere without signal; syncs smoothly upon reconnection.\n\n" +
    "2. **Authentic 3D ATM Cards & Wallets**\n" +
    "   • Realistic textures for LandBank, BDO, BPI, GoTyme, Maya, and GCash.\n" +
    "   • Tap any card in the deck to flip in 3D and view details, CVV, and centavo-exact balances.\n\n" +
    "3. **Smart Bills with Live ATM Auto-Deduction**\n" +
    "   • Schedule utilities or rent. Mark as paid to trigger real-time deduction from your selected bank card.\n\n" +
    "4. **Safe-to-Spend & 50/30/20 Budgeting**\n" +
    "   • Real-time Safe-to-Spend tracking, Kinsenas/Monthly pay cycles, and dedicated savings jars.\n\n" +
    "5. **Tipid Coach AI & Fast Natural Logging**\n" +
    "   • Plain text commands ('Log 150 coffee via GCash') or pasted SMS/receipt text with an editable Confirm & Save card.\n\n" +
    "💡 *Tip:* Tap 'Tour' at the top or 'App Guide' on your Dashboard to open the animated interactive walkthrough!"
  );
}

/**
 * Provides smart offline / on-device answers, transaction/ledger action parsing,
 * developer Q&A, calculators, and spending warnings whenever the AI endpoint is offline or unconfigured.
 */
export function generateLocalAssistantReply(
  rawMessage: string,
  snapshot: AssistantLedgerSnapshot,
  lang: LanguageCode = "en"
): AssistantTurnResponse {
  const effectiveLang = detectEffectiveLanguage(rawMessage, lang);
  const isTl = effectiveLang === "tl";
  const warnings = analyzeSpendingBehavior(snapshot, effectiveLang);
  const topWarning: AssistantBehaviorAlert | null = warnings[0]
    ? { level: warnings[0].severity, title: warnings[0].title, detail: warnings[0].detail }
    : null;

  const proposedActions = parseNaturalAssistantActions(rawMessage, snapshot);

  if (proposedActions.length > 0) {
    const summaryText = buildActionPreparedSummary(proposedActions, isTl);
    const firstWarning = evaluateActionBehaviorWarning(
      proposedActions[0],
      snapshot,
      effectiveLang,
      false
    );

    const reply = isTl
      ? `Sige, inihanda ko na ${proposedActions.length > 1 ? `ang ${proposedActions.length} items` : "ito"} para sa iyo:\n${summaryText}\n\nI-review lang saglit at pindutin ang "Confirm & Save" sa card sa ibaba.`
      : `Got it — I prepared ${proposedActions.length > 1 ? `${proposedActions.length} draft updates` : "this update"} for you:\n${summaryText}\n\nReview the details and tap "Confirm & Save" below.`;

    return {
      reply,
      warning: firstWarning || topWarning,
      proposedActions,
      mode: "local"
    };
  }

  const lower = clipUnsafeText(rawMessage, 1200).toLowerCase();
  const s = summarizeCycleLedger(snapshot, new Date());

  // 1. Developer / Creator knowledge
  if (
    /\b(renniel|salazar|developer|creator|maker|founder|author|who built|who made|who created|who developed|sino gumawa|sinong gumawa|sino nag|gumawa ng app)\b/i.test(
      lower
    )
  ) {
    return { reply: answerDeveloperQuestion(isTl), warning: null, proposedActions: [], mode: "local" };
  }

  // 2. What-if Affordability simulator
  if (
    /\b(afford|kaya ba|kaya ko ba|pwede ko ba bilhin|puwede ko ba bilhin|safe ba bumili|safe ba gumastos|should i buy|bilhin ko ba|what if i spend|what if bumili)\b/i.test(
      lower
    )
  ) {
    return {
      reply: answerAffordabilityQuestion(rawMessage, snapshot, isTl),
      warning: topWarning,
      proposedActions: [],
      mode: "local"
    };
  }

  // 3. Payday / Kinsenas splitter
  if (
    /\b(split|hatiin|allocate|allocation|payday plan|sahod plan|sweldo plan|paano i-budget)\b/i.test(
      lower
    )
  ) {
    return {
      reply: answerPaydayPlan(rawMessage, snapshot, isTl),
      warning: topWarning,
      proposedActions: [],
      mode: "local"
    };
  }

  // 4. 50/30/20 Audit
  if (/\b(50\s*\/?\s*30\s*\/?\s*20|audit|needs vs wants|luho ratio|ratio ko)\b/i.test(lower)) {
    const baseCents = Math.max(s.cycleIncomeCents, s.cycleExpenseCents);
    const needPct = baseCents > 0 ? Math.round((s.needCents / baseCents) * 100) : 0;
    const luhoPct = baseCents > 0 ? Math.round((s.luhoCents / baseCents) * 100) : 0;
    const netBufferCents = Math.max(0, s.cycleIncomeCents - s.cycleExpenseCents);
    const savePct =
      s.cycleIncomeCents > 0 ? Math.round((netBufferCents / s.cycleIncomeCents) * 100) : 0;

    const reply = isTl
      ? `Heto ang 50/30/20 pulse ng cycle mo ngayon:\n• Needs: ₱${formatPeso(fromCentavos(s.needCents))} (${needPct}%${s.cycleIncomeCents > 0 ? " ng income" : " ng gastos"}, target <=50%)\n• Wants/Luho: ₱${formatPeso(fromCentavos(s.luhoCents))} (${luhoPct}%, ideal <=30%)\n• Savings / Net Buffer: ₱${formatPeso(fromCentavos(netBufferCents))} (${savePct}% retained${s.savingsTotalCents > 0 ? `, +₱${formatPeso(fromCentavos(s.savingsTotalCents))} sa Savings Jars` : ""})\n\n${luhoPct > 30 ? "Tip: Medyo mabigat ang Luho share ngayon — subukang mag-pause ng treat purchases ng 2 araw para lumaki ang buffer." : "Solid ang disiplina mo! Nasa magandang balance ang needs at wants mo."}`
      : `Here is your 50/30/20 check for this cycle:\n• Essentials (Needs): ₱${formatPeso(fromCentavos(s.needCents))} (${needPct}%, guideline ~50%)\n• Wants (Luho): ₱${formatPeso(fromCentavos(s.luhoCents))} (${luhoPct}%, guideline ~30%)\n• Unspent Cashflow Buffer: ₱${formatPeso(fromCentavos(netBufferCents))} (${savePct}%${s.savingsTotalCents > 0 ? `, plus ₱${formatPeso(fromCentavos(s.savingsTotalCents))} saved in Jars` : ""})\n\n${luhoPct > 30 ? "Tip: Wants are trending above 30% — trimming 1–2 impulse buys this week protects your buffer." : "Looking well balanced — keep feeding your Savings Jars while Wants stay controlled."}`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // 5. App capabilities / help / guide
  if (
    /\b(how to use|paano gamitin|help|what can you do|ano kaya mo|ano mga kaya|features|capabilities|sms|receipt|offline|pin lock|kinsenas work)\b/i.test(
      lower
    )
  ) {
    return { reply: answerAppGuide(isTl), warning: null, proposedActions: [], mode: "local" };
  }

  // 6. Spending behavior / overspending / warnings / analyze
  if (
    /\b(overspend|warning|habit|behavior|lug|luho|analyze|kamusta gastos|kumusta gastos|check spend|gastos ko)\b/i.test(
      lower
    )
  ) {
    const cycleSpent = formatPeso(fromCentavos(s.cycleExpenseCents));
    const luhoSpent = formatPeso(fromCentavos(s.luhoCents));
    const needSpent = formatPeso(fromCentavos(s.needCents));
    const topCats = Array.from(s.categoryTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, cents]) => `${cat}: ₱${formatPeso(fromCentavos(cents))}`)
      .join(", ");

    const reply = isTl
      ? `Spending check para sa ${snapshot.budgetCycle === "kinsenas" ? "Kinsenas" : "Buwanang"} cycle:\n• Kabuuang gastos: ₱${cycleSpent} (Needs ₱${needSpent} · Luho ₱${luhoSpent} / ${s.luhoSharePct}%)\n${topCats ? `• Pinakamalaking categories: ${topCats}\n` : ""}${warnings.length === 0 ? "• Solid! Maayos ang pacing ng spending behavior mo ngayon." : `• May ${warnings.length} alert na dapat bantayan — silipin ang pinakataas na warning sa card.`}`
      : `Spending behavior check for this ${snapshot.budgetCycle} cycle:\n• Total spent: ₱${cycleSpent} (Essentials ₱${needSpent} · Wants/Luho ₱${luhoSpent} / ${s.luhoSharePct}%)\n${topCats ? `• Top categories: ${topCats}\n` : ""}${warnings.length === 0 ? "• Nice work — your spending pace and Wants balance look steady." : `• ${warnings.length} alert(s) worth a look right now — check the alert banner.`}`;

    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // 7. Safe-to-spend / remaining budget
  if (/\b(safe|budget|natitira|matitira|pwede pang|puwede pang|limit|cap|kinsenas)\b/i.test(lower)) {
    if (!s.safeMetrics) {
      const reply = isTl
        ? `Wala ka pang naka-set na budget cap ngayon. ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} pa lang ang gastos mo sa cycle at may ₱${formatPeso(snapshot.overallBalance)} ka across active wallets. Sabihan mo lang ako ng "Set budget 15000" kung gusto mong maglagay ng limit!`
        : `You don't have a cycle budget cap set yet. Cycle spending sits at ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} with ₱${formatPeso(snapshot.overallBalance)} across wallets. Just say "Set budget 15000" whenever you'd like to set one!`;
      return { reply, warning: topWarning, proposedActions: [], mode: "local" };
    }

    const m = s.safeMetrics;
    const reply = isTl
      ? `Budget pulse mo (${snapshot.budgetCycle === "kinsenas" ? "Kinsenas" : "Monthly"} · ${s.window.remainingDays} araw pa):\n• Nagastos: ₱${formatPeso(m.spentAmount)} / ₱${formatPeso(m.capAmount)}\n• Natitira: ₱${formatPeso(m.remainingBudget)}\n• Safe daily spend: ₱${formatPeso(m.dailySafeSpend)}/araw\n• Unpaid bills sa cycle: ₱${formatPeso(m.unpaidBillsInCycle)} (Free after bills: ₱${formatPeso(m.freeAfterBills)})`
      : `Your budget pulse (${snapshot.budgetCycle} · ${s.window.remainingDays} days left):\n• Spent: ₱${formatPeso(m.spentAmount)} / ₱${formatPeso(m.capAmount)}\n• Remaining: ₱${formatPeso(m.remainingBudget)}\n• Safe daily spend: ₱${formatPeso(m.dailySafeSpend)}/day\n• Unpaid bills this cycle: ₱${formatPeso(m.unpaidBillsInCycle)} (Free after bills: ₱${formatPeso(m.freeAfterBills)})`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // 8. Bills & Utang + Payoff advice
  if (/\b(bill|bills|bayarin|due|utang|singil|utang ko|may utang|debt|payoff)\b/i.test(lower)) {
    const unpaidBills = snapshot.bills.filter((b) => b.status !== "Paid");
    const unpaidBillsPreview = unpaidBills
      .slice(0, 3)
      .map((b) => `${b.title} (₱${formatPeso(b.amount)}${b.dueDate ? `, due ${b.dueDate}` : ""})`)
      .join(", ");
    const payables = snapshot.utangList.filter((u) => u.status !== "Paid" && u.direction === "i_owe");
    const receivables = snapshot.utangList.filter(
      (u) => u.status !== "Paid" && u.direction === "owed_to_me"
    );

    const reply = isTl
      ? `Heto ang summary ng Bills at Utang mo:\n• Unpaid bills (${unpaidBills.length}): ₱${formatPeso(fromCentavos(s.unpaidBillsCents))}${unpaidBillsPreview ? ` — ${unpaidBillsPreview}` : ""}\n• Sisingilin pa (${receivables.length}): ₱${formatPeso(fromCentavos(s.unpaidToMeCents))}\n• Babayaran mo (${payables.length}): ₱${formatPeso(fromCentavos(s.unpaidIOweCents))}\n\nTip: Sabihan mo lang ako ng "Nagbayad na si [Pangalan]" o "Paid na Meralco bill" para ma-settle agad.`
      : `Here's where your Bills & Utang stand:\n• Unpaid bills (${unpaidBills.length}): ₱${formatPeso(fromCentavos(s.unpaidBillsCents))}${unpaidBillsPreview ? ` — ${unpaidBillsPreview}` : ""}\n• Owed to you (${receivables.length}): ₱${formatPeso(fromCentavos(s.unpaidToMeCents))}\n• You owe (${payables.length}): ₱${formatPeso(fromCentavos(s.unpaidIOweCents))}\n\nTip: You can tell me "Settle [Name] utang" or "Mark Meralco bill paid" anytime.`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // 9. Wallets / Balances / Savings Jars
  if (/\b(wallet|wallets|balanse|balance|pera|cash|gcash|maya|bank|jar|jars|savings|ipon)\b/i.test(lower)) {
    const walletList = snapshot.wallets
      .map((w) => `• ${resolveWalletVisual(w).displayName}: ₱${formatPeso(snapshot.walletBalances[w] ?? 0)}`)
      .join("\n");
    const todayKey = manilaDateKey(new Date()) || "2026-01-01";
    const jarList = snapshot.savingsGoals
      .slice(0, 4)
      .map((g) => {
        const prog = computeSavingsJarProgress(g, todayKey);
        return `• ${g.name}: ₱${formatPeso(g.savedAmount)} / ₱${formatPeso(g.targetAmount)} (${prog.pct}%)`;
      })
      .join("\n");

    const reply = isTl
      ? `Total liquid balance mo ay ₱${formatPeso(snapshot.overallBalance)}:\n${walletList}${jarList ? `\n\nSavings Jars (${snapshot.savingsGoals.length}):\n${jarList}` : "\n\nWala ka pang Savings Jar — sabihin lang \"Create savings jar Emergency target 20000\" kung gusto mong gumawa."}`
      : `Your total liquid balance is ₱${formatPeso(snapshot.overallBalance)}:\n${walletList}${jarList ? `\n\nSavings Jars (${snapshot.savingsGoals.length}):\n${jarList}` : "\n\nNo Savings Jars yet — try \"Create savings jar Emergency target 20000\" to start one."}`;
    return { reply, warning: topWarning, proposedActions: [], mode: "local" };
  }

  // 10. Friendly greeting / warm human snapshot fallback (preserves "Quick financial snapshot" wording)
  const isGreeting = /\b(hi|hello|hey|kumusta|kamusta|good morning|good afternoon|good evening|thanks|thank you|salamat)\b/i.test(
    lower
  );
  const reply = isTl
    ? `${isGreeting ? "Kumusta! Andito lang ako kapag kailangan mo ng karamay sa budget. " : ""}Quick financial snapshot:\n• Total Balance: ₱${formatPeso(snapshot.overallBalance)}\n• Gastos ngayong cycle: ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} (${s.luhoSharePct}% Luho)\n\nPuwede mo akong tanungin ng "Kaya ko ba bumili ng 1500?", magpa-split ng sahod, mag-paste ng GCash SMS, o mag-utos tulad ng "Transfer 500 GCash to Cash" o "Log 150 kape Cash".`
    : `${isGreeting ? "Hey there! Good to see you. " : ""}Quick financial snapshot:\n• Total Balance: ₱${formatPeso(snapshot.overallBalance)}\n• Cycle Spending: ₱${formatPeso(fromCentavos(s.cycleExpenseCents))} (${s.luhoSharePct}% Wants/Luho)\n\nAsk me anything — try "Can I afford ₱1,500?", paste a GCash/bank SMS receipt, transfer wallets, create a bill or jar, or say "Who built Tipid?"`;

  return { reply, warning: topWarning, proposedActions: [], mode: "local" };
}
