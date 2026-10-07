<script setup lang="ts">
import { computed, watch } from "vue";

export interface MockProductColor {
  name: string;
  hex: string;
}

const COLOR_PRESETS: MockProductColor[] = [
  { name: "Café Rústico", hex: "#4a2c11" },
  { name: "Negro Mate", hex: "#1e293b" },
  { name: "Miel / Tan", hex: "#c88a4b" },
  { name: "Azul Marino", hex: "#0f3460" },
  { name: "Gris Asfalto", hex: "#64748b" },
  { name: "Verde Oliva", hex: "#4d5b3d" },
  { name: "Vino", hex: "#6b212f" },
  { name: "Blanco Hueso", hex: "#f1f5f9" },
];

interface Props {
  seed: string;
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

const availableColors = computed<MockProductColor[]>(() => {
  if (!props.seed || props.seed.trim() === "") return [];
  const seedNum = hashString(props.seed);
  const hasColorVariants = seedNum % 10 < 6;
  if (!hasColorVariants) return [];

  const count = 2 + (Math.floor(seedNum / 10) % 4);
  const colors: MockProductColor[] = [];
  for (let i = 0; i < count; i++) {
    const index = (seedNum + i * 2) % COLOR_PRESETS.length;
    const candidate = COLOR_PRESETS[index];
    if (!colors.some((c) => c.name === candidate.name)) {
      colors.push(candidate);
    }
  }
  return colors;
});

watch(
  availableColors,
  (colors) => {
    if (colors.length > 0) {
      if (!props.modelValue || !colors.some((c) => c.name === props.modelValue)) {
        emit("update:modelValue", colors[0].name);
      }
    } else {
      if (props.modelValue !== "") {
        emit("update:modelValue", "");
      }
    }
  },
  { immediate: true }
);

function selectColor(name: string) {
  emit("update:modelValue", name);
}
</script>

<template>
  <div v-if="availableColors.length > 0" class="mb-5">
    <div class="mb-2 flex items-center gap-2 text-sm">
      <span class="font-semibold text-neutral-900">Color:</span>
      <span class="text-neutral-500">{{ modelValue }}</span>
    </div>
    <div class="flex items-center gap-3">
      <button
        v-for="color in availableColors"
        :key="color.name"
        type="button"
        :title="color.name"
        :aria-label="color.name"
        :class="[
          'group relative flex h-7 w-7 items-center justify-center rounded-full transition-all focus:outline-none cursor-pointer',
          modelValue === color.name
            ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110'
            : 'border border-neutral-300 hover:scale-105',
        ]"
        :style="{ backgroundColor: color.hex }"
        @click="selectColor(color.name)"
      >
        <i
          v-if="modelValue === color.name"
          class="fa-solid fa-check text-[10px]"
          :class="color.name.includes('Blanco') ? 'text-neutral-900' : 'text-white'"
        ></i>
      </button>
    </div>
  </div>
</template>
