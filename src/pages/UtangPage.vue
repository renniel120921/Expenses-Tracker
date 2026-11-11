<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import UtangBreakdownChart from "@/components/UtangBreakdownChart.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import {
  csvEscapeCell,
  dayDiffFromKeys,
  formatDateKeyReadable,
  formatPeso,
  fromCentavos,
  manilaDateKey,
  money,
  toCentavos
} from "@/lib/core";
import { addUtang, deleteUtang, reopenUtang, settleUtang, updateUtang } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { useI18n } from "@/lib/i18n";
import type { TimestampLike, UtangDirection, UtangRecord } from "@/types/finance";

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const { utangList, loadingUtang } = useFinanceData(uidRef, { withUtang: true });
const { t, isTl } = useI18n();

const todayKey = manilaDateKey() || new Date().toISOString().slice(0, 10);

const filterTab = ref<"all" | "owed_to_me" | "i_owe" | "settled">("all");
const periodScope = ref<string>("all");
const searchQuery = ref("");
const sortBy = ref<"recent" | "amount" | "dueDate" | "name">("recent");

onMounted(() => {
  const filterParam = new URLSearchParams(window.location.search).get("filter");
  if (
    filterParam === "all" ||
    filterParam === "owed_to_me" ||
    filterParam === "i_owe" ||
    filterParam === "settled"
  ) {
    filterTab.value = filterParam;
  }
});

// Add / Edit modal state
const dialogOpen = ref(false);
const editingRecord = ref<UtangRecord | null>(null);
const direction = ref<UtangDirection>("owed_to_me");
const personName = ref("");
const amount = ref("");
const dueDate = ref("");
const notes = ref("");
const partialPayment = ref("");
const formError = ref("");
const formInvalidField = ref<"name" | "amount" | null>(null);
const saving = ref(false);

const nameInputRef = ref<HTMLInputElement | null>(null);
const amountInputRef = ref<HTMLInputElement | null>(null);

const updatingId = ref<string | null>(null);
const pendingDelete = ref<UtangRecord | null>(null);
const deleting = ref(false);

function resolveRecordDateKey(item: UtangRecord): string {
  if (item.dueDate) return item.dueDate;
  const raw = item.createdAt;
  if (raw && typeof raw === "object") {
    if ("toDate" in raw && typeof (raw as TimestampLike).toDate === "function") {
      return manilaDateKey((raw as TimestampLike).toDate!()) || "";
    }
    if ("toMillis" in raw && typeof (raw as TimestampLike).toMillis === "function") {
      return manilaDateKey((raw as TimestampLike).toMillis!()) || "";
    }
    if (raw instanceof Date) return manilaDateKey(raw) || "";
  }
  return "";
}

const availablePeriods = computed(() => {
  const keys = new Set<string>();
  keys.add(todayKey.slice(0, 7));
  for (const item of utangList.value) {
    const dk = resolveRecordDateKey(item);
    if (dk && dk.length >= 7) {
      keys.add(dk.slice(0, 7));
    }
  }
  return Array.from(keys)
    .sort()
    .reverse()
    .map((ym) => ({
      id: ym,
      label: formatDateKeyReadable(`${ym}-01`, { month: "long", year: "numeric" })
    }));
});

const periodScopedList = computed(() => {
  if (periodScope.value === "all") return utangList.value;
  return utangList.value.filter((item) => {
    const dk = resolveRecordDateKey(item);
    return dk.startsWith(periodScope.value);
  });
});

const summary = computed(() => {
  let receivableCents = 0;
  let payableCents = 0;
  let settledCents = 0;
  let receivableCount = 0;
  let payableCount = 0;
  let settledCount = 0;

  for (const item of periodScopedList.value) {
    let cents = 0;
    try {
      cents = toCentavos(item.amount, { allowZero: true });
    } catch {
      cents = 0;
    }

    if (item.status === "Paid") {
      settledCount += 1;
      settledCents += cents;
    } else if (item.direction === "i_owe") {
      payableCount += 1;
      payableCents += cents;
    } else {
      receivableCount += 1;
      receivableCents += cents;
    }
  }

  const netCents = receivableCents - payableCents;
  const totalVolumeCents = receivableCents + payableCents + settledCents;

  const pct = (part: number) => (totalVolumeCents > 0 ? Math.round((part / totalVolumeCents) * 100) : 0);

  return {
    total: periodScopedList.value.length,
    activeCount: receivableCount + payableCount,
    receivableCount,
    payableCount,
    settledCount,
    receivableTotal: fromCentavos(receivableCents),
    payableTotal: fromCentavos(payableCents),
    settledTotal: fromCentavos(settledCents),
    netPosition: fromCentavos(netCents),
    receivablePct: pct(receivableCents),
    payablePct: pct(payableCents),
    settledPct: pct(settledCents)
  };
});

const hasActiveFilter = computed(
  () => filterTab.value !== "all" || periodScope.value !== "all" || searchQuery.value.trim() !== ""
);

function resetFilters() {
  filterTab.value = "all";
  periodScope.value = "all";
  searchQuery.value = "";
}

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = periodScopedList.value.filter((item) => {
    if (filterTab.value === "owed_to_me" && (item.direction !== "owed_to_me" || item.status === "Paid")) {
      return false;
    }
    if (filterTab.value === "i_owe" && (item.direction !== "i_owe" || item.status === "Paid")) {
      return false;
    }
    if (filterTab.value === "settled" && item.status !== "Paid") {
      return false;
    }
    if (q) {
      const hay = `${item.name} ${item.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (sortBy.value === "amount") {
    return [...list].sort((a, b) => {
      try {
        return toCentavos(b.amount, { allowZero: true }) - toCentavos(a.amount, { allowZero: true });
      } catch {
        return 0;
      }
    });
  }
  if (sortBy.value === "name") {
    return [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }
  if (sortBy.value === "dueDate") {
    return [...list].sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }
  return list;
});

const groupedList = computed(() => {
  const groups: Record<string, { key: string; label: string; subDate: string; items: UtangRecord[] }> = {};

  for (const item of filteredList.value) {
    const dk = resolveRecordDateKey(item) || "unscheduled";
    if (!groups[dk]) {
      let label = isTl.value ? "Walang Takdang Petsa" : "No Due Date";
      let subDate = "";
      if (dk !== "unscheduled") {
        const diff = dayDiffFromKeys(dk, todayKey);
        const formatted = formatDateKeyReadable(dk, { day: "numeric", month: "short", year: "numeric" });
        if (diff === 0) {
          label = isTl.value ? "Ngayon" : "Today";
          subDate = formatDateKeyReadable(dk, { day: "numeric", month: "short" });
        } else if (diff === -1) {
          label = isTl.value ? "Kahapon" : "Yesterday";
          subDate = formatDateKeyReadable(dk, { day: "numeric", month: "short" });
        } else if (diff === 1) {
          label = isTl.value ? "Bukas" : "Tomorrow";
          subDate = formatDateKeyReadable(dk, { day: "numeric", month: "short" });
        } else {
          label = formatted;
        }
      }
      groups[dk] = { key: dk, label, subDate, items: [] };
    }
    groups[dk].items.push(item);
  }

  return Object.values(groups);
});

function dueBadge(item: UtangRecord): { label: string; isOverdue: boolean } | null {
  if (item.status === "Paid" || !item.dueDate) return null;
  const diffDays = dayDiffFromKeys(item.dueDate, todayKey);
  if (diffDays === null) return null;
  if (diffDays < 0) {
    return {
      label: isTl.value ? `${Math.abs(diffDays)}d lampas` : `${Math.abs(diffDays)}d overdue`,
      isOverdue: true
    };
  }
  if (diffDays === 0) {
    return { label: isTl.value ? "Ngayon" : "Due today", isOverdue: false };
  }
  return {
    label: formatDateKeyReadable(item.dueDate, { month: "short", day: "numeric", year: "numeric" }),
    isOverdue: false
  };
}

function openAddDialog() {
  editingRecord.value = null;
  direction.value = filterTab.value === "i_owe" ? "i_owe" : "owed_to_me";
  personName.value = "";
  amount.value = "";
  dueDate.value = "";
  notes.value = "";
  partialPayment.value = "";
  formError.value = "";
  formInvalidField.value = null;
  dialogOpen.value = true;
}

function openEditDialog(item: UtangRecord) {
  editingRecord.value = item;
  direction.value = item.direction;
  personName.value = item.name;
  amount.value = String(item.amount ?? "");
  dueDate.value = item.dueDate || "";
  notes.value = item.notes || "";
  partialPayment.value = "";
  formError.value = "";
  formInvalidField.value = null;
  dialogOpen.value = true;
}

async function applyPartialPayment() {
  const uid = user.value?.uid;
  const record = editingRecord.value;
  if (!uid || !record || saving.value) return;
  formError.value = "";

  let currentCents = 0;
  let payCents = 0;
  try {
    currentCents = toCentavos(amount.value);
    payCents = toCentavos(partialPayment.value);
  } catch {
    formError.value = isTl.value ? "Ilagay ang tamang halaga ng bayad." : "Enter a valid payment deduction greater than ₱0.";
    return;
  }

  if (payCents >= currentCents) {
    saving.value = true;
    try {
      await settleUtang(uid, record.id);
      dialogOpen.value = false;
      pushToast(isTl.value ? "Nabayaran nang buo at minarkahang settled." : "Full balance covered — marked as settled.", "success");
    } catch {
      formError.value = isTl.value ? "Hindi ma-settle ang tala." : "Could not settle record.";
    } finally {
      saving.value = false;
    }
    return;
  }

  const remainingCents = currentCents - payCents;
  amount.value = fromCentavos(remainingCents).toFixed(2);
  partialPayment.value = "";
  pushToast(
    isTl.value
      ? `Nabawas ang bayad. Natitirang balanse: ₱${formatPeso(fromCentavos(remainingCents))}`
      : `Payment applied — remaining ₱${formatPeso(fromCentavos(remainingCents))}. Save changes to confirm.`,
    "info"
  );
}

async function handleSaveUtang() {
  const uid = user.value?.uid;
  if (!uid) return;
  formError.value = "";
  formInvalidField.value = null;

  const cleanName = personName.value.trim();
  if (!cleanName) {
    formError.value = isTl.value ? "Ilagay ang pangalan ng tao o kumpanya." : "Enter the person or counterparty name.";
    formInvalidField.value = "name";
    nameInputRef.value?.focus();
    return;
  }

  let safeAmount = 0;
  try {
    safeAmount = money(amount.value);
  } catch {
    formError.value = isTl.value ? "Ilagay ang tamang halaga na lampas sa ₱0." : "Enter a valid amount greater than ₱0.";
    formInvalidField.value = "amount";
    amountInputRef.value?.focus();
    return;
  }

  saving.value = true;
  try {
    const payload = {
      name: cleanName,
      amount: safeAmount,
      direction: direction.value,
      dueDate: dueDate.value || null,
      notes: notes.value.trim()
    };

    if (editingRecord.value) {
      const res = await updateUtang(uid, editingRecord.value.id, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Na-update ang tala ng utang." : "Debt record updated.",
        isTl.value ? "Na-update offline — isi-sync online." : "Updated offline — syncs when online."
      );
    } else {
      const res = await addUtang(uid, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naitala ang utang." : "Debt record saved.",
        isTl.value ? "Naka-save offline — isi-sync online." : "Debt saved offline — syncs when online."
      );
    }
    dialogOpen.value = false;
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Could not save record.";
  } finally {
    saving.value = false;
  }
}

async function toggleSettled(item: UtangRecord) {
  const uid = user.value?.uid;
  if (!uid || updatingId.value) return;
  updatingId.value = item.id;
  try {
    if (item.status === "Paid") {
      await reopenUtang(uid, item.id);
      pushToast(isTl.value ? "Binuksan muli ang tala." : "Record marked active.", "info");
    } else {
      await settleUtang(uid, item.id);
      pushToast(isTl.value ? "Minarkahang bayad na." : "Marked as settled.", "success");
    }
  } catch {
    pushToast(isTl.value ? "Hindi na-update ang tala." : "Could not update status.", "error");
  } finally {
    updatingId.value = null;
  }
}

async function confirmDeleteRecord() {
  const uid = user.value?.uid;
  const target = pendingDelete.value;
  if (!uid || !target) return;
  deleting.value = true;
  try {
    await deleteUtang(uid, target.id);
    pendingDelete.value = null;
    pushToast(isTl.value ? "Nabura ang tala." : "Debt record deleted.", "info");
  } catch {
    pushToast(isTl.value ? "Hindi mabura ang tala." : "Could not delete record.", "error");
  } finally {
    deleting.value = false;
  }
}

function handleExportCsv() {
  if (utangList.value.length === 0) {
    pushToast(isTl.value ? "Walang tala ng utang na mae-export." : "No debt records available to export.", "info");
    return;
  }
  const header = ["name", "direction", "amount", "status", "due_date", "notes"];
  const rows = filteredList.value.map((item) =>
    [
      item.name,
      item.direction === "owed_to_me" ? "Owed to me" : "I owe",
      money(item.amount, { allowZero: true }),
      item.status,
      item.dueDate || "",
      item.notes || ""
    ]
      .map(csvEscapeCell)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tipid-utang-${todayKey}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pushToast(isTl.value ? "Na-download ang CSV ng utang." : "Utang ledger CSV exported.", "success");
}
</script>

<template>
  <AppShell active-tab="utang" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-5">
      <!-- Clean Header (Matches Reference Header + Quick Export & Add Record) -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.utangTitle }}
          </h1>
          <p class="mt-0.5 hidden text-xs text-[var(--text-secondary)] sm:block">
            {{ t.utangSubtitle }}
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
            @click="openAddDialog"
          >
            <Plus :size="15" aria-hidden="true" />
            <span class="hidden min-[400px]:inline">{{ t.addUtang }}</span>
            <span class="min-[400px]:hidden">{{ isTl ? "Tala" : "Record" }}</span>
          </button>
        </div>
      </header>

      <!-- Featured Ring + Two Inset Tiles + Filter Pill Chips Card (Matches Mockup Top Card in Tipid Colors) -->
      <section aria-label="Utang balances summary" class="tipid-card p-4 sm:p-5">
        <div class="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          <!-- Left: Segmented Donut Ring -->
          <div class="flex justify-center sm:col-span-5">
            <UtangBreakdownChart
              :receivable-total="summary.receivableTotal"
              :payable-total="summary.payableTotal"
              :settled-total="summary.settledTotal"
            />
          </div>

          <!-- Right: Stacked Net Position & Comparison Exposure Inset Tiles -->
          <div class="grid grid-cols-2 gap-2.5 sm:col-span-7 sm:grid-cols-1">
            <div class="tipid-inset flex flex-col justify-center px-3.5 py-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[11px] font-medium text-[var(--text-muted)]">
                  {{ isTl ? "Netong Posisyon" : "Net Position" }}
                </span>
                <span class="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-secondary)]">
                  {{ summary.netPosition >= 0 ? (isTl ? "Pautang" : "Net +") : (isTl ? "Utang" : "Net -") }}
                </span>
              </div>
              <p
                :class="[
                  'tipid-amount mt-1 font-mono text-lg font-bold tracking-tight sm:text-xl',
                  summary.netPosition > 0
                    ? 'text-[var(--income)]'
                    : summary.netPosition < 0
                      ? 'text-[var(--expense)]'
                      : 'text-[var(--text-primary)]'
                ]"
              >
                {{ summary.netPosition >= 0 ? "+" : "-" }}₱{{ formatPeso(Math.abs(summary.netPosition)) }}
              </p>
            </div>

            <div class="tipid-inset flex flex-col justify-center px-3.5 py-3">
              <div class="flex items-center justify-between gap-2 text-xs">
                <span class="font-bold text-[var(--text-primary)]">
                  {{ summary.activeCount }} {{ isTl ? "aktibo" : "active" }} · {{ summary.settledCount }} {{ isTl ? "tapos" : "settled" }}
                </span>
              </div>
              <p class="mt-1 truncate font-mono text-xs text-[var(--text-secondary)]">
                <span class="font-semibold text-[var(--income)]">+₱{{ formatPeso(summary.receivableTotal) }}</span>
                <span class="mx-1 text-[var(--text-muted)]">/</span>
                <span class="font-semibold text-[var(--expense)]">-₱{{ formatPeso(summary.payableTotal) }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Bottom Inside Same Card: Interactive Share Pill Chips -->
        <div class="mt-4 flex flex-wrap gap-2 border-t border-[var(--border-subtle)] pt-3.5">
          <button
            type="button"
            :aria-pressed="filterTab === 'all'"
            :class="[
              'rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors',
              filterTab === 'all'
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'border-transparent bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            ]"
            @click="filterTab = 'all'"
          >
            {{ t.commonAll }} ({{ summary.total }})
          </button>

          <button
            type="button"
            :aria-pressed="filterTab === 'owed_to_me'"
            :class="[
              'rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors',
              filterTab === 'owed_to_me'
                ? 'border-[var(--income)] bg-[var(--income-soft)] text-[var(--income)]'
                : 'border-transparent bg-[var(--income-soft)] text-[var(--income)] opacity-85 hover:opacity-100'
            ]"
            @click="filterTab = filterTab === 'owed_to_me' ? 'all' : 'owed_to_me'"
          >
            <span class="font-mono">{{ summary.receivablePct }}%</span>
            {{ isTl ? "Pautang" : "Owed to You" }} ({{ summary.receivableCount }})
          </button>

          <button
            type="button"
            :aria-pressed="filterTab === 'i_owe'"
            :class="[
              'rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors',
              filterTab === 'i_owe'
                ? 'border-[var(--expense)] bg-[var(--expense-soft)] text-[var(--expense)]'
                : 'border-transparent bg-[var(--expense-soft)] text-[var(--expense)] opacity-85 hover:opacity-100'
            ]"
            @click="filterTab = filterTab === 'i_owe' ? 'all' : 'i_owe'"
          >
            <span class="font-mono">{{ summary.payablePct }}%</span>
            {{ isTl ? "Utang Mo" : "You Owe" }} ({{ summary.payableCount }})
          </button>

          <button
            type="button"
            :aria-pressed="filterTab === 'settled'"
            :class="[
              'rounded-full border-2 px-3 py-1 text-xs font-semibold transition-colors',
              filterTab === 'settled'
                ? 'border-[var(--text-primary)] bg-[var(--bg-inset)] text-[var(--text-primary)]'
                : 'border-transparent bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            ]"
            @click="filterTab = filterTab === 'settled' ? 'all' : 'settled'"
          >
            <span class="font-mono">{{ summary.settledPct }}%</span>
            {{ isTl ? "Bayad Na" : "Settled" }} ({{ summary.settledCount }})
          </button>
        </div>
      </section>

      <!-- Inline Section Heading with Highlighted Month / Period Pill (Matches "Spendings for [November v]") -->
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="text-base font-bold text-[var(--text-primary)] sm:text-lg">
            {{ isTl ? "Mga tala para sa" : "Records for" }}
          </h2>
          <select
            v-model="periodScope"
            :aria-label="isTl ? 'Pumili ng buwan' : 'Select period'"
            class="rounded-xl bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white outline-none transition-colors hover:bg-[var(--accent-hover)] focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 sm:text-sm [&>option]:bg-[#101813] [&>option]:text-white"
          >
            <option value="all">{{ isTl ? "Lahat ng Petsa" : "All Dates" }}</option>
            <option v-for="m in availablePeriods" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>

        <select
          v-model="sortBy"
          aria-label="Sort utang records"
          class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        >
          <option value="recent">{{ isTl ? "Pinakabago" : "Most Recent" }}</option>
          <option value="amount">{{ isTl ? "Pinakamalaki" : "Highest Amount" }}</option>
          <option value="dueDate">{{ isTl ? "Takdang Petsa" : "Due Date" }}</option>
          <option value="name">{{ isTl ? "Pangalan A–Z" : "Counterparty A–Z" }}</option>
        </select>
      </div>

      <!-- Ledger Card: Integrated Search Bar + Date-Grouped Person Rows -->
      <section class="tipid-card overflow-hidden p-4 sm:p-5">
        <!-- Integrated Pill Search Bar -->
        <div role="search" aria-label="Search utang records" class="mb-4 flex items-center gap-2">
          <div class="relative min-w-0 flex-1">
            <Search
              :size="16"
              class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              aria-hidden="true"
            />
            <input
              v-model="searchQuery"
              type="search"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              class="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/70 py-2.5 pl-10 pr-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors focus:border-[var(--accent)] focus:bg-[var(--bg-surface)]"
              :placeholder="isTl ? 'Hanapin ang pangalan o tala...' : 'Search counterparty or notes...'"
              aria-label="Search debt records"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
              :aria-label="isTl ? 'I-clear ang paghahanap' : 'Clear search'"
              @click="searchQuery = ''"
            >
              <X :size="14" aria-hidden="true" />
            </button>
          </div>

          <button
            v-if="hasActiveFilter"
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5 text-xs font-semibold text-[var(--accent)] hover:border-[var(--accent)]"
            @click="resetFilters"
          >
            <RotateCcw :size="13" aria-hidden="true" />
            <span class="hidden sm:inline">{{ isTl ? "I-reset" : "Reset" }}</span>
          </button>
        </div>

        <div v-if="loadingUtang" class="py-12 text-center text-sm text-[var(--text-muted)]">
          {{ isTl ? "Kinukuha ang talaan..." : "Loading utang ledger..." }}
        </div>

        <div v-else-if="groupedList.length === 0" class="flex flex-col items-center px-4 py-10 text-center">
          <div class="tipid-icon-badge h-12 w-12 rounded-2xl bg-[var(--bg-inset)] text-[var(--text-muted)]">
            <Users :size="22" aria-hidden="true" />
          </div>
          <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">
            {{
              utangList.length === 0
                ? isTl
                  ? "Walang nakatalang utang o pautang."
                  : "No debts or receivables recorded yet."
                : isTl
                  ? "Walang tugmang tala sa filter."
                  : "No records match this filter."
            }}
          </p>
          <p class="mt-1 max-w-sm text-xs text-[var(--text-muted)]">
            {{
              utangList.length === 0
                ? isTl
                  ? "Itala kung may nanghiram sa iyo o may kailangan kang bayaran upang malinaw ang balanse."
                  : "Record money owed to you or balances you owe so repayments stay tracked."
                : isTl
                  ? "Subukang ibalik ang filter sa Lahat."
                  : "Try clearing the search query or switching back to All."
            }}
          </p>
          <button
            v-if="utangList.length === 0"
            type="button"
            class="tipid-cta mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
            @click="openAddDialog"
          >
            <Plus :size="14" aria-hidden="true" />
            <span>{{ t.addUtang }}</span>
          </button>
          <button
            v-else
            type="button"
            class="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            @click="resetFilters"
          >
            <RotateCcw :size="13" aria-hidden="true" />
            <span>{{ isTl ? "I-reset ang filter" : "Reset Filters" }}</span>
          </button>
        </div>

        <!-- Date-Grouped Rows (Exact Layout Rhythm of Reference Feed) -->
        <div v-else class="space-y-5">
          <div v-for="group in groupedList" :key="group.key" class="space-y-2">
            <div class="flex items-baseline gap-2 px-1">
              <h3 class="text-sm font-bold text-[var(--text-primary)]">{{ group.label }}</h3>
              <span v-if="group.subDate" class="text-xs font-medium text-[var(--text-muted)]">{{ group.subDate }}</span>
            </div>

            <ul class="divide-y divide-[var(--border-subtle)]">
              <li v-for="item in group.items" :key="item.id">
                <article class="flex flex-col gap-2.5 py-3 transition-colors hover:bg-[var(--bg-inset)]/35 sm:flex-row sm:items-center sm:justify-between sm:rounded-xl sm:px-2">
                  <div class="flex min-w-0 flex-1 items-center gap-3">
                    <span
                      :class="[
                        'tipid-icon-badge h-10 w-10 shrink-0 rounded-xl',
                        item.status === 'Paid'
                          ? 'bg-[var(--bg-inset)] text-[var(--text-muted)]'
                          : item.direction === 'owed_to_me'
                            ? 'bg-[var(--income-soft)] text-[var(--income)]'
                            : 'bg-[var(--expense-soft)] text-[var(--expense)]'
                      ]"
                      aria-hidden="true"
                    >
                      <CheckCircle2 v-if="item.status === 'Paid'" :size="18" />
                      <ArrowDownLeft v-else-if="item.direction === 'owed_to_me'" :size="18" />
                      <ArrowUpRight v-else :size="18" />
                    </span>

                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <p
                          :class="[
                            'truncate text-sm font-bold',
                            item.status === 'Paid' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                          ]"
                        >
                          {{ item.name }}
                        </p>
                        <span
                          v-if="dueBadge(item)"
                          :class="[
                            'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
                            dueBadge(item)?.isOverdue
                              ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                              : 'bg-[var(--bg-inset)] text-[var(--text-secondary)]'
                          ]"
                        >
                          <AlertTriangle v-if="dueBadge(item)?.isOverdue" :size="10" aria-hidden="true" />
                          <Clock v-else :size="10" aria-hidden="true" />
                          <span>{{ dueBadge(item)?.label }}</span>
                        </span>
                      </div>

                      <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                        {{
                          item.status === "Paid"
                            ? isTl
                              ? "Bayad Na"
                              : "Settled"
                            : item.direction === "owed_to_me"
                              ? isTl
                                ? "Pautang"
                                : "Owed to you"
                              : isTl
                                ? "Utang mo"
                                : "You owe"
                        }}
                        <template v-if="item.notes"> · {{ item.notes }}</template>
                      </p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between gap-2 pl-13 sm:justify-end sm:pl-0">
                    <span
                      :class="[
                        'tipid-amount font-mono text-sm font-bold sm:text-base',
                        item.status === 'Paid'
                          ? 'text-[var(--text-muted)] line-through'
                          : item.direction === 'owed_to_me'
                            ? 'text-[var(--income)]'
                            : 'text-[var(--expense)]'
                      ]"
                    >
                      {{ item.direction === "owed_to_me" ? "+" : "-" }}₱{{ formatPeso(item.amount) }}
                    </span>

                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
                        :aria-label="`Edit debt with ${item.name}`"
                        :title="isTl ? 'I-edit o magbawas ng bayad' : 'Edit or record payment'"
                        @click="openEditDialog(item)"
                      >
                        <Pencil :size="14" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        :disabled="updatingId === item.id"
                        class="tipid-compact inline-flex items-center gap-1 whitespace-nowrap rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-inset)]"
                        @click="toggleSettled(item)"
                      >
                        <RotateCcw v-if="item.status === 'Paid'" :size="12" aria-hidden="true" />
                        <CheckCircle2 v-else :size="12" class="text-[var(--income)]" aria-hidden="true" />
                        <span>
                          {{
                            item.status === "Paid"
                              ? isTl
                                ? "Buksan"
                                : "Reopen"
                              : isTl
                                ? "Settle"
                                : "Settle"
                          }}
                        </span>
                      </button>

                      <button
                        type="button"
                        class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                        :aria-label="`Delete debt with ${item.name}`"
                        @click="pendingDelete = item"
                      >
                        <Trash2 :size="14" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Add / Edit Utang Dialog (Semantic Fieldset + Accessible Form Validation) -->
    <BaseDialog
      :open="dialogOpen"
      :title="editingRecord ? (isTl ? 'I-edit ang Utang' : 'Edit Debt Record') : t.addUtang"
      :subtitle="
        editingRecord
          ? isTl
            ? 'Baguhin ang detalye o magbawas ng partial na bayad.'
            : 'Update record details or deduct a partial repayment.'
          : isTl
            ? 'Itala ang pautang o halagang dapat bayaran.'
            : 'Log money someone owes you or money you owe someone else.'
      "
      @close="dialogOpen = false"
    >
      <form class="space-y-4" novalidate @submit.prevent="handleSaveUtang">
        <fieldset class="space-y-1.5">
          <legend class="mb-1 text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Direksyon ng Balanse" : "Balance Direction" }}
          </legend>
          <div class="grid grid-cols-2 gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)] p-1">
            <label
              :class="[
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent)]',
                direction === 'owed_to_me'
                  ? 'bg-[var(--bg-surface)] text-[var(--income)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              ]"
            >
              <input v-model="direction" type="radio" name="utang-direction" value="owed_to_me" class="visually-hidden" />
              <ArrowDownLeft :size="14" aria-hidden="true" />
              <span>{{ isTl ? "May Utang sa Akin" : "Owed to me" }}</span>
            </label>
            <label
              :class="[
                'flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--accent)]',
                direction === 'i_owe'
                  ? 'bg-[var(--bg-surface)] text-[var(--expense)] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              ]"
            >
              <input v-model="direction" type="radio" name="utang-direction" value="i_owe" class="visually-hidden" />
              <ArrowUpRight :size="14" aria-hidden="true" />
              <span>{{ isTl ? "May Utang Ako" : "I owe" }}</span>
            </label>
          </div>
        </fieldset>

        <div>
          <label for="utang-name" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Pangalan" : "Person / Counterparty" }} <span aria-hidden="true">*</span>
          </label>
          <input
            id="utang-name"
            ref="nameInputRef"
            v-model="personName"
            name="counterparty"
            type="text"
            autocomplete="name"
            enterkeyhint="next"
            maxlength="120"
            required
            :aria-invalid="formInvalidField === 'name' ? 'true' : undefined"
            :aria-describedby="formError ? 'utang-form-error' : undefined"
            class="tipid-input"
            :placeholder="isTl ? 'hal. Juan Dela Cruz' : 'e.g. Carlo Mendoza'"
            @input="if (formInvalidField === 'name') { formError = ''; formInvalidField = null; }"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label for="utang-amount" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Halaga (PHP)" : "Amount (PHP)" }} <span aria-hidden="true">*</span>
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
              <input
                id="utang-amount"
                ref="amountInputRef"
                v-model="amount"
                name="amount"
                type="number"
                inputmode="decimal"
                enterkeyhint="next"
                step="0.01"
                min="0.01"
                required
                :aria-invalid="formInvalidField === 'amount' ? 'true' : undefined"
                :aria-describedby="formError ? 'utang-form-error' : undefined"
                class="tipid-input pl-8 font-mono"
                placeholder="0.00"
                @input="if (formInvalidField === 'amount') { formError = ''; formInvalidField = null; }"
              />
            </div>
          </div>

          <div>
            <label for="utang-due" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Takdang Petsa (Opsyonal)" : "Due Date (Optional)" }}
            </label>
            <input id="utang-due" v-model="dueDate" name="dueDate" type="date" class="tipid-input" />
          </div>
        </div>

        <!-- Partial Payment Helper in Edit Mode -->
        <div
          v-if="editingRecord && editingRecord.status !== 'Paid'"
          class="tipid-inset space-y-2 p-3"
        >
          <label for="utang-partial" class="block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Magbawas ng Partial Payment (₱)" : "Deduct Partial Payment (Optional)" }}
          </label>
          <div class="flex gap-2">
            <div class="relative min-w-0 flex-1">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-[var(--text-muted)]">₱</span>
              <input
                id="utang-partial"
                v-model="partialPayment"
                name="partialPayment"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0.01"
                class="tipid-input min-h-[38px] py-1.5 pl-7 font-mono text-xs"
                placeholder="0.00"
              />
            </div>
            <button
              type="button"
              :disabled="saving || !partialPayment"
              class="shrink-0 rounded-xl bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white disabled:opacity-50"
              @click="applyPartialPayment"
            >
              {{ isTl ? "Ibawas" : "Apply" }}
            </button>
          </div>
        </div>

        <div>
          <label for="utang-notes" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Tala (Opsyonal)" : "Notes (Optional)" }}
          </label>
          <textarea
            id="utang-notes"
            v-model="notes"
            name="notes"
            rows="2"
            maxlength="500"
            class="tipid-input resize-y"
            :placeholder="isTl ? 'Detalye o dahilan...' : 'Split dinner, cash advance, etc.'"
          />
        </div>

        <p v-if="formError" id="utang-form-error" role="alert" aria-live="polite" class="text-xs font-medium text-[var(--expense)]">
          {{ formError }}
        </p>

        <div class="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
            :disabled="saving"
            @click="dialogOpen = false"
          >
            {{ t.commonCancel }}
          </button>
          <button
            type="submit"
            class="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
            :disabled="saving"
          >
            {{ saving ? t.commonSaving : editingRecord ? (isTl ? "I-save ang Pagbabago" : "Save changes") : t.commonSave }}
          </button>
        </div>
      </form>
    </BaseDialog>

    <!-- Confirm Delete -->
    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      :title="isTl ? 'Burahin ang tala ng utang?' : 'Delete debt record?'"
      :message="
        pendingDelete
          ? `${pendingDelete.name} (₱${formatPeso(pendingDelete.amount)}) will be permanently removed.`
          : ''
      "
      :confirm-label="t.commonDelete"
      :cancel-label="t.commonCancel"
      :loading="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDeleteRecord"
    />
  </AppShell>
</template>
