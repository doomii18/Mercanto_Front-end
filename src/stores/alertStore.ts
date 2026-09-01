import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface AlertOptions {
  id?: string;
  title?: string;
  message: string;
  confirmText?: string;
  iconVariant?: "teal" | "orange" | "danger";
  icon?: string;
  onConfirm?: () => void;
}

export const useAlertStore = defineStore("alert", () => {
  const queue = ref<AlertOptions[]>([]);
  const currentAlert = computed(() => queue.value[0] ?? null);
  const isOpen = computed(() => queue.value.length > 0);

  function spawnAlert(options: AlertOptions | string) {
    const payload: AlertOptions =
      typeof options === "string" ? { message: options } : options;

    queue.value.push({
      id: payload.id ?? crypto.randomUUID(),
      title: payload.title ?? "Error",
      message: payload.message,
      confirmText: payload.confirmText ?? "Entendido",
      iconVariant: payload.iconVariant ?? "danger",
      icon: payload.icon ?? "fa-solid fa-circle-exclamation",
      onConfirm: payload.onConfirm,
    });
  }

  function showError(message: string, title = "Error") {
    spawnAlert({
      title,
      message,
      iconVariant: "danger",
      icon: "fa-solid fa-circle-exclamation",
    });
  }

  function dismiss() {
    if (queue.value.length === 0) return;
    const active = queue.value[0];
    active.onConfirm?.();
    queue.value.shift();
  }

  function clearAll() {
    queue.value = [];
  }

  return {
    queue,
    currentAlert,
    isOpen,
    spawnAlert,
    showError,
    dismiss,
    clearAll,
  };
});
