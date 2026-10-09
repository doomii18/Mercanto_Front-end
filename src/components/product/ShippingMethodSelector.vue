<script setup lang="ts">
import { computed } from "vue";
import type { ShippingMethod } from "@/api";

export interface ShippingMethodDetail {
  id: ShippingMethod;
  name: string;
  icon: string;
  description: string;
}

const SHIPPING_METADATA: Record<ShippingMethod, ShippingMethodDetail> = {
  bus: {
    id: "bus",
    name: "Bus Interlocal",
    icon: "fa-solid fa-bus",
    description: "Envío terminal a terminal mediante transporte interlocal",
  },
  own_delivery: {
    id: "own_delivery",
    name: "Entrega Propia / Paquetería",
    icon: "fa-solid fa-truck",
    description: "Entrega directa por el comercio o paquetería privada",
  },
};

interface Props {
  methods?: (ShippingMethod | string)[];
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  methods: () => [],
  modelValue: "bus",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: ShippingMethod): void;
}>();

const availableOptions = computed<ShippingMethodDetail[]>(() => {
  const rawMethods = props.methods || [];
  return rawMethods
    .map((m) => SHIPPING_METADATA[m as ShippingMethod])
    .filter((opt): opt is ShippingMethodDetail => Boolean(opt));
});

function handleSelect(methodId: ShippingMethod) {
  emit("update:modelValue", methodId);
}
</script>

<template>
  <div class="shipping-method-selector">
    <p class="mb-2 text-sm font-semibold text-neutral-900">
      Método de envío disponible:
    </p>

    <div v-if="availableOptions.length > 0" class="flex flex-wrap gap-2.5">
      <button
        v-for="method in availableOptions"
        :key="method.id"
        type="button"
        :class="[
          'flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold border transition-all duration-150',
          modelValue === method.id
            ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs ring-1 ring-teal-500/30'
            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50',
        ]"
        @click="handleSelect(method.id)"
      >
        <i :class="[method.icon, modelValue === method.id ? 'text-teal-600' : 'text-neutral-500']"></i>
        <span>{{ method.name }}</span>
      </button>
    </div>

    <div
      v-else
      class="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-3.5 py-2.5 text-xs text-neutral-600"
    >
      <i class="fa-solid fa-truck-ramp-box text-neutral-400"></i>
      <span>Envío y flete a coordinar directamente con el comercio al cotizar.</span>
    </div>

    <p class="mt-2 text-xs text-neutral-500">
      *El costo de flete final es calculado y cotizado directamente por el comercio según destino.
    </p>
  </div>
</template>
