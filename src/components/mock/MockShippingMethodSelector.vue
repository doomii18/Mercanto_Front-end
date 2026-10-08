<script setup lang="ts">
import { computed, watch } from "vue";

export interface ShippingMethodOption {
  id: string;
  name: string;
  icon: string;
  cost: number;
}

interface Props {
  methods?: string[];
  seed?: string;
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  methods: () => [],
  seed: "",
  modelValue: "bus",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "update:selectedMethod", method: ShippingMethodOption): void;
}>();

const ALL_METHODS: Record<string, ShippingMethodOption> = {
  bus: {
    id: "bus",
    name: "Bus Interlocal",
    icon: "fa-solid fa-bus",
    cost: 150,
  },
  own_delivery: {
    id: "own_delivery",
    name: "Entrega Propia",
    icon: "fa-solid fa-truck",
    cost: 180,
  },
};

const availableOptions = computed<ShippingMethodOption[]>(() => {
  const rawMethods = props.methods || [];
  if (rawMethods.length === 0) {
    return [ALL_METHODS.bus, ALL_METHODS.own_delivery];
  }
  return rawMethods
    .map((m) => ALL_METHODS[m])
    .filter((opt): opt is ShippingMethodOption => Boolean(opt));
});

const currentSelected = computed<ShippingMethodOption | undefined>(() => {
  if (availableOptions.value.length === 0) return undefined;
  return (
    availableOptions.value.find((m) => m.id === props.modelValue) ||
    availableOptions.value[0]
  );
});

watch(
  currentSelected,
  (method) => {
    if (method) {
      if (props.modelValue !== method.id) {
        emit("update:modelValue", method.id);
      }
      emit("update:selectedMethod", method);
    }
  },
  { immediate: true }
);

function handleSelect(methodId: string) {
  emit("update:modelValue", methodId);
}
</script>

<template>
  <div>
    <p class="mb-2 text-sm font-semibold text-neutral-900">Tipo de envío disponible:</p>
    <div class="flex flex-wrap gap-3">
      <div
        v-for="method in availableOptions"
        :key="method.id"
        :class="[
          'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-150',
          modelValue === method.id
            ? 'bg-teal-500/15 text-teal-600'
            : 'text-neutral-900 hover:bg-neutral-200',
        ]"
        @click="handleSelect(method.id)"
      >
        <i :class="method.icon"></i>
        <span>{{ method.name }}</span>
      </div>
    </div>
    <p class="mt-2 text-xs italic text-neutral-500">
      *Costos de envío estimados, calculados al finalizar la compra.
    </p>
  </div>
</template>
