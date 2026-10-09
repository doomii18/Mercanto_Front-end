<script setup lang="ts">
import { computed } from "vue";
import type { ProductSpecOptions } from "@/api/modules/catalog/product/types";

interface Props {
  specOptions?: ProductSpecOptions | null;
  modelValue?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  specOptions: () => ({}),
  modelValue: () => ({}),
});

const emit = defineEmits<{
  (e: "update:modelValue", value: Record<string, string>): void;
  (e: "change-option", key: string, value: string): void;
}>();

// Formats a key name for display (e.g., "color" -> "Color", "talla_calzado" -> "Talla Calzado")
function formatOptionKey(key: string): string {
  if (!key) return "";
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// Entries filtered: only keys with non-empty string arrays
const optionEntries = computed<[string, string[]][]>(() => {
  if (!props.specOptions || typeof props.specOptions !== "object") return [];
  return Object.entries(props.specOptions).filter(
    ([, values]) => Array.isArray(values) && values.length > 0
  );
});

function handleSelect(key: string, value: string) {
  const updated = {
    ...props.modelValue,
    [key]: value,
  };
  emit("update:modelValue", updated);
  emit("change-option", key, value);
}

function isSelected(key: string, value: string): boolean {
  if (props.modelValue && props.modelValue[key] !== undefined) {
    return props.modelValue[key] === value;
  }
  // Default to first option if none selected yet
  const entry = optionEntries.value.find(([k]) => k === key);
  return Boolean(entry && entry[1][0] === value);
}
</script>

<template>
  <div v-if="optionEntries.length > 0" class="spec-options-container flex flex-col gap-4 mb-5">
    <div
      v-for="[key, values] in optionEntries"
      :key="key"
      class="spec-option-group"
    >
      <div class="mb-2 flex items-center justify-between text-sm">
        <span class="font-semibold text-neutral-900">
          {{ formatOptionKey(key) }}:
        </span>
        <span class="text-xs font-medium text-neutral-500">
          {{ modelValue[key] || values[0] }}
        </span>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="value in values"
          :key="value"
          type="button"
          :class="[
            'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all duration-150 select-none',
            isSelected(key, value)
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
              : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50',
          ]"
          @click="handleSelect(key, value)"
        >
          {{ value }}
        </button>
      </div>
    </div>
  </div>
</template>
