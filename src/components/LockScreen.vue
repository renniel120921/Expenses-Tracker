<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Lock, ScanFace, KeyRound, LogOut } from "@lucide/vue";
import {
  verifyBiometrics,
  verifyPasscode,
  hasPasscode,
  isWebAuthnSupported
} from "@/lib/biometrics";
import { friendlyError, logOut } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const props = defineProps<{
  uid: string;
  email: string;
}>();

const emit = defineEmits<{
  (e: "unlocked"): void;
}>();

const { isTl } = useI18n();
const pin = ref("");
const error = ref("");
const busy = ref(false);
const showPinForm = ref(!isWebAuthnSupported());
const pinAvailable = ref(hasPasscode(props.uid));

async function attemptBiometric() {
  error.value = "";
  busy.value = true;
  try {
    const res = await verifyBiometrics(props.uid);
    if (res === true) {
      emit("unlocked");
      return;
    }
    if (res === "prompt_pin") {
      showPinForm.value = true;
    } else {
      error.value = isTl.value
        ? "Hindi makumpirma ang biometric scan. Subukan muli o gamitin ang PIN."
        : "Biometric verification did not complete. Retry or use PIN passcode.";
      showPinForm.value = true;
    }
  } catch {
    error.value = isTl.value
      ? "Kinansela o hindi available ang biometrics. Subukan ulit o gamitin ang PIN."
      : "Biometric check cancelled or unavailable. Try again or use PIN.";
    showPinForm.value = true;
  } finally {
    busy.value = false;
  }
}

async function submitPin() {
  error.value = "";
  if (!pin.value.trim()) {
    error.value = isTl.value ? "Ilagay ang iyong PIN passcode." : "Enter your PIN passcode.";
    return;
  }
  busy.value = true;
  try {
    const ok = await verifyPasscode(props.uid, pin.value.trim());
    if (ok) {
      pin.value = "";
      emit("unlocked");
    } else {
      error.value = isTl.value ? "Maling PIN passcode." : "Incorrect PIN passcode.";
    }
  } catch (err) {
    error.value = friendlyError(err);
  } finally {
    busy.value = false;
  }
}

async function handleSignOut() {
  await logOut();
  window.location.href = "login.html";
}

onMounted(() => {
  if (isWebAuthnSupported()) {
    void attemptBiometric();
  }
});
</script>

<template>
  <div
    class="fixed inset-0 z-[150] flex items-center justify-center bg-[var(--bg-canvas)]/95 px-4 backdrop-blur-md"
    role="region"
    :aria-label="isTl ? 'Seguridad ng App' : 'App Security Lock'"
  >
    <div class="tipid-card w-full max-w-sm p-6 text-center">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
        <Lock :size="22" aria-hidden="true" />
      </div>
      <h1 class="text-lg font-semibold text-[var(--text-primary)]">
        {{ isTl ? "Naka-lock ang Tipid" : "Tipid is Locked" }}
      </h1>
      <p class="mt-1 text-xs text-[var(--text-secondary)]">
        {{ email }}
      </p>

      <p
        v-if="error"
        role="alert"
        class="mt-4 rounded-xl bg-[var(--expense-soft)] px-3 py-2 text-xs font-medium text-[var(--expense)]"
      >
        {{ error }}
      </p>

      <div class="mt-5 space-y-3">
        <button
          v-if="isWebAuthnSupported()"
          type="button"
          :disabled="busy"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
          @click="attemptBiometric"
        >
          <ScanFace :size="18" aria-hidden="true" />
          <span>{{ isTl ? "I-unlock gamit ang Biometrics" : "Unlock with Biometrics" }}</span>
        </button>

        <form v-if="showPinForm && pinAvailable" class="space-y-3 pt-2 text-left" @submit.prevent="submitPin">
          <div>
            <label for="lock-pin-input" class="mb-1 block text-xs font-medium text-[var(--text-secondary)]">
              {{ isTl ? "PIN Passcode" : "PIN Passcode" }}
            </label>
            <input
              id="lock-pin-input"
              v-model="pin"
              type="password"
              inputmode="numeric"
              maxlength="8"
              autocomplete="off"
              placeholder="••••"
              class="tipid-input text-center font-mono text-lg tracking-[0.3em]"
            />
          </div>
          <button
            type="submit"
            :disabled="busy"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-inset)]"
          >
            <KeyRound :size="16" aria-hidden="true" />
            <span>{{ isTl ? "I-verify ang PIN" : "Verify PIN" }}</span>
          </button>
        </form>

        <button
          v-if="!showPinForm && pinAvailable"
          type="button"
          class="tipid-compact w-full py-2 text-xs font-semibold text-[var(--accent)] hover:underline"
          @click="showPinForm = true"
        >
          {{ isTl ? "Gamitin ang PIN Passcode" : "Use PIN Passcode instead" }}
        </button>

        <div class="border-t border-[var(--border-subtle)] pt-3">
          <button
            type="button"
            class="tipid-compact inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--expense)]"
            @click="handleSignOut"
          >
            <LogOut :size="14" aria-hidden="true" />
            <span>{{ isTl ? "Mag-log out sa account" : "Sign out of account" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
