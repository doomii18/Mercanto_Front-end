import { defineStore } from "pinia";
import { ref } from "vue";
import type { Router } from "vue-router";

export interface AuthPromptOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  redirectPath?: string;
  router?: Router;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const useAuthPromptStore = defineStore("authPrompt", () => {
  const isOpen = ref(false);
  const options = ref<AuthPromptOptions>({});

  function promptLogin(opts: AuthPromptOptions = {}) {
    options.value = {
      title: opts.title ?? "¿Deseas iniciar sesión?",
      message:
        opts.message ??
        "Para realizar esta acción necesitas iniciar sesión. Puedes iniciar sesión ahora o continuar explorando los productos.",
      confirmText: opts.confirmText ?? "Iniciar sesión",
      cancelText: opts.cancelText ?? "Seguir explorando",
      redirectPath: opts.redirectPath,
      router: opts.router,
      icon: opts.icon ?? "fa-solid fa-heart",
      iconColor: opts.iconColor ?? "text-rose-500",
      iconBg: opts.iconBg ?? "bg-rose-50 ring-rose-50/50",
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    };
    isOpen.value = true;
  }

  function confirm() {
    isOpen.value = false;
    if (options.value.onConfirm) {
      options.value.onConfirm();
    } else if (options.value.router) {
      options.value.router.push({
        name: "login",
        query: options.value.redirectPath ? { redirect: options.value.redirectPath } : undefined,
      });
    }
  }

  function cancel() {
    isOpen.value = false;
    options.value.onCancel?.();
  }

  return {
    isOpen,
    options,
    promptLogin,
    confirm,
    cancel,
  };
});
