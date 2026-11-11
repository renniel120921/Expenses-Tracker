<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseDialog from "./BaseDialog.vue";
import { SUPPORTED_WALLETS, toCentavos, fromCentavos, sumMoney, money } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { saveWalletBaseBalance } from "@/lib/data";
import { notifyWriteResult } from "@/lib/offlineSync";
import { pushToast } from "@/composables/useToast";
import { useI18n } from "@/lib/i18n";
import type { TransactionEntry } from "@/types/finance";

const props = defineProps<{
  open: boolean;
  mode: "edit" | "add";
  uid: string;
  editMethod?: string;
  entries: TransactionEntry[];
  baseBalances: Record<string, number>;
  walletBalances: Record<string, number>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const { isTl } = useI18n();

const availableWallets = computed(() => {
  const linked = new Set(Object.keys(props.baseBalances).map((k) => resolveWalletVisual(k).id.toLowerCase()));
  return SUPPORTED_WALLETS.filter((w) => !linked.has(w.id.toLowerCase()));
});

const editDisplayName = computed(() =>
  props.editMethod ? resolveWalletVisual(props.editMethod).displayName : ""
);

const chosenMethod = ref("GCash");
const balanceInput = ref("");
const saving = ref(false);
const error = ref("");

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    error.value = "";
    if (props.mode === "edit" && props.editMethod) {
      chosenMethod.value = props.editMethod;
      balanceInput.value = String(props.walletBalances[props.editMethod] ?? 0);
    } else {
      chosenMethod.value = availableWallets.value[0]?.id || "GCash";
      balanceInput.value = "0";
    }
  }
);

async function submitWallet() {
  error.value = "";
  let targetBal: number;
  try {
    targetBal = money(balanceInput.value || 0, { allowZero: true });
  } catch {
    error.value = isTl.value ? "Maglagay ng valid na halaga." : "Enter a valid balance amount.";
    return;
  }

  const targetMethod = props.mode === "edit" && props.editMethod ? props.editMethod : chosenMethod.value;
  if (!targetMethod) {
    error.value = isTl.value ? "Pumili ng wallet." : "Select a wallet.";
    return;
  }

  saving.value = true;
  try {
    if (props.mode === "edit") {
      // Derive authoritative base balance using integer centavos relative to existing entries
      const methodEntries = props.entries.filter((e) => e.method === targetMethod);
      const inc = sumMoney(methodEntries.filter((e) => e.type === "income").map((e) => e.amount));
      const exp = sumMoney(methodEntries.filter((e) => e.type !== "income").map((e) => e.amount));
      const net = inc - exp;
      const baseBal = fromCentavos(
        toCentavos(targetBal, { allowZero: true }) - toCentavos(net, { allowZero: true, allowNegative: true })
      );
      const res = await saveWalletBaseBalance(props.uid, targetMethod, baseBal);
      notifyWriteResult(
        pushToast,
        res,
        `${targetMethod} balance updated.`,
        `${targetMethod} balance saved offline — syncs when online.`
      );
    } else {
      const res = await saveWalletBaseBalance(props.uid, targetMethod, targetBal);
      notifyWriteResult(
        pushToast,
        res,
        `${targetMethod} linked.`,
        `${targetMethod} linked offline — syncs when online.`
      );
    }
    emit("close");
  } catch {
    error.value = isTl.value ? "Hindi nai-update ang wallet." : "Could not save wallet.";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="mode === 'edit' ? (isTl ? `I-update ang ${editDisplayName}` : `Adjust ${editDisplayName} Balance`) : (isTl ? 'Magdagdag ng Wallet' : 'Link Account')"
    :subtitle="mode === 'edit' ? (isTl ? 'I-adjust ang aktuwal na balanse ngayon.' : 'Reconcile this wallet to its current actual balance.') : (isTl ? 'Pumili ng e-wallet o bank account na susubaybayan.' : 'Select a wallet or bank account to track.')"
    max-width-class="max-w-sm"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submitWallet">
      <div v-if="mode === 'add'">
        <label for="wallet-select" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
          {{ isTl ? "Account / Wallet" : "Account / Wallet" }}
        </label>
        <select id="wallet-select" v-model="chosenMethod" class="tipid-input text-sm" :disabled="availableWallets.length === 0">
          <option v-for="w in availableWallets" :key="w.id" :value="w.id">
            {{ w.name }} ({{ resolveWalletVisual(w.id).kindLabel }})
          </option>
        </select>
        <p v-if="availableWallets.length === 0" class="mt-1 text-xs text-[var(--text-muted)]">
          {{ isTl ? "Naka-link na ang lahat ng sinusuportahang wallet." : "All supported accounts are already linked." }}
        </p>
      </div>

      <div>
        <label for="wallet-balance-input" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
          {{ mode === 'edit' ? (isTl ? 'Kasalukuyang Balanse (PHP)' : 'Current Balance (PHP)') : (isTl ? 'Panimulang Balanse (PHP)' : 'Initial Balance (PHP)') }}
        </label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-semibold text-[var(--text-muted)]">₱</span>
          <input
            id="wallet-balance-input"
            v-model="balanceInput"
            type="number"
            min="0"
            step="0.01"
            inputmode="decimal"
            autofocus
            required
            placeholder="0.00"
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
          :disabled="saving || (mode === 'add' && availableWallets.length === 0)"
          class="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
        >
          {{ saving ? "..." : mode === "edit" ? (isTl ? "I-update" : "Update") : (isTl ? "Idagdag" : "Add Wallet") }}
        </button>
      </div>
    </form>
  </BaseDialog>
</template>
