<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from "vue";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  Download,
  Info,
  Plus,
  Scale,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  X
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import BudgetModal from "@/components/BudgetModal.vue";
import CashFlowChart, { type ChartHorizon, type ChartMode } from "@/components/CashFlowChart.vue";
import CategoryDoughnutChart from "@/components/CategoryDoughnutChart.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import TransactionDetailDialog from "@/components/TransactionDetailDialog.vue";
import TransactionModal from "@/components/TransactionModal.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import { getCategoryIcon, getWalletKindIcon } from "@/lib/categoryIcons";
import {
  buildTransactionsCsv,
  entryDate,
  formatPeso,
  fromCentavos,
  getCategoryColor,
  manilaDateKey,
  toCentavos
} from "@/lib/core";
import { deleteEntry } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import type { TransactionEntry } from "@/types/finance";

type AnalyticsTabId = "income" | "outflow" | "budget";
type BudgetHorizon = "thisWeek" | "thisMonth" | "last30Days" | "all";
type SortMode = "amount-desc" | "amount-asc" | "name-asc";

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const { entries, wallets, walletBalances, budget } = useFinanceData(uidRef);
const { t, isTl } = useI18n();

const activeTab = ref<AnalyticsTabId>("income");
const chartHorizon = ref<ChartHorizon>("last6Months");
const budgetHorizon = ref<BudgetHorizon>("thisMonth");
const outflowChartMode = ref<Extract<ChartMode, "expense" | "flow" | "cumulative">>("expense");

const incomeCategoryFilter = ref<string>("all");
const categorySort = ref<SortMode>("amount-desc");
const alertDismissed = ref(false);

const txModalOpen = ref(false);
const budgetModalOpen = ref(false);
const inspectedEntry = ref<TransactionEntry | null>(null);
const pendingDelete = ref<TransactionEntry | null>(null);
const deleting = ref(false);

const tabDefs = computed(() => [
  { id: "income" as const, label: isTl.value ? "Kita" : "Income" },
  { id: "outflow" as const, label: isTl.value ? "Gastos" : "Outflow" },
  { id: "budget" as const, label: isTl.value ? "Badyet" : "Budget" }
]);

function selectTab(id: AnalyticsTabId) {
  if (activeTab.value === id) return;
  activeTab.value = id;
  nextTick(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

onMounted(() => {
  const tabParam = new URLSearchParams(window.location.search).get("tab");
  if (tabParam === "income" || tabParam === "outflow" || tabParam === "budget") {
    selectTab(tabParam);
  }
});

function handleTabKeydown(event: KeyboardEvent, index: number) {
  const list = tabDefs.value;
  let nextIdx = index;
  if (event.key === "ArrowRight") {
    nextIdx = (index + 1) % list.length;
  } else if (event.key === "ArrowLeft") {
    nextIdx = (index - 1 + list.length) % list.length;
  } else if (event.key === "Home") {
    nextIdx = 0;
  } else if (event.key === "End") {
    nextIdx = list.length - 1;
  } else {
    return;
  }
  event.preventDefault();
  const nextTab = list[nextIdx];
  selectTab(nextTab.id);
  const el = document.getElementById(`tab-${nextTab.id}`);
  el?.focus();
}

function horizonStartMs(horizon: ChartHorizon | BudgetHorizon): number | null {
  if (horizon === "all") return null;
  const now = new Date();
  if (horizon === "thisWeek") {
    const day = (now.getDay() + 6) % 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day).getTime();
  }
  if (horizon === "last30Days") {
    return now.getTime() - 30 * 24 * 60 * 60 * 1000;
  }
  if (horizon === "last6Months") {
    return new Date(now.getFullYear(), now.getMonth() - 5, 1).getTime();
  }
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function filterEntriesByHorizon(horizon: ChartHorizon | BudgetHorizon): TransactionEntry[] {
  const startMs = horizonStartMs(horizon);
  if (startMs === null) return entries.value;
  return entries.value.filter((e) => {
    const d = entryDate(e);
    return d ? d.getTime() >= startMs : false;
  });
}

const chartScopedEntries = computed(() => filterEntriesByHorizon(chartHorizon.value));
const budgetScopedEntries = computed(() => filterEntriesByHorizon(budgetHorizon.value));

const incomeMetrics = computed(() => {
  const incomeItems = chartScopedEntries.value.filter((e) => e.type === "income");
  let totalCents = 0;
  const catCounts: Record<string, { label: string; cents: number; count: number }> = {};

  for (const e of incomeItems) {
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    totalCents += cents;
    const cat = e.category || "Other";
    if (!catCounts[cat]) {
      catCounts[cat] = { label: cat, cents: 0, count: 0 };
    }
    catCounts[cat].cents += cents;
    catCounts[cat].count += 1;
  }

  // Month-over-month comparison in Philippine calendar months
  const now = new Date();
  const curMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  let curMonthIncomeCents = 0;
  let prevMonthIncomeCents = 0;
  for (const e of entries.value) {
    if (e.type !== "income") continue;
    const d = entryDate(e);
    if (!d) continue;
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    const ms = d.getTime();
    if (ms >= curMonthStart) curMonthIncomeCents += cents;
    else if (ms >= prevMonthStart) prevMonthIncomeCents += cents;
  }

  const deltaPct =
    prevMonthIncomeCents > 0
      ? Math.round(((curMonthIncomeCents - prevMonthIncomeCents) / prevMonthIncomeCents) * 100)
      : null;

  const filterChips = Object.values(catCounts)
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 3)
    .map((c) => c.label);

  const visibleEntries =
    incomeCategoryFilter.value === "all"
      ? incomeItems
      : incomeItems.filter((e) => (e.category || "Other") === incomeCategoryFilter.value);

  return {
    total: fromCentavos(totalCents),
    count: incomeItems.length,
    deltaPct,
    filterChips,
    visibleEntries
  };
});

const outflowMetrics = computed(() => {
  let expenseCents = 0;
  let needCents = 0;
  let wantCents = 0;
  const walletTotals: Record<string, number> = {};
  const activeDays = new Set<string>();

  for (const e of chartScopedEntries.value) {
    if (e.type === "income") continue;
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    expenseCents += cents;
    if (e.spendType === "luho") wantCents += cents;
    else needCents += cents;

    const w = e.method || "Cash";
    walletTotals[w] = (walletTotals[w] || 0) + cents;

    const d = entryDate(e);
    const dayKey = d ? manilaDateKey(d) : null;
    if (dayKey) activeDays.add(dayKey);
  }

  const dayDivisor = Math.max(activeDays.size, 1);
  const needsPct = expenseCents > 0 ? Math.round((needCents / expenseCents) * 100) : 0;
  const wantsPct = expenseCents > 0 ? 100 - needsPct : 0;

  const walletShares = Object.entries(walletTotals)
    .map(([wallet, cents]) => ({
      wallet,
      visual: resolveWalletVisual(wallet),
      amount: fromCentavos(cents),
      cents,
      pct: expenseCents > 0 ? Math.round((cents / expenseCents) * 100) : 0
    }))
    .sort((a, b) => b.cents - a.cents);

  return {
    total: fromCentavos(expenseCents),
    avgDaily: fromCentavos(Math.round(expenseCents / dayDivisor)),
    activeDaysCount: activeDays.size,
    needs: fromCentavos(needCents),
    wants: fromCentavos(wantCents),
    needsPct,
    wantsPct,
    walletShares
  };
});

const budgetMetrics = computed(() => {
  let spendCents = 0;
  const catMap: Record<string, { label: string; cents: number; count: number }> = {};

  for (const e of budgetScopedEntries.value) {
    if (e.type === "income") continue;
    let cents = 0;
    try {
      cents = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    spendCents += cents;
    const cat = e.category || "Other";
    if (!catMap[cat]) {
      catMap[cat] = { label: cat, cents: 0, count: 0 };
    }
    catMap[cat].cents += cents;
    catMap[cat].count += 1;
  }

  let budgetCents = 0;
  if (budget.value && budget.value > 0) {
    try {
      budgetCents = toCentavos(budget.value, { allowZero: true });
    } catch {
      budgetCents = 0;
    }
  }

  const utilizationPct = budgetCents > 0 ? Math.round((spendCents / budgetCents) * 100) : null;
  const totalSpend = fromCentavos(spendCents);

  const rawItems = Object.values(catMap).map((item) => ({
    label: item.label,
    amount: fromCentavos(item.cents),
    cents: item.cents,
    count: item.count,
    sharePct: spendCents > 0 ? Math.round((item.cents / spendCents) * 100) : 0,
    budgetPct: budgetCents > 0 ? Math.min(100, Math.round((item.cents / budgetCents) * 100)) : 0,
    color: getCategoryColor(item.label)
  }));

  const byAmountDesc = [...rawItems].sort((a, b) => b.cents - a.cents);
  const topCat = byAmountDesc[0] || null;

  const sortedItems = [...rawItems].sort((a, b) => {
    if (categorySort.value === "amount-asc") return a.cents - b.cents;
    if (categorySort.value === "name-asc") return a.label.localeCompare(b.label);
    return b.cents - a.cents;
  });

  const remainingCents = budgetCents > 0 ? budgetCents - spendCents : 0;

  return {
    totalSpend,
    budgetCap: budgetCents > 0 ? fromCentavos(budgetCents) : null,
    utilizationPct,
    remainingAbs: fromCentavos(Math.abs(remainingCents)),
    overBudget: remainingCents < 0,
    topCat,
    items: sortedItems
  };
});

const budgetAlert = computed(() => {
  const b = budgetMetrics.value;
  if (!b.budgetCap) {
    return {
      tone: "info" as const,
      title: isTl.value ? "Walang nakatakdang buwanang badyet." : "Monthly budget cap not set yet.",
      body: isTl.value
        ? "Magtakda ng target cap upang makita ang pacing ng bawat kategorya."
        : "Set a monthly target to monitor category pacing against your spending limit."
    };
  }
  if (b.utilizationPct !== null && b.utilizationPct > 100) {
    return {
      tone: "danger" as const,
      title: isTl.value
        ? `Lumagpas na sa ${b.utilizationPct}% ng buwanang badyet.`
        : `Spending is at ${b.utilizationPct}% of your monthly budget.`,
      body: isTl.value
        ? `Lagpas ng ₱${formatPeso(b.remainingAbs)} sa ₱${formatPeso(b.budgetCap)} cap.`
        : `₱${formatPeso(b.remainingAbs)} over your ₱${formatPeso(b.budgetCap)} target.`
    };
  }
  if (b.topCat && b.utilizationPct !== null && b.utilizationPct >= 75) {
    return {
      tone: "warning" as const,
      title: isTl.value
        ? `${b.topCat.label} ang nangunguna sa ${b.topCat.sharePct}% ng gastos.`
        : `${b.topCat.label} accounts for ${b.topCat.sharePct}% of period spend.`,
      body: isTl.value
        ? `${b.utilizationPct}% na ng buwanang badyet ang nagamit. Bantayan ang natitirang ₱${formatPeso(b.remainingAbs)}.`
        : `${b.utilizationPct}% of budget used — consider trimming discretionary ${b.topCat.label.toLowerCase()} expenses.`
    };
  }
  if (b.topCat) {
    return {
      tone: "ok" as const,
      title: isTl.value
        ? `${b.topCat.label} ang pinakamalaking kategorya (${b.topCat.sharePct}%).`
        : `${b.topCat.label} leads outflow at ${b.topCat.sharePct}% share.`,
      body: isTl.value
        ? `Nasa maayos na antas pa — ₱${formatPeso(b.remainingAbs)} ang natitira sa badyet.`
        : `On pace within your cap — ₱${formatPeso(b.remainingAbs)} remaining for the month.`
    };
  }
  return {
    tone: "info" as const,
    title: isTl.value
      ? `Aktibong badyet: ₱${formatPeso(b.budgetCap)}.`
      : `Monthly budget of ₱${formatPeso(b.budgetCap)} is active.`,
    body: isTl.value
      ? "Magtala ng gastos upang masubaybayan ang porsyento bawat kategorya."
      : "Log expenses in this period to break down category utilization."
  };
});

function cycleCategorySort() {
  if (categorySort.value === "amount-desc") categorySort.value = "amount-asc";
  else if (categorySort.value === "amount-asc") categorySort.value = "name-asc";
  else categorySort.value = "amount-desc";
}

const sortLabel = computed(() => {
  if (categorySort.value === "amount-asc") return isTl.value ? "Pinakamababa" : "Lowest";
  if (categorySort.value === "name-asc") return "A–Z";
  return isTl.value ? "Pinakamataas" : "Highest";
});

function formatShortDate(entry: TransactionEntry): string {
  const d = entryDate(entry);
  if (!d) return "—";
  return d.toLocaleDateString(isTl.value ? "fil-PH" : "en-PH", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function handleExportCsv() {
  if (entries.value.length === 0) {
    pushToast(isTl.value ? "Walang transaksyon na mae-export." : "No transactions available to export.", "info");
    return;
  }
  const csv = buildTransactionsCsv(chartScopedEntries.value.length > 0 ? chartScopedEntries.value : entries.value);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tipid-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pushToast(isTl.value ? "Na-download ang CSV." : "Analytics CSV exported.", "success");
}

function requestDelete(entry: TransactionEntry) {
  pendingDelete.value = entry;
}

async function confirmDelete() {
  if (!user.value?.uid || !pendingDelete.value) return;
  deleting.value = true;
  try {
    await deleteEntry(user.value.uid, pendingDelete.value.id);
    pushToast(isTl.value ? "Nabura ang entry." : "Transaction removed.", "success");
    pendingDelete.value = null;
    inspectedEntry.value = null;
  } catch {
    pushToast(isTl.value ? "Hindi mabura ang entry." : "Failed to remove entry.", "error");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <AppShell active-tab="analytics" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-5">
      <!-- Clean Header (Matches Reference Header + Quick Export & Entry Actions) -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.analyticsTitle }}
          </h1>
          <p class="mt-0.5 hidden text-xs text-[var(--text-secondary)] sm:block">
            {{ t.analyticsSubtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="tipid-card-interactive inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)] sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3.5"
            :aria-label="isTl ? 'I-export bilang CSV' : 'Export CSV'"
            :title="isTl ? 'I-export bilang CSV' : 'Export CSV'"
            @click="handleExportCsv"
          >
            <Download :size="16" aria-hidden="true" />
            <span class="hidden text-xs font-semibold sm:inline">CSV</span>
          </button>

          <button
            type="button"
            class="tipid-cta inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="txModalOpen = true"
          >
            <Plus :size="15" aria-hidden="true" />
            <span class="hidden min-[400px]:inline">{{ t.addTransaction }}</span>
            <span class="min-[400px]:hidden">{{ isTl ? "Tala" : "Add" }}</span>
          </button>
        </div>
      </header>

      <!-- Accessible 3-Mode Tab Bar (Income | Outflow | Budget) -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          :aria-label="isTl ? 'Mga pananaw ng analytics' : 'Analytics views'"
          class="tipid-tablist w-full sm:max-w-md"
        >
          <button
            v-for="(tab, idx) in tabDefs"
            :id="`tab-${tab.id}`"
            :key="tab.id"
            type="button"
            role="tab"
            class="tipid-tab"
            :aria-selected="activeTab === tab.id"
            :tabindex="activeTab === tab.id ? 0 : -1"
            @click="selectTab(tab.id)"
            @keydown="handleTabKeydown($event, idx)"
          >
            {{ tab.label }}
          </button>
        </div>

        <button
          v-if="activeTab === 'budget'"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
          @click="budgetModalOpen = true"
        >
          <SlidersHorizontal :size="14" aria-hidden="true" />
          <span>{{ isTl ? "Ayusin ang Badyet" : "Edit Monthly Cap" }}</span>
        </button>
      </div>

      <div class="grid grid-cols-1">
        <!-- PANEL 1: INCOME -->
        <section
          id="panel-income"
          role="tabpanel"
          aria-labelledby="tab-income"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'income' ? 0 : undefined"
          :hidden="activeTab !== 'income' ? 'until-found' : undefined"
          @beforematch="selectTab('income')"
        >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <!-- Left / Top: Highlighted Inflow Analytics Card -->
          <div class="tipid-card p-5 lg:col-span-7">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>{{ isTl ? "Pagsusuri ng Kita" : "Income Analytics" }}</span>
                  <Info
                    :size="13"
                    class="text-[var(--text-muted)]"
                    :title="isTl ? 'Naka-highlight ang buwang may pinakamataas na kita' : 'Peak earning period is highlighted in emerald'"
                    aria-hidden="true"
                  />
                </p>
                <div class="mt-1 flex flex-wrap items-baseline gap-2.5">
                  <span class="tipid-amount font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    ₱{{ formatPeso(incomeMetrics.total) }}
                  </span>
                  <span
                    v-if="incomeMetrics.deltaPct !== null"
                    :class="[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                      incomeMetrics.deltaPct >= 0
                        ? 'bg-[var(--income-soft)] text-[var(--income)]'
                        : 'bg-[var(--expense-soft)] text-[var(--expense)]'
                    ]"
                  >
                    <TrendingUp v-if="incomeMetrics.deltaPct >= 0" :size="12" aria-hidden="true" />
                    <TrendingDown v-else :size="12" aria-hidden="true" />
                    <span>{{ incomeMetrics.deltaPct >= 0 ? "+" : "" }}{{ incomeMetrics.deltaPct }}%</span>
                  </span>
                </div>
              </div>

              <select
                v-model="chartHorizon"
                :aria-label="isTl ? 'Saklaw ng kita' : 'Income chart period'"
                class="shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              >
                <option value="last6Months">{{ isTl ? "Buwanan (6m)" : "Monthly" }}</option>
                <option value="thisMonth">{{ t.thisMonth }}</option>
                <option value="thisWeek">{{ t.thisWeek }}</option>
                <option value="last30Days">{{ t.last30Days }}</option>
                <option value="all">{{ isTl ? "Buong Taon" : "Year (12m)" }}</option>
              </select>
            </div>

            <div class="mt-4">
              <CashFlowChart :entries="entries" :horizon="chartHorizon" mode="income" hide-summary-boxes />
            </div>
          </div>

          <!-- Right / Bottom: Filterable Inflow History Card -->
          <div class="tipid-card flex flex-col p-5 lg:col-span-5">
            <div class="border-b border-[var(--border-subtle)]">
              <div class="flex items-center gap-4 overflow-x-auto pb-0.5 text-xs font-semibold">
                <button
                  type="button"
                  :class="[
                    'whitespace-nowrap border-b-2 pb-2.5 transition-colors',
                    incomeCategoryFilter === 'all'
                      ? 'border-[var(--accent)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  ]"
                  @click="incomeCategoryFilter = 'all'"
                >
                  {{ isTl ? "Lahat" : "All" }}
                </button>
                <button
                  v-for="cat in incomeMetrics.filterChips"
                  :key="cat"
                  type="button"
                  :class="[
                    'whitespace-nowrap border-b-2 pb-2.5 transition-colors',
                    incomeCategoryFilter === cat
                      ? 'border-[var(--accent)] text-[var(--text-primary)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  ]"
                  @click="incomeCategoryFilter = cat"
                >
                  {{ cat }}
                </button>
              </div>
            </div>

            <div
              v-if="incomeMetrics.visibleEntries.length === 0"
              class="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center"
            >
              <div class="tipid-icon-badge h-11 w-11 rounded-2xl bg-[var(--bg-inset)] text-[var(--text-muted)]">
                <TrendingUp :size="20" aria-hidden="true" />
              </div>
              <p class="text-sm font-semibold text-[var(--text-primary)]">
                {{ isTl ? "Walang nakatalang kita" : "No inflows recorded yet" }}
              </p>
              <p class="max-w-xs text-xs text-[var(--text-muted)]">
                {{ isTl ? "Magdagdag ng suweldo, allowance, o kita upang makita ang monthly inflow bars." : "Log salary, allowance, or side income to chart your earning momentum." }}
              </p>
              <button
                type="button"
                class="tipid-compact mt-1 rounded-xl bg-[var(--accent-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                @click="txModalOpen = true"
              >
                + {{ isTl ? "Magdagdag ng Kita" : "Add Income" }}
              </button>
            </div>

            <ul v-else class="mt-3 divide-y divide-[var(--border-subtle)]">
              <li v-for="item in incomeMetrics.visibleEntries.slice(0, 12)" :key="item.id">
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-3 rounded-xl px-1.5 py-3 text-left transition-colors hover:bg-[var(--bg-inset)]/55"
                  @click="inspectedEntry = item"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <span
                      class="tipid-icon-badge h-10 w-10 shrink-0 rounded-full bg-[var(--income-soft)] text-[var(--income)]"
                      aria-hidden="true"
                    >
                      <component :is="getCategoryIcon(item.category || 'Other', 'income')" :size="17" />
                    </span>
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-[var(--text-primary)]">
                        {{ item.desc || item.category || "Income" }}
                      </p>
                      <p class="truncate text-xs text-[var(--text-muted)]">
                        {{ formatShortDate(item) }} · {{ resolveWalletVisual(item.method || "Cash").displayName }}
                      </p>
                    </div>
                  </div>
                  <div class="shrink-0 text-right">
                    <p class="tipid-amount font-mono text-sm font-bold text-[var(--income)]">
                      +₱{{ formatPeso(item.amount) }}
                    </p>
                    <p class="text-[11px] font-medium text-[var(--text-muted)]">
                      {{ item.category || "Other" }}
                    </p>
                  </div>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>

        <!-- PANEL 2: OUTFLOW -->
        <section
          id="panel-outflow"
          role="tabpanel"
          aria-labelledby="tab-outflow"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'outflow' ? 0 : undefined"
          :hidden="activeTab !== 'outflow' ? 'until-found' : undefined"
          @beforematch="selectTab('outflow')"
        >
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <!-- Outflow Chart Card -->
          <div class="tipid-card p-5 lg:col-span-7">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                  <span>{{ isTl ? "Pagsusuri ng Gastos" : "Outflow Analytics" }}</span>
                  <Info
                    :size="13"
                    class="text-[var(--text-muted)]"
                    :title="isTl ? 'Naka-highlight ang panahong may pinakamataas na gastos' : 'Highest spending period is highlighted'"
                    aria-hidden="true"
                  />
                </p>
                <div class="mt-1 flex flex-wrap items-baseline gap-2.5">
                  <span class="tipid-amount font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                    ₱{{ formatPeso(outflowMetrics.total) }}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-full bg-[var(--expense-soft)] px-2.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--expense)]">
                    {{ isTl ? "Karaniwan" : "Daily avg" }} ₱{{ formatPeso(outflowMetrics.avgDaily) }}
                  </span>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  :aria-label="isTl ? 'Uri ng tsart' : 'Outflow chart style'"
                  class="inline-flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-0.5 text-[11px]"
                >
                  <button
                    v-for="m in [
                      { id: 'expense', label: isTl ? 'Gastos' : 'Bars' },
                      { id: 'flow', label: isTl ? 'Pasok/Labas' : 'In vs Out' },
                      { id: 'cumulative', label: isTl ? 'Kabuuan' : 'Trend' }
                    ]"
                    :key="m.id"
                    type="button"
                    :class="[
                      'rounded-lg px-2.5 py-1 font-semibold transition-colors',
                      outflowChartMode === m.id
                        ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    ]"
                    @click="outflowChartMode = m.id as typeof outflowChartMode"
                  >
                    {{ m.label }}
                  </button>
                </div>

                <select
                  v-model="chartHorizon"
                  :aria-label="isTl ? 'Saklaw ng gastos' : 'Outflow chart period'"
                  class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="last6Months">{{ isTl ? "Buwanan (6m)" : "Monthly" }}</option>
                  <option value="thisMonth">{{ t.thisMonth }}</option>
                  <option value="thisWeek">{{ t.thisWeek }}</option>
                  <option value="last30Days">{{ t.last30Days }}</option>
                  <option value="all">{{ isTl ? "Buong Taon" : "Year (12m)" }}</option>
                </select>
              </div>
            </div>

            <div class="mt-4">
              <CashFlowChart :entries="entries" :horizon="chartHorizon" :mode="outflowChartMode" hide-summary-boxes />
            </div>
          </div>

          <!-- Right Column: Needs vs Wants + Spend by Account -->
          <div class="space-y-4 lg:col-span-5">
            <div class="tipid-card p-5">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5">
                  <div class="tipid-icon-badge h-8 w-8 bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Scale :size="15" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 class="text-sm font-bold text-[var(--text-primary)]">Needs vs Wants</h2>
                    <p class="text-[11px] text-[var(--text-muted)]">50/30/20 allocation</p>
                  </div>
                </div>
                <span
                  v-if="outflowMetrics.total > 0"
                  :class="[
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                    outflowMetrics.wantsPct <= 35 ? 'bg-[var(--income-soft)] text-[var(--income)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'
                  ]"
                >
                  <CheckCircle2 v-if="outflowMetrics.wantsPct <= 35" :size="12" aria-hidden="true" />
                  <TrendingUp v-else :size="12" aria-hidden="true" />
                  <span>{{ outflowMetrics.wantsPct <= 35 ? (isTl ? "Balanse" : "Disciplined") : (isTl ? "Mataas ang Luho" : "Want-heavy") }}</span>
                </span>
              </div>

              <div class="mt-4 space-y-3.5">
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="inline-flex items-center gap-1.5 font-semibold text-[var(--income)]">
                      <ShieldCheck :size="13" aria-hidden="true" />
                      <span>{{ isTl ? "Kailangan (Needs)" : "Essentials (Needs)" }}</span>
                    </span>
                    <span class="font-mono font-bold text-[var(--text-primary)] tabular-nums">
                      ₱{{ formatPeso(outflowMetrics.needs) }} ({{ outflowMetrics.needsPct }}%)
                    </span>
                  </div>
                  <progress
                    class="tipid-progress h-2 w-full"
                    :value="outflowMetrics.needsPct"
                    max="100"
                    style="--progress-bar-fill: var(--income)"
                    :aria-label="`Essentials spend share: ${outflowMetrics.needsPct}%`"
                  />
                </div>

                <div class="space-y-1.5">
                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="inline-flex items-center gap-1.5 font-semibold text-[var(--expense)]">
                      <ShoppingBag :size="13" aria-hidden="true" />
                      <span>{{ isTl ? "Luho (Wants)" : "Discretionary (Wants)" }}</span>
                    </span>
                    <span class="font-mono font-bold text-[var(--text-primary)] tabular-nums">
                      ₱{{ formatPeso(outflowMetrics.wants) }} ({{ outflowMetrics.wantsPct }}%)
                    </span>
                  </div>
                  <progress
                    class="tipid-progress h-2 w-full"
                    :value="outflowMetrics.wantsPct"
                    max="100"
                    style="--progress-bar-fill: var(--expense)"
                    :aria-label="`Discretionary spend share: ${outflowMetrics.wantsPct}%`"
                  />
                </div>
              </div>
            </div>

            <div class="tipid-card p-5">
              <div class="mb-3.5 flex items-center gap-2.5">
                <div class="tipid-icon-badge h-8 w-8 bg-[var(--bg-inset)] text-[var(--accent)]">
                  <Wallet :size="15" aria-hidden="true" />
                </div>
                <div>
                  <h2 class="text-sm font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Gastos Bawat Wallet" : "Spend by Account" }}
                  </h2>
                  <p class="text-[11px] text-[var(--text-muted)]">
                    {{ isTl ? "Distribusyon ng nagastos" : "Outflow share per wallet" }}
                  </p>
                </div>
              </div>

              <div v-if="outflowMetrics.walletShares.length === 0" class="rounded-xl border border-dashed border-[var(--border-subtle)] py-6 text-center text-xs text-[var(--text-muted)]">
                {{ isTl ? "Walang gastos sa napiling saklaw." : "No account spending recorded in this range." }}
              </div>

              <ul v-else class="space-y-3">
                <li v-for="w in outflowMetrics.walletShares" :key="w.wallet">
                  <a
                    :href="`history.html?wallet=${encodeURIComponent(w.wallet)}`"
                    class="block space-y-1.5 rounded-lg p-1 text-xs no-underline transition-colors hover:bg-[var(--bg-inset)]/55"
                  >
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex min-w-0 items-center gap-2">
                        <span
                          class="tipid-icon-badge h-7 w-7 rounded-lg text-white"
                          :style="{ backgroundColor: w.visual.surfaceEnd }"
                          aria-hidden="true"
                        >
                          <component :is="getWalletKindIcon(w.visual.kind)" :size="13" />
                        </span>
                        <span class="truncate font-semibold text-[var(--text-primary)]">{{ w.visual.displayName }}</span>
                      </div>
                      <span class="shrink-0 font-mono font-bold text-[var(--text-primary)] tabular-nums">
                        ₱{{ formatPeso(w.amount) }} ({{ w.pct }}%)
                      </span>
                    </div>
                    <progress
                      class="tipid-progress h-1.5 w-full"
                      :value="w.pct"
                      max="100"
                      :style="{ '--progress-bar-fill': w.visual.surfaceEnd }"
                      :aria-label="`${w.visual.displayName} spend share: ${w.pct}%`"
                    />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

        <!-- PANEL 3: BUDGET -->
        <section
          id="panel-budget"
          role="tabpanel"
          aria-labelledby="tab-budget"
          class="col-start-1 row-start-1"
          :tabindex="activeTab === 'budget' ? 0 : undefined"
          :hidden="activeTab !== 'budget' ? 'until-found' : undefined"
          @beforematch="selectTab('budget')"
        >
        <div class="space-y-4">
          <!-- Dismissible Budget Insight Banner (Tipid palette matching reference banner positioning) -->
          <div
            v-if="!alertDismissed"
            role="status"
            :class="[
              'flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-xs',
              budgetAlert.tone === 'danger'
                ? 'border-[var(--expense)]/30 bg-[var(--expense-soft)] text-[var(--text-primary)]'
                : budgetAlert.tone === 'warning'
                  ? 'border-[var(--warning)]/30 bg-[var(--warning-soft)] text-[var(--text-primary)]'
                  : 'border-[var(--accent)]/25 bg-[var(--accent-soft)] text-[var(--text-primary)]'
            ]"
          >
            <div class="flex items-start gap-2.5">
              <span
                :class="[
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  budgetAlert.tone === 'danger'
                    ? 'bg-[var(--expense)] text-white'
                    : budgetAlert.tone === 'warning'
                      ? 'bg-[var(--warning)] text-white'
                      : 'bg-[var(--accent)] text-white'
                ]"
                aria-hidden="true"
              >
                <AlertTriangle v-if="budgetAlert.tone === 'danger' || budgetAlert.tone === 'warning'" :size="13" />
                <Sparkles v-else :size="13" />
              </span>
              <div>
                <p class="font-bold">{{ budgetAlert.title }}</p>
                <p class="mt-0.5 text-[var(--text-secondary)]">{{ budgetAlert.body }}</p>
              </div>
            </div>

            <button
              type="button"
              class="shrink-0 rounded-lg p-1 text-[var(--text-muted)] transition-colors hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
              :aria-label="isTl ? 'Isara ang abiso' : 'Dismiss insight banner'"
              @click="alertDismissed = true"
            >
              <X :size="15" aria-hidden="true" />
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <!-- Centered Ring Chart & Legend Card (Left on Desktop, Top on Mobile) -->
            <div class="tipid-card p-5 lg:col-span-5">
              <div class="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 class="text-sm font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Paggamit ng Badyet" : "Spending vs Budget" }}
                  </h2>
                  <p class="text-[11px] text-[var(--text-muted)]">
                    {{ isTl ? "Bahagi ng bawat kategorya" : "Category share of period spending" }}
                  </p>
                </div>

                <select
                  v-model="budgetHorizon"
                  :aria-label="isTl ? 'Saklaw ng badyet' : 'Budget spending period'"
                  class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="thisMonth">{{ t.thisMonth }}</option>
                  <option value="thisWeek">{{ t.thisWeek }}</option>
                  <option value="last30Days">{{ t.last30Days }}</option>
                  <option value="all">{{ t.allTime }}</option>
                </select>
              </div>

              <CategoryDoughnutChart
                :entries="budgetScopedEntries"
                :budget-cap="budgetHorizon === 'thisMonth' ? budgetMetrics.budgetCap : null"
                :budget-pct="budgetHorizon === 'thisMonth' ? budgetMetrics.utilizationPct : null"
                variant="ring-legend"
                @add-expense="txModalOpen = true"
              />
            </div>

            <!-- Sortable Budget / Category Items Card (Right on Desktop, Below on Mobile) -->
            <div class="tipid-card p-5 lg:col-span-7">
              <div class="mb-4 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <BarChart3 :size="16" class="text-[var(--accent)]" aria-hidden="true" />
                  <h2 class="text-sm font-bold text-[var(--text-primary)]">
                    {{ isTl ? "Mga Kategorya ng Gastos" : "Budget Items" }}
                  </h2>
                  <span class="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                    {{ budgetMetrics.items.length }}
                  </span>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
                  @click="cycleCategorySort"
                >
                  <ArrowUpDown :size="13" aria-hidden="true" />
                  <span>{{ sortLabel }}</span>
                </button>
              </div>

              <div
                v-if="budgetMetrics.items.length === 0"
                class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] py-10 text-center"
              >
                <p class="text-sm font-semibold text-[var(--text-primary)]">
                  {{ isTl ? "Walang nakalistang kategorya" : "No category spending yet" }}
                </p>
                <p class="max-w-xs text-xs text-[var(--text-muted)]">
                  {{ isTl ? "Magtala ng gastos upang lumabas ang bawat kategorya rito." : "Log expenses in this period to sort and inspect category progress." }}
                </p>
              </div>

              <ul v-else class="space-y-3">
                <li
                  v-for="item in budgetMetrics.items"
                  :key="item.label"
                  class="tipid-inset space-y-2.5 p-3.5"
                >
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex min-w-0 items-center gap-2.5">
                      <span
                        class="tipid-icon-badge h-8 w-8 shrink-0 rounded-lg"
                        :style="{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`, color: item.color }"
                        aria-hidden="true"
                      >
                        <component :is="getCategoryIcon(item.label, 'expense')" :size="15" />
                      </span>
                      <div class="min-w-0">
                        <p class="truncate text-sm font-semibold text-[var(--text-primary)]">{{ item.label }}</p>
                        <p class="text-[11px] text-[var(--text-muted)]">
                          {{ item.count }} {{ item.count === 1 ? (isTl ? "tala" : "entry") : (isTl ? "tala" : "entries") }}
                        </p>
                      </div>
                    </div>
                    <span
                      class="rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold"
                      :style="{ backgroundColor: `color-mix(in srgb, ${item.color} 14%, transparent)`, color: item.color }"
                    >
                      {{ item.sharePct }}%
                    </span>
                  </div>

                  <progress
                    class="tipid-progress h-2 w-full"
                    :value="budgetHorizon === 'thisMonth' && budgetMetrics.budgetCap ? item.budgetPct : item.sharePct"
                    max="100"
                    :style="{ '--progress-bar-fill': item.color }"
                    :aria-label="`${item.label}: ₱${formatPeso(item.amount)}`"
                  />

                  <div class="flex items-center justify-between gap-2 text-xs">
                    <span class="tipid-amount font-mono font-bold text-[var(--text-primary)]">
                      ₱{{ formatPeso(item.amount) }}<span
                        v-if="budgetHorizon === 'thisMonth' && budgetMetrics.budgetCap"
                        class="font-normal text-[var(--text-muted)]"
                      > / ₱{{ formatPeso(budgetMetrics.budgetCap) }}</span>
                    </span>
                    <span class="font-mono text-[11px] font-semibold text-[var(--accent)]">
                      <template v-if="budgetHorizon === 'thisMonth' && budgetMetrics.budgetCap">
                        {{ item.budgetPct }}% {{ isTl ? "ng cap" : "of cap" }}
                      </template>
                      <template v-else>
                        {{ item.sharePct }}% {{ isTl ? "ng gastos" : "of spend" }}
                      </template>
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        </section>
      </div>
    </div>

    <TransactionModal
      v-if="user"
      :open="txModalOpen"
      :uid="user.uid"
      :wallets="wallets"
      :wallet-balances="walletBalances"
      @close="txModalOpen = false"
    />

    <BudgetModal
      v-if="user"
      :open="budgetModalOpen"
      :uid="user.uid"
      :current-budget="budget"
      @close="budgetModalOpen = false"
    />

    <TransactionDetailDialog
      :open="Boolean(inspectedEntry)"
      :entry="inspectedEntry"
      @close="inspectedEntry = null"
      @delete="requestDelete"
    />

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      :title="isTl ? 'Burahin ang Transaksyon?' : 'Remove Transaction?'"
      :message="isTl ? 'Ibabalik ng pagbura ang balanse ng wallet.' : 'Deleting this entry recalculates wallet balances.'"
      :confirm-label="isTl ? 'Burahin' : 'Remove'"
      destructive
      :loading="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </AppShell>
</template>
