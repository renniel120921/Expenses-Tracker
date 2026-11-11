<script setup lang="ts">
import { computed } from "vue";
import { Trash2 } from "@lucide/vue";
import BaseDialog from "./BaseDialog.vue";
import { entryDate, formatPeso, getCategoryColor } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { getCategoryIcon, getWalletKindIcon } from "@/lib/categoryIcons";
import { useI18n } from "@/lib/i18n";
import type { TimestampLike, TransactionEntry } from "@/types/finance";

const props = defineProps<{
  open: boolean;
  entry: TransactionEntry | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "delete", entry: TransactionEntry): void;
}>();

const { isTl } = useI18n();

function resolveExactDate(entry: TransactionEntry): Date | null {
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
  return entryDate(entry);
}

const formattedTimestamp = computed(() => {
  if (!props.entry) return "";
  const d = resolveExactDate(props.entry);
  if (!d) return "Recently synced";
  return d.toLocaleString(isTl.value ? "fil-PH" : "en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
});

const walletVisual = computed(() =>
  resolveWalletVisual(props.entry?.method || "Cash")
);

const categoryBadgeStyle = computed(() => {
  if (!props.entry || props.entry.type === "income") return undefined;
  const color = getCategoryColor(props.entry.category);
  return {
    backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
    color
  };
});
</script>

<template>
  <BaseDialog
    :open="open"
    :title="isTl ? 'Detalye ng Transaksyon' : 'Transaction Details'"
    max-width-class="max-w-sm"
    @close="emit('close')"
  >
    <div v-if="entry" class="space-y-4">
      <div class="tipid-inset flex flex-col items-center p-5 text-center">
        <div
          :class="[
            'tipid-icon-badge mb-3 h-12 w-12 rounded-2xl',
            entry.type === 'income' ? 'bg-[var(--income-soft)] text-[var(--income)]' : ''
          ]"
          :style="categoryBadgeStyle"
          aria-hidden="true"
        >
          <component :is="getCategoryIcon(entry.category, entry.type)" :size="22" />
        </div>

        <span
          :class="[
            'inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
            entry.type === 'income'
              ? 'bg-[var(--income-soft)] text-[var(--income)]'
              : 'bg-[var(--expense-soft)] text-[var(--expense)]'
          ]"
        >
          {{ entry.type === 'income' ? (isTl ? 'Kita' : 'Income') : (isTl ? 'Gastos' : 'Expense') }}
        </span>
        <p
          :class="[
            'tipid-amount mt-2 font-mono text-2xl font-bold',
            entry.type === 'income' ? 'text-[var(--income)]' : 'text-[var(--text-primary)]'
          ]"
        >
          {{ entry.type === 'income' ? '+' : '-' }}₱{{ formatPeso(entry.amount) }}
        </p>
        <p class="mt-1 text-sm font-semibold text-[var(--text-primary)]">
          {{ entry.desc }}
        </p>
      </div>

      <dl class="space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2">
          <dt class="text-[var(--text-muted)]">{{ isTl ? "Kategorya" : "Category" }}</dt>
          <dd class="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <component :is="getCategoryIcon(entry.category, entry.type)" :size="13" class="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>{{ entry.category }}</span>
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2">
          <dt class="text-[var(--text-muted)]">{{ isTl ? "Account / Wallet" : "Account / Wallet" }}</dt>
          <dd class="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :style="{ backgroundColor: walletVisual.surfaceEnd }"
              aria-hidden="true"
            />
            <component :is="getWalletKindIcon(walletVisual.kind)" :size="13" class="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
            <span>{{ walletVisual.displayName }}</span>
            <span class="rounded bg-[var(--bg-inset)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
              {{ walletVisual.kindLabel }}
            </span>
          </dd>
        </div>
        <div
          v-if="entry.type !== 'income'"
          class="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2"
        >
          <dt class="text-[var(--text-muted)]">{{ isTl ? "Uri" : "Classification" }}</dt>
          <dd
            :class="[
              'rounded-md px-2 py-0.5 font-semibold',
              entry.spendType === 'luho'
                ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
                : 'bg-[var(--income-soft)] text-[var(--income)]'
            ]"
          >
            {{ entry.spendType === "luho" ? (isTl ? "Luho (Want)" : "Discretionary (Want)") : (isTl ? "Kailangan (Need)" : "Essential (Need)") }}
          </dd>
        </div>
        <div class="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-2">
          <dt class="text-[var(--text-muted)]">{{ isTl ? "Petsa at Oras" : "Date & Time" }}</dt>
          <dd class="font-mono text-[var(--text-primary)]">{{ formattedTimestamp }}</dd>
        </div>
        <div v-if="entry.note" class="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-2">
          <dt class="shrink-0 text-[var(--text-muted)]">{{ isTl ? "Tala" : "Notes" }}</dt>
          <dd class="text-right font-medium text-[var(--text-primary)]">{{ entry.note }}</dd>
        </div>
        <div class="flex items-center justify-between gap-4">
          <dt class="text-[var(--text-muted)]">{{ isTl ? "Reference ID" : "Reference" }}</dt>
          <dd class="font-mono text-[11px] text-[var(--text-muted)]">#{{ entry.id.slice(0, 12) }}</dd>
        </div>
      </dl>

      <div class="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-xl border border-[var(--expense)]/30 bg-[var(--expense-soft)] px-3.5 py-2 text-xs font-semibold text-[var(--expense)] hover:opacity-90"
          @click="emit('delete', entry)"
        >
          <Trash2 :size="13" aria-hidden="true" />
          <span>{{ isTl ? "Burahin" : "Delete Entry" }}</span>
        </button>
        <button
          type="button"
          class="rounded-xl border border-[var(--border-strong)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
          @click="emit('close')"
        >
          {{ isTl ? "Isara" : "Close" }}
        </button>
      </div>
    </div>
  </BaseDialog>
</template>
