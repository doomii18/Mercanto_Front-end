<script setup lang="ts">
import CategoryImage from "./CategoryImage.vue";

interface Props {
  id: string;
  name: string;
  imageBlobId?: string | null;
  selected?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  imageBlobId: null,
  selected: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: "toggle", id: string): void;
  (e: "click", event: MouseEvent): void;
}>();

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return;
  emit("click", event);
  emit("toggle", props.id);
};
</script>

<template>
  <button
    type="button"
    role="checkbox"
    :aria-checked="selected"
    :aria-label="name"
    :disabled="disabled"
    :class="[
      'group relative flex aspect-square w-full min-h-0 flex-col items-center justify-between rounded-2xl border-2 p-2.5 text-center transition-all duration-150 select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a896] focus-visible:ring-offset-2',
      selected
        ? 'border-[#ff6a00] bg-[#fffaf5]'
        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#00a896]',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    ]"
    @click="handleClick"
  >
    <!-- Spacer for balanced vertical alignment -->
    <div class="h-1 w-full shrink-0" aria-hidden="true"></div>

    <!-- Image Slot -->
    <div class="flex flex-1 min-h-0 w-full items-center justify-center p-1">
      <div class="h-11 w-11 sm:h-12 sm:w-12 max-h-full max-w-full flex items-center justify-center overflow-hidden">
        <CategoryImage :blob-id="imageBlobId" :alt="name" />
      </div>
    </div>

    <!-- Name Label -->
    <span
      :class="[
        'line-clamp-2 shrink-0 text-[11px] sm:text-xs font-semibold leading-tight transition-colors px-0.5',
        selected ? 'text-[#023859]' : 'text-slate-700 group-hover:text-[#023859]'
      ]"
      :title="name"
    >
      {{ name }}
    </span>

    <!-- Checkmark Badge -->
    <div
      v-if="selected"
      class="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-xs"
    >
      <i class="fa-solid fa-check text-[10px]"></i>
    </div>
  </button>
</template>
