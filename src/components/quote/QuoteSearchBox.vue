
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import type { QuoteAggregateResponse, QuoteResponse } from "@/api";
import QuoteStatusBadge from "./QuoteStatusBadge.vue";
import { uuidToCrockford } from "../../utils/formatters";

interface CounterpartyInfo {
  name: string;
  avatarBlobId: string | null;
}

const props = withDefaults(
  defineProps<{
    quotes: QuoteAggregateResponse[];
    counterpartiesMap?: Map<string, CounterpartyInfo>;
    isProvider?: boolean;
    placeholder?: string;
  }>(),
  {
    counterpartiesMap: () => new Map(),
    isProvider: false,
    placeholder: "Buscar por ID, producto, notas o dirección...",
  }
);

const router = useRouter();
const searchBoxRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const isDropdownOpen = ref(false);

const getCounterpartyId = (q: QuoteResponse) =>
  props.isProvider ? q.buyer_id : q.provider_id;

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return [];
  return props.quotes.filter((aggregate) => {
    const q = aggregate.quote;
    const crockford = uuidToCrockford(q.id).toLowerCase();
    const itemsMatch = aggregate.items.some((item) =>
      item.product_title_snapshot.toLowerCase().includes(query)
    );
    const notesMatch = (q.buyer_notes || "").toLowerCase().includes(query);
    const addressMatch = (q.shipping_address || "").toLowerCase().includes(query);
    return (
      q.id.toLowerCase().includes(query) ||
      crockford.includes(query) ||
      notesMatch ||
      addressMatch ||
      itemsMatch
    );
  });
});

const getShortId = (quoteId: string): string => {
  const crockford = uuidToCrockford(quoteId);
  return crockford.slice(0, 5);
};

const getQuoteTotal = (aggregate: QuoteAggregateResponse): string => {
  const total = aggregate.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
  return `C$ ${total.toLocaleString("es-NI")}`;
};

const handleSelectOrder = (quoteId: string) => {
  isDropdownOpen.value = false;
  searchQuery.value = "";
  router.push({ name: "quote-detail", params: { id: quoteId } });
};

const handleClickOutside = (event: MouseEvent) => {
  if (searchBoxRef.value && !searchBoxRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false;
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div ref="searchBoxRef" class="relative w-full md:w-80 lg:w-96">
    <div
      class="flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 gap-2.5 transition-all duration-200 focus-within:border-teal-600 focus-within:ring-2 focus-within:ring-teal-600/15 shadow-2xs"
    >
      <i class="fa-solid fa-magnifying-glass text-slate-400 text-sm shrink-0"></i>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        class="w-full border-none outline-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 font-sans"
        @focus="isDropdownOpen = true"
        @input="isDropdownOpen = true"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="text-slate-400 hover:text-slate-600 p-0.5 shrink-0 transition-colors cursor-pointer"
        aria-label="Limpiar búsqueda"
        @click="searchQuery = ''"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <!-- Floating Result Box -->
    <div
      v-if="isDropdownOpen && searchQuery.trim().length > 0"
      class="absolute top-full mt-2 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-80 overflow-y-auto z-50 p-1.5 flex flex-col"
      role="listbox"
    >
      <div v-if="searchResults.length === 0" class="py-6 px-4 text-center text-slate-400 flex flex-col items-center gap-2 text-sm">
        <i class="fa-regular fa-folder-open text-2xl"></i>
        <span>No se encontraron pedidos</span>
      </div>
      <div
        v-for="item in searchResults"
        :key="item.quote.id"
        class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors outline-none focus-visible:bg-slate-50 border-b border-slate-50 last:border-b-0"
        role="option"
        tabindex="0"
        @click="handleSelectOrder(item.quote.id)"
        @keydown.enter="handleSelectOrder(item.quote.id)"
      >
        <div class="w-9 h-9 rounded-lg bg-teal-50 text-[#00a896] flex items-center justify-center text-sm shrink-0">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <div class="flex-1 min-w-0 flex flex-col gap-0.5">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm text-[#083c5a] truncate" :title="item.items[0]?.product_title_snapshot">
              {{ item.items[0]?.product_title_snapshot || 'Pedido sin productos' }}
            </span>
            <span v-if="item.items.length > 1" class="bg-slate-100 text-slate-600 text-[0.7rem] font-bold px-1.5 py-0.5 rounded shrink-0">
              +{{ item.items.length - 1 }}
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-xs text-slate-500 truncate">
            <span class="font-medium truncate">
              {{ counterpartiesMap.get(getCounterpartyId(item.quote))?.name || (isProvider ? 'Comprador' : 'Proveedor') }}
            </span>
            <span class="text-slate-300">•</span>
            <span class="font-bold text-[#083c5a]">#{{ getShortId(item.quote.id) }}</span>
            <span class="text-slate-300">•</span>
            <span class="font-bold text-orange-500">{{ getQuoteTotal(item) }}</span>
          </div>
        </div>
        <div class="shrink-0">
          <QuoteStatusBadge :status="item.quote.status" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>
