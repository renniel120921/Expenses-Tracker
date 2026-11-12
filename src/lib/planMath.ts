import { entryDate, fromCentavos, manilaDateKey, toCentavos } from "@/lib/core";
import type {
  BillRecurrence,
  BudgetCycle,
  CategoryBudgetRecord,
  SavingsGoalRecord,
  TransactionEntry
} from "@/types/finance";

export interface BudgetCycleWindow {
  cycle: BudgetCycle;
  startKey: string;
  endKey: string;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
}

export interface CategoryBudgetStatus {
  id: string;
  category: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  pct: number;
  state: "safe" | "warning" | "over";
}

export interface SafeToSpendMetrics {
  capAmount: number;
  spentAmount: number;
  remainingBudget: number;
  dailySafeSpend: number;
  remainingDays: number;
  isOverBudget: boolean;
  unpaidBillsInCycle: number;
  freeAfterBills: number;
}

export interface SavingsJarProgress {
  id: string;
  pct: number;
  remainingAmount: number;
  isCompleted: boolean;
  daysRemaining: number | null;
  suggestedDaily: number | null;
  suggestedPayday: number | null;
  milestone: 0 | 25 | 50 | 75 | 100;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

function parseKey(key: string): DateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(key || "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() + 1 !== month ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function formatKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function utcDayIndex(parts: DateParts): number {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

/**
 * Computes the next YYYY-MM-DD bill due date for recurring schedules using
 * calendar-clamped UTC arithmetic (e.g. Jan 31 + 1 month -> Feb 28/29).
 */
export function computeNextBillDueDate(
  currentDueDate: string,
  recurrence: BillRecurrence | undefined
): string | null {
  if (!recurrence || recurrence === "none") return null;
  const parts = parseKey(currentDueDate);
  if (!parts) return null;

  if (recurrence === "weekly") {
    const d = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 7));
    return formatKey(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  const monthStep = recurrence === "monthly" ? 1 : recurrence === "quarterly" ? 3 : 12;
  const zeroMonth = parts.month - 1 + monthStep;
  const nextYear = parts.year + Math.floor(zeroMonth / 12);
  const nextMonth = (zeroMonth % 12) + 1;
  const maxDay = daysInUtcMonth(nextYear, nextMonth);
  const nextDay = Math.min(parts.day, maxDay);
  return formatKey(nextYear, nextMonth, nextDay);
}

/**
 * Resolves start/end date keys and remaining day counts for either full-month
 * or Philippine bi-weekly (1-15 / 16-End) budget cycles.
 */
export function resolveBudgetCycleWindow(
  todayKey: string,
  cycle: BudgetCycle
): BudgetCycleWindow {
  const fallback = parseKey(todayKey) || { year: 2026, month: 1, day: 1 };
  const lastDay = daysInUtcMonth(fallback.year, fallback.month);

  if (cycle === "kinsenas") {
    if (fallback.day <= 15) {
      return {
        cycle,
        startKey: formatKey(fallback.year, fallback.month, 1),
        endKey: formatKey(fallback.year, fallback.month, 15),
        totalDays: 15,
        elapsedDays: fallback.day,
        remainingDays: Math.max(1, 15 - fallback.day + 1)
      };
    }
    const totalDays = lastDay - 15;
    return {
      cycle,
      startKey: formatKey(fallback.year, fallback.month, 16),
      endKey: formatKey(fallback.year, fallback.month, lastDay),
      totalDays,
      elapsedDays: fallback.day - 15,
      remainingDays: Math.max(1, lastDay - fallback.day + 1)
    };
  }

  return {
    cycle: "monthly",
    startKey: formatKey(fallback.year, fallback.month, 1),
    endKey: formatKey(fallback.year, fallback.month, lastDay),
    totalDays: lastDay,
    elapsedDays: fallback.day,
    remainingDays: Math.max(1, lastDay - fallback.day + 1)
  };
}

/**
 * Extracts a YYYY-MM-DD Manila calendar key for a TransactionEntry regardless of
 * whether createdAt/timestamp or plain date string is present.
 */
export function entryManilaDateKey(entry: Partial<TransactionEntry>): string {
  if (typeof entry.date === "string" && parseKey(entry.date)) {
    return entry.date;
  }
  const resolved = entryDate(entry);
  return resolved ? manilaDateKey(resolved) || "" : "";
}

/**
 * Aggregates category spending within [cycleStartKey, cycleEndKey] ignoring
 * income and wallet-to-wallet transfers.
 */
export function computeCategoryBudgetStatuses(params: {
  entries: ReadonlyArray<TransactionEntry>;
  budgets: ReadonlyArray<CategoryBudgetRecord>;
  cycleStartKey: string;
  cycleEndKey: string;
  warningThresholdPct?: number;
}): {
  statuses: CategoryBudgetStatus[];
  spentByCategory: Record<string, number>;
  totalPeriodExpense: number;
  totalCategoryCaps: number;
} {
  const { entries, budgets, cycleStartKey, cycleEndKey, warningThresholdPct = 80 } = params;
  const categorySpentCents: Record<string, number> = {};
  let totalExpenseCents = 0;

  for (const entry of entries) {
    if (entry.type !== "expense") continue;
    const key = entryManilaDateKey(entry);
    if (!key || key < cycleStartKey || key > cycleEndKey) continue;

    let amountCents = 0;
    try {
      amountCents = toCentavos(entry.amount, { allowZero: true });
    } catch {
      continue;
    }
    totalExpenseCents += amountCents;
    const cat = entry.category || "Other";
    categorySpentCents[cat] = (categorySpentCents[cat] || 0) + amountCents;
  }

  let totalCapsCents = 0;
  const statuses: CategoryBudgetStatus[] = budgets.map((b) => {
    let limitCents = 0;
    try {
      limitCents = toCentavos(b.limitAmount, { allowZero: true });
    } catch {
      limitCents = 0;
    }
    totalCapsCents += limitCents;
    const spentCents = categorySpentCents[b.category] || 0;
    const remCents = limitCents - spentCents;
    const pct = limitCents > 0 ? Math.min(999, Math.round((spentCents / limitCents) * 100)) : 0;
    const state: CategoryBudgetStatus["state"] =
      spentCents > limitCents ? "over" : pct >= warningThresholdPct ? "warning" : "safe";

    return {
      id: b.id,
      category: b.category,
      limitAmount: fromCentavos(limitCents),
      spentAmount: fromCentavos(spentCents),
      remainingAmount: fromCentavos(remCents),
      pct,
      state
    };
  });

  const spentByCategory = Object.fromEntries(
    Object.entries(categorySpentCents).map(([k, v]) => [k, fromCentavos(v)])
  );

  return {
    statuses,
    spentByCategory,
    totalPeriodExpense: fromCentavos(totalExpenseCents),
    totalCategoryCaps: fromCentavos(totalCapsCents)
  };
}

/**
 * Computes Safe-to-Spend daily allowance and Free Cash After Unpaid Bills.
 */
export function computeSafeToSpendMetrics(params: {
  capAmount: number;
  spentAmount: number;
  remainingDays: number;
  activeLiquidityBalance: number;
  unpaidBillsInCycle: number;
}): SafeToSpendMetrics {
  const days = Math.max(1, Math.round(params.remainingDays));
  const capCents = toCentavos(Math.max(0, params.capAmount || 0), { allowZero: true });
  const spentCents = toCentavos(Math.max(0, params.spentAmount || 0), { allowZero: true });
  const remBudgetCents = capCents - spentCents;
  const dailyCents = remBudgetCents > 0 ? Math.floor(remBudgetCents / days) : 0;

  const liquidityCents = toCentavos(params.activeLiquidityBalance || 0, {
    allowZero: true,
    allowNegative: true
  });
  const unpaidCents = toCentavos(Math.max(0, params.unpaidBillsInCycle || 0), { allowZero: true });

  return {
    capAmount: fromCentavos(capCents),
    spentAmount: fromCentavos(spentCents),
    remainingBudget: fromCentavos(remBudgetCents),
    dailySafeSpend: fromCentavos(dailyCents),
    remainingDays: days,
    isOverBudget: capCents > 0 && spentCents > capCents,
    unpaidBillsInCycle: fromCentavos(unpaidCents),
    freeAfterBills: fromCentavos(liquidityCents - unpaidCents)
  };
}

/**
 * Computes completion percentage, milestone tier, and recommended daily/payday
 * saving pace for a Savings Jar.
 */
export function computeSavingsJarProgress(
  goal: Pick<SavingsGoalRecord, "id" | "targetAmount" | "savedAmount" | "targetDate">,
  todayKey: string
): SavingsJarProgress {
  const targetCents = toCentavos(Math.max(0, goal.targetAmount || 0), { allowZero: true });
  const savedCents = toCentavos(Math.max(0, goal.savedAmount || 0), { allowZero: true });
  const remCents = Math.max(0, targetCents - savedCents);
  const pct = targetCents > 0 ? Math.min(100, Math.round((savedCents / targetCents) * 100)) : 0;
  const isCompleted = targetCents > 0 && savedCents >= targetCents;

  const milestone: SavingsJarProgress["milestone"] =
    pct >= 100 ? 100 : pct >= 75 ? 75 : pct >= 50 ? 50 : pct >= 25 ? 25 : 0;

  let daysRemaining: number | null = null;
  let suggestedDaily: number | null = null;
  let suggestedPayday: number | null = null;

  if (goal.targetDate && !isCompleted) {
    const startParts = parseKey(todayKey);
    const endParts = parseKey(goal.targetDate);
    if (startParts && endParts) {
      const diff = utcDayIndex(endParts) - utcDayIndex(startParts);
      daysRemaining = Math.max(1, diff);
      suggestedDaily = fromCentavos(Math.ceil(remCents / daysRemaining));
      const paydaysLeft = Math.max(1, Math.ceil(daysRemaining / 15));
      suggestedPayday = fromCentavos(Math.ceil(remCents / paydaysLeft));
    }
  }

  return {
    id: goal.id,
    pct,
    remainingAmount: fromCentavos(remCents),
    isCompleted,
    daysRemaining,
    suggestedDaily,
    suggestedPayday,
    milestone
  };
}
