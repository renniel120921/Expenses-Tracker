<script setup lang="ts">
import { Check, AlertCircle, Info, X } from "@lucide/vue";
import { useToast } from "@/composables/useToast";

const { toasts, dismissToast } = useToast();
</script>

<template>
  <div
    aria-live="polite"
    aria-atomic="true"
    class="pointer-events-none fixed inset-x-0 bottom-24 z-[140] flex flex-col items-end gap-2 px-4 md:bottom-6 md:px-6"
  >
    <div
      v-for="item in toasts"
      :key="item.id"
      role="status"
      class="tipid-floating-chrome pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3"
    >
      <span
        :class="[
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          item.tone === 'success'
            ? 'bg-[var(--income-soft)] text-[var(--income)]'
            : item.tone === 'error'
              ? 'bg-[var(--expense-soft)] text-[var(--expense)]'
              : 'bg-[var(--accent-soft)] text-[var(--accent)]'
        ]"
      >
        <Check v-if="item.tone === 'success'" :size="15" aria-hidden="true" />
        <AlertCircle v-else-if="item.tone === 'error'" :size="15" aria-hidden="true" />
        <Info v-else :size="15" aria-hidden="true" />
      </span>
      <p class="min-w-0 flex-1 text-xs font-medium text-[var(--text-primary)]">
        {{ item.message }}
      </p>
      <button
        type="button"
        class="tipid-compact tipid-compact-touch inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
        aria-label="Dismiss notification"
        @click="dismissToast(item.id)"
      >
        <X :size="14" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
