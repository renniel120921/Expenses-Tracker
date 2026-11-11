<script setup lang="ts">
import { ref, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";
import { money } from "@/lib/core";
import { setBudget } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";

const props = defineProps<{
  open: boolean;
  uid: string;
  currentBudget: number | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { isTl } = useI18n();
const limitInput = ref("");
const saving = ref(false);
const error = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      limitInput.value = props.currentBudget && props.currentBudget > 0 ? String(props.currentBudget) : "";
      error.value = "";
    }
  }
);

async function submitBudget() {
  error.value = "";
  let parsed: number;
  try {
    parsed = money(limitInput.value, { allowZero: true });
  } catch {
    error.value = isTl.value ? "Maglagay ng valid na halaga." : "Enter a valid budget amount.";
    return;
  }

  saving.value = true;
  try {
    const res = await setBudget(props.uid, parsed);
    notifyWriteResult(
      pushToast,
      res,
      isTl.value ? "Na-update ang buwanang badyet." : "Monthly budget limit updated.",
      isTl.value ? "Naka-save ang badyet offline — isi-sync online." : "Budget saved offline — syncs when online."
    );
    emit("close");
  } catch {
    error.value = isTl.value ? "Hindi nai-save ang badyet." : "Failed to save budget.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="isTl ? 'Buwanang Badyet' : 'Monthly Budget Limit'"
    :subtitle="isTl ? 'Itakda ang target na kabuuang gastos sa isang buwan.' : 'Set your target monthly spending cap.'"
    max-width-class="max-w-sm"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submitBudget">
      <div>
        <label for="budget-limit-input" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
          {{ isTl ? "Limit Bawat Buwan (PHP)" : "Monthly Limit (PHP)" }}
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
          <input
            id="budget-limit-input"
            v-model="limitInput"
            type="number"
            min="0"
            step="100"
            inputmode="decimal"
            autofocus
            required
            placeholder="15000"
            class="tipid-input pl-8 font-mono text-base font-semibold tabular-nums"
          />
        </div>
      </div>

      <p v-if="error" role="alert" class="text-xs font-medium text-[var(--expense)]">{{ error }}</p>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
          @click="emit('close')"
        >
          {{ isTl ? "Kanselahin" : "Cancel" }}
        </button>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          {{ saving ? (isTl ? "Sinasave..." : "Saving...") : (isTl ? "I-save" : "Save Limit") }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
