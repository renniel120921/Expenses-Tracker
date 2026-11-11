import { ref } from "vue";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const toasts = ref<ToastItem[]>([]);
let nextId = 1;

export function pushToast(message: string, tone: ToastTone = "info", durationMs = 3000): void {
  const id = nextId++;
  toasts.value.push({ id, message, tone });
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, durationMs);
}

export function dismissToast(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id);
}

export function useToast() {
  return {
    toasts,
    pushToast,
    dismissToast
  };
}
