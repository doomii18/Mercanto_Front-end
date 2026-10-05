<script setup lang="ts">
import {
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "reka-ui";
import { useAuthPromptStore } from "@/stores/ui";

const authPromptStore = useAuthPromptStore();
</script>

<template>
  <AlertDialogRoot v-model:open="authPromptStore.isOpen">
    <AlertDialogPortal>
      <AlertDialogOverlay
        class="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
      />
      <AlertDialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 sm:p-7 shadow-2xl transition-all duration-200 focus:outline-none"
      >
        <div class="flex flex-col items-center text-center">
          <div
            :class="[
              'mb-4 flex h-14 w-14 items-center justify-center rounded-full shadow-xs ring-8',
              authPromptStore.options.iconBg || 'bg-rose-50 ring-rose-50/50',
              authPromptStore.options.iconColor || 'text-rose-500'
            ]"
          >
            <i :class="[authPromptStore.options.icon || 'fa-solid fa-heart', 'text-2xl']"></i>
          </div>

          <AlertDialogTitle class="font-serif text-xl font-bold text-[#083c5a] mb-2 leading-snug">
            {{ authPromptStore.options.title || "¿Deseas iniciar sesión?" }}
          </AlertDialogTitle>

          <AlertDialogDescription class="text-sm text-slate-500 leading-relaxed mb-6">
            {{ authPromptStore.options.message || "Debes iniciar sesión para realizar esta acción. Puedes iniciar sesión ahora o continuar explorando los productos." }}
          </AlertDialogDescription>

          <div class="flex w-full flex-col-reverse sm:flex-row gap-2.5">
            <AlertDialogCancel
              class="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer focus:ring-2 focus:ring-slate-300"
              @click="authPromptStore.cancel()"
            >
              {{ authPromptStore.options.cancelText || "Seguir explorando" }}
            </AlertDialogCancel>

            <AlertDialogAction
              class="w-full sm:flex-1 rounded-xl bg-[#00a896] hover:bg-[#008f80] py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-[#00a896]/30 flex items-center justify-center gap-2"
              @click="authPromptStore.confirm()"
            >
              <i class="fa-solid fa-arrow-right-to-bracket text-xs"></i>
              <span>{{ authPromptStore.options.confirmText || "Iniciar sesión" }}</span>
            </AlertDialogAction>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</template>
