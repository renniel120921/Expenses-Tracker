<script setup lang="ts">
import BaseDialog from "./BaseDialog.vue";

withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
    loading?: boolean;
  }>(),
  {
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    destructive: true,
    loading: false
  }
);

const emit = defineEmits<{
  (e: "cancel"): void;
  (e: "confirm"): void;
}>();
</script>

<template>
  <BaseDialog :open="open" :title="title" max-width-class="max-w-sm" @close="emit('cancel')">
    <p class="text-sm leading-relaxed text-[var(--text-secondary)]">
      {{ message }}
    </p>
    <div class="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
      <button
        type="button"
        autofocus
        class="inline-flex items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
        :disabled="loading"
        @click="emit('cancel')"
      >
        {{ cancelLabel }}
      </button>
      <button
        type="button"
        :disabled="loading"
        :class="[
          'inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity',
          destructive ? 'bg-[var(--expense)] hover:opacity-90' : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)]'
        ]"
        @click="emit('confirm')"
      >
        {{ loading ? "..." : confirmLabel }}
      </button>
    </div>
  </BaseDialog>
</template>
