<script setup lang="ts">
import { ref, computed } from "vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import type { QuoteAction, QuoteActionType } from "@/composables/useQuoteActions";

interface Props {
  actions: QuoteAction[];
  isActionProcessing?: (type: QuoteActionType) => boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActionProcessing: () => false,
});

const emit = defineEmits<{
  (e: "action", action: QuoteAction): void;
}>();

const pendingAction = ref<QuoteAction | null>(null);
const isConfirming = ref(false);

const hasActions = computed(() => props.actions.length > 0);

const ICON_VARIANT_MAP: Record<QuoteActionType, "teal" | "orange" | "danger"> = {
  accept: "teal",
  pay: "teal",
  fulfill: "teal",
  reject: "danger",
  cancel: "orange",
};

function openConfirmation(action: QuoteAction) {
  pendingAction.value = action;
}

function closeConfirmation() {
  pendingAction.value = null;
  isConfirming.value = false;
}

async function handleConfirm() {
  if (!pendingAction.value) return;
  isConfirming.value = true;
  emit("action", pendingAction.value);
}

function getButtonClasses(action: QuoteAction): string {
  const base =
    "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer border-[1.5px] select-none";
  const hoverLift = "hover:-translate-y-px hover:shadow-md";
  const disabled = "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";
  const processing = props.isActionProcessing(action.type)
    ? "opacity-60 cursor-not-allowed"
    : "";

  const variants: Record<string, string> = {
    success: `bg-(--light-teal) text-white border-(--light-teal) hover:bg-teal-600 hover:border-teal-600 ${hoverLift} ${disabled} ${processing}`,
    primary: `bg-(--primary-orange) text-white border-(--primary-orange) hover:bg-orange-600 hover:border-orange-600 ${hoverLift} ${disabled} ${processing}`,
    danger:  `bg-white text-red-600 border-red-300 hover:bg-red-50 hover:border-red-600 ${hoverLift} ${disabled} ${processing}`,
    neutral: `bg-white text-(--primary-blue) border-slate-300 hover:bg-slate-50 hover:border-(--primary-blue) ${hoverLift} ${disabled} ${processing}`,
  };

  return `${base} ${variants[action.variant] ?? variants.neutral}`;
}
</script>

<template>
  <div
    v-if="hasActions"
    class="flex flex-col gap-4 rounded-2xl border-[1.5px] border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50/40 p-5 md:p-6"
  >
    <!-- Hint -->
    <div class="flex items-center gap-2 text-xs font-medium text-slate-500">
      <i class="fa-solid fa-circle-info text-sm text-(--light-teal)"></i>
      <span>Acciones disponibles para el estado actual</span>
    </div>

    <!-- Buttons -->
    <div class="flex flex-wrap items-center justify-end gap-3 max-sm:flex-col max-sm:items-stretch">
      <button
        v-for="action in actions"
        :key="action.type"
        type="button"
        :class="getButtonClasses(action)"
        :disabled="isActionProcessing(action.type)"
        @click="openConfirmation(action)"
      >
        <i
          v-if="isActionProcessing(action.type)"
          class="fa-solid fa-spinner fa-spin"
        ></i>
        <i v-else :class="action.icon"></i>
        <span class="max-sm:text-center">{{ action.label }}</span>
      </button>
    </div>

    <!-- Confirm Modal -->
    <ConfirmModal
      :model-value="pendingAction !== null"
      :title="pendingAction?.confirmTitle ?? ''"
      :description="pendingAction?.confirmDescription ?? ''"
      :confirm-text="pendingAction?.confirmText ?? 'Confirmar'"
      cancel-text="Volver"
      :icon="pendingAction?.icon ?? 'fa-solid fa-circle-question'"
      :icon-variant="
        pendingAction ? ICON_VARIANT_MAP[pendingAction.type] : 'teal'
      "
      :loading="isConfirming"
      @update:model-value="(val: boolean) => !val && closeConfirmation()"
      @confirm="handleConfirm"
      @cancel="closeConfirmation"
    />
  </div>
</template>
