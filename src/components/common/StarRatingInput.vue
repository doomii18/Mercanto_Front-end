<script setup lang="ts">
import { ref, computed } from "vue";

interface Props {
  modelValue?: number;
  maxStars?: number;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  maxStars: 5,
  disabled: false,
  size: "md",
  showLabel: true,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const hoveredRating = ref<number | null>(null);

const activeRating = computed(() => {
  if (hoveredRating.value !== null) {
    return hoveredRating.value;
  }
  return props.modelValue;
});

const labels: Record<number, string> = {
  1: "Malo",
  2: "Regular",
  3: "Bueno",
  4: "Muy bueno",
  5: "Excelente",
};

const currentLabel = computed(() => {
  if (activeRating.value > 0 && labels[activeRating.value]) {
    return labels[activeRating.value];
  }
  return "";
});

function handleMouseEnter(star: number) {
  if (!props.disabled) {
    hoveredRating.value = star;
  }
}

function handleMouseLeave() {
  if (!props.disabled) {
    hoveredRating.value = null;
  }
}

function handleClick(star: number) {
  if (!props.disabled) {
    emit("update:modelValue", star);
  }
}

const sizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return "text-base gap-1";
    case "lg":
      return "text-2xl gap-2";
    case "md":
    default:
      return "text-xl gap-1.5";
  }
});
</script>

<template>
  <div class="inline-flex items-center gap-3">
    <div
      class="flex items-center select-none"
      :class="[sizeClasses, disabled ? 'cursor-default' : 'cursor-pointer']"
      @mouseleave="handleMouseLeave"
    >
      <button
        v-for="star in maxStars"
        :key="star"
        type="button"
        :disabled="disabled"
        class="transition-transform duration-150 focus:outline-none"
        :class="[!disabled && 'hover:scale-110']"
        :aria-label="`${star} estrellas`"
        @mouseenter="handleMouseEnter(star)"
        @click="handleClick(star)"
      >
        <i
          :class="[
            star <= activeRating
              ? 'fa-solid fa-star text-amber-400'
              : 'fa-regular fa-star text-slate-300',
          ]"
        ></i>
      </button>
    </div>

    <span
      v-if="showLabel && currentLabel"
      class="text-xs font-semibold text-slate-600 transition-opacity duration-150"
    >
      {{ currentLabel }}
    </span>
  </div>
</template>
