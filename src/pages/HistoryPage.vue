<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Download,
  Printer,
  Plus,
  Search as SearchIcon,
  SearchX,
  Trash2,
  Scale,
  ReceiptText,
  RotateCcw,
  Calendar,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  X
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import TransactionModal from "@/components/TransactionModal.vue";
import TransactionDetailDialog from "@/components/TransactionDetailDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";
import {
  buildTransactionsCsv,
  CATEGORIES,
  entryDate,
  formatPeso,
  fromCentavos,
  getCategoryColor,
  manilaDateKey,
  toCentavos
} from "@/lib/core";
import { deleteEntry } from "@/lib/data";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getCategoryIcon, getWalletKindIcon } from "@/lib/categoryIcons";
import type { TimestampLike, TransactionEntry } from "@/types/finance";

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const { entries, wallets, walletBalances } = useFinanceData(uidRef);
const { t, isTl } = useI18n();

const searchQuery = ref("");
const showSearch = ref(false);
const showFilters = ref(false);
const typeFilter = ref<"all" | "income" | "expense">("all");
const categoryFilter = ref("all");
const walletFilter = ref("all");
const monthFilter = ref("all");

const txModalOpen = ref(false);
const inspectedEntry = ref<TransactionEntry | null>(null);
const pendingDelete = ref<TransactionEntry | null>(null);
const deleting = ref(false);

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get("type");
  const catParam = params.get("category");
  const walletParam = params.get("wallet");
  const monthParam = params.get("month");
  const qParam = params.get("q");

  if (typeParam === "income" || typeParam === "expense") {
    typeFilter.value = typeParam;
  }
  if (catParam) {
    categoryFilter.value = catParam;
    showFilters.value = true;
  }
  if (walletParam) {
    walletFilter.value = walletParam;
    showFilters.value = true;
  }
  if (monthParam) {
    monthFilter.value = monthParam;
    showFilters.value = true;
  }
  if (qParam) {
    searchQuery.value = qParam;
    showSearch.value = true;
  }
});

const advancedFilterCount = computed(() => {
  let c = 0;
  if (categoryFilter.value !== "all") c += 1;
  if (walletFilter.value !== "all") c += 1;
  if (monthFilter.value !== "all") c += 1;
  return c;
});

const hasActiveFilters = computed(
  () =>
    searchQuery.value.trim() !== "" ||
    typeFilter.value !== "all" ||
    advancedFilterCount.value > 0
);

function resetFilters() {
  searchQuery.value = "";
  typeFilter.value = "all";
  categoryFilter.value = "all";
  walletFilter.value = "all";
  monthFilter.value = "all";
}

function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    searchQuery.value = "";
  }
}

function formatMonthLabel(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(isTl.value ? "fil-PH" : "en-US", {
    month: "long",
    year: "numeric"
  });
}

function resolveExactTimestamp(entry: TransactionEntry): Date | null {
  const raw = entry.createdAt ?? entry.timestamp;
  if (raw) {
    if (typeof raw === "object") {
      if ("toDate" in raw && typeof (raw as TimestampLike).toDate === "function") {
        return (raw as TimestampLike).toDate!();
      }
      if ("toMillis" in raw && typeof (raw as TimestampLike).toMillis === "function") {
        return new Date((raw as TimestampLike).toMillis!());
      }
      if (raw instanceof Date) return raw;
    }
    if (typeof raw === "string" || typeof raw === "number") {
      const parsed = new Date(raw);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  return null;
}

function entryTimeLabel(entry: TransactionEntry): string {
  const exact = resolveExactTimestamp(entry);
  if (exact) {
    return exact.toLocaleTimeString("en-US", {
      timeZone: "Asia/Manila",
      hour: "numeric",
      minute: "2-digit"
    });
  }
  const d = entryDate(entry);
  return d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
}

const availableMonths = computed(() => {
  const keys = new Set<string>();
  for (const e of entries.value) {
    const d = entryDate(e);
    if (!d) continue;
    const key = manilaDateKey(d)?.slice(0, 7);
    if (key) keys.add(key);
  }
  return Array.from(keys).sort().reverse();
});

const filteredEntries = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const targetWalletId =
    walletFilter.value === "all" ? null : resolveWalletVisual(walletFilter.value).id.toLowerCase();

  return entries.value.filter((e) => {
    if (typeFilter.value !== "all" && e.type !== typeFilter.value) return false;
    if (categoryFilter.value !== "all" && e.category !== categoryFilter.value) return false;
    if (targetWalletId) {
      const entryWalletId = resolveWalletVisual(e.method || "Cash").id.toLowerCase();
      if (entryWalletId !== targetWalletId && (e.method || "Cash") !== walletFilter.value) return false;
    }
    if (monthFilter.value !== "all") {
      const d = entryDate(e);
      const key = d ? manilaDateKey(d)?.slice(0, 7) : "";
      if (key !== monthFilter.value) return false;
    }
    if (q) {
      const displayWallet = resolveWalletVisual(e.method || "Cash").displayName;
      const hay = `${e.desc} ${e.category} ${e.method} ${displayWallet} ${e.note || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
});

const summary = computed(() => {
  let inflowCents = 0;
  let outflowCents = 0;
  for (const e of filteredEntries.value) {
    let amt = 0;
    try {
      amt = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    if (e.type === "income") inflowCents += amt;
    else outflowCents += amt;
  }

  return {
    inflow: fromCentavos(inflowCents),
    outflow: fromCentavos(outflowCents),
    net: fromCentavos(inflowCents - outflowCents),
    count: filteredEntries.value.length
  };
});

const groupedByDate = computed(() => {
  const todayKey = manilaDateKey(new Date()) || "";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = manilaDateKey(yesterday) || "";

  const groups: Record<string, { label: string; items: TransactionEntry[]; net: number }> = {};

  for (const e of filteredEntries.value) {
    const d = entryDate(e);
    const dateKey = (d && manilaDateKey(d)) || "unscheduled";
    if (!groups[dateKey]) {
      let label = dateKey;
      if (dateKey === todayKey) label = isTl.value ? "Ngayon" : "Today";
      else if (dateKey === yesterdayKey) label = isTl.value ? "Kahapon" : "Yesterday";
      else if (d) {
        label = d.toLocaleDateString(isTl.value ? "fil-PH" : "en-PH", {
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
      groups[dateKey] = { label, items: [], net: 0 };
    }
    groups[dateKey].items.push(e);
    const signed = e.type === "income" ? e.amount : -e.amount;
    groups[dateKey].net = fromCentavos(
      toCentavos(groups[dateKey].net, { allowZero: true, allowNegative: true }) +
        toCentavos(signed, { allowZero: true, allowNegative: true })
    );
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, group]) => ({ key, ...group }));
});

function entryBadgeStyle(entry: TransactionEntry): Record<string, string> | undefined {
  if (entry.type === "income") return undefined;
  const color = getCategoryColor(entry.category);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
    color
  };
}

function handleExportCsv() {
  if (filteredEntries.value.length === 0) {
    pushToast(isTl.value ? "Walang entry na mae-export." : "No transactions to export.", "info");
    return;
  }
  const csv = buildTransactionsCsv(filteredEntries.value);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tipid-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pushToast(isTl.value ? "Na-download ang CSV." : "CSV statement downloaded.", "success");
}

function handlePrint() {
  window.print();
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
  <AppShell active-tab="history" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-5">
      <!-- Clean Header (Matches Reference + Statement Actions) -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.historyTitle }}
          </h1>
          <p class="mt-0.5 hidden text-xs text-[var(--text-secondary)] sm:block">
            {{ t.historySubtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-1.5 sm:gap-2 print:hidden">
          <button
            type="button"
            class="tipid-compact tipid-compact-touch inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
            :aria-expanded="showSearch"
            aria-controls="history-search-panel"
            aria-label="Toggle search"
            @click="toggleSearch"
          >
            <X v-if="showSearch" :size="16" aria-hidden="true" />
            <SearchIcon v-else :size="16" aria-hidden="true" />
          </button>

          <button
            type="button"
            class="tipid-compact inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)] sm:px-3"
            :aria-label="t.exportCsv"
            :title="t.exportCsv"
            @click="handleExportCsv"
          >
            <Download :size="14" aria-hidden="true" />
            <span class="hidden md:inline">{{ t.exportCsv }}</span>
          </button>

          <button
            type="button"
            class="tipid-compact inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 text-xs font-semibold text-[var(--text-primary)] shadow-xs transition-colors hover:bg-[var(--bg-inset)] sm:px-3"
            :aria-label="t.printStatement"
            :title="t.printStatement"
            @click="handlePrint"
          >
            <Printer :size="14" aria-hidden="true" />
            <span class="hidden md:inline">{{ t.printStatement }}</span>
          </button>

          <button
            type="button"
            class="tipid-cta inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] sm:px-4"
            @click="txModalOpen = true"
          >
            <Plus :size="15" aria-hidden="true" />
            <span class="hidden sm:inline">{{ t.addTransaction }}</span>
            <span class="sm:hidden">{{ isTl ? "Magtala" : "Add" }}</span>
          </button>
        </div>
      </header>

      <!-- Compact Joined Summary Strip (Keeps transactions visible above the fold on mobile!) -->
      <section aria-label="Ledger summary" class="grid grid-cols-1 gap-2.5 md:grid-cols-12">
        <div class="tipid-card-emerald flex items-center justify-between gap-3 px-4 py-3 md:col-span-5 sm:px-5">
          <div class="min-w-0">
            <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/75">
              <Scale :size="12" aria-hidden="true" />
              <span>{{ isTl ? "Net Balance" : "Net Difference" }}</span>
            </span>
            <p class="tipid-amount font-mono text-xl font-bold tracking-tight text-white sm:text-2xl">
              {{ summary.net >= 0 ? "+" : "-" }}₱{{ formatPeso(Math.abs(summary.net)) }}
            </p>
          </div>
          <span class="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/14 px-2.5 py-1 font-mono text-[11px] font-semibold text-white">
            {{ summary.count }} {{ summary.count === 1 ? (isTl ? "tala" : "entry") : (isTl ? "tala" : "entries") }}
          </span>
        </div>

        <div class="tipid-card grid grid-cols-2 divide-x divide-[var(--border-subtle)] md:col-span-7">
          <div class="flex items-center gap-2.5 px-3.5 py-3 sm:px-5">
            <div class="tipid-icon-badge h-8 w-8 bg-[var(--income-soft)] text-[var(--income)]">
              <ArrowUp :size="15" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <span class="block text-[11px] font-semibold text-[var(--text-muted)]">
                {{ isTl ? "Kita" : "Income" }}
              </span>
              <p class="tipid-amount truncate font-mono text-sm font-bold text-[var(--income)] sm:text-base">
                +₱{{ formatPeso(summary.inflow) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2.5 px-3.5 py-3 sm:px-5">
            <div class="tipid-icon-badge h-8 w-8 bg-[var(--expense-soft)] text-[var(--expense)]">
              <ArrowDown :size="15" aria-hidden="true" />
            </div>
            <div class="min-w-0">
              <span class="block text-[11px] font-semibold text-[var(--text-muted)]">
                {{ isTl ? "Gastos" : "Expenses" }}
              </span>
              <p class="tipid-amount truncate font-mono text-sm font-bold text-[var(--expense)] sm:text-base">
                -₱{{ formatPeso(summary.outflow) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Collapsible Search Bar -->
      <div
        v-if="showSearch || searchQuery.trim() !== ''"
        id="history-search-panel"
        role="search"
        aria-label="Search ledger"
        class="tipid-auth-disclosure relative print:hidden"
      >
        <SearchIcon
          :size="15"
          class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          aria-hidden="true"
        />
        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search transactions"
          autofocus
          :placeholder="isTl ? 'Maghanap ng detalye, kategorya, tala, o account...' : 'Search description, category, notes, or account...'"
          class="tipid-input min-h-[42px] py-2 pl-10 text-xs sm:text-sm"
        />
      </div>

      <!-- Pill Row ([All] [Income] [Expense] + Filter Sliders Toggle matching Reference!) -->
      <div class="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <div role="group" aria-label="Filter by transaction type" class="flex flex-wrap items-center gap-2">
          <button
            v-for="tab in [
              { id: 'all', label: t.commonAll },
              { id: 'income', label: isTl ? 'Kita' : 'Income' },
              { id: 'expense', label: isTl ? 'Gastos' : 'Expense' }
            ]"
            :key="tab.id"
            type="button"
            :aria-pressed="typeFilter === tab.id"
            :class="[
              'tipid-compact min-h-[36px] rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
              typeFilter === tab.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
            ]"
            @click="typeFilter = tab.id as typeof typeFilter"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="tipid-compact inline-flex min-h-[36px] items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-inset)]"
            @click="resetFilters"
          >
            <RotateCcw :size="12" aria-hidden="true" />
            <span>{{ isTl ? "I-reset" : "Reset" }}</span>
          </button>

          <button
            type="button"
            :aria-expanded="showFilters"
            aria-controls="history-advanced-filters"
            :class="[
              'tipid-compact inline-flex min-h-[36px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              showFilters || advancedFilterCount > 0
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs hover:bg-[var(--bg-inset)]'
            ]"
            @click="showFilters = !showFilters"
          >
            <SlidersHorizontal :size="14" aria-hidden="true" />
            <span class="hidden min-[380px]:inline">{{ isTl ? "Mga Filter" : "Filters" }}</span>
            <span
              v-if="advancedFilterCount > 0"
              class="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent)] px-1 font-mono text-[10px] font-bold text-white"
            >
              {{ advancedFilterCount }}
            </span>
          </button>
        </div>
      </div>

      <!-- Expandable Detailed Filters Drawer -->
      <section
        v-if="showFilters"
        id="history-advanced-filters"
        aria-label="Detailed filters"
        class="tipid-card tipid-auth-disclosure grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 print:hidden"
      >
        <div class="min-w-0">
          <label for="history-filter-category" class="mb-1 block text-[11px] font-semibold text-[var(--text-muted)]">
            {{ isTl ? "Kategorya" : "Category" }}
          </label>
          <select
            id="history-filter-category"
            v-model="categoryFilter"
            class="tipid-input min-h-[40px] py-1.5 text-xs sm:text-sm"
          >
            <option value="all">{{ isTl ? "Lahat ng Kategorya" : "All Categories" }}</option>
            <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
            <option value="Kita">Kita (Income)</option>
          </select>
        </div>

        <div class="min-w-0">
          <label for="history-filter-wallet" class="mb-1 block text-[11px] font-semibold text-[var(--text-muted)]">
            {{ isTl ? "Account / Wallet" : "Account / Wallet" }}
          </label>
          <select
            id="history-filter-wallet"
            v-model="walletFilter"
            class="tipid-input min-h-[40px] py-1.5 text-xs sm:text-sm"
          >
            <option value="all">{{ isTl ? "Lahat ng Account" : "All Accounts" }}</option>
            <option v-for="w in wallets" :key="w" :value="w">
              {{ resolveWalletVisual(w).displayName }}
            </option>
          </select>
        </div>

        <div class="min-w-0">
          <label for="history-filter-month" class="mb-1 block text-[11px] font-semibold text-[var(--text-muted)]">
            {{ isTl ? "Buwan" : "Period / Month" }}
          </label>
          <select
            id="history-filter-month"
            v-model="monthFilter"
            class="tipid-input min-h-[40px] py-1.5 text-xs sm:text-sm"
          >
            <option value="all">{{ isTl ? "Lahat ng Buwan" : "All Months" }}</option>
            <option v-for="m in availableMonths" :key="m" :value="m">
              {{ formatMonthLabel(m) }}
            </option>
          </select>
        </div>
      </section>

      <!-- Empty States -->
      <section
        v-if="groupedByDate.length === 0"
        class="tipid-card flex flex-col items-center justify-center px-6 py-14 text-center"
      >
        <div
          :class="[
            'tipid-icon-badge h-14 w-14 rounded-2xl',
            hasActiveFilters ? 'bg-[var(--bg-inset)] text-[var(--text-secondary)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
          ]"
        >
          <SearchX v-if="hasActiveFilters" :size="26" aria-hidden="true" />
          <ReceiptText v-else :size="26" aria-hidden="true" />
        </div>

        <h2 class="mt-4 text-base font-bold text-[var(--text-primary)]">
          <template v-if="hasActiveFilters">
            {{ isTl ? "Walang tugma sa kasalukuyang filter" : "No transactions match these filters" }}
          </template>
          <template v-else>
            {{ isTl ? "Wala pang naitalang transaksyon" : "Your transaction ledger is empty" }}
          </template>
        </h2>

        <p class="mt-1.5 max-w-md text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
          <template v-if="hasActiveFilters">
            {{ isTl ? "Subukang paluwagin ang paghahanap o ibalik ang mga filter." : "Try adjusting your search keywords, category, account, or period filters." }}
          </template>
          <template v-else>
            {{ isTl ? "Simulan ang iyong talaan sa pagdagdag ng unang gastos o kita." : "Log your first expense, inflow, or SMS notice to see detailed date-grouped entries here." }}
          </template>
        </p>

        <div class="mt-5 flex flex-wrap items-center justify-center gap-2.5 print:hidden">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            @click="resetFilters"
          >
            <RotateCcw :size="14" aria-hidden="true" />
            <span>{{ isTl ? "I-reset ang mga Filter" : "Reset Filters" }}</span>
          </button>
          <button
            type="button"
            class="tipid-cta inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="txModalOpen = true"
          >
            <Plus :size="14" aria-hidden="true" />
            <span>{{ t.addTransaction }}</span>
          </button>
        </div>
      </section>

      <!-- Date-Grouped Statement Feed (Matching Reference Grouping + Detailed Metadata!) -->
      <div v-else class="space-y-5">
        <section
          v-for="group in groupedByDate"
          :key="group.key"
          class="space-y-2 print:break-inside-avoid"
        >
          <!-- Clean Group Header Outside Card -->
          <div class="flex items-center justify-between gap-2 px-1">
            <h2 class="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--text-primary)]">
              <Calendar :size="13" class="shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
              <span>{{ group.label }}</span>
            </h2>
            <span
              :class="[
                'font-mono text-xs font-semibold',
                group.net >= 0 ? 'text-[var(--income)]' : 'text-[var(--text-muted)]'
              ]"
            >
              {{ group.items.length }} {{ group.items.length === 1 ? "item" : "items" }} · Net {{ group.net >= 0 ? "+" : "-" }}₱{{ formatPeso(Math.abs(group.net)) }}
            </span>
          </div>

          <!-- Grouped Transactions Card -->
          <ul class="tipid-card divide-y divide-[var(--border-subtle)] overflow-hidden print:shadow-none">
            <li
              v-for="item in group.items"
              :key="item.id"
              class="flex items-center justify-between gap-2 px-3.5 py-3.5 transition-colors hover:bg-[var(--bg-inset)]/40 sm:px-5"
            >
              <button
                type="button"
                class="tipid-compact flex min-w-0 flex-1 items-center gap-3.5 text-left"
                @click="inspectedEntry = item"
              >
                <!-- Round Category Emblem -->
                <span
                  :class="[
                    'tipid-icon-badge h-11 w-11 shrink-0 rounded-full',
                    item.type === 'income' ? 'bg-[var(--income-soft)] text-[var(--income)]' : ''
                  ]"
                  :style="entryBadgeStyle(item)"
                  aria-hidden="true"
                >
                  <component :is="getCategoryIcon(item.category, item.type)" :size="19" />
                </span>

                <!-- Rich Detailed Primary + Secondary Row -->
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <p class="truncate text-sm font-bold text-[var(--text-primary)]">
                      {{ item.category }}
                    </p>
                    <span
                      v-if="item.type !== 'income'"
                      :class="[
                        'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                        item.spendType === 'luho'
                          ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                          : 'bg-[var(--bg-inset)] text-[var(--text-secondary)]'
                      ]"
                    >
                      {{ item.spendType === "luho" ? "Want" : "Need" }}
                    </span>
                  </div>

                  <p class="mt-0.5 truncate text-xs font-medium text-[var(--text-secondary)]">
                    {{ item.desc }}
                  </p>

                  <div class="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                    <span class="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-medium text-[var(--text-secondary)]">
                      <span
                        class="h-1.5 w-1.5 shrink-0 rounded-full"
                        :style="{ backgroundColor: resolveWalletVisual(item.method || 'Cash').surfaceEnd }"
                        aria-hidden="true"
                      />
                      <component
                        :is="getWalletKindIcon(resolveWalletVisual(item.method || 'Cash').kind)"
                        :size="10"
                        aria-hidden="true"
                      />
                      <span>{{ resolveWalletVisual(item.method || "Cash").displayName }}</span>
                    </span>
                    <span v-if="item.note" class="truncate text-[var(--text-muted)]">
                      · {{ item.note }}
                    </span>
                  </div>
                </div>

                <!-- Right Amount + Exact Timestamp Column (Matches Reference!) -->
                <div class="shrink-0 text-right">
                  <p
                    :class="[
                      'tipid-amount font-mono text-sm font-bold sm:text-base',
                      item.type === 'income' ? 'text-[var(--income)]' : 'text-[var(--expense)]'
                    ]"
                  >
                    {{ item.type === "income" ? "+" : "-" }}₱{{ formatPeso(item.amount) }}
                  </p>
                  <p class="mt-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                    {{ entryTimeLabel(item) }}
                  </p>
                </div>
              </button>

              <button
                type="button"
                class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)] print:hidden"
                :aria-label="`Delete ${item.desc}`"
                @click="pendingDelete = item"
              >
                <Trash2 :size="15" aria-hidden="true" />
              </button>
            </li>
          </ul>
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

    <TransactionDetailDialog
      :open="Boolean(inspectedEntry)"
      :entry="inspectedEntry"
      @close="inspectedEntry = null"
      @delete="(entry) => { inspectedEntry = null; pendingDelete = entry; }"
    />

    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      :title="isTl ? 'Burahin ang Transaksyon?' : 'Delete Transaction?'"
      :message="pendingDelete ? `Remove &quot;${pendingDelete.desc}&quot; permanently?` : ''"
      :confirm-label="t.commonDelete"
      :cancel-label="t.commonCancel"
      :loading="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </AppShell>
</template>
