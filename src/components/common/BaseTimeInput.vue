<script setup lang="ts">
import { computed } from "vue";
import { TimeFieldRoot, TimeFieldInput, type TimeValue } from "reka-ui";
import { parseTime } from "@internationalized/date";
import { Clock, X } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    modelValue?: string | TimeValue | null;
    label?: string;
    labelClass?: string;
    description?: string;
    error?: string;
    disabled?: boolean;
    readonly?: boolean;
    hourCycle?: 12 | 24;
    granularity?: "hour" | "minute" | "second";
    id?: string;
    name?: string;
  }>(),
  {
    modelValue: null,
    label: undefined,
    labelClass: undefined,
    description: undefined,
    error: undefined,
    disabled: false,
    readonly: false,
    hourCycle: 12,
    granularity: "minute",
    id: undefined,
    name: undefined,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "change", value: string | null): void;
}>();

const innerTime = computed<TimeValue | undefined>({
  get() {
    if (!props.modelValue) return undefined;
    if (typeof props.modelValue === "string") {
      try {
        return parseTime(props.modelValue);
      } catch {
        return undefined;
      }
    }
    return props.modelValue;
  },
  set(val) {
    if (!val) {
      emit("update:modelValue", null);
      emit("change", null);
      return;
    }
    const h = String(val.hour).padStart(2, "0");
    const m = String(val.minute).padStart(2, "0");
    const strVal =
      props.granularity === "second"
        ? `${h}:${m}:${String(val.second).padStart(2, "0")}`
        : `${h}:${m}`;
    emit("update:modelValue", strVal);
    emit("change", strVal);
  },
});

const handleClear = () => {
  innerTime.value = undefined;
};
</script>

<template>
  <div class="flex flex-col gap-1.5 w-full">
    <label
      v-if="label"
      :for="id"
      :class="labelClass || 'text-sm font-semibold text-gray-700'"
    >
      {{ label }}
    </label>

    <TimeFieldRoot
      :id="id"
      :name="name"
      v-model="innerTime"
      :disabled="disabled"
      :readonly="readonly"
      :hour-cycle="hourCycle"
      :granularity="granularity"
      v-slot="{ segments }"
      class="inline-flex h-10 items-center gap-1 w-full rounded-xl border bg-white px-3.5 text-sm transition-all focus-within:ring-2 focus-within:ring-[#189c94]/15 focus-within:border-[#189c94]"
      :class="[
        error
          ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500/20'
          : 'border-slate-200 hover:border-slate-300',
        disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : '',
      ]"
    >
      <Clock class="w-4 h-4 text-slate-400 mr-1.5 flex-shrink-0" />

      <div class="flex items-center select-none font-mono text-sm tracking-wider">
        <template v-for="item in segments" :key="item.part">
          <TimeFieldInput
            :part="item.part"
            class="rounded px-1 py-0.5 text-[#083c5a] outline-none transition focus:bg-[#e6f7f5] focus:text-[#189c94] data-[placeholder]:text-slate-400"
          >
            {{ item.value }}
          </TimeFieldInput>
        </template>
      </div>

      <button
        v-if="modelValue && !disabled && !readonly"
        type="button"
        @click="handleClear"
        class="ml-auto text-slate-400 hover:text-slate-600 rounded p-0.5 transition"
        title="Limpiar hora"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </TimeFieldRoot>

    <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
    <p v-else-if="description" class="text-xs text-slate-500">{{ description }}</p>
  </div>
</template>
