<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Trash2 } from "@lucide/vue";
import BaseDialog from "./BaseDialog.vue";
import { SUPPORTED_WALLETS, deriveWalletBaseBalance, money } from "@/lib/core";
import { resolveWalletVisual } from "@/lib/walletVisuals";
import { removeWallet, saveWalletBaseBalance } from "@/lib/data";
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

const isDefaultCashWallet = computed(
  () => (props.editMethod ?? "").trim().toLowerCase() === "cash"
);

const canRemoveWallet = computed(
  () => props.mode === "edit" && Boolean(props.editMethod?.trim()) && !isDefaultCashWallet.value
);

const chosenMethod = ref("GCash");
const balanceInput = ref("");
const saving = ref(false);
const removing = ref(false);
const confirmingRemove = ref(false);
const error = ref("");
const busy = computed(() => saving.value || removing.value);

watch(
  () => [props.open, props.mode, props.editMethod] as const,
  ([isOpen]) => {
    if (!isOpen) return;
    error.value = "";
    confirmingRemove.value = false;
    removing.value = false;
    if (props.mode === "edit" && props.editMethod) {
      chosenMethod.value = props.editMethod;
      balanceInput.value = String(props.walletBalances[props.editMethod] ?? 0);
    } else {
      chosenMethod.value = availableWallets.value[0]?.id || "";
      balanceInput.value = "0";
    }
  }
);

async function submitWallet() {
  if (busy.value) return;
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
    // Reconcile against historical entries using integer centavos so both initial linking
    // and balance updates match the entered amount without phantom historical drift.
    const baseBal = deriveWalletBaseBalance(props.entries, targetMethod, targetBal);
    const res = await saveWalletBaseBalance(props.uid, targetMethod, baseBal);
    const displayLabel = resolveWalletVisual(targetMethod).displayName;

    if (props.mode === "edit") {
      notifyWriteResult(
        pushToast,
        res,
        `${displayLabel} balance updated.`,
        `${displayLabel} balance saved offline — syncs when online.`
      );
    } else {
      notifyWriteResult(
        pushToast,
        res,
        `${displayLabel} linked.`,
        `${displayLabel} linked offline — syncs when online.`
      );
    }
    emit("close");
  } catch {
    error.value = isTl.value ? "Hindi nai-update ang wallet." : "Could not save wallet.";
  } finally {
    saving.value = false;
  }
}

async function confirmRemoveWallet() {
  if (!canRemoveWallet.value || !props.editMethod || busy.value) return;
  error.value = "";
  removing.value = true;
  const targetMethod = props.editMethod;
  const displayLabel = editDisplayName.value || targetMethod;

  try {
    const res = await removeWallet(props.uid, targetMethod);
    notifyWriteResult(
      pushToast,
      res,
      `${displayLabel} removed.`,
      `${displayLabel} removed offline — syncs when online.`
    );
    emit("close");
  } catch {
    error.value = isTl.value ? "Hindi naalis ang card." : "Could not remove card.";
  } finally {
    removing.value = false;
  }
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="mode === 'edit' ? (isTl ? `Pamahalaan ang ${editDisplayName}` : `Manage ${editDisplayName}`) : (isTl ? 'Magdagdag ng Wallet' : 'Link Account')"
    :subtitle="mode === 'edit' ? (isTl ? 'I-update ang balanse o alisin ang card.' : 'Update balance or remove this card.') : (isTl ? 'Pumili ng wallet o bank account.' : 'Choose a wallet or bank account to track.')"
    max-width-class="max-w-sm"
    @close="emit('close')"
  >
    <div class="space-y-4">
      <form class="space-y-4" @submit.prevent="submitWallet">
        <div v-if="mode === 'add'">
          <label for="wallet-select" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
            {{ isTl ? "Account / Wallet" : "Account / Wallet" }}
          </label>
          <select id="wallet-select" v-model="chosenMethod" class="tipid-input text-base sm:text-sm" :disabled="availableWallets.length === 0">
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
            :disabled="busy"
            class="rounded-xl border border-[var(--border-strong)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] disabled:opacity-60"
            @click="emit('close')"
          >
            {{ isTl ? "Kanselahin" : "Cancel" }}
          </button>
          <button
            type="submit"
            :disabled="busy || (mode === 'add' && availableWallets.length === 0)"
            class="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60"
          >
            {{ saving ? "..." : mode === "edit" ? (isTl ? "I-update" : "Update") : (isTl ? "Idagdag" : "Add Wallet") }}
          </button>
        </div>
      </form>

      <div v-if="mode === 'edit'" class="border-t border-[var(--border-subtle)] pt-3">
        <p v-if="isDefaultCashWallet" class="text-center text-xs text-[var(--text-muted)]">
          {{ isTl ? "Default wallet ang Cash at hindi pwedeng alisin." : "Cash stays active as your default ledger." }}
        </p>

        <button
          v-else-if="!confirmingRemove"
          type="button"
          :disabled="busy"
          class="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--expense)]/25 px-4 py-2.5 text-xs font-semibold text-[var(--expense)] transition-colors hover:bg-[var(--expense)]/10 disabled:opacity-50"
          @click="confirmingRemove = true"
        >
          <Trash2 :size="14" aria-hidden="true" />
          <span>{{ isTl ? "Alisin ang Card" : "Remove Card" }}</span>
        </button>

        <div
          v-else
          role="region"
          :aria-label="isTl ? 'Kumpirmahin ang pag-alis ng card' : 'Confirm card removal'"
          class="space-y-2.5 rounded-xl border border-[var(--expense)]/30 bg-[var(--expense)]/8 p-3"
        >
          <div class="space-y-0.5">
            <p class="text-xs font-bold text-[var(--expense)]">
              {{ isTl ? `Alisin ang ${editDisplayName}?` : `Remove ${editDisplayName}?` }}
            </p>
            <p class="text-[11px] text-[var(--text-secondary)]">
              {{ isTl ? "Mananatili ang dating records sa History." : "Past transactions stay in History." }}
            </p>
          </div>
          <div class="flex items-center justify-end gap-2">
            <button
              type="button"
              :disabled="busy"
              class="rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)] disabled:opacity-60"
              @click="confirmingRemove = false"
            >
              {{ isTl ? "Itago" : "Keep" }}
            </button>
            <button
              type="button"
              :disabled="busy"
              class="rounded-lg bg-[var(--expense)] px-3.5 py-2 text-xs font-semibold text-white hover:opacity-95 disabled:opacity-60"
              @click="confirmRemoveWallet"
            >
              {{ removing ? "..." : (isTl ? "Oo, Alisin" : "Remove") }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseDialog>
</template>
