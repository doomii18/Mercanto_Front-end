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
  // The most recent alert is at index 0 (rendered at front)
  const currentAlert = computed(() => queue.value[0] ?? null);
  const isOpen = computed(() => queue.value.length > 0);

  function spawnAlert(options: AlertOptions | string): string {
    const payload: AlertOptions =
      typeof options === "string" ? { message: options } : options;

    const id = payload.id ?? crypto.randomUUID();
    const newAlert: AlertOptions = {
      id,
      title: payload.title ?? "Error",
      message: payload.message,
      confirmText: payload.confirmText ?? "Entendido",
      iconVariant: payload.iconVariant ?? "danger",
      icon: payload.icon ?? "fa-solid fa-circle-exclamation",
      onConfirm: payload.onConfirm,
    };

    // If identical alert is already at the front, prevent duplicate spam
    if (
      queue.value.length > 0 &&
      queue.value[0].message === newAlert.message &&
      queue.value[0].title === newAlert.title
    ) {
      return queue.value[0].id ?? id;
    }

    // Place newest alert at the front (index 0) so it renders immediately
    queue.value.unshift(newAlert);
    return id;
  }

  function showError(message: string, title = "Error"): string {
    return spawnAlert({
      title,
      message,
      iconVariant: "danger",
      icon: "fa-solid fa-circle-exclamation",
    });
  }

  function showWarning(message: string, title = "Advertencia"): string {
    return spawnAlert({
      title,
      message,
      iconVariant: "orange",
      icon: "fa-solid fa-triangle-exclamation",
    });
  }

  function dismiss(id?: string) {
    if (queue.value.length === 0) return;
    if (id) {
      const idx = queue.value.findIndex((a) => a.id === id);
      if (idx !== -1) {
        const item = queue.value[idx];
        item.onConfirm?.();
        queue.value.splice(idx, 1);
        return;
      }
    }
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
    showWarning,
    dismiss,
    clearAll,
  };
});
