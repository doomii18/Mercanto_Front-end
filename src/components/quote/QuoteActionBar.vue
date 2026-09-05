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
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer border select-none";
  const hoverLift = "hover:shadow-sm";
  const disabled = "disabled:opacity-50 disabled:cursor-not-allowed";
  const processing = props.isActionProcessing(action.type)
    ? "opacity-50 cursor-not-allowed"
    : "";

  const variants: Record<string, string> = {
    success: `bg-teal-700 text-white border-teal-700 hover:bg-teal-800 hover:border-teal-800 ${hoverLift} ${disabled} ${processing}`,
    primary: `bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:border-amber-700 ${hoverLift} ${disabled} ${processing}`,
    danger:  `bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-400 ${hoverLift} ${disabled} ${processing}`,
    neutral: `bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 ${hoverLift} ${disabled} ${processing}`,
  };

  return `${base} ${variants[action.variant] ?? variants.neutral}`;
}
</script>

<template>
  <div
    v-if="hasActions"
    class="flex flex-wrap items-center gap-2.5 max-sm:w-full max-sm:flex-col max-sm:items-stretch"
  >
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
      <span>{{ action.label }}</span>
    </button>

    <ConfirmModal
      :model-value="pendingAction !== null"
      :title="pendingAction?.confirmTitle ?? ''"
      :description="pendingAction?.confirmDescription ?? ''"
      :confirm-text="pendingAction?.confirmText ?? 'Confirmar'"
      cancel-text="Volver"
      :icon="pendingAction?.icon ?? 'fa-solid fa-circle-question'"
      :icon-variant="pendingAction ? ICON_VARIANT_MAP[pendingAction.type] : 'teal'"
      :loading="isConfirming"
      @update:model-value="(val: boolean) => !val && closeConfirmation()"
      @confirm="handleConfirm"
      @cancel="closeConfirmation"
    />
  </div>
</template>
