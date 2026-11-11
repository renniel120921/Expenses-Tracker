<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { X } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    subtitle?: string;
    persistent?: boolean;
    maxWidthClass?: string;
  }>(),
  {
    persistent: false,
    maxWidthClass: ""
  }
);

const emit = defineEmits<{
  (e: "close"): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);
const titleId = `tipid-dlg-${Math.random().toString(36).slice(2, 9)}`;
let pressedOutside = false;

function isPointerOutsideDialog(e: PointerEvent, dialog: HTMLDialogElement): boolean {
  const r = dialog.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
}

function handlePointerDown(e: PointerEvent) {
  const el = dialogRef.value;
  if (!el || props.persistent) {
    pressedOutside = false;
    return;
  }
  pressedOutside = isPointerOutsideDialog(e, el);
}

function handlePointerUp(e: PointerEvent) {
  const el = dialogRef.value;
  if (!el || props.persistent) return;
  if (!("closedBy" in HTMLDialogElement.prototype) && pressedOutside && isPointerOutsideDialog(e, el)) {
    el.close();
  }
  pressedOutside = false;
}

function handleClose() {
  if (dialogRef.value) {
    dialogRef.value.returnValue = "";
  }
  emit("close");
}

function handleCancel(e: Event) {
  if (props.persistent) {
    e.preventDefault();
  }
}

watch(
  () => props.open,
  (isOpen) => {
    const el = dialogRef.value;
    if (!el) return;
    if (isOpen && !el.open) {
      el.showModal();
    } else if (!isOpen && el.open) {
      el.close();
    }
  }
);

onMounted(() => {
  const el = dialogRef.value;
  if (el && props.open && !el.open) {
    el.showModal();
  }
});

onUnmounted(() => {
  if (dialogRef.value?.open) {
    dialogRef.value.close();
  }
});
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    :closedby="persistent ? 'none' : 'any'"
    :class="['tipid-dialog', maxWidthClass]"
    @close="handleClose"
    @cancel="handleCancel"
    @pointerdown="handlePointerDown"
    @pointerup="handlePointerUp"
  >
    <div class="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] px-5 py-4">
      <div class="min-w-0">
        <h2 :id="titleId" class="text-base font-semibold tracking-tight text-[var(--text-primary)]">
          {{ title }}
        </h2>
        <p v-if="subtitle" class="mt-0.5 text-xs text-[var(--text-secondary)]">
          {{ subtitle }}
        </p>
      </div>
      <button
        type="button"
        class="tipid-compact tipid-compact-touch inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-inset)] hover:text-[var(--text-primary)]"
        aria-label="Close dialog"
        @click="dialogRef?.close()"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>

    <div class="p-5">
      <slot />
    </div>
  </dialog>
</template>
