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
      'group relative flex aspect-square w-full min-h-[140px] sm:min-h-[160px] md:min-h-[180px] flex-col items-center justify-between rounded-2xl border-2 p-3 sm:p-4 text-center transition-all duration-200 select-none overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00a896] focus-visible:ring-offset-2',
      selected
        ? 'border-[#ff6a00] bg-[#fffaf5] shadow-md ring-2 ring-[#ff6a00]/20'
        : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-[#00a896] hover:shadow-md',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    ]"
    @click="handleClick"
  >
    <!-- Spacer for balanced vertical alignment -->
    <div class="h-1 w-full shrink-0" aria-hidden="true"></div>

    <!-- Image Slot (Enlarged) -->
    <div class="flex flex-1 min-h-0 w-full items-center justify-center p-1 sm:p-1.5">
      <div
        :class="[
          'flex h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 max-h-full max-w-full items-center justify-center rounded-2xl p-2.5 transition-transform duration-200 group-hover:scale-105 overflow-hidden',
          selected ? 'bg-orange-100/60' : 'bg-slate-50 group-hover:bg-[#e0f4f2]/50'
        ]"
      >
        <CategoryImage :blob-id="imageBlobId" :alt="name" />
      </div>
    </div>

    <!-- Name Label -->
    <span
      :class="[
        'line-clamp-2 shrink-0 text-xs sm:text-sm font-semibold leading-tight transition-colors px-1 mt-1',
        selected ? 'text-[#023859] font-bold' : 'text-slate-700 group-hover:text-[#023859]'
      ]"
      :title="name"
    >
      {{ name }}
    </span>

    <!-- Checkmark Badge -->
    <div
      v-if="selected"
      class="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff6a00] text-white shadow-sm ring-2 ring-white"
    >
      <i class="fa-solid fa-check text-xs"></i>
    </div>
  </button>
</template>
