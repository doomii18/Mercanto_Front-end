<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore';

const toastStore = useToastStore();

const getVariantClasses = (variant?: string) => {
  switch (variant) {
    case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-800';
    case 'warning': return 'bg-amber-50 border-amber-200 text-amber-800';
    case 'error': return 'bg-red-50 border-red-200 text-red-800';
    default: return 'bg-white border-slate-200 text-slate-800';
  }
};

const getIconClasses = (variant?: string) => {
  switch (variant) {
    case 'success': return 'text-emerald-600 bg-emerald-100';
    case 'warning': return 'text-amber-600 bg-amber-100';
    case 'error': return 'text-red-600 bg-red-100';
    default: return 'text-[#00a896] bg-[#e6f7f5]'; // Teal for info
  }
};
</script>

<template>
  <div class="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
    <TransitionGroup name="toast-slide">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        :class="[
          'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg cursor-pointer transition-all hover:shadow-xl',
          getVariantClasses(toast.variant)
        ]"
        @click="toast.onClick?.()"
      >
        <div :class="['w-8 h-8 rounded-full flex items-center justify-center shrink-0', getIconClasses(toast.variant)]">
          <i :class="toast.icon || 'fa-solid fa-bell'" class="text-sm"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-sm mb-0.5">{{ toast.title }}</h4>
          <p class="text-xs opacity-80 line-clamp-2">{{ toast.message }}</p>
        </div>
        <button
          class="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1 -m-1"
          @click.stop="toastStore.removeToast(toast.id)"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}
.toast-slide-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-slide-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
.toast-slide-move {
  transition: transform 0.3s ease;
}
</style>
