<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend
} from "chart.js";
import { entryDate, formatPeso, fromCentavos, manilaDateKey, toCentavos } from "@/lib/core";
import { useTheme } from "@/composables/useTheme";
import { useI18n } from "@/lib/i18n";
import type { TransactionEntry } from "@/types/finance";

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
  Legend
);

export type ChartHorizon = "thisWeek" | "thisMonth" | "last30Days" | "last6Months" | "all";
export type ChartMode = "daily" | "cumulative" | "flow" | "income" | "expense";

const props = withDefaults(
  defineProps<{
    entries: TransactionEntry[];
    horizon: ChartHorizon;
    mode?: ChartMode;
    hideSummaryBoxes?: boolean;
  }>(),
  {
    mode: "daily",
    hideSummaryBoxes: false
  }
);

const { isDark } = useTheme();
const { isTl } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const series = computed(() => {
  const now = new Date();
  const useMonthlyBuckets =
    props.horizon === "last6Months" || (props.horizon === "all" && (props.mode === "income" || props.mode === "expense"));

  if (useMonthlyBuckets) {
    const monthCount = props.horizon === "last6Months" ? 6 : 12;
    const monthMap: Record<string, { expenseCents: number; incomeCents: number; dateObj: Date }> = {};
    for (let i = monthCount - 1; i >= 0; i--) {
      const mDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mKey = `${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, "0")}`;
      monthMap[mKey] = { expenseCents: 0, incomeCents: 0, dateObj: mDate };
    }

    for (const e of props.entries) {
      const d = entryDate(e);
      if (!d) continue;
      const dKey = manilaDateKey(d);
      const mKey = dKey ? dKey.slice(0, 7) : "";
      if (!mKey || !monthMap[mKey]) continue;
      let amt = 0;
      try {
        amt = toCentavos(e.amount, { allowZero: true });
      } catch {
        continue;
      }
      if (e.type === "income") {
        monthMap[mKey].incomeCents += amt;
      } else if (e.type === "expense") {
        monthMap[mKey].expenseCents += amt;
      }
    }

    const labels: string[] = [];
    const expenseVals: number[] = [];
    const incomeVals: number[] = [];
    const cumulativeVals: number[] = [];
    let cumCents = 0;
    let totalExpCents = 0;
    let totalIncCents = 0;

    for (const k of Object.keys(monthMap).sort()) {
      const item = monthMap[k];
      labels.push(item.dateObj.toLocaleDateString("en-US", { month: "short" }));
      const exp = fromCentavos(item.expenseCents);
      const inc = fromCentavos(item.incomeCents);
      expenseVals.push(exp);
      incomeVals.push(inc);
      cumCents += item.expenseCents;
      totalExpCents += item.expenseCents;
      totalIncCents += item.incomeCents;
      cumulativeVals.push(fromCentavos(cumCents));
    }

    const totalPeriodExpense = fromCentavos(totalExpCents);
    const totalPeriodIncome = fromCentavos(totalIncCents);
    const avgDailyExpense = expenseVals.length > 0 ? fromCentavos(Math.round(totalExpCents / expenseVals.length)) : 0;
    const avgDailyIncome = incomeVals.length > 0 ? fromCentavos(Math.round(totalIncCents / incomeVals.length)) : 0;
    const peakDayExpense = Math.max(...expenseVals, 0);
    const peakDayIncome = Math.max(...incomeVals, 0);

    return {
      labels,
      expenseVals,
      incomeVals,
      cumulativeVals,
      totalPeriodExpense,
      totalPeriodIncome,
      avgDailyExpense,
      avgDailyIncome,
      peakDayExpense,
      peakDayIncome
    };
  }

  let startDate: Date;
  if (props.horizon === "thisWeek") {
    const day = (now.getDay() + 6) % 7;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  } else if (props.horizon === "last30Days") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (props.horizon === "all") {
    startDate = new Date(now.getFullYear(), 0, 1);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const dayMap: Record<string, { expenseCents: number; incomeCents: number; dateObj: Date }> = {};
  const cur = new Date(startDate);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  while (cur <= end) {
    const k = manilaDateKey(cur);
    if (k) {
      dayMap[k] = { expenseCents: 0, incomeCents: 0, dateObj: new Date(cur) };
    }
    cur.setDate(cur.getDate() + 1);
  }

  for (const e of props.entries) {
    const d = entryDate(e);
    if (!d) continue;
    const k = manilaDateKey(d);
    if (!k || !dayMap[k]) continue;
    let amt = 0;
    try {
      amt = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    if (e.type === "income") {
      dayMap[k].incomeCents += amt;
    } else if (e.type === "expense") {
      dayMap[k].expenseCents += amt;
    }
  }

  const labels: string[] = [];
  const expenseVals: number[] = [];
  const incomeVals: number[] = [];
  const cumulativeVals: number[] = [];
  let cumCents = 0;
  let totalPeriodCents = 0;
  let totalPeriodIncomeCents = 0;

  for (const k of Object.keys(dayMap).sort()) {
    const item = dayMap[k];
    labels.push(item.dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
    const exp = fromCentavos(item.expenseCents);
    const inc = fromCentavos(item.incomeCents);
    expenseVals.push(exp);
    incomeVals.push(inc);
    cumCents += item.expenseCents;
    totalPeriodCents += item.expenseCents;
    totalPeriodIncomeCents += item.incomeCents;
    cumulativeVals.push(fromCentavos(cumCents));
  }

  const totalPeriodExpense = fromCentavos(totalPeriodCents);
  const totalPeriodIncome = fromCentavos(totalPeriodIncomeCents);
  const avgDailyExpense = expenseVals.length > 0 ? fromCentavos(Math.round(totalPeriodCents / expenseVals.length)) : 0;
  const avgDailyIncome = incomeVals.length > 0 ? fromCentavos(Math.round(totalPeriodIncomeCents / incomeVals.length)) : 0;
  const peakDayExpense = Math.max(...expenseVals, 0);
  const peakDayIncome = Math.max(...incomeVals, 0);

  return {
    labels,
    expenseVals,
    incomeVals,
    cumulativeVals,
    totalPeriodExpense,
    totalPeriodIncome,
    avgDailyExpense,
    avgDailyIncome,
    peakDayExpense,
    peakDayIncome
  };
});

function renderChart() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const dark = isDark.value;
  const tickColor = dark ? "rgba(241, 245, 242, 0.56)" : "rgba(13, 22, 17, 0.56)";
  const gridColor = dark ? "rgba(255, 255, 255, 0.06)" : "rgba(13, 22, 17, 0.06)";
  const accentColor = dark ? "#32BE8C" : "#146348";
  const expenseColor = dark ? "#F08A78" : "#B64236";
  const incomeColor = dark ? "#38CC90" : "#13784C";
  const mutedBarColor = dark ? "rgba(241, 245, 242, 0.13)" : "#E2E8E3";
  const tooltipBg = dark ? "#17231C" : "#0D1611";
  const data = series.value;

  const peakIncomeVal = Math.max(...data.incomeVals, 0);
  const peakExpenseVal = Math.max(...data.expenseVals, 0);

  const datasets =
    props.mode === "daily"
      ? [
          {
            type: "bar" as const,
            label: isTl.value ? "Gastos" : "Daily Spend",
            data: data.expenseVals,
            backgroundColor: dark ? "rgba(240, 138, 120, 0.82)" : "rgba(182, 66, 54, 0.84)",
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 22,
            order: 2
          },
          {
            type: "line" as const,
            label: isTl.value ? "Karaniwan" : "Daily Avg",
            data: data.labels.map(() => data.avgDailyExpense),
            borderColor: dark ? "rgba(232, 184, 92, 0.82)" : "rgba(155, 100, 11, 0.78)",
            borderWidth: 1.5,
            borderDash: [4, 4],
            pointRadius: 0,
            fill: false,
            order: 1
          }
        ]
      : props.mode === "cumulative"
        ? [
            {
              type: "line" as const,
              label: isTl.value ? "Kabuuan" : "Cumulative Outflow",
              data: data.cumulativeVals,
              borderColor: accentColor,
              backgroundColor: dark ? "rgba(50, 190, 140, 0.14)" : "rgba(20, 99, 72, 0.11)",
              borderWidth: 2.25,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: accentColor,
              tension: 0.28,
              fill: true
            }
          ]
        : props.mode === "income"
          ? [
              {
                type: "bar" as const,
                label: isTl.value ? "Kita" : "Inflow",
                data: data.incomeVals,
                backgroundColor: data.incomeVals.map((v) =>
                  v > 0 && v === peakIncomeVal ? incomeColor : mutedBarColor
                ),
                hoverBackgroundColor: incomeColor,
                borderRadius: 8,
                borderSkipped: false,
                maxBarThickness: 34
              }
            ]
          : props.mode === "expense"
            ? [
                {
                  type: "bar" as const,
                  label: isTl.value ? "Gastos" : "Outflow",
                  data: data.expenseVals,
                  backgroundColor: data.expenseVals.map((v) =>
                    v > 0 && v === peakExpenseVal ? expenseColor : mutedBarColor
                  ),
                  hoverBackgroundColor: expenseColor,
                  borderRadius: 8,
                  borderSkipped: false,
                  maxBarThickness: 34
                }
              ]
            : [
                {
                  type: "bar" as const,
                  label: isTl.value ? "Kita" : "Inflow",
                  data: data.incomeVals,
                  backgroundColor: incomeColor,
                  borderRadius: 6,
                  borderSkipped: false,
                  maxBarThickness: 18
                },
                {
                  type: "bar" as const,
                  label: isTl.value ? "Gastos" : "Outflow",
                  data: data.expenseVals,
                  backgroundColor: expenseColor,
                  borderRadius: 6,
                  borderSkipped: false,
                  maxBarThickness: 18
                }
              ];

  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const maxVal =
    props.mode === "income"
      ? peakIncomeVal
      : props.mode === "expense" || props.mode === "daily"
        ? peakExpenseVal
        : Math.max(...data.expenseVals, ...data.incomeVals, ...data.cumulativeVals, 0);

  chartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels: data.labels,
      datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reducedMotion ? false : undefined,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: props.mode === "flow",
          position: "top",
          align: "end",
          labels: { color: tickColor, boxWidth: 10, boxHeight: 10, useBorderRadius: true, borderRadius: 3, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: tooltipBg,
          titleColor: "#F1F5F2",
          bodyColor: "#DCE4DF",
          padding: 10,
          cornerRadius: 10,
          displayColors: true,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ₱${formatPeso(ctx.parsed.y)}`
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: tickColor, maxTicksLimit: 7, font: { size: 11 } }
        },
        y: {
          beginAtZero: true,
          suggestedMax: maxVal === 0 ? 500 : undefined,
          grid: { color: gridColor },
          border: { display: false },
          ticks: {
            color: tickColor,
            font: { size: 11 },
            maxTicksLimit: 6,
            callback: (val) => `₱${Number(val).toLocaleString("en-PH")}`
          }
        }
      }
    }
  });
}

onMounted(renderChart);
watch([() => props.entries, () => props.horizon, () => props.mode, isDark, isTl], renderChart, { deep: true });
onUnmounted(() => {
  chartInstance?.destroy();
  chartInstance = null;
});
</script>

<template>
  <figure>
    <div class="relative h-56 sm:h-64 w-full">
      <canvas
        ref="canvasRef"
        role="img"
        :aria-label="
          mode === 'income'
            ? `Inflow chart: Period inflow ₱${formatPeso(series.totalPeriodIncome)}, peak bucket ₱${formatPeso(series.peakDayIncome)}`
            : `Cash flow chart: Period outflow ₱${formatPeso(series.totalPeriodExpense)}, daily average ₱${formatPeso(series.avgDailyExpense)}, peak day ₱${formatPeso(series.peakDayExpense)}`
        "
      />
    </div>
    <figcaption class="visually-hidden">
      <template v-if="mode === 'income'">
        Period inflow ₱{{ formatPeso(series.totalPeriodIncome) }}, peak bucket ₱{{ formatPeso(series.peakDayIncome) }}.
      </template>
      <template v-else>
        Period outflow ₱{{ formatPeso(series.totalPeriodExpense) }}, daily average ₱{{ formatPeso(series.avgDailyExpense) }}, peak day ₱{{ formatPeso(series.peakDayExpense) }}.
      </template>
    </figcaption>

    <div
      v-if="!hideSummaryBoxes"
      class="mt-4 grid grid-cols-1 gap-2 border-t border-[var(--border-subtle)] pt-3 min-[420px]:grid-cols-3"
    >
      <div class="tipid-inset px-3 py-2">
        <span class="block text-[11px] font-medium text-[var(--text-muted)]">
          {{ isTl ? "Kabuuang Gastos" : "Period Outflow" }}
        </span>
        <span class="tipid-amount font-mono text-sm font-semibold text-[var(--text-primary)]">
          ₱{{ formatPeso(series.totalPeriodExpense) }}
        </span>
      </div>
      <div class="tipid-inset px-3 py-2">
        <span class="block text-[11px] font-medium text-[var(--text-muted)]">
          {{ isTl ? "Araw-araw na Ave." : "Daily Average" }}
        </span>
        <span class="tipid-amount font-mono text-sm font-semibold text-[var(--accent)]">
          ₱{{ formatPeso(series.avgDailyExpense) }}
        </span>
      </div>
      <div class="tipid-inset px-3 py-2">
        <span class="block text-[11px] font-medium text-[var(--text-muted)]">
          {{ isTl ? "Pinakamataas" : "Peak Day" }}
        </span>
        <span class="tipid-amount font-mono text-sm font-semibold text-[var(--expense)]">
          ₱{{ formatPeso(series.peakDayExpense) }}
        </span>
      </div>
    </div>
  </figure>
</template>
