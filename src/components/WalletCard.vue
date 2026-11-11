<script setup lang="ts">
import { computed, useId } from "vue";
import { Pencil, AlertCircle } from "@lucide/vue";
import { formatPeso } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getWalletKindIcon } from "@/lib/categoryIcons";
import { useI18n } from "@/lib/i18n";

const props = withDefaults(
  defineProps<{
    method: string;
    balance: number;
    totalPositiveBalance?: number;
    balanceHidden?: boolean;
    showEdit?: boolean;
  }>(),
  {
    totalPositiveBalance: 0,
    balanceHidden: false,
    showEdit: true
  }
);

const emit = defineEmits<{
  (e: "edit", method: string): void;
}>();

const { isTl } = useI18n();
const svgUid = useId();
const goldGradId = `tipid-chip-gold-${svgUid}`;
const silverGradId = `tipid-chip-silver-${svgUid}`;

const visual = computed(() => resolveWalletVisual(props.method));
const KindIcon = computed(() => getWalletKindIcon(visual.value.kind));

const portfolioSharePct = computed(() => {
  if (props.balance <= 0 || props.totalPositiveBalance <= 0) return null;
  return Math.max(1, Math.min(100, Math.round((props.balance / props.totalPositiveBalance) * 100)));
});

const isNegative = computed(() => props.balance < 0);

const cardVars = computed(() => ({
  "--bank-start": visual.value.surfaceStart,
  "--bank-end": visual.value.surfaceEnd,
  "--bank-accent": visual.value.accent
}));
</script>

<template>
  <article
    class="tipid-bank-card group relative flex flex-col justify-between overflow-hidden rounded-[1.25rem] p-5 select-none"
    :style="cardVars"
  >
    <!-- Subtle architectural banknote/card guilloché pattern -->
    <svg
      aria-hidden="true"
      class="pointer-events-none absolute -right-6 -bottom-6 h-36 w-36 opacity-[0.07] transition-transform duration-300 group-hover:scale-105"
      viewBox="0 0 120 120"
      fill="none"
    >
      <circle cx="80" cy="80" r="56" stroke="currentColor" stroke-width="1.25" />
      <circle cx="80" cy="80" r="42" stroke="currentColor" stroke-width="1.25" stroke-dasharray="4 4" />
      <circle cx="80" cy="80" r="28" stroke="currentColor" stroke-width="1.25" />
    </svg>

    <!-- Card Header: Institution emblem, name, kind chip, and edit action -->
    <header class="relative z-10 flex items-start justify-between gap-2.5">
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/25 bg-white/14 shadow-xs backdrop-blur-xs"
          aria-hidden="true"
        >
          <component :is="KindIcon" :size="18" class="shrink-0" />
        </span>

        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-1.5">
            <h3 class="truncate text-sm font-bold tracking-tight">
              {{ visual.displayName }}
            </h3>
            <span class="shrink-0 whitespace-nowrap rounded-full border border-current/20 bg-white/12 px-2 py-0.5 text-[10px] font-semibold tracking-wide opacity-90">
              {{ visual.kindLabel }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-[10px] font-semibold tracking-[0.08em] uppercase opacity-75">
            {{ visual.railLabel }}
          </p>
        </div>
      </div>

      <button
        v-if="showEdit"
        type="button"
        class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white/14 opacity-90 backdrop-blur-xs transition-colors hover:bg-white/25 hover:opacity-100"
        :aria-label="`Adjust ${visual.displayName} balance`"
        :title="`Adjust ${visual.displayName} balance`"
        @click="emit('edit', method)"
      >
        <Pencil :size="14" aria-hidden="true" />
      </button>
    </header>

    <!-- Middle Hardware / Channel Layer: Metallic EMV Chip + NFC Waves + Masked Digits -->
    <div class="tipid-bank-card-mid relative z-10 mt-4 flex items-center justify-between gap-3">
      <div class="flex items-center gap-2.5">
        <!-- Metallic EMV Chip for Banks & Digital Cards -->
        <svg
          v-if="visual.chipFinish !== 'none'"
          aria-hidden="true"
          viewBox="0 0 38 28"
          class="tipid-emv-chip h-[22px] w-[30px] shrink-0 rounded-[5px]"
          :data-finish="visual.chipFinish"
          fill="none"
        >
          <rect
            x="0.75"
            y="0.75"
            width="36.5"
            height="26.5"
            rx="4.5"
            :fill="visual.chipFinish === 'gold' ? `url(#${goldGradId})` : `url(#${silverGradId})`"
            stroke="rgba(255,255,255,0.45)"
            stroke-width="1"
          />
          <path
            d="M12.5 1V27M25.5 1V27M1 9.5H12.5M25.5 9.5H37M1 18.5H12.5M25.5 18.5H37M12.5 14H25.5"
            stroke="rgba(13,22,17,0.32)"
            stroke-width="1.15"
          />
          <defs>
            <linearGradient :id="goldGradId" x1="0" y1="0" x2="38" y2="28" gradientUnits="userSpaceOnUse">
              <stop stop-color="#F7E09E" />
              <stop offset="0.5" stop-color="#D4AF5A" />
              <stop offset="1" stop-color="#B08935" />
            </linearGradient>
            <linearGradient :id="silverGradId" x1="0" y1="0" x2="38" y2="28" gradientUnits="userSpaceOnUse">
              <stop stop-color="#F1F5F9" />
              <stop offset="0.5" stop-color="#CBD5E1" />
              <stop offset="1" stop-color="#94A3B8" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Contactless NFC Waves -->
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          class="h-4 w-4 shrink-0 opacity-75"
          fill="none"
        >
          <path d="M5.5 7.2a4.8 4.8 0 0 1 0 5.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path d="M8.8 5.1a8 8 0 0 1 0 9.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
          <path d="M12.2 3.1a11.4 11.4 0 0 1 0 13.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>

        <span class="font-mono text-xs font-medium tracking-[0.14em] tabular-nums opacity-85">
          •••• {{ visual.cardLast4 }}
        </span>
      </div>

      <span
        class="rounded-md border border-current/20 bg-black/18 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider opacity-95"
        aria-hidden="true"
      >
        {{ visual.monogram }}
      </span>
    </div>

    <!-- Card Footer: Available balance + portfolio weight -->
    <footer class="relative z-10 mt-4 flex items-end justify-between gap-2 border-t border-current/16 pt-3">
      <div class="min-w-0">
        <span class="block text-[10px] font-medium tracking-wide opacity-75">
          {{ visual.kind === "cash" ? (isTl ? "Hawak na Pera" : "On Hand Balance") : (isTl ? "Kasalukuyang Balanse" : "Available Balance") }}
        </span>
        <p class="tipid-amount tipid-bank-card-balance mt-0.5 font-mono text-xl font-bold tracking-tight tabular-nums">
          <template v-if="balanceHidden">₱••••••</template>
          <template v-else>{{ isNegative ? "-₱" : "₱" }}{{ formatPeso(Math.abs(balance)) }}</template>
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-1.5">
        <span
          v-if="isNegative"
          class="inline-flex items-center gap-1 rounded-full border border-current/25 bg-black/28 px-2 py-0.5 text-[10px] font-semibold"
        >
          <AlertCircle :size="11" aria-hidden="true" />
          <span>{{ isTl ? "Kulang" : "Overdrawn" }}</span>
        </span>
        <span
          v-else-if="portfolioSharePct !== null && !balanceHidden"
          class="whitespace-nowrap rounded-full border border-current/20 bg-white/12 px-2 py-0.5 font-mono text-[10px] font-semibold opacity-95"
        >
          {{ portfolioSharePct }}% {{ isTl ? "bahagi" : "share" }}
        </span>
      </div>
    </footer>
  </article>
</template>
