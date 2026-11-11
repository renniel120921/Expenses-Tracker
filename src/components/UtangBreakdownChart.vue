<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { Chart, DoughnutController, ArcElement, Tooltip } from "chart.js";
import { formatPeso, fromCentavos, toCentavos } from "@/lib/core";
import { useTheme } from "@/composables/useTheme";
import { useI18n } from "@/lib/i18n";

Chart.register(DoughnutController, ArcElement, Tooltip);

const props = defineProps<{
  receivableTotal: number;
  payableTotal: number;
  settledTotal: number;
}>();

const { isDark } = useTheme();
const { isTl } = useI18n();
const canvasRef = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const slices = computed(() => {
  const dark = isDark.value;
  let recCents = 0;
  let payCents = 0;
  let setCents = 0;
  try {
    recCents = toCentavos(props.receivableTotal, { allowZero: true });
    payCents = toCentavos(props.payableTotal, { allowZero: true });
    setCents = toCentavos(props.settledTotal, { allowZero: true });
  } catch {
    recCents = 0;
    payCents = 0;
    setCents = 0;
  }

  const items = [
    {
      label: isTl.value ? "Pautang" : "Owed to You",
      value: fromCentavos(recCents),
      cents: recCents,
      color: dark ? "#38CC90" : "#13784C"
    },
    {
      label: isTl.value ? "Utang Mo" : "You Owe",
      value: fromCentavos(payCents),
      cents: payCents,
      color: dark ? "#F08A78" : "#B64236"
    },
    {
      label: isTl.value ? "Bayad Na" : "Settled",
      value: fromCentavos(setCents),
      cents: setCents,
      color: dark ? "#68786E" : "#9AA7A0"
    }
  ].filter((s) => s.cents > 0);

  return {
    items,
    hasData: items.length > 0,
    totalCents: recCents + payCents + setCents
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
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const hasData = slices.value.hasData;
  const list = slices.value.items;

  chartInstance = new Chart(canvas, {
    type: "doughnut",
    data: hasData
      ? {
          labels: list.map((s) => s.label),
          datasets: [
            {
              data: list.map((s) => s.value),
              backgroundColor: list.map((s) => s.color),
              borderColor: dark ? "#101813" : "#FFFFFF",
              borderWidth: 2.5,
              borderRadius: 6,
              spacing: 3,
              hoverOffset: 4
            }
          ]
        }
      : {
          labels: [isTl.value ? "Walang tala" : "No balances"],
          datasets: [
            {
              data: [1],
              backgroundColor: [dark ? "rgba(241, 245, 242, 0.12)" : "#E4E8E4"],
              borderWidth: 0
            }
          ]
        },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "76%",
      animation: reducedMotion ? false : undefined,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: hasData,
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
watch([slices, isDark], renderChart, { deep: true, flush: "post" });
onUnmounted(() => {
  chartInstance?.destroy();
  chartInstance = null;
});
</script>

<template>
  <figure class="relative h-36 w-36 shrink-0 sm:h-40 sm:w-40">
    <canvas
      ref="canvasRef"
      role="img"
      :aria-label="
        slices.hasData
          ? `Utang breakdown: Owed to you ₱${formatPeso(receivableTotal)}, You owe ₱${formatPeso(payableTotal)}, Settled ₱${formatPeso(settledTotal)}`
          : 'Utang breakdown ring: no balances recorded'
      "
    />
    <figcaption class="visually-hidden">
      Owed to you ₱{{ formatPeso(receivableTotal) }}, You owe ₱{{ formatPeso(payableTotal) }}, Settled ₱{{ formatPeso(settledTotal) }}.
    </figcaption>
  </figure>
</template>
