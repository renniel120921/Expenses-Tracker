<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet
} from "@lucide/vue";
import AppShell from "@/components/AppShell.vue";
import BaseDialog from "@/components/BaseDialog.vue";
import ConfirmDialog from "@/components/ConfirmDialog.vue";
import { useAuthGuard } from "@/composables/useAuthGuard";
import { useFinanceData } from "@/composables/useFinanceData";
import { pushToast } from "@/composables/useToast";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { csvEscapeCell, formatPeso, fromCentavos, manilaDateKey, money, sumActiveWalletsBalance, toCentavos } from "@/lib/core";
import { addBill, deleteBill, markBillPaidAndScheduleNext, updateBill, updateBillStatus } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { useI18n } from "@/lib/i18n";
import type { BillRecurrence, BillRecord } from "@/types/finance";

const BILL_CATEGORIES = [
  "Utilities",
  "Internet & Mobile",
  "Rent & Housing",
  "Credit Card & BNPL",
  "Subscriptions",
  "Insurance & Health",
  "Other Bills"
] as const;

interface PlainDateParts {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

function parsePlainDate(dateKey: string): PlainDateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function formatPlainDateKey(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function plainDayIndex(parts: PlainDateParts): number {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function formatPlainReadable(dateKey: string, opts: Intl.DateTimeFormatOptions): string {
  const parts = parsePlainDate(dateKey);
  if (!parts) return dateKey || "—";
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).toLocaleDateString("en-PH", {
    ...opts,
    timeZone: "UTC"
  });
}

function splitPesoParts(amount: number): { whole: string; decimals: string } {
  const formatted = formatPeso(amount);
  const dotIdx = formatted.lastIndexOf(".");
  if (dotIdx === -1) return { whole: formatted, decimals: "" };
  return { whole: formatted.slice(0, dotIdx), decimals: formatted.slice(dotIdx) };
}

const { user, isOffline, isLocked, unlockSession } = useAuthGuard();
const uidRef = computed(() => user.value?.uid);
const { bills, loadingBills, wallets, walletBalances } = useFinanceData(uidRef, { withBills: true });
const { t, isTl } = useI18n();

const todayKey = manilaDateKey() || new Date().toISOString().slice(0, 10);
const initialToday = parsePlainDate(todayKey) || {
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  day: new Date().getDate()
};

const statusFilter = ref<"all" | "upcoming" | "overdue" | "paid">("all");
const monthCycleFilter = ref<string>("all");
const searchQuery = ref("");
const sortBy = ref<"dueDate" | "amount" | "title">("dueDate");
const filtersOpen = ref(false);

const mobilePane = ref<"schedule" | "calendar">("schedule");
const isDesktop = ref(true);

let desktopMq: MediaQueryList | null = null;
function syncViewportMode() {
  isDesktop.value = desktopMq ? desktopMq.matches : true;
}

onMounted(() => {
  desktopMq = window.matchMedia("(min-width: 1024px)");
  syncViewportMode();
  desktopMq.addEventListener("change", syncViewportMode);

  const params = new URLSearchParams(window.location.search);
  const filterParam = params.get("filter");
  if (filterParam === "all" || filterParam === "upcoming" || filterParam === "overdue" || filterParam === "paid") {
    statusFilter.value = filterParam;
    filtersOpen.value = filterParam !== "all";
  }
  if (params.get("view") === "calendar") {
    mobilePane.value = "calendar";
  }
  const billIdParam = params.get("bill");
  if (billIdParam) {
    deepLinkBillId.value = billIdParam;
  }
});

onUnmounted(() => {
  desktopMq?.removeEventListener("change", syncViewportMode);
});

const calendarYear = ref(initialToday.year);
const calendarMonth = ref(initialToday.month);
const selectedDateKey = ref<string | null>(null);
const calendarSectionRef = ref<HTMLElement | null>(null);

watch(monthCycleFilter, (ym) => {
  if (ym === "all") return;
  const parts = parsePlainDate(`${ym}-01`);
  if (parts) {
    calendarYear.value = parts.year;
    calendarMonth.value = parts.month;
    selectedDateKey.value = null;
  }
});

const addOpen = ref(false);
const editingBill = ref<BillRecord | null>(null);
const deepLinkBillId = ref<string | null>(null);
const billTitle = ref("");
const billAmount = ref("");
const billDueDate = ref(todayKey);
const billCategory = ref<string>(BILL_CATEGORIES[0]);
const billRecurrence = ref<BillRecurrence>("none");
const billNotes = ref("");
const billError = ref("");
const savingBill = ref(false);
const billTitleInputRef = ref<HTMLInputElement | null>(null);
const billAmountInputRef = ref<HTMLInputElement | null>(null);
const billDueDateInputRef = ref<HTMLInputElement | null>(null);

const recurrenceOptions = computed(() => [
  { id: "none" as const, label: isTl.value ? "Minsan" : "One-time" },
  { id: "weekly" as const, label: isTl.value ? "Linggo" : "Weekly" },
  { id: "monthly" as const, label: isTl.value ? "Buwanan" : "Monthly" },
  { id: "quarterly" as const, label: "3 Mos" },
  { id: "yearly" as const, label: isTl.value ? "Taon" : "Yearly" }
]);

function recurrenceLabel(rec?: BillRecurrence): string {
  if (!rec || rec === "none") return "";
  return recurrenceOptions.value.find((o) => o.id === rec)?.label || rec;
}

const billCategoryOptions = computed<string[]>(() => {
  const list: string[] = [...BILL_CATEGORIES];
  const cur = billCategory.value.trim();
  if (cur && !list.includes(cur)) {
    list.unshift(cur);
  }
  return list;
});

watch(
  bills,
  (list) => {
    if (!deepLinkBillId.value || list.length === 0) return;
    const match = list.find((b) => b.id === deepLinkBillId.value);
    deepLinkBillId.value = null;
    if (match) {
      openEditDialog(match);
    }
  },
  { immediate: true }
);

const togglingId = ref<string | null>(null);
const pendingDelete = ref<BillRecord | null>(null);
const deleting = ref(false);

const availableMonths = computed(() => {
  const keys = new Set<string>();
  keys.add(formatPlainDateKey(initialToday.year, initialToday.month, 1).slice(0, 7));
  for (const b of bills.value) {
    if (b.dueDate && b.dueDate.length >= 7) {
      keys.add(b.dueDate.slice(0, 7));
    }
  }
  return Array.from(keys)
    .sort()
    .map((ym) => ({
      id: ym,
      label: formatPlainReadable(`${ym}-01`, { month: "short", year: "numeric" })
    }));
});

const cycleBills = computed(() => {
  if (monthCycleFilter.value === "all") return bills.value;
  return bills.value.filter((b) => (b.dueDate || "").startsWith(monthCycleFilter.value));
});

const counts = computed(() => {
  let unpaidCents = 0;
  let overdueCents = 0;
  let paidCents = 0;
  let upcomingCount = 0;
  let overdueCount = 0;
  let paidCount = 0;

  for (const b of cycleBills.value) {
    let cents = 0;
    try {
      cents = toCentavos(b.amount, { allowZero: true });
    } catch {
      cents = 0;
    }
    if (b.status === "Paid") {
      paidCount += 1;
      paidCents += cents;
    } else if (b.status === "Overdue") {
      overdueCount += 1;
      unpaidCents += cents;
      overdueCents += cents;
    } else {
      upcomingCount += 1;
      unpaidCents += cents;
    }
  }

  const total = cycleBills.value.length;
  const openCount = upcomingCount + overdueCount;
  const completionPct = total > 0 ? Math.round((paidCount / total) * 100) : 0;

  return {
    total,
    openCount,
    upcomingCount,
    overdueCount,
    paidCount,
    completionPct,
    unpaidTotal: fromCentavos(unpaidCents),
    overdueTotal: fromCentavos(overdueCents),
    paidTotal: fromCentavos(paidCents)
  };
});

const heroSplit = computed(() => splitPesoParts(counts.value.unpaidTotal));

const liquidWalletBalance = computed(() => sumActiveWalletsBalance(wallets.value, walletBalances.value));
const freeAfterBills = computed(() =>
  fromCentavos(
    toCentavos(liquidWalletBalance.value, { allowZero: true, allowNegative: true }) -
      toCentavos(counts.value.unpaidTotal, { allowZero: true })
  )
);

const previewCategories = computed(() => {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const b of cycleBills.value) {
    if (b.status === "Paid") continue;
    const cat = b.category || "Other Bills";
    if (!seen.has(cat)) {
      seen.add(cat);
      list.push(cat);
    }
    if (list.length >= 3) break;
  }
  return list;
});

const hasActiveFilter = computed(
  () => statusFilter.value !== "all" || monthCycleFilter.value !== "all" || searchQuery.value.trim() !== ""
);

function resetFilters() {
  statusFilter.value = "all";
  monthCycleFilter.value = "all";
  searchQuery.value = "";
}

const filteredBills = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = cycleBills.value.filter((b) => {
    if (statusFilter.value === "upcoming" && b.status !== "Unpaid") return false;
    if (statusFilter.value === "overdue" && b.status !== "Overdue") return false;
    if (statusFilter.value === "paid" && b.status !== "Paid") return false;
    if (q) {
      const hay = `${b.title} ${b.category} ${b.notes || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return [...list].sort((a, b) => {
    if (sortBy.value === "amount") {
      try {
        return toCentavos(b.amount, { allowZero: true }) - toCentavos(a.amount, { allowZero: true });
      } catch {
        return 0;
      }
    }
    if (sortBy.value === "title") {
      return String(a.title || "").localeCompare(String(b.title || ""));
    }
    return String(a.dueDate || "").localeCompare(String(b.dueDate || ""));
  });
});

function billTone(bill: BillRecord): "overdue" | "today" | "soon" | "paid" {
  if (bill.status === "Paid") return "paid";
  if (bill.status === "Overdue") return "overdue";
  const nowParts = parsePlainDate(todayKey);
  const dueParts = parsePlainDate(bill.dueDate);
  if (!nowParts || !dueParts) return "soon";
  const diffDays = plainDayIndex(dueParts) - plainDayIndex(nowParts);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "today";
  return "soon";
}

function dueRelativeLabel(bill: BillRecord): { text: string; tone: "overdue" | "today" | "soon" | "paid" } {
  if (bill.status === "Paid") {
    return { text: isTl.value ? "Bayad na" : "PAID", tone: "paid" };
  }
  const nowParts = parsePlainDate(todayKey);
  const dueParts = parsePlainDate(bill.dueDate);
  if (!nowParts || !dueParts) {
    return { text: isTl.value ? "Nakatakda" : "SCHEDULED", tone: "soon" };
  }
  const diffDays = plainDayIndex(dueParts) - plainDayIndex(nowParts);
  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      text: isTl.value ? `${overdueDays}d lampas` : `${overdueDays}D OVERDUE`,
      tone: "overdue"
    };
  }
  if (diffDays === 0) {
    return { text: isTl.value ? "NGAYON" : "TODAY", tone: "today" };
  }
  return {
    text: isTl.value ? `SA ${diffDays} ARAW` : `${diffDays} DAYS`,
    tone: diffDays <= 3 ? "today" : "soon"
  };
}

function formatDueDate(dateStr: string): string {
  return formatPlainReadable(dateStr, { month: "short", day: "numeric", year: "numeric" });
}

// Calendar grid calculation using UTC calendar integers (location-agnostic)
const calendarMonthKey = computed(() => formatPlainDateKey(calendarYear.value, calendarMonth.value, 1).slice(0, 7));

const calendarHeaderTitle = computed(() => {
  if (selectedDateKey.value && selectedDateKey.value.startsWith(calendarMonthKey.value)) {
    return formatPlainReadable(selectedDateKey.value, { month: "short", day: "numeric", year: "numeric" });
  }
  return formatPlainReadable(`${calendarMonthKey.value}-01`, { month: "long", year: "numeric" });
});

const calendarCells = computed(() => {
  const year = calendarYear.value;
  const month = calendarMonth.value;
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 (Sun)..6 (Sat)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevMonthDate.getUTCFullYear();
  const prevMonth = prevMonthDate.getUTCMonth() + 1;
  const daysInPrevMonth = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();

  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = nextMonthDate.getUTCMonth() + 1;

  const billDotsByDay: Record<string, Array<"overdue" | "today" | "soon" | "paid">> = {};
  for (const b of bills.value) {
    if (!b.dueDate) continue;
    if (!billDotsByDay[b.dueDate]) billDotsByDay[b.dueDate] = [];
    billDotsByDay[b.dueDate].push(billTone(b));
  }

  const cells: Array<{
    dateKey: string;
    day: number;
    inCurrentMonth: boolean;
    isToday: boolean;
    dots: Array<"overdue" | "today" | "soon" | "paid">;
  }> = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const key = formatPlainDateKey(prevYear, prevMonth, day);
    cells.push({
      dateKey: key,
      day,
      inCurrentMonth: false,
      isToday: key === todayKey,
      dots: (billDotsByDay[key] || []).slice(0, 3)
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = formatPlainDateKey(year, month, day);
    cells.push({
      dateKey: key,
      day,
      inCurrentMonth: true,
      isToday: key === todayKey,
      dots: (billDotsByDay[key] || []).slice(0, 3)
    });
  }

  const remainder = cells.length % 7;
  const trailing = remainder === 0 ? 0 : 7 - remainder;
  for (let day = 1; day <= trailing; day++) {
    const key = formatPlainDateKey(nextYear, nextMonth, day);
    cells.push({
      dateKey: key,
      day,
      inCurrentMonth: false,
      isToday: key === todayKey,
      dots: (billDotsByDay[key] || []).slice(0, 3)
    });
  }

  return cells;
});

const calendarMonthOpenCount = computed(
  () =>
    bills.value.filter(
      (b) => b.status !== "Paid" && (b.dueDate || "").startsWith(calendarMonthKey.value)
    ).length
);

const timelineGroups = computed(() => {
  const monthPrefix = calendarMonthKey.value;
  const matching = bills.value.filter((b) => {
    if (selectedDateKey.value) return b.dueDate === selectedDateKey.value;
    return (b.dueDate || "").startsWith(monthPrefix);
  });

  const sorted = [...matching].sort((a, b) => String(a.dueDate || "").localeCompare(String(b.dueDate || "")));
  const groups: Record<string, { dateKey: string; heading: string; relativeCaption: string; items: BillRecord[] }> = {};

  for (const b of sorted) {
    const dk = b.dueDate || "unscheduled";
    if (!groups[dk]) {
      const heading =
        dk === "unscheduled"
          ? isTl.value
            ? "WALANG PETSA"
            : "UNSCHEDULED"
          : formatPlainReadable(dk, { weekday: "long", month: "short", day: "numeric", year: "numeric" }).toUpperCase();
      groups[dk] = {
        dateKey: dk,
        heading,
        relativeCaption: dk === todayKey ? (isTl.value ? "Ngayon" : "Today") : "",
        items: []
      };
    }
    groups[dk].items.push(b);
  }

  return Object.values(groups).map((g) => ({
    ...g,
    relativeCaption:
      g.relativeCaption ||
      `${g.items.length} ${g.items.length === 1 ? (isTl.value ? "paalala" : "reminder") : isTl.value ? "paalala" : "reminders"}`
  }));
});

function stepCalendarMonth(delta: number) {
  const next = new Date(Date.UTC(calendarYear.value, calendarMonth.value - 1 + delta, 1));
  calendarYear.value = next.getUTCFullYear();
  calendarMonth.value = next.getUTCMonth() + 1;
  selectedDateKey.value = null;
}

function toggleCalendarDay(dateKey: string, inCurrentMonth: boolean) {
  if (!inCurrentMonth) {
    const parts = parsePlainDate(dateKey);
    if (parts) {
      calendarYear.value = parts.year;
      calendarMonth.value = parts.month;
    }
  }
  selectedDateKey.value = selectedDateKey.value === dateKey ? null : dateKey;
}

function selectMobilePane(pane: "schedule" | "calendar") {
  mobilePane.value = pane;
}

function handlePaneTabKeydown(event: KeyboardEvent) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "Home" || event.key === "End") {
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "schedule"
        : event.key === "End"
          ? "calendar"
          : mobilePane.value === "schedule"
            ? "calendar"
            : "schedule";
    mobilePane.value = next;
    document.getElementById(`bills-tab-${next}`)?.focus();
  }
}

function focusCalendarView() {
  if (!isDesktop.value) {
    mobilePane.value = "calendar";
  } else {
    calendarSectionRef.value?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

function focusOverdueBills() {
  if (counts.value.overdueCount > 0) {
    statusFilter.value = "overdue";
    filtersOpen.value = true;
    if (!isDesktop.value) mobilePane.value = "schedule";
    pushToast(
      isTl.value
        ? `${counts.value.overdueCount} bayarin ang lampas na sa takdang petsa.`
        : `${counts.value.overdueCount} overdue commitment highlighted.`,
      "info"
    );
  } else {
    pushToast(isTl.value ? "Lahat ng bayarin ay nasa oras." : "All scheduled bills are on track.", "success");
  }
}

function openAddDialog(prefillDate?: string) {
  editingBill.value = null;
  billTitle.value = "";
  billAmount.value = "";
  billDueDate.value = prefillDate || selectedDateKey.value || todayKey;
  billCategory.value = BILL_CATEGORIES[0];
  billRecurrence.value = "none";
  billNotes.value = "";
  billError.value = "";
  addOpen.value = true;
}

function openEditDialog(bill: BillRecord) {
  editingBill.value = bill;
  billTitle.value = bill.title || "";
  billAmount.value = String(bill.amount ?? "");
  billDueDate.value = bill.dueDate || todayKey;
  billCategory.value = bill.category || BILL_CATEGORIES[0];
  billRecurrence.value = bill.recurrence || "none";
  billNotes.value = bill.notes || "";
  billError.value = "";
  addOpen.value = true;
}

function toggleEditingBillPaid() {
  const target = editingBill.value;
  addOpen.value = false;
  editingBill.value = null;
  if (target) {
    void togglePaid(target);
  }
}

function deleteEditingBill() {
  const target = editingBill.value;
  addOpen.value = false;
  editingBill.value = null;
  if (target) {
    pendingDelete.value = target;
  }
}

function handleExportBillsCsv() {
  if (bills.value.length === 0) {
    pushToast(isTl.value ? "Walang bayarin na mae-export." : "No bills scheduled to export.", "info");
    return;
  }
  const header = ["title", "category", "due_date", "amount", "status", "notes"];
  const rows = filteredBills.value.map((b) =>
    [
      b.title,
      b.category,
      b.dueDate,
      money(b.amount, { allowZero: true }),
      b.status,
      b.notes || ""
    ]
      .map(csvEscapeCell)
      .join(",")
  );
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tipid-bills-${todayKey}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  pushToast(isTl.value ? "Na-download ang CSV ng mga bayarin." : "Bills schedule CSV exported.", "success");
}

async function handleAddBill() {
  const uid = user.value?.uid;
  if (!uid) return;
  billError.value = "";

  const cleanTitle = billTitle.value.trim();
  if (!cleanTitle) {
    billError.value = isTl.value ? "Ilagay ang pangalan ng bayarin." : "Enter a bill title.";
    billTitleInputRef.value?.focus();
    return;
  }

  let safeAmount = 0;
  try {
    safeAmount = money(billAmount.value);
  } catch {
    billError.value = isTl.value ? "Ilagay ang tamang halaga na lampas sa ₱0." : "Enter a valid amount greater than ₱0.";
    billAmountInputRef.value?.focus();
    return;
  }

  if (!billDueDate.value) {
    billError.value = isTl.value ? "Pumili ng takdang petsa." : "Select a due date.";
    billDueDateInputRef.value?.focus();
    return;
  }

  savingBill.value = true;
  try {
    const payload = {
      title: cleanTitle,
      amount: safeAmount,
      dueDate: billDueDate.value,
      category: billCategory.value,
      recurrence: billRecurrence.value,
      notes: billNotes.value.trim()
    };
    if (editingBill.value) {
      const res = await updateBill(uid, editingBill.value.id, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Na-update ang bayarin." : "Bill updated.",
        isTl.value ? "Na-update offline — isi-sync online." : "Updated offline — syncs when online."
      );
    } else {
      const res = await addBill(uid, payload);
      notifyWriteResult(
        pushToast,
        res,
        isTl.value ? "Naidagdag ang bayarin." : "Bill added to schedule.",
        isTl.value ? "Na-save ang bayarin offline — isi-sync online." : "Bill saved offline — syncs when online."
      );
    }
    const savedDate = parsePlainDate(billDueDate.value);
    if (savedDate) {
      calendarYear.value = savedDate.year;
      calendarMonth.value = savedDate.month;
    }
    addOpen.value = false;
    editingBill.value = null;
  } catch (err) {
    billError.value = err instanceof Error ? err.message : "Could not save bill.";
  } finally {
    savingBill.value = false;
  }
}

async function togglePaid(bill: BillRecord) {
  const uid = user.value?.uid;
  if (!uid || togglingId.value) return;
  const markingPaid = bill.status !== "Paid";
  togglingId.value = bill.id;
  try {
    if (markingPaid) {
      const { nextDueDate } = await markBillPaidAndScheduleNext(uid, bill);
      pushToast(
        nextDueDate
          ? isTl.value
            ? `Bayad na. Susunod na due: ${nextDueDate}`
            : `Marked paid. Next due ${nextDueDate} scheduled.`
          : isTl.value
            ? "Minarkahang bayad."
            : "Marked as paid.",
        "success"
      );
    } else {
      await updateBillStatus(uid, bill.id, "Unpaid");
      pushToast(isTl.value ? "Ibinalik sa hindi pa bayad." : "Marked as unpaid.", "success");
    }
  } catch {
    pushToast(isTl.value ? "Hindi na-update ang bayarin." : "Could not update bill status.", "error");
  } finally {
    togglingId.value = null;
  }
}

async function confirmDeleteBill() {
  const uid = user.value?.uid;
  const target = pendingDelete.value;
  if (!uid || !target) return;
  deleting.value = true;
  try {
    await deleteBill(uid, target.id);
    pendingDelete.value = null;
    pushToast(isTl.value ? "Nabura ang bayarin." : "Bill deleted.", "info");
  } catch {
    pushToast(isTl.value ? "Hindi mabura ang bayarin." : "Could not delete bill.", "error");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <AppShell active-tab="bills" :user="user" :is-offline="isOffline" :is-locked="isLocked" @unlocked="unlockSession">
    <div v-if="user" class="space-y-5">
      <!-- Compact Header (Keeps Hero & Quick Actions Visible Above the Fold on Mobile) -->
      <header class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h1 class="truncate text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {{ t.billsTitle }}
          </h1>
          <p class="mt-0.5 hidden text-xs text-[var(--text-secondary)] sm:block">
            {{ t.billsSubtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <button
            type="button"
            class="tipid-card-interactive relative inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--text-primary)]"
            :aria-label="
              counts.overdueCount > 0
                ? `${counts.overdueCount} overdue bills`
                : isTl
                  ? 'Katayuan ng mga paalala'
                  : 'Bills reminder status'
            "
            @click="focusOverdueBills"
          >
            <Bell :size="17" aria-hidden="true" />
            <span
              v-if="counts.overdueCount > 0"
              class="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--expense)] ring-2 ring-[var(--bg-surface)]"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            class="tipid-cta hidden items-center gap-1.5 whitespace-nowrap rounded-xl bg-[var(--accent)] px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] sm:inline-flex"
            @click="openAddDialog()"
          >
            <Plus :size="15" aria-hidden="true" />
            <span>{{ t.addBill }}</span>
          </button>
        </div>
      </header>

      <!-- Hero Commitments Card (Tipid Signature Deep Emerald with Cycle Pill & Stacked Badges) -->
      <section aria-label="Bills cycle overview" class="tipid-card-emerald p-5 sm:p-6">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <span class="tipid-eyebrow text-white/75">
              {{ isTl ? "KABUUANG BABAYARAN" : "TOTAL UNPAID" }}
            </span>
            <p class="tipid-amount mt-1.5 font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl">
              ₱{{ heroSplit.whole }}<span class="text-xl font-semibold text-white/70 sm:text-2xl">{{ heroSplit.decimals }}</span>
            </p>
          </div>

          <select
            v-model="monthCycleFilter"
            :aria-label="isTl ? 'Pumili ng buwan' : 'Billing cycle month'"
            class="shrink-0 rounded-full border border-white/20 bg-white/14 px-3.5 py-1.5 text-xs font-semibold text-white outline-none backdrop-blur-xs focus:border-white/50 [&>option]:bg-[#101813] [&>option]:text-white"
          >
            <option value="all">{{ isTl ? "Lahat ng Aktibo" : "All Active" }}</option>
            <option v-for="m in availableMonths" :key="m.id" :value="m.id">{{ m.label }}</option>
          </select>
        </div>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/14 pt-3.5">
          <div class="flex flex-wrap items-center gap-2 text-xs text-white/90">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/14 px-2.5 py-1 font-medium">
              <CheckCircle2 :size="13" class="text-[#7BE5B5]" aria-hidden="true" />
              <span>₱{{ formatPeso(counts.paidTotal) }} {{ isTl ? "bayad" : "paid" }}</span>
            </span>
            <span class="font-mono text-[11px] font-semibold text-white/75">
              {{ counts.completionPct }}% {{ isTl ? "kumpleto" : "cleared" }}
            </span>
            <span
              :class="[
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold',
                freeAfterBills >= 0 ? 'bg-white/14 text-[#7BE5B5]' : 'bg-rose-500/25 text-rose-200'
              ]"
            >
              <Wallet :size="12" aria-hidden="true" />
              <span>{{ isTl ? "Natitirang Pondo:" : "After Bills:" }} {{ freeAfterBills < 0 ? "-" : "" }}₱{{ formatPeso(Math.abs(freeAfterBills)) }}</span>
            </span>
          </div>

          <div class="flex items-center gap-2.5">
            <div v-if="previewCategories.length > 0" class="flex items-center -space-x-2" aria-hidden="true">
              <span
                v-for="cat in previewCategories"
                :key="cat"
                class="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/18 text-white shadow-xs backdrop-blur-xs"
              >
                <component :is="getCategoryIcon(cat)" :size="13" />
              </span>
            </div>
            <span class="text-xs font-semibold text-white/90">
              {{ counts.openCount }}
              {{
                isTl
                  ? "aktibong bayarin"
                  : counts.openCount === 1
                    ? "active commitment"
                    : "active commitments"
              }}
            </span>
          </div>
        </div>
      </section>

      <!-- 4 Quick Action Tiles (Matches Mockup Action Strip in Tipid Colors) -->
      <section aria-label="Quick bill actions" class="grid grid-cols-4 gap-2.5 sm:gap-3">
        <button
          type="button"
          class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
          @click="openAddDialog()"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]" aria-hidden="true">
            <Plus :size="17" />
          </span>
          <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "Idagdag" : "Add" }}</span>
        </button>

        <button
          type="button"
          class="tipid-card-interactive relative flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
          @click="
            filtersOpen = !filtersOpen;
            if (!isDesktop) selectMobilePane('schedule');
          "
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--income-soft)] text-[var(--income)]" aria-hidden="true">
            <SlidersHorizontal :size="16" />
          </span>
          <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "Salain" : "Filter" }}</span>
          <span
            v-if="hasActiveFilter"
            class="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--accent)]"
            aria-hidden="true"
          />
        </button>

        <button
          type="button"
          class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
          @click="focusCalendarView"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[var(--warning)]" aria-hidden="true">
            <CalendarDays :size="16" />
          </span>
          <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "Kalendaryo" : "Calendar" }}</span>
        </button>

        <button
          type="button"
          class="tipid-card-interactive flex flex-col items-center justify-center gap-1.5 px-2 py-3 text-center"
          @click="handleExportBillsCsv"
        >
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-inset)] text-[var(--text-secondary)]" aria-hidden="true">
            <Download :size="16" />
          </span>
          <span class="text-[11px] font-semibold text-[var(--text-primary)]">{{ isTl ? "I-export" : "Export" }}</span>
        </button>
      </section>

      <!-- Mobile View Switcher (Schedule List <-> Reminders Calendar) -->
      <div v-if="!isDesktop" class="flex items-center justify-between gap-2">
        <div
          role="tablist"
          :aria-label="isTl ? 'Pananaw ng bayarin' : 'Bills view mode'"
          class="tipid-tablist tipid-tablist-2 w-full"
        >
          <button
            id="bills-tab-schedule"
            type="button"
            role="tab"
            class="tipid-tab"
            :aria-selected="mobilePane === 'schedule'"
            :tabindex="mobilePane === 'schedule' ? 0 : -1"
            @click="selectMobilePane('schedule')"
            @keydown="handlePaneTabKeydown"
          >
            {{ isTl ? "Nakatakda" : "Upcoming" }}
          </button>
          <button
            id="bills-tab-calendar"
            type="button"
            role="tab"
            class="tipid-tab"
            :aria-selected="mobilePane === 'calendar'"
            :tabindex="mobilePane === 'calendar' ? 0 : -1"
            @click="selectMobilePane('calendar')"
            @keydown="handlePaneTabKeydown"
          >
            {{ isTl ? "Paalala at Petsa" : "Calendar" }}
          </button>
        </div>
      </div>

      <!-- Dual-Column Desktop / Tabbed Mobile Content Grid -->
      <div class="grid grid-cols-1 gap-0 lg:grid-cols-12 lg:gap-5">
        <!-- LEFT / SCHEDULE PANEL -->
        <section
          id="bills-panel-schedule"
          :role="!isDesktop ? 'tabpanel' : undefined"
          :aria-labelledby="!isDesktop ? 'bills-tab-schedule' : undefined"
          :aria-label="isDesktop ? (isTl ? 'Listahan ng mga bayarin' : 'Upcoming payments') : undefined"
          :tabindex="!isDesktop && mobilePane === 'schedule' ? 0 : undefined"
          :hidden="!isDesktop && mobilePane !== 'schedule' ? 'until-found' : undefined"
          class="max-lg:col-start-1 max-lg:row-start-1 lg:col-span-7"
          @beforematch="selectMobilePane('schedule')"
        >
          <div class="space-y-3">
            <!-- Section Header + See All Pill -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-[var(--text-primary)]">
                  {{ isTl ? "Nakatakdang Bayarin" : "Upcoming payments" }}
                </h2>
                <span class="rounded-full bg-[var(--bg-inset)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--text-secondary)]">
                  {{ filteredBills.length }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button
                  v-if="hasActiveFilter"
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-[var(--bg-inset)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  @click="resetFilters"
                >
                  <RotateCcw :size="12" aria-hidden="true" />
                  <span>{{ isTl ? "I-reset" : "Reset" }}</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-1 rounded-full bg-[var(--hero-card-start)] px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                  @click="statusFilter = statusFilter === 'upcoming' ? 'all' : 'upcoming'"
                >
                  <span>{{ statusFilter === "upcoming" ? (isTl ? "Lahat" : "See all") : isTl ? "Aktibo" : "Open only" }}</span>
                  <ChevronRight :size="13" aria-hidden="true" />
                </button>
              </div>
            </div>

            <!-- Collapsible Search, Status & Sort Bar (Shown when toggled or filtered; always clean) -->
            <div v-if="filtersOpen || hasActiveFilter" role="search" aria-label="Filter bills" class="tipid-card space-y-3 p-3.5">
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="tab in [
                    { id: 'all', label: `${t.commonAll} (${counts.total})` },
                    { id: 'upcoming', label: `${isTl ? 'Nakatakda' : 'Upcoming'} (${counts.upcomingCount})` },
                    { id: 'overdue', label: `${isTl ? 'Lampas' : 'Overdue'} (${counts.overdueCount})` },
                    { id: 'paid', label: `${isTl ? 'Bayad' : 'Paid'} (${counts.paidCount})` }
                  ]"
                  :key="tab.id"
                  type="button"
                  :class="[
                    'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                    statusFilter === tab.id
                      ? 'bg-[var(--hero-card-start)] text-white'
                      : 'bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  ]"
                  @click="statusFilter = tab.id as typeof statusFilter"
                >
                  {{ tab.label }}
                </button>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row">
                <div class="relative min-w-0 flex-1">
                  <Search
                    :size="14"
                    class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    aria-hidden="true"
                  />
                  <input
                    v-model="searchQuery"
                    type="search"
                    class="tipid-input min-h-[44px] py-1.5 pl-9 text-base sm:min-h-[38px] sm:text-xs"
                    :placeholder="isTl ? 'Hanapin ang bayarin...' : 'Search bills...'"
                    aria-label="Search bills"
                  />
                </div>

                <select
                  v-model="sortBy"
                  class="tipid-input min-h-[44px] py-1.5 text-base sm:min-h-[38px] sm:w-40 sm:text-xs"
                  aria-label="Sort bills"
                >
                  <option value="dueDate">{{ isTl ? "Takdang Petsa" : "Due Date" }}</option>
                  <option value="amount">{{ isTl ? "Pinakamalaki" : "Highest Amount" }}</option>
                  <option value="title">{{ isTl ? "Pangalan A–Z" : "Title A–Z" }}</option>
                </select>
              </div>
            </div>

            <!-- Bills List / Empty State -->
            <div v-if="loadingBills" class="tipid-card py-12 text-center text-sm text-[var(--text-muted)]">
              {{ isTl ? "Kinukuha ang mga bayarin..." : "Loading bills schedule..." }}
            </div>

            <div v-else-if="filteredBills.length === 0" class="tipid-card flex flex-col items-center px-6 py-12 text-center">
              <div class="tipid-icon-badge h-12 w-12 rounded-2xl bg-[var(--bg-inset)] text-[var(--text-muted)]">
                <Calendar :size="22" aria-hidden="true" />
              </div>
              <p class="mt-3 text-sm font-semibold text-[var(--text-primary)]">
                {{
                  bills.length === 0
                    ? isTl
                      ? "Wala pang nakalistang bayarin."
                      : "No bills scheduled yet."
                    : isTl
                      ? "Walang tugmang bayarin sa filter."
                      : "No bills match this filter."
                }}
              </p>
              <p class="mt-1 max-w-xs text-xs text-[var(--text-muted)]">
                {{
                  bills.length === 0
                    ? isTl
                      ? "Idagdag ang kuryente, internet, o installment para hindi makalimutan."
                      : "Add recurring utilities, subscriptions, or due balances to stay ahead."
                    : isTl
                      ? "Subukang ibalik ang filter sa Lahat."
                      : "Clear filters or select another billing cycle above."
                }}
              </p>
              <button
                v-if="bills.length === 0"
                type="button"
                class="tipid-cta mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--accent-hover)]"
                @click="openAddDialog()"
              >
                <Plus :size="14" aria-hidden="true" />
                <span>{{ t.addBill }}</span>
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

            <ul v-else class="space-y-2.5">
              <li v-for="bill in filteredBills" :key="bill.id">
                <article class="tipid-card-interactive tipid-card-has-action flex items-center justify-between gap-3 p-3.5 sm:px-4">
                  <div class="flex min-w-0 items-center gap-3">
                    <label class="tipid-checkbox-label shrink-0">
                      <input
                        type="checkbox"
                        class="tipid-checkbox"
                        :checked="bill.status === 'Paid'"
                        :disabled="togglingId === bill.id"
                        :aria-label="bill.status === 'Paid' ? `Mark ${bill.title} as unpaid` : `Mark ${bill.title} as paid`"
                        @change="togglePaid(bill)"
                      />
                    </label>

                    <div
                      :class="[
                        'tipid-icon-badge h-11 w-11 shrink-0 rounded-2xl',
                        bill.status === 'Paid'
                          ? 'bg-[var(--income-soft)] text-[var(--income)]'
                          : dueRelativeLabel(bill).tone === 'overdue'
                            ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                            : dueRelativeLabel(bill).tone === 'today'
                              ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                              : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      ]"
                      aria-hidden="true"
                    >
                      <component :is="getCategoryIcon(bill.category)" :size="19" />
                    </div>

                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <h3 class="min-w-0">
                          <button
                            type="button"
                            :class="[
                              'tipid-card-action truncate text-sm font-bold',
                              bill.status === 'Paid' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                            ]"
                            @click="openEditDialog(bill)"
                          >
                            {{ bill.title }}
                          </button>
                        </h3>
                        <span
                          :class="[
                            'rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide',
                            dueRelativeLabel(bill).tone === 'overdue'
                              ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                              : dueRelativeLabel(bill).tone === 'today'
                                ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                                : dueRelativeLabel(bill).tone === 'paid'
                                  ? 'bg-[var(--income-soft)] text-[var(--income)]'
                                  : 'bg-[var(--bg-inset)] text-[var(--text-secondary)]'
                          ]"
                        >
                          {{ dueRelativeLabel(bill).text }}
                        </span>
                        <span
                          v-if="recurrenceLabel(bill.recurrence)"
                          class="inline-flex items-center gap-1 rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--accent)]"
                        >
                          <Repeat :size="10" aria-hidden="true" />
                          <span>{{ recurrenceLabel(bill.recurrence) }}</span>
                        </span>
                      </div>

                      <p class="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                        {{ formatDueDate(bill.dueDate) }} · {{ bill.category }}
                        <template v-if="bill.notes"> · {{ bill.notes }}</template>
                      </p>
                    </div>
                  </div>

                  <div class="flex shrink-0 items-center gap-2">
                    <div class="text-right">
                      <p
                        :class="[
                          'tipid-amount font-mono text-sm font-bold sm:text-base',
                          bill.status === 'Paid' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                        ]"
                      >
                        ₱{{ splitPesoParts(bill.amount).whole }}<span class="text-xs font-medium opacity-65">{{ splitPesoParts(bill.amount).decimals }}</span>
                      </p>
                      <p class="text-[10px] font-medium text-[var(--text-muted)]">
                        {{ bill.status === "Paid" ? (isTl ? "Bayad" : "settled") : isTl ? "nakatakda" : "scheduled" }}
                      </p>
                    </div>

                    <button
                      type="button"
                      class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--expense-soft)] hover:text-[var(--expense)]"
                      :aria-label="`Delete ${bill.title}`"
                      @click="pendingDelete = bill"
                    >
                      <Trash2 :size="15" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            </ul>
          </div>
        </section>

        <!-- RIGHT / CALENDAR & REMINDERS TIMELINE PANEL -->
        <section
          id="bills-panel-calendar"
          ref="calendarSectionRef"
          :role="!isDesktop ? 'tabpanel' : undefined"
          :aria-labelledby="!isDesktop ? 'bills-tab-calendar' : undefined"
          :aria-label="isDesktop ? (isTl ? 'Kalendaryo at timeline ng bayarin' : 'Bills calendar and reminders') : undefined"
          :tabindex="!isDesktop && mobilePane === 'calendar' ? 0 : undefined"
          :hidden="!isDesktop && mobilePane !== 'calendar' ? 'until-found' : undefined"
          class="max-lg:col-start-1 max-lg:row-start-1 lg:col-span-5"
          @beforematch="selectMobilePane('calendar')"
        >
          <div class="space-y-4">
            <!-- Interactive Month Calendar Card -->
            <div class="tipid-card p-4 sm:p-5">
              <div class="mb-3 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <h2 class="truncate text-base font-bold text-[var(--text-primary)]">
                    {{ calendarHeaderTitle }}
                  </h2>
                  <p class="text-[11px] text-[var(--text-muted)]">
                    {{ calendarMonthOpenCount }}
                    {{
                      isTl
                        ? "aktibong paalala ngayong buwan"
                        : calendarMonthOpenCount === 1
                          ? "active commitment this month"
                          : "active commitments this month"
                    }}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-1.5">
                  <button
                    v-if="selectedDateKey"
                    type="button"
                    class="rounded-full bg-[var(--bg-inset)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent)] hover:bg-[var(--accent-soft)]"
                    @click="selectedDateKey = null"
                  >
                    {{ isTl ? "Buong buwan" : "All month" }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
                    :aria-label="isTl ? 'Nakaraang buwan' : 'Previous month'"
                    @click="stepCalendarMonth(-1)"
                  >
                    <ChevronLeft :size="15" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
                    :aria-label="isTl ? 'Susunod na buwan' : 'Next month'"
                    @click="stepCalendarMonth(1)"
                  >
                    <ChevronRight :size="15" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div class="mt-2 grid grid-cols-7 gap-1">
                <button
                  v-for="cell in calendarCells"
                  :key="cell.dateKey"
                  type="button"
                  :aria-label="`${formatPlainReadable(cell.dateKey, { month: 'short', day: 'numeric', year: 'numeric' })}${cell.dots.length ? `, ${cell.dots.length} bill due` : ''}`"
                  :aria-pressed="selectedDateKey === cell.dateKey"
                  :class="[
                    'flex min-h-[42px] flex-col items-center justify-center rounded-xl py-1 text-xs transition-colors',
                    selectedDateKey === cell.dateKey || (!selectedDateKey && cell.isToday)
                      ? 'bg-[var(--hero-card-start)] font-bold text-white shadow-xs'
                      : cell.inCurrentMonth
                        ? 'font-medium text-[var(--text-primary)] hover:bg-[var(--bg-inset)]'
                        : 'text-[var(--text-muted)] opacity-45 hover:bg-[var(--bg-inset)]/60'
                  ]"
                  @click="toggleCalendarDay(cell.dateKey, cell.inCurrentMonth)"
                >
                  <span>{{ cell.day }}</span>
                  <span v-if="cell.dots.length > 0" class="mt-0.5 flex items-center gap-0.5" aria-hidden="true">
                    <span
                      v-for="(dotTone, idx) in cell.dots"
                      :key="idx"
                      :class="[
                        'h-1.5 w-1.5 rounded-full',
                        dotTone === 'overdue'
                          ? 'bg-[var(--expense)]'
                          : dotTone === 'today'
                            ? 'bg-[var(--warning)]'
                            : dotTone === 'paid'
                              ? 'bg-[var(--income)]'
                              : selectedDateKey === cell.dateKey || (!selectedDateKey && cell.isToday)
                                ? 'bg-white'
                                : 'bg-[var(--accent)]'
                      ]"
                    />
                  </span>
                </button>
              </div>
            </div>

            <!-- Date-Grouped Reminders Timeline -->
            <div v-if="timelineGroups.length === 0" class="tipid-card flex flex-col items-center px-5 py-8 text-center">
              <p class="text-xs font-semibold text-[var(--text-primary)]">
                {{
                  selectedDateKey
                    ? isTl
                      ? `Walang bayaring nakatakda sa ${formatDueDate(selectedDateKey)}.`
                      : `No bills due on ${formatDueDate(selectedDateKey)}.`
                    : isTl
                      ? "Walang nakatakdang bayarin sa buwang ito."
                      : "No commitments scheduled for this month."
                }}
              </p>
              <button
                type="button"
                class="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                @click="openAddDialog(selectedDateKey || `${calendarMonthKey}-15`)"
              >
                <Plus :size="13" aria-hidden="true" />
                <span>{{ isTl ? "Magtakda sa petsang ito" : "Schedule Bill Here" }}</span>
              </button>
            </div>

            <div v-else class="space-y-4">
              <div v-for="group in timelineGroups" :key="group.dateKey" class="space-y-2.5">
                <div class="flex items-center justify-between gap-2 px-1">
                  <span class="text-[11px] font-bold tracking-wider text-[var(--text-primary)]">
                    {{ group.heading }}
                  </span>
                  <span class="text-[11px] font-medium text-[var(--text-muted)]">
                    {{ group.relativeCaption }}
                  </span>
                </div>

                <ul class="space-y-2.5">
                  <li v-for="(bill, idx) in group.items" :key="bill.id" class="relative flex items-stretch gap-3">
                    <!-- Timeline Dot & Connector Rail -->
                    <div class="relative flex w-4 shrink-0 flex-col items-center pt-4" aria-hidden="true">
                      <span
                        :class="[
                          'z-10 h-3 w-3 rounded-full border-2 bg-[var(--bg-canvas)]',
                          bill.status === 'Paid'
                            ? 'border-[var(--income)]'
                            : billTone(bill) === 'overdue'
                              ? 'border-[var(--expense)]'
                              : billTone(bill) === 'today'
                                ? 'border-[var(--warning)]'
                                : 'border-[var(--accent)]'
                        ]"
                      />
                      <span
                        v-if="idx < group.items.length - 1"
                        class="mt-1 w-0.5 flex-1 bg-[var(--border-subtle)]"
                      />
                    </div>

                    <article class="tipid-card-interactive tipid-card-has-action flex flex-1 items-center justify-between gap-2.5 p-3">
                      <div class="flex min-w-0 items-center gap-2.5">
                        <label class="tipid-checkbox-label shrink-0">
                          <input
                            type="checkbox"
                            class="tipid-checkbox"
                            :checked="bill.status === 'Paid'"
                            :disabled="togglingId === bill.id"
                            :aria-label="bill.status === 'Paid' ? `Mark ${bill.title} as unpaid` : `Mark ${bill.title} as paid`"
                            @change="togglePaid(bill)"
                          />
                        </label>

                        <span
                          :class="[
                            'tipid-icon-badge h-9 w-9 shrink-0 rounded-xl',
                            bill.status === 'Paid'
                              ? 'bg-[var(--income-soft)] text-[var(--income)]'
                              : billTone(bill) === 'overdue'
                                ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                                : billTone(bill) === 'today'
                                  ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                                  : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                          ]"
                          aria-hidden="true"
                        >
                          <component :is="getCategoryIcon(bill.category)" :size="16" />
                        </span>

                        <div class="min-w-0">
                          <p class="min-w-0">
                            <button
                              type="button"
                              :class="[
                                'tipid-card-action truncate text-xs font-bold sm:text-sm',
                                bill.status === 'Paid' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                              ]"
                              @click="openEditDialog(bill)"
                            >
                              {{ bill.title }}
                            </button>
                          </p>
                          <p class="truncate text-[11px] text-[var(--text-muted)]">
                            {{ bill.category }}
                            <template v-if="recurrenceLabel(bill.recurrence)"> · {{ recurrenceLabel(bill.recurrence) }}</template>
                            <template v-if="bill.notes"> · {{ bill.notes }}</template>
                          </p>
                        </div>
                      </div>

                      <div class="shrink-0 text-right">
                        <p class="tipid-amount font-mono text-xs font-bold text-[var(--text-primary)] sm:text-sm">
                          ₱{{ formatPeso(bill.amount) }}
                        </p>
                        <p class="inline-flex items-center justify-end gap-1 text-[10px] font-medium text-[var(--text-muted)]">
                          <AlertTriangle v-if="billTone(bill) === 'overdue'" :size="10" class="text-[var(--expense)]" aria-hidden="true" />
                          <CheckCircle2 v-else-if="bill.status === 'Paid'" :size="10" class="text-[var(--income)]" aria-hidden="true" />
                          <Clock v-else :size="10" aria-hidden="true" />
                          <span>{{ dueRelativeLabel(bill).text }}</span>
                        </p>
                      </div>
                    </article>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Add / Edit Bill Dialog -->
    <BaseDialog
      :open="addOpen"
      :title="editingBill ? (isTl ? 'I-edit ang Bayarin' : 'Edit Bill') : t.addBill"
      :subtitle="
        editingBill
          ? isTl
            ? 'Baguhin ang halaga, takdang petsa, o markahang bayad.'
            : 'Update bill details, mark it paid, or adjust due date.'
          : isTl
            ? 'Magtakda ng bagong bayarin at due date.'
            : 'Schedule a recurring utility, subscription, or due balance.'
      "
      @close="addOpen = false; editingBill = null"
    >
      <form class="space-y-4" novalidate @submit.prevent="handleAddBill">
        <div>
          <label for="bill-title" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Pangalan ng Bayarin" : "Bill Title" }}
          </label>
          <input
            id="bill-title"
            ref="billTitleInputRef"
            v-model="billTitle"
            type="text"
            maxlength="120"
            required
            class="tipid-input text-base sm:text-sm"
            :placeholder="isTl ? 'hal. Meralco, PLDT Fiber, Upa' : 'e.g. Meralco, PLDT Fiber, Apartment Rent'"
            @input="billError = ''"
          />
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label for="bill-amount" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Halaga (PHP)" : "Amount (PHP)" }}
            </label>
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
              <input
                id="bill-amount"
                ref="billAmountInputRef"
                v-model="billAmount"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0.01"
                required
                class="tipid-input pl-8 font-mono text-base sm:text-sm"
                placeholder="0.00"
                @input="billError = ''"
              />
            </div>
          </div>

          <div>
            <label for="bill-date" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
              {{ isTl ? "Takdang Petsa" : "Due Date" }}
            </label>
            <input
              id="bill-date"
              ref="billDueDateInputRef"
              v-model="billDueDate"
              type="date"
              required
              class="tipid-input text-base sm:text-sm"
              @input="billError = ''"
            />
          </div>
        </div>

        <div>
          <label for="bill-category" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Kategorya" : "Category" }}
          </label>
          <select id="bill-category" v-model="billCategory" class="tipid-input text-base sm:text-sm">
            <option v-for="cat in billCategoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <fieldset class="space-y-1.5">
          <legend class="text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Uulit ba tuwing..." : "Repeat Schedule" }}
          </legend>
          <div class="grid grid-cols-5 gap-1.5">
            <label
              v-for="opt in recurrenceOptions"
              :key="opt.id"
              :class="[
                'flex cursor-pointer items-center justify-center rounded-xl border px-1.5 py-2 text-center text-[11px] font-semibold transition-colors',
                billRecurrence === opt.id
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              ]"
            >
              <input v-model="billRecurrence" type="radio" name="bill-recurrence" :value="opt.id" class="visually-hidden" />
              {{ opt.label }}
            </label>
          </div>
        </fieldset>

        <div>
          <label for="bill-notes" class="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
            {{ isTl ? "Tala (Opsyonal)" : "Notes (Optional)" }}
          </label>
          <textarea
            id="bill-notes"
            v-model="billNotes"
            rows="2"
            maxlength="500"
            class="tipid-input resize-y text-base sm:text-sm"
            :placeholder="isTl ? 'Account number o paalala...' : 'Account number or payment channel...'"
          />
        </div>

        <p v-if="billError" role="alert" class="text-xs font-medium text-[var(--expense)]">
          {{ billError }}
        </p>

        <div class="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <div v-if="editingBill" class="flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
              :disabled="savingBill || togglingId === editingBill.id"
              @click="toggleEditingBillPaid"
            >
              <CheckCircle2 :size="14" class="text-[var(--income)]" aria-hidden="true" />
              <span>{{ editingBill.status === "Paid" ? (isTl ? "Markahang Hindi Pa Bayad" : "Mark Unpaid") : (isTl ? "Markahang Bayad" : "Mark Paid") }}</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--expense)]/35 bg-[var(--expense-soft)]/50 px-3.5 py-2 text-xs font-semibold text-[var(--expense)] hover:bg-[var(--expense)] hover:text-white"
              :disabled="savingBill"
              @click="deleteEditingBill"
            >
              <Trash2 :size="14" aria-hidden="true" />
              <span>{{ t.commonDelete }}</span>
            </button>
          </div>

          <div class="flex flex-col-reverse gap-2.5 sm:ml-auto sm:flex-row">
            <button
              type="button"
              class="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
              :disabled="savingBill"
              @click="addOpen = false; editingBill = null"
            >
              {{ t.commonCancel }}
            </button>
            <button
              type="submit"
              class="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              :disabled="savingBill"
            >
              {{ savingBill ? t.commonSaving : editingBill ? (isTl ? "I-save ang Pagbabago" : "Save changes") : t.commonSave }}
            </button>
          </div>
        </div>
      </form>
    </BaseDialog>

    <!-- Confirm Delete -->
    <ConfirmDialog
      :open="Boolean(pendingDelete)"
      :title="isTl ? 'Burahin ang bayarin?' : 'Delete bill?'"
      :message="
        pendingDelete
          ? `${pendingDelete.title} (₱${formatPeso(pendingDelete.amount)}) will be permanently removed.`
          : ''
      "
      :confirm-label="t.commonDelete"
      :cancel-label="t.commonCancel"
      :loading="deleting"
      @cancel="pendingDelete = null"
      @confirm="confirmDeleteBill"
    />
  </AppShell>
</template>
