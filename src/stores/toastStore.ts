import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface Toast {
  id: string;
  title: string;
  message: string;
  icon?: string;
  variant?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  onClick?: () => void;
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([]);

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    toasts.value.push(newToast);

    const duration = toast.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, addToast, removeToast };
});
