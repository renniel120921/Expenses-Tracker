<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip
} from "chart.js";
import { PieChart } from "@lucide/vue";
import { formatPeso, fromCentavos, getCategoryColor, toCentavos } from "@/lib/core";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { useTheme } from "@/composables/useTheme";
import { useI18n } from "@/lib/i18n";
import type { TransactionEntry } from "@/types/finance";

Chart.register(DoughnutController, ArcElement, Tooltip);

const props = withDefaults(
  defineProps<{
    entries: TransactionEntry[];
    budgetCap?: number | null;
    budgetPct?: number | null;
    variant?: "full" | "ring-legend";
  }>(),
  {
    budgetCap: null,
    budgetPct: null,
    variant: "full"
  }
);

const emit = defineEmits<{
  (e: "addExpense"): void;
}>();

const { isDark } = useTheme();
const { isTl } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const breakdown = computed(() => {
  const expenses = props.entries.filter((e) => e.type !== "income");
  const catMap: Record<string, number> = {};
  let totalCents = 0;

  for (const e of expenses) {
    let amt = 0;
    try {
      amt = toCentavos(e.amount, { allowZero: true });
    } catch {
      continue;
    }
    const cat = e.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + amt;
    totalCents += amt;
  }

  const total = fromCentavos(totalCents);
  const items = Object.entries(catMap)
    .map(([label, cents]) => ({
      label,
      amount: fromCentavos(cents),
      pct: totalCents > 0 ? (cents / totalCents) * 100 : 0,
      color: getCategoryColor(label)
    }))
    .sort((a, b) => b.amount - a.amount);

  return { total, items };
});

function renderChart() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  const items = breakdown.value.items;
  if (items.length === 0) return;

  const dark = isDark.value;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  chartInstance = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: items.map((i) => i.label),
      datasets: [
        {
          data: items.map((i) => i.amount),
          backgroundColor: items.map((i) => i.color),
          borderColor: dark ? "#101813" : "#FFFFFF",
          borderWidth: 2.5,
          borderRadius: 6,
          spacing: 2,
          hoverOffset: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "74%",
      animation: reducedMotion ? false : undefined,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: dark ? "#17231C" : "#0D1611",
          titleColor: "#F1F5F2",
          bodyColor: "#DCE4DF",
          padding: 10,
          cornerRadius: 10,
          callbacks: {
            label: (ctx) => `${ctx.label}: ₱${formatPeso(ctx.parsed)}`
          }
        }
      }
    }
  });
}

onMounted(renderChart);
watch([breakdown, isDark, () => props.budgetCap, () => props.variant], renderChart, { deep: true, flush: "post" });
onUnmounted(() => {
  chartInstance?.destroy();
  chartInstance = null;
});
</script>

<template>
  <div v-if="breakdown.items.length === 0" class="flex flex-col items-center justify-center gap-2.5 py-8 text-center">
    <div class="tipid-icon-badge h-12 w-12 rounded-2xl bg-[var(--bg-inset)] text-[var(--text-muted)]">
      <PieChart :size="22" aria-hidden="true" />
    </div>
    <div>
      <p class="text-sm font-semibold text-[var(--text-primary)]">
        {{ isTl ? "Walang gastos sa panahong ito" : "No recorded expenses in this period" }}
      </p>
      <p class="mt-0.5 text-xs text-[var(--text-muted)]">
        <template v-if="budgetCap && budgetCap > 0">
          {{
            isTl
              ? `Aktibong badyet: ₱${formatPeso(budgetCap)} · Magtala ng gastos upang makita ang porsyento.`
              : `Monthly cap ₱${formatPeso(budgetCap)} active · Log an expense to chart category shares.`
          }}
        </template>
        <template v-else>
          {{ isTl ? "Magtala ng gastos o pumili ng mas malawak na saklaw sa itaas." : "Log an expense or switch the date horizon above to inspect category shares." }}
        </template>
      </p>
    </div>
    <button
      type="button"
      class="tipid-compact mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
      @click="emit('addExpense')"
    >
      {{ isTl ? "+ Magdagdag ng Gastos" : "+ Log First Expense" }}
    </button>
  </div>

  <figure
    v-else
    :class="
      variant === 'ring-legend'
        ? 'flex flex-col items-center gap-5'
        : 'flex flex-col items-center gap-6 md:flex-row md:items-start'
    "
  >
    <div :class="variant === 'ring-legend' ? 'relative h-56 w-56 shrink-0' : 'relative h-52 w-52 shrink-0'">
      <canvas
        ref="canvasRef"
        role="img"
        :aria-label="`Expense breakdown by category totaling ₱${formatPeso(breakdown.total)} across ${breakdown.items.length} categories`"
      />
      <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
        <span
          v-if="variant === 'ring-legend' && budgetPct !== null && budgetCap && budgetCap > 0"
          class="mb-1 rounded-lg bg-[var(--bg-inset)] px-2.5 py-0.5 font-mono text-[11px] font-bold"
          :class="budgetPct > 100 ? 'text-[var(--expense)]' : budgetPct >= 85 ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'"
        >
          {{ budgetPct }}%
        </span>
        <span class="text-[11px] font-medium text-[var(--text-muted)]">
          {{ variant === "ring-legend" ? (isTl ? "Nagastos Mo" : "You've Spent") : (isTl ? "Kabuuang Gastos" : "Total Outflow") }}
        </span>
        <span class="tipid-amount font-mono text-lg font-bold tracking-tight text-[var(--text-primary)]">
          ₱{{ formatPeso(breakdown.total) }}
        </span>
        <span
          v-if="variant === 'ring-legend' && budgetCap && budgetCap > 0"
          class="mt-0.5 text-[11px] text-[var(--text-muted)]"
        >
          {{ isTl ? "ng" : "of" }} ₱{{ formatPeso(budgetCap) }}
        </span>
      </div>
    </div>

    <figcaption class="visually-hidden">
      Category spending distribution totaling ₱{{ formatPeso(breakdown.total) }}.
    </figcaption>

    <ul
      v-if="variant === 'ring-legend'"
      class="grid w-full max-w-md grid-cols-2 gap-x-4 gap-y-2 border-t border-[var(--border-subtle)] pt-4 sm:grid-cols-3"
    >
      <li
        v-for="item in breakdown.items"
        :key="item.label"
        class="flex min-w-0 items-center justify-between gap-1.5 text-xs"
      >
        <span class="flex min-w-0 items-center gap-1.5">
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            :style="{ backgroundColor: item.color }"
            aria-hidden="true"
          />
          <span class="truncate font-medium text-[var(--text-secondary)]">{{ item.label }}</span>
        </span>
        <span class="shrink-0 font-mono text-[11px] font-semibold text-[var(--text-muted)]">
          {{ item.pct.toFixed(0) }}%
        </span>
      </li>
    </ul>

    <ul v-else class="w-full min-w-0 flex-1 space-y-2.5">
      <li
        v-for="item in breakdown.items"
        :key="item.label"
        class="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-inset)]/45 px-3.5 py-2.5 text-xs"
      >
        <span
          class="tipid-icon-badge h-8 w-8 rounded-lg"
          :style="{ backgroundColor: `color-mix(in srgb, ${item.color} 15%, transparent)`, color: item.color }"
          aria-hidden="true"
        >
          <component :is="getCategoryIcon(item.label, 'expense')" :size="15" />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate font-semibold text-[var(--text-primary)]">
              {{ item.label }}
            </span>
            <div class="flex shrink-0 items-baseline gap-2">
              <span class="font-mono text-[11px] text-[var(--text-muted)]">
                {{ item.pct.toFixed(0) }}%
              </span>
              <span class="tipid-amount font-mono font-bold text-[var(--text-primary)]">
                ₱{{ formatPeso(item.amount) }}
              </span>
            </div>
          </div>
          <progress
            class="tipid-progress mt-1.5 h-1.5 w-full"
            :value="item.pct"
            max="100"
            :style="{ '--progress-bar-fill': item.color }"
            :aria-label="`${item.label} share: ${item.pct.toFixed(0)}%`"
          />
        </div>
      </li>
    </ul>
  </figure>
</template>
