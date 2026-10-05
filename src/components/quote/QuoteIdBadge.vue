<script setup lang="ts">
import { ref, computed } from "vue";
import { uuidToCrockford } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{
    quoteId: string;
    size?: "sm" | "lg";
  }>(),
  {
    size: "sm",
  }
);

const copied = ref(false);

const chunks = computed(() => {
  if (!props.quoteId) return [];
  const encoded = uuidToCrockford(props.quoteId);
  return encoded.split("-");
});

const copyFullId = async () => {
  if (!props.quoteId) return;
  try {
    await navigator.clipboard.writeText(props.quoteId);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // fallback if navigator.clipboard fails
  }
};
</script>

<template>
  <button
    type="button"
    :class="[
      'inline-flex items-center bg-[#f0f4f8] hover:bg-[#e4ebf2] border border-slate-200/90 rounded-lg transition-colors cursor-pointer select-none max-w-full text-left group',
      size === 'lg' ? 'px-3.5 py-1.5' : 'px-3 py-1'
    ]"
    :title="copied ? '¡ID copiado al portapapeles!' : `Copiar UUID completo: ${quoteId}`"
    :aria-label="copied ? 'ID copiado al portapapeles' : `Copiar ID: ${quoteId}`"
    @click.stop="copyFullId"
  >
    <div
      class="inline-flex flex-wrap items-center font-sans font-bold tracking-wider text-[#083c5a]"
      :class="size === 'lg' ? 'text-base' : 'text-xs sm:text-[0.82rem]'"
    >
      <template v-for="(chunk, idx) in chunks" :key="idx">
        <span class="whitespace-nowrap">{{ chunk }}</span>
        <span v-if="idx < chunks.length - 1" class="text-slate-400 font-normal mx-1">-</span>
      </template>
    </div>

    <span class="ml-2 inline-flex items-center justify-center shrink-0">
      <i
        v-if="copied"
        class="fa-solid fa-check text-emerald-600 text-xs"
      ></i>
      <i
        v-else
        class="fa-regular fa-copy text-slate-400 group-hover:text-teal-600 text-xs transition-colors"
      ></i>
    </span>
  </button>
</template>
