<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Plus,
  Eye,
  EyeOff,
  Pencil,
  Search,
  Trash2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ArrowRightLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  ReceiptText,
  Scale,
  Sparkles,
  Users,
  ShieldCheck,
  ShoppingBag,
  Tag,
  PiggyBank,
  Gauge
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import WalletDeck from "@/components/WalletDeck.vue";
import TransactionModal from "@/components/TransactionModal.vue";
import TransactionDetailDialog from "@/components/TransactionDetailDialog.vue";
import BudgetModal from "@/components/BudgetModal.vue";
import WalletModal from "@/components/WalletModal.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import CashFlowChart from "@/components/CashFlowChart.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import { useWelcomeTour } from "@/composables/useWelcomeTour";
import { useI18n } from "@/lib/i18n";
import {
  entryDate,
  formatPeso,
  fromCentavos,
  getCategoryColor,
  manilaDateKey,
  resolveShortcutTransactionType,
  sumActiveWalletsBalance,
  sumMoney,
  toCentavos
} from "@/lib/core";
import { deleteEntry, markBillPaidAndScheduleNext } from "@/lib/data";
import {
  computeCategoryBudgetStatuses,
  computeSafeToSpendMetrics,
  resolveBudgetCycleWindow
} from "@/lib/planMath";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getCategoryIcon, getWalletKindIcon } from "@/lib/categoryIcons";
import type { BillRecord, EntryType, TransactionEntry } from "@/types/finance";

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const {
  entries,
  budget,
  budgetCycle,
  baseBalances,
  walletBalances,
  overallBalance,
  wallets,
  bills,
  utangList,
  savingsGoals
} = useFinanceData(uidRef, {
  withBills: true,
  withUtang: true,
  withSavingsGoals: true
});
const { t, isTl } = useI18n();
const { openTour: openWelcomeTour } = useWelcomeTour();

const horizon = ref<"thisMonth" | "thisWeek" | "last30Days" | "all">("thisMonth");
const chartMode = ref<"daily" | "cumulative" | "flow">("daily");
const balanceHidden = ref(false);

const txFilter = ref<"all" | "expense" | "income" | "transfer" | "need" | "luho">("all");
const searchQuery = ref("");

const txModalOpen = ref(false);
const txDefaultType = ref<EntryType>("expense");
const budgetModalOpen = ref(false);
const walletModalOpen = ref(false);
const walletModalMode = ref<"add" | "edit">("add");
const editWalletMethod = ref<string | undefined>(undefined);

const inspectedEntry = ref<TransactionEntry | null>(null);
const pendingDelete = ref<TransactionEntry | null>(null);
const deleting = ref(false);

onMounted(() => {
  const shortcutType = resolveShortcutTransactionType(window.location.search);
  if (shortcutType) {
    txDefaultType.value = shortcutType;
    txModalOpen.value = true;
    window.history.replaceState({}, "", window.location.pathname);
  }
});

const userFirstName = computed(() => {
  const raw = user.value?.displayName?.trim() || user.value?.email?.split("@")[0] || "Friend";
  return raw.split(/\s+/)[0] || raw;
});

const greetingText = computed(() => {
  const hour = new Date().getHours();
  if (isTl.value) {
    if (hour < 12) return "Magandang Umaga";
    if (hour < 18) return "Magandang Hapon";
    return "Magandang Gabi";
  }
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
});

const horizonOptions = computed(() => [
  { id: "thisMonth" as const, label: t.value.thisMonth },
  { id: "thisWeek" as const, label: t.value.thisWeek },
  { id: "last30Days" as const, label: t.value.last30Days },
  { id: "all" as const, label: t.value.allTime }
]);

const activeHorizonLabel = computed(
  () => horizonOptions.value.find((o) => o.id === horizon.value)?.label || t.value.thisMonth
);

const monthStats = computed(() => {
  const now = new Date();
  const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  let incThisCents = 0;
  let expThisCents = 0;
  let incLastCents = 0;

  for (const e of entries.value) {
    const d = entryDate(e);
    if (!d) continue;
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
      if (e.type === "income") incThisCents += cents;
      else if (e.type === "expense") expThisCents += cents;
    } else if (d.getFullYear() === lastMonthRef.getFullYear() && d.getMonth() === lastMonthRef.getMonth()) {
      if (e.type === "income") incLastCents += cents;
    }
  }

  return {
    incomeThis: fromCentavos(incThisCents),
    expenseThis: fromCentavos(expThisCents),
    incomeLast: fromCentavos(incLastCents),
    net: fromCentavos(incThisCents - expThisCents)
  };
});

const budgetProgress = computed(() => {
  const cap = Number(budget.value || 0);
  if (cap <= 0) return { hasCap: false, cap: 0, spent: monthStats.value.expenseThis, remaining: 0, pct: 0, over: false };
  const capCents = toCentavos(cap, { allowZero: true });
  const expCents = toCentavos(monthStats.value.expenseThis, { allowZero: true });
  const rem = fromCentavos(capCents - expCents);
  const pct = Math.min(100, Math.round((expCents / capCents) * 100));
  return {
    hasCap: true,
    cap: fromCentavos(capCents),
    spent: fromCentavos(expCents),
    remaining: rem,
    pct,
    over: expCents > capCents
  };
});

const totalPositiveWalletBalance = computed(() => {
  let posCents = 0;
  for (const method of wallets.value) {
    const val = Number(walletBalances.value[method] ?? 0);
    if (val > 0) {
      try {
        posCents += toCentavos(val, { allowZero: true });
      } catch {
        // ignore invalid display values
      }
    }
  }
  return fromCentavos(posCents);
});

const horizonEntries = computed(() => {
  const now = new Date();
  let startMs = 0;
  if (horizon.value === "thisWeek") {
    const day = (now.getDay() + 6) % 7;
    startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).getTime();
  } else if (horizon.value === "last30Days") {
    startMs = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  } else if (horizon.value === "thisMonth") {
    startMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  if (horizon.value === "all") return entries.value;
  return entries.value.filter((e) => {
    const d = entryDate(e);
    return d ? d.getTime() >= startMs : false;
  });
});

const horizonSummary = computed(() => {
  let incCents = 0;
  let expCents = 0;
  let needCents = 0;
  let wantCents = 0;
  const catMap: Record<string, number> = {};

  for (const e of horizonEntries.value) {
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    if (e.type === "income") {
      incCents += cents;
    } else if (e.type === "expense") {
      expCents += cents;
      if (e.spendType === "luho") wantCents += cents;
      else needCents += cents;
      const cat = e.category || "Other";
      catMap[cat] = (catMap[cat] || 0) + cents;
    }
  }

  const topExpenses = Object.entries(catMap)
    .map(([category, cents], _, arr) => ({
      category,
      amount: fromCentavos(cents),
      pct: expCents > 0 ? Math.max(1, Math.round((cents / expCents) * 100)) : 0,
      color: getCategoryColor(category),
      totalKinds: arr.length
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const needsPct = expCents > 0 ? Math.round((needCents / expCents) * 100) : 0;
  const wantsPct = expCents > 0 ? 100 - needsPct : 0;

  return {
    inflow: fromCentavos(incCents),
    outflow: fromCentavos(expCents),
    net: fromCentavos(incCents - expCents),
    needs: fromCentavos(needCents),
    wants: fromCentavos(wantCents),
    needsPct,
    wantsPct,
    topExpenses
  };
});

const filteredRecentEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return entries.value
    .filter((e) => {
      if (txFilter.value === "expense" && e.type !== "expense") return false;
      if (txFilter.value === "income" && e.type !== "income") return false;
      if (txFilter.value === "transfer" && e.type !== "transfer") return false;
      if (txFilter.value === "need" && (e.type !== "expense" || e.spendType === "luho")) return false;
      if (txFilter.value === "luho" && (e.type !== "expense" || e.spendType !== "luho")) return false;
      if (q) {
        const displayWallet = resolveWalletVisual(e.method || "Cash").displayName;
        const toDisplayWallet = e.toMethod ? resolveWalletVisual(e.toMethod).displayName : "";
        const hay = `${e.desc} ${e.category} ${e.method} ${displayWallet} ${e.toMethod || ""} ${toDisplayWallet}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .slice(0, 8);
});

const safeToSpend = computed(() => {
  const todayKey = manilaDateKey() || new Date().toISOString().slice(0, 10);
  const windowInfo = resolveBudgetCycleWindow(todayKey, budgetCycle.value);
  const { totalPeriodExpense } = computeCategoryBudgetStatuses({
    entries: entries.value,
    budgets: [],
    cycleStartKey: windowInfo.startKey,
    cycleEndKey: windowInfo.endKey
  });
  const unpaidInCycle = sumMoney(
    bills.value
      .filter((b) => b.status !== "Paid" && b.dueDate && b.dueDate <= windowInfo.endKey)
      .map((b) => b.amount)
  );
  return computeSafeToSpendMetrics({
    capAmount: Number(budget.value || 0),
    spentAmount: totalPeriodExpense,
    remainingDays: windowInfo.remainingDays,
    activeLiquidityBalance: sumActiveWalletsBalance(wallets.value, walletBalances.value),
    unpaidBillsInCycle: unpaidInCycle
  });
});

const savingsSummary = computed(() => {
  const saved = sumMoney(savingsGoals.value.map((g) => g.savedAmount));
  const target = sumMoney(savingsGoals.value.map((g) => g.targetAmount));
  const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
  return { count: savingsGoals.value.length, saved, target, pct };
});

const payingBillId = ref<string | null>(null);
async function quickMarkBillPaid(bill: BillRecord) {
  const uid = user.value?.uid;
  if (!uid || payingBillId.value) return;
  payingBillId.value = bill.id;
  try {
    const { nextDueDate } = await markBillPaidAndScheduleNext(uid, bill);
    pushToast(
      nextDueDate
        ? isTl.value
          ? `Bayad na. Susunod na due: ${nextDueDate}`
          : `Paid. Next bill due ${nextDueDate}.`
        : isTl.value
          ? "Minarkahang bayad."
          : "Bill marked as paid.",
      "success"
    );
  } catch {
    pushToast(isTl.value ? "Hindi na-update ang bayarin." : "Could not update bill.", "error");
  } finally {
    payingBillId.value = null;
  }
}

const dueBills = computed(() => bills.value.filter((b) => b.status === "Unpaid" || b.status === "Overdue"));
const overdueCount = computed(() => bills.value.filter((b) => b.status === "Overdue").length);
const unpaidBillsTotal = computed(() => sumMoney(dueBills.value.map((b) => b.amount)));
const billsPaidPct = computed(() => {
  if (bills.value.length === 0) return 0;
  const paid = bills.value.filter((b) => b.status === "Paid").length;
  return Math.round((paid / bills.value.length) * 100);
});

const utangSummary = computed(() => {
  const owedToMe = sumMoney(
    utangList.value.filter((u) => u.direction === "owed_to_me" && u.status !== "Paid").map((u) => u.amount)
  );
  const iOwe = sumMoney(
    utangList.value.filter((u) => u.direction === "i_owe" && u.status !== "Paid").map((u) => u.amount)
  );
  return { owedToMe, iOwe, net: owedToMe - iOwe };
});

function entryBadgeStyle(entry: TransactionEntry): Record<string, string> | undefined {
  if (entry.type !== "expense") return undefined;
  const color = getCategoryColor(entry.category);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 13%, transparent)`,
    color
  };
}

function openEditWallet(method: string) {
  walletModalMode.value = "edit";
  editWalletMethod.value = method;
  walletModalOpen.value = true;
}

function openAddWallet() {
  walletModalMode.value = "add";
  editWalletMethod.value = undefined;
  walletModalOpen.value = true;
}

async function confirmDeleteEntry() {
  if (!user.value?.uid || !pendingDelete.value) return;
  deleting.value = true;
  try {
    await deleteEntry(user.value.uid, pendingDelete.value.id);
    pushToast(isTl.value ? "Nabura ang transaksyon." : "Transaction deleted.", "success");
    pendingDelete.value = null;
    inspectedEntry.value = null;
  } catch {
    pushToast(isTl.value ? "Hindi mabura ang entry." : "Failed to delete entry.", "error");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <AppShell active-tab="home" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-6">
      <!-- Compact Greeting + Action Header -->
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-medium text-[var(--text-muted)]">
            {{ greetingText }} ·
            {{ new Date().toLocaleDateString(isTl ? "fil-PH" : "en-US", { month: "short", day: "numeric", year: "numeric" }) }}
          </p>
          <h1 class="mt-0.5 truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ userFirstName }}
          </h1>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <!-- Welcome Tour / App Guide Pill -->
          <button
            type="button"
            class="tipid-compact inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--accent)] sm:min-h-[32px]"
            :aria-label="isTl ? 'Buksan ang gabay at welcome tour' : 'Open welcome tour and app guide'"
            @click="openWelcomeTour"
          >
            <Sparkles :size="13" class="text-[var(--accent)]" aria-hidden="true" />
            <span>{{ isTl ? "Gabay sa App" : "App Guide" }}</span>
          </button>

          <!-- Compact select on narrow phones -->
          <select
            v-model="horizon"
            aria-label="Time horizon"
            class="tipid-compact min-h-[38px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs sm:hidden"
          >
            <option v-for="opt in horizonOptions" :key="opt.id" :value="opt.id">
              {{ opt.label }}
            </option>
          </select>

          <!-- Segmented strip on tablet/desktop -->
          <div
            role="group"
            aria-label="Time horizon"
            class="hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 text-xs shadow-xs sm:inline-flex"
          >
            <button
              v-for="opt in horizonOptions"
              :key="opt.id"
              type="button"
              :class="[
                'tipid-compact min-h-[32px] rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-colors',
                horizon === opt.id ? 'bg-[var(--bg-inset)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              ]"
              @click="horizon = opt.id"
            >
              {{ opt.label }}
            </button>
          </div>

          <button
            type="button"
            class="tipid-cta inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="txDefaultType = 'expense'; txModalOpen = true"
          >
            <Plus :size="15" aria-hidden="true" />
            <span>{{ isTl ? "Magtala" : "Add" }}</span>
            <span class="hidden sm:inline">{{ isTl ? "ng Tala" : "Transaction" }}</span>
          </button>
        </div>
      </header>

      <!-- Joined Hero Stack: Total Balance Card + Split Inflow/Outflow Companion Bar -->
      <section aria-label="Balance and Cash Flow Overview" class="space-y-3">
        <article class="tipid-card-emerald p-5 sm:p-6">
          <div class="flex items-center justify-between gap-2">
            <span class="tipid-eyebrow text-white/80">{{ t.netBalance }}</span>
            <button
              type="button"
              class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/12 text-white/90 transition-colors hover:bg-white/22"
              :aria-label="balanceHidden ? 'Show balance' : 'Hide balance'"
              @click="balanceHidden = !balanceHidden"
            >
              <EyeOff v-if="balanceHidden" :size="14" aria-hidden="true" />
              <Eye v-else :size="14" aria-hidden="true" />
            </button>
          </div>

          <p class="tipid-amount mt-2 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {{ balanceHidden ? "₱••••••" : `₱${formatPeso(overallBalance)}` }}
          </p>

          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/14 pt-3.5">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center gap-1 text-xs font-medium text-white/85">
                <span>{{ isTl ? "Net" : "Net" }} ({{ activeHorizonLabel }}):</span>
                <strong class="font-mono font-bold text-white">
                  {{ horizonSummary.net >= 0 ? "+" : "-" }}₱{{ formatPeso(Math.abs(horizonSummary.net)) }}
                </strong>
              </span>
              <button
                type="button"
                class="tipid-compact inline-flex items-center gap-1 rounded-lg border border-white/18 bg-white/14 px-2 py-0.5 text-[11px] font-semibold text-white transition-colors hover:bg-white/24"
                @click="txDefaultType = 'income'; txModalOpen = true"
              >
                <Plus :size="11" aria-hidden="true" />
                <span>{{ isTl ? "Kita" : "Income" }}</span>
              </button>
            </div>

            <a
              href="#accounts-section"
              class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1 pl-3 pr-1 text-xs font-semibold text-white no-underline transition-colors hover:bg-white/20"
            >
              <span>{{ isTl ? "Aking Balanse" : "My Balances" }}</span>
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#0B3A2B]">
                <ArrowDown :size="13" aria-hidden="true" />
              </span>
            </a>
          </div>
        </article>

        <!-- Joined Split Income | Expenses Companion Bar -->
        <div class="tipid-card grid grid-cols-2 divide-x divide-[var(--border-subtle)] overflow-hidden">
          <div class="flex items-center gap-3 p-4 sm:px-6 sm:py-4">
            <div class="tipid-icon-badge h-9 w-9 shrink-0 bg-[var(--income-soft)] text-[var(--income)]">
              <ArrowUp :size="16" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <span class="block text-[11px] font-semibold text-[var(--text-muted)]">
                {{ isTl ? "Kita" : "Income" }}
              </span>
              <p class="tipid-amount mt-0.5 truncate font-mono text-base font-bold text-[var(--income)] sm:text-xl">
                +₱{{ formatPeso(horizonSummary.inflow) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 p-4 sm:px-6 sm:py-4">
            <div class="tipid-icon-badge h-9 w-9 shrink-0 bg-[var(--expense-soft)] text-[var(--expense)]">
              <ArrowDown :size="16" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <span class="block text-[11px] font-semibold text-[var(--text-muted)]">
                {{ isTl ? "Gastos" : "Expenses" }}
              </span>
              <p class="tipid-amount mt-0.5 truncate font-mono text-base font-bold text-[var(--expense)] sm:text-xl">
                ₱{{ formatPeso(horizonSummary.outflow) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Top 5 Expenses Horizontal Ranked Cards (Positioned per reference in Tipid palette) -->
      <section aria-label="Top spending categories" class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
            {{ isTl ? "Top 5 na Gastos" : "Top 5 expenses" }}
          </h2>
          <a
            href="chart.html"
            class="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)] no-underline transition-colors hover:bg-[var(--accent)] hover:text-white"
          >
            <span>{{ activeHorizonLabel }}</span>
          </a>
        </div>

        <div
          v-if="horizonSummary.topExpenses.length === 0"
          class="tipid-card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
        >
          <div class="flex items-center gap-3">
            <div class="tipid-icon-badge h-9 w-9 bg-[var(--bg-inset)] text-[var(--text-muted)]">
              <Tag :size="16" aria-hidden="true" />
            </div>
            <div>
              <p class="text-xs font-semibold text-[var(--text-primary)]">
                {{ isTl ? "Wala pang nakaranggo na gastos." : "No expenses yet." }}
              </p>
              <p class="text-[11px] text-[var(--text-muted)]">
                {{ isTl ? "Lalabas ang top categories dito." : "Top categories rank here automatically." }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="tipid-compact inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
            @click="txDefaultType = 'expense'; txModalOpen = true"
          >
            <Plus :size="13" aria-hidden="true" />
            <span>{{ isTl ? "Magdagdag" : "Log Expense" }}</span>
          </button>
        </div>

        <div
          v-else
          tabindex="0"
          role="region"
          aria-label="Top expense categories"
          class="tipid-snap-track pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible"
        >
          <a
            v-for="(cat, idx) in horizonSummary.topExpenses"
            :key="cat.category"
            :href="`history.html?category=${encodeURIComponent(cat.category)}`"
            class="block w-[132px] shrink-0 no-underline sm:w-[148px] lg:w-auto"
          >
            <article class="tipid-card-interactive relative flex h-full flex-col items-center justify-between overflow-hidden px-3.5 py-4 text-center">
              <div
                class="absolute inset-x-0 top-0 h-1"
                :style="{ backgroundColor: cat.color }"
                aria-hidden="true"
              />
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                :style="{
                  backgroundColor: `color-mix(in srgb, ${cat.color} 15%, transparent)`,
                  color: cat.color
                }"
              >
                {{ idx + 1 }}
              </div>

              <div class="mt-2.5 flex w-full min-w-0 flex-col items-center gap-1">
                <component
                  :is="getCategoryIcon(cat.category, 'expense')"
                  :size="16"
                  class="text-[var(--text-muted)]"
                  aria-hidden="true"
                />
                <p class="w-full truncate text-xs font-semibold text-[var(--text-secondary)]">
                  {{ cat.category }}
                </p>
                <p class="tipid-amount font-mono text-sm font-bold text-[var(--text-primary)]">
                  ₱{{ formatPeso(cat.amount) }}
                </p>
              </div>
            </article>
          </a>
        </div>
      </section>

      <!-- Spend vs Budget & Key Pacing 2-Column Grid (Positioned per reference) -->
      <section aria-label="Spend vs budget" class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="text-base font-bold tracking-tight text-[var(--text-primary)] sm:text-lg">
            {{ isTl ? "Gastos vs badyet" : "Spend vs budget" }}
          </h2>
          <div class="flex items-center gap-2">
            <a
              href="plan.html"
              class="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] no-underline transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <span>{{ isTl ? "Plano" : "Plan Hub" }}</span>
              <ChevronRight :size="12" aria-hidden="true" />
            </a>
            <button
              type="button"
              class="tipid-compact inline-flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
              @click="budgetModalOpen = true"
            >
              <Pencil :size="11" aria-hidden="true" />
              <span>{{ budgetCycle === "kinsenas" ? "Kinsenas" : isTl ? "Buwanan" : "Monthly" }}</span>
            </button>
          </div>
        </div>

        <!-- Compact Plan Preview Strip (Safe-to-Spend Today + Savings Jars) -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="plan.html?tab=budgets"
            class="tipid-card-interactive flex items-center justify-between gap-3 p-4 no-underline"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="tipid-icon-badge h-9 w-9 shrink-0 bg-[var(--accent-soft)] text-[var(--accent)]">
                <Gauge :size="17" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-[var(--text-muted)]">
                  {{ isTl ? "Ligtas Gastusin / Araw" : "Safe-to-Spend Today" }}
                </p>
                <p class="tipid-amount truncate font-mono text-base font-bold text-[var(--text-primary)]">
                  <template v-if="safeToSpend.capAmount > 0">
                    ₱{{ formatPeso(safeToSpend.dailySafeSpend) }}<span class="text-xs font-medium text-[var(--text-muted)]"> / day</span>
                  </template>
                  <template v-else>
                    {{ isTl ? "Itakda ang limit" : "Set cycle budget" }}
                  </template>
                </p>
              </div>
            </div>
            <span class="shrink-0 rounded-full bg-[var(--bg-inset)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
              {{ safeToSpend.remainingDays }}d {{ isTl ? "natitira" : "left" }}
            </span>
          </a>

          <a
            href="plan.html?tab=jars"
            class="tipid-card-interactive flex items-center justify-between gap-3 p-4 no-underline"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="tipid-icon-badge h-9 w-9 shrink-0 bg-[var(--income-soft)] text-[var(--income)]">
                <PiggyBank :size="17" aria-hidden="true" />
              </div>
              <div class="min-w-0">
                <p class="truncate text-xs font-semibold text-[var(--text-muted)]">
                  {{ isTl ? "Mga Ipon Jars" : "Savings Jars" }}
                </p>
                <p class="tipid-amount truncate font-mono text-base font-bold text-[var(--text-primary)]">
                  <template v-if="savingsSummary.count > 0">
                    ₱{{ formatPeso(savingsSummary.saved) }}
                    <span class="text-xs font-medium text-[var(--text-muted)]">/ ₱{{ formatPeso(savingsSummary.target) }}</span>
                  </template>
                  <template v-else>
                    {{ isTl ? "Gumawa ng goal" : "Start a goal jar" }}
                  </template>
                </p>
              </div>
            </div>
            <span class="shrink-0 rounded-full bg-[var(--income-soft)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--income)]">
              {{ savingsSummary.count > 0 ? `${savingsSummary.count} · ${savingsSummary.pct}%` : "+ New" }}
            </span>
          </a>
        </div>

        <div class="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
          <!-- Card 1: Monthly Budget Pacing -->
          <article class="tipid-card-interactive tipid-kpi-card flex flex-col justify-between p-4">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="truncate text-xs font-semibold text-[var(--text-muted)]">
                  {{ t.monthlyBudget }}
                </span>
                <button
                  type="button"
                  class="tipid-compact tipid-compact-touch inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-label="t.commonEdit"
                  :title="t.commonEdit"
                  @click="budgetModalOpen = true"
                >
                  <ChevronRight :size="15" aria-hidden="true" />
                </button>
              </div>
              <p class="tipid-amount mt-1.5 font-mono text-lg font-bold text-[var(--text-primary)]">
                ₱{{ formatPeso(budgetProgress.spent) }}
              </p>
            </div>

            <div class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-[var(--text-muted)]">{{ budgetProgress.hasCap ? `${budgetProgress.pct}%` : "No cap" }}</span>
                <span :class="budgetProgress.over ? 'font-semibold text-[var(--expense)]' : 'text-[var(--text-secondary)]'">
                  <template v-if="budgetProgress.hasCap">
                    {{ budgetProgress.remaining < 0 ? "-" : "" }}₱{{ formatPeso(Math.abs(budgetProgress.remaining)) }}
                    {{ budgetProgress.over ? (isTl ? "lampas" : "over") : (isTl ? "natitira" : "left") }}
                  </template>
                  <template v-else>{{ isTl ? "Magtakda" : "Set limit" }}</template>
                </span>
              </div>
              <progress
                class="tipid-progress h-1.5 w-full"
                :value="budgetProgress.hasCap ? budgetProgress.pct : 0"
                max="100"
                :style="{ '--progress-bar-fill': budgetProgress.over ? 'var(--expense)' : 'var(--accent)' }"
                :aria-label="`Monthly budget usage: ${budgetProgress.pct}%`"
              />
            </div>
          </article>

          <!-- Card 2: Pending Bills Due -->
          <article class="tipid-card-interactive tipid-kpi-card flex flex-col justify-between p-4">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="truncate text-xs font-semibold text-[var(--text-muted)]">
                  {{ isTl ? "Nakatakdang Bills" : "Bills Due" }}
                </span>
                <a
                  href="bills.html"
                  class="tipid-compact tipid-compact-touch inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  :aria-label="t.navBills"
                >
                  <ChevronRight :size="15" aria-hidden="true" />
                </a>
              </div>
              <p class="tipid-amount mt-1.5 font-mono text-lg font-bold text-[var(--text-primary)]">
                ₱{{ formatPeso(unpaidBillsTotal) }}
              </p>
            </div>

            <div class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between gap-1 text-[11px] font-medium">
                <span :class="overdueCount > 0 ? 'font-semibold text-[var(--expense)]' : 'text-[var(--text-muted)]'">
                  {{ overdueCount > 0 ? `${overdueCount} overdue` : `${dueBills.length} open` }}
                </span>
                <span class="truncate text-[var(--text-secondary)]">
                  {{ dueBills[0]?.title || (isTl ? "Bayad lahat" : "All clear") }}
                </span>
              </div>
              <progress
                class="tipid-progress h-1.5 w-full"
                :value="billsPaidPct"
                max="100"
                :style="{ '--progress-bar-fill': overdueCount > 0 ? 'var(--warning)' : 'var(--income)' }"
                :aria-label="`Bills paid cycle completion: ${billsPaidPct}%`"
              />
            </div>
          </article>

          <!-- Card 3: Essentials (Need) Spend -->
          <article class="tipid-card-interactive tipid-kpi-card flex flex-col justify-between p-4">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="inline-flex items-center gap-1 truncate text-xs font-semibold text-[var(--text-muted)]">
                  <ShieldCheck :size="12" class="shrink-0 text-[var(--income)]" aria-hidden="true" />
                  <span class="truncate">Essentials</span>
                </span>
                <a
                  href="chart.html?tab=outflow"
                  class="tipid-compact tipid-compact-touch inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  aria-label="Inspect essentials in Analytics"
                >
                  <ChevronRight :size="15" aria-hidden="true" />
                </a>
              </div>
              <p class="tipid-amount mt-1.5 font-mono text-lg font-bold text-[var(--text-primary)]">
                ₱{{ formatPeso(horizonSummary.needs) }}
              </p>
            </div>

            <div class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-[var(--text-muted)]">Need</span>
                <span class="font-mono text-[var(--income)]">{{ horizonSummary.needsPct }}% share</span>
              </div>
              <progress
                class="tipid-progress h-1.5 w-full"
                :value="horizonSummary.needsPct"
                max="100"
                style="--progress-bar-fill: var(--income)"
                :aria-label="`Essentials ratio: ${horizonSummary.needsPct}%`"
              />
            </div>
          </article>

          <!-- Card 4: Discretionary (Want) Spend -->
          <article class="tipid-card-interactive tipid-kpi-card flex flex-col justify-between p-4">
            <div>
              <div class="flex items-center justify-between gap-1.5">
                <span class="inline-flex items-center gap-1 truncate text-xs font-semibold text-[var(--text-muted)]">
                  <ShoppingBag :size="12" class="shrink-0 text-[var(--expense)]" aria-hidden="true" />
                  <span class="truncate">Discretionary</span>
                </span>
                <a
                  href="chart.html?tab=outflow"
                  class="tipid-compact tipid-compact-touch inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                  aria-label="Inspect wants in Analytics"
                >
                  <ChevronRight :size="15" aria-hidden="true" />
                </a>
              </div>
              <p class="tipid-amount mt-1.5 font-mono text-lg font-bold text-[var(--text-primary)]">
                ₱{{ formatPeso(horizonSummary.wants) }}
              </p>
            </div>

            <div class="mt-3 space-y-1.5">
              <div class="flex items-center justify-between text-[11px] font-medium">
                <span class="text-[var(--text-muted)]">Want (Luho)</span>
                <span class="font-mono text-[var(--expense)]">{{ horizonSummary.wantsPct }}% share</span>
              </div>
              <progress
                class="tipid-progress h-1.5 w-full"
                :value="horizonSummary.wantsPct"
                max="100"
                style="--progress-bar-fill: var(--expense)"
                :aria-label="`Discretionary ratio: ${horizonSummary.wantsPct}%`"
              />
            </div>
          </article>
        </div>
      </section>

      <!-- Real Bank & E-Wallet Cards Deck (#accounts-section scroll target for My Balances) -->
      <WalletDeck
        :wallets="wallets"
        :wallet-balances="walletBalances"
        :total-positive-balance="totalPositiveWalletBalance"
        :balance-hidden="balanceHidden"
        @add="openAddWallet"
        @edit="openEditWallet"
      />

      <!-- Cash Flow + Commitments Grid -->
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="tipid-card p-5 lg:col-span-2">
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="tipid-icon-badge h-8 w-8 bg-[var(--accent-soft)] text-[var(--accent)]">
                <BarChart3 :size="16" aria-hidden="true" />
              </div>
              <div>
                <h2 class="text-sm font-bold text-[var(--text-primary)]">{{ t.cashFlowHeading }}</h2>
                <p class="text-[11px] text-[var(--text-muted)]">
                  {{ isTl ? "Paggalaw ng balanse sa napiling panahon" : "Activity trend across selected period" }}
                </p>
              </div>
            </div>

            <div class="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1 text-xs">
              <button
                v-for="m in [
                  { id: 'daily', label: 'Daily' },
                  { id: 'cumulative', label: 'Cumulative' },
                  { id: 'flow', label: 'In vs Out' }
                ]"
                :key="m.id"
                type="button"
                :class="[
                  'tipid-compact min-h-[30px] rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-colors',
                  chartMode === m.id ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                ]"
                @click="chartMode = m.id as typeof chartMode"
              >
                {{ m.label }}
              </button>
            </div>
          </div>
          <CashFlowChart :entries="horizonEntries" :horizon="horizon" :mode="chartMode" />
        </div>

        <div class="tipid-card flex flex-col justify-between p-5">
          <div>
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div class="tipid-icon-badge h-8 w-8 bg-[var(--warning-soft)] text-[var(--warning)]">
                  <CalendarClock :size="16" aria-hidden="true" />
                </div>
                <h2 class="text-sm font-bold text-[var(--text-primary)]">{{ t.commitmentsHeading }}</h2>
              </div>
              <a href="bills.html" class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-[var(--accent)] no-underline hover:underline">
                <span>{{ t.viewAll }}</span>
                <ArrowRight :size="13" aria-hidden="true" />
              </a>
            </div>

            <div class="mt-3.5 grid grid-cols-2 gap-2.5">
              <a href="bills.html" class="tipid-inset block p-3 no-underline transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]">
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                  <ReceiptText :size="12" class="shrink-0" aria-hidden="true" />
                  <span>{{ isTl ? "Unpaid Bills" : "Pending Bills" }}</span>
                </span>
                <p class="tipid-amount mt-1 font-mono text-sm font-bold text-[var(--text-primary)]">
                  ₱{{ formatPeso(unpaidBillsTotal) }}
                </p>
              </a>
              <a href="utang.html" class="tipid-inset block p-3 no-underline transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]">
                <span class="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]">
                  <Scale :size="12" class="shrink-0" aria-hidden="true" />
                  <span>Net Utang</span>
                </span>
                <p :class="['tipid-amount mt-1 font-mono text-sm font-bold', utangSummary.net >= 0 ? 'text-[var(--income)]' : 'text-[var(--expense)]']">
                  {{ utangSummary.net >= 0 ? "+" : "-" }}₱{{ formatPeso(Math.abs(utangSummary.net)) }}
                </p>
              </a>
            </div>

            <a
              v-if="overdueCount > 0"
              href="bills.html?filter=overdue"
              class="mt-3 flex items-center gap-2 rounded-xl bg-[var(--expense-soft)] px-3.5 py-2.5 text-xs font-semibold text-[var(--expense)] no-underline transition-colors hover:bg-[var(--expense)] hover:text-white"
            >
              <AlertTriangle :size="15" class="shrink-0" aria-hidden="true" />
              <span>{{ overdueCount }} {{ overdueCount === 1 ? "overdue bill requires" : "overdue bills require" }} attention.</span>
            </a>

            <ul v-if="dueBills.length > 0" class="mt-3.5 space-y-2.5">
              <li
                v-for="bill in dueBills.slice(0, 3)"
                :key="bill.id"
                class="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/40 px-3 py-2 text-xs transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-inset)]"
              >
                <a
                  :href="`bills.html?bill=${encodeURIComponent(bill.id)}`"
                  class="flex min-w-0 flex-1 items-center justify-between gap-2.5 no-underline"
                >
                  <div class="min-w-0 flex items-center gap-2.5">
                    <div
                      :class="[
                        'tipid-icon-badge h-8 w-8',
                        bill.status === 'Overdue'
                          ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                          : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                      ]"
                      aria-hidden="true"
                    >
                      <component :is="getCategoryIcon(bill.category)" :size="15" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-semibold text-[var(--text-primary)]">{{ bill.title }}</p>
                      <p :class="['font-mono text-[11px]', bill.status === 'Overdue' ? 'text-[var(--expense)] font-semibold' : 'text-[var(--text-muted)]']">
                        {{ bill.status === "Overdue" ? "Overdue" : "Due" }} {{ bill.dueDate }}
                      </p>
                    </div>
                  </div>
                  <span class="shrink-0 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                    ₱{{ formatPeso(bill.amount) }}
                  </span>
                </a>
                <button
                  type="button"
                  :disabled="payingBillId === bill.id"
                  class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--income)] transition-colors hover:border-[var(--income)] hover:bg-[var(--income-soft)]"
                  :aria-label="isTl ? `Markahan na bayad ang ${bill.title}` : `Mark ${bill.title} paid`"
                  :title="isTl ? 'Markahang bayad' : 'Mark paid'"
                  @click="quickMarkBillPaid(bill)"
                >
                  <CheckCircle2 :size="15" aria-hidden="true" />
                </button>
              </li>
            </ul>
            <div v-else class="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] px-3 py-5 text-center">
              <div class="tipid-icon-badge h-9 w-9 bg-[var(--income-soft)] text-[var(--income)]">
                <CheckCircle2 :size="18" aria-hidden="true" />
              </div>
              <p class="text-xs font-medium text-[var(--text-muted)]">
                {{ isTl ? "Walang nakatakdang bayarin." : "No pending bills due." }}
              </p>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3.5 text-xs">
            <span class="inline-flex items-center gap-1.5 text-[var(--text-secondary)]">
              <Users :size="13" class="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              <span>Receivable: <strong class="font-mono text-[var(--income)]">₱{{ formatPeso(utangSummary.owedToMe) }}</strong></span>
            </span>
            <a href="utang.html" class="inline-flex items-center gap-1 font-semibold text-[var(--accent)] no-underline hover:underline">
              <span>Utang</span>
              <ArrowRight :size="12" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <!-- Recent Transactions Feed -->
      <section aria-label="Recent transactions" class="tipid-card p-5">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center gap-2.5">
            <div class="tipid-icon-badge h-8 w-8 bg-[var(--bg-inset)] text-[var(--accent)]">
              <ArrowRightLeft :size="15" aria-hidden="true" />
            </div>
            <div class="flex items-center gap-3">
              <h2 class="text-sm font-bold text-[var(--text-primary)]">{{ t.recentLogsHeading }}</h2>
              <a href="history.html" class="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] no-underline hover:underline">
                <span>{{ t.viewAll }}</span>
                <ArrowRight :size="12" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div class="flex w-full flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
            <div class="relative w-full min-w-[200px] sm:flex-1 lg:w-56 lg:flex-initial">
              <Search :size="14" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden="true" />
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="t.commonSearch"
                class="tipid-input min-h-[44px] w-full py-1.5 pl-9 pr-3 text-base sm:min-h-[38px] sm:text-xs"
              />
            </div>

            <div class="flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1">
              <button
                v-for="tab in [
                  { id: 'all', label: 'All' },
                  { id: 'expense', label: 'Expense' },
                  { id: 'income', label: 'Income' },
                  { id: 'transfer', label: 'Transfer' },
                  { id: 'need', label: 'Need' },
                  { id: 'luho', label: 'Want' }
                ]"
                :key="tab.id"
                type="button"
                :class="[
                  'tipid-compact min-h-[34px] shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors sm:min-h-[30px]',
                  txFilter === tab.id ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                ]"
                @click="txFilter = tab.id as typeof txFilter"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredRecentEntries.length === 0" class="flex flex-col items-center gap-2.5 py-10 text-center">
          <div class="tipid-icon-badge h-11 w-11 bg-[var(--bg-inset)] text-[var(--text-muted)]">
            <ReceiptText :size="20" aria-hidden="true" />
          </div>
          <p class="text-xs font-medium text-[var(--text-muted)]">
            {{ isTl ? "Walang transaksyon na tugma sa filter." : "No transactions match the current filter." }}
          </p>
          <button
            v-if="txFilter === 'all' && !searchQuery.trim()"
            type="button"
            class="tipid-compact inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
            @click="txDefaultType = 'expense'; txModalOpen = true"
          >
            <Plus :size="14" aria-hidden="true" />
            <span>{{ t.addTransaction }}</span>
          </button>
        </div>

        <ul v-else class="mt-4 divide-y divide-[var(--border-subtle)]">
          <li
            v-for="entry in filteredRecentEntries"
            :key="entry.id"
            class="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[var(--bg-inset)]/45"
          >
            <button
              type="button"
              class="tipid-compact flex min-w-0 flex-1 items-center gap-3 text-left"
              @click="inspectedEntry = entry"
            >
              <div
                :class="[
                  'tipid-icon-badge h-10 w-10',
                  entry.type === 'income'
                    ? 'bg-[var(--income-soft)] text-[var(--income)]'
                    : entry.type === 'transfer'
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : ''
                ]"
                :style="entryBadgeStyle(entry)"
                aria-hidden="true"
              >
                <component :is="getCategoryIcon(entry.category, entry.type)" :size="17" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-[var(--text-primary)]">
                    {{ entry.desc }}
                  </p>
                  <span
                    v-if="entry.type === 'expense'"
                    :class="[
                      'hidden shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:inline-block',
                      entry.spendType === 'luho'
                        ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                        : 'bg-[var(--bg-inset)] text-[var(--text-secondary)]'
                    ]"
                  >
                    {{ entry.spendType === "luho" ? "Want" : "Need" }}
                  </span>
                  <span
                    v-else-if="entry.type === 'transfer'"
                    class="hidden shrink-0 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)] sm:inline-block"
                  >
                    Transfer
                  </span>
                </div>
                <p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
                  <span class="font-medium text-[var(--text-secondary)]">{{ entry.category }}</span>
                  <span class="inline-flex items-center gap-1 rounded-md bg-[var(--bg-inset)]/80 px-1.5 py-0.5 font-medium text-[var(--text-secondary)]">
                    <component
                      :is="getWalletKindIcon(resolveWalletVisual(entry.method || 'Cash').kind)"
                      :size="11"
                      class="shrink-0"
                      aria-hidden="true"
                    />
                    <span>{{ resolveWalletVisual(entry.method || "Cash").displayName }}</span>
                    <template v-if="entry.type === 'transfer' && entry.toMethod">
                      <ArrowRightLeft :size="10" class="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
                      <span>{{ resolveWalletVisual(entry.toMethod).displayName }}</span>
                    </template>
                  </span>
                  <span>{{ entryDate(entry)?.toLocaleDateString("en-US", { month: "short", day: "numeric" }) || "" }}</span>
                </p>
              </div>
            </button>

            <div class="flex shrink-0 items-center gap-2">
              <span
                :class="[
                  'tipid-amount font-mono text-sm font-bold',
                  entry.type === 'income' ? 'text-[var(--income)]' : 'text-[var(--text-primary)]'
                ]"
              >
                {{ entry.type === "transfer" ? "" : entry.type === "income" ? "+" : "-" }}₱{{ formatPeso(entry.amount) }}
              </span>
              <button
                type="button"
                class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                :aria-label="`Delete ${entry.desc}`"
                @click="pendingDelete = entry"
              >
                <Trash2 :size="15" aria-hidden="true" />
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <TransactionModal
      v-if="user"
      :open="txModalOpen && !isLocked"
      :uid="user.uid"
      :wallets="wallets"
      :wallet-balances="walletBalances"
      :default-type="txDefaultType"
      @close="txModalOpen = false"
    />

    <BudgetModal
      v-if="user"
      :open="budgetModalOpen"
      :uid="user.uid"
      :current-budget="budget"
      @close="budgetModalOpen = false"
    />

    <WalletModal
      v-if="user"
      :open="walletModalOpen"
      :mode="walletModalMode"
      :edit-method="editWalletMethod"
      :uid="user.uid"
      :entries="entries"
      :base-balances="baseBalances"
      :wallet-balances="walletBalances"
      @close="walletModalOpen = false"
    />

    <TransactionDetailDialog
      :open="Boolean(inspectedEntry)"
      :entry="inspectedEntry"
      @close="inspectedEntry = null"
      @delete="(entry) => { inspectedEntry = null; pendingDelete = entry; }"
    />

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      :title="isTl ? 'Burahin ang Transaksyon?' : 'Delete Transaction?'"
      :message="pendingDelete ? `Remove &quot;${pendingDelete.desc}&quot; (₱${formatPeso(pendingDelete.amount)}) permanently?` : ''"
      :confirm-label="t.commonDelete"
      :cancel-label="t.commonCancel"
      :loading="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDeleteEntry"
    />
  </AppShell>
</template>
