
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import type { QuoteAggregateResponse, QuoteResponse } from "../../api/services/quote/types";
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
    placeholder: "Buscar por ID, producto o contraparte...",
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
    const counterpartyName = props.counterpartiesMap.get(getCounterpartyId(q))?.name.toLowerCase() || "";
    const itemsMatch = aggregate.items.some((item) =>
      item.product_title_snapshot.toLowerCase().includes(query)
    );
    return (
      q.id.toLowerCase().includes(query) ||
      crockford.includes(query) ||
      counterpartyName.includes(query) ||
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
  <div ref="searchBoxRef" class="search-container">
    <div class="search-input-wrapper">
      <i class="fa-solid fa-magnifying-glass search-icon"></i>
      <input
        v-model="searchQuery"
        type="text"
        :placeholder="placeholder"
        @focus="isDropdownOpen = true"
        @input="isDropdownOpen = true"
      />
      <button
        v-if="searchQuery"
        type="button"
        class="btn-clear-search"
        aria-label="Limpiar búsqueda"
        @click="searchQuery = ''"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <!-- Floating Result Box -->
    <div
      v-if="isDropdownOpen && searchQuery.trim().length > 0"
      class="search-results-dropdown"
      role="listbox"
    >
      <div v-if="searchResults.length === 0" class="dropdown-empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <span>No se encontraron pedidos</span>
      </div>
      <div
        v-for="item in searchResults"
        :key="item.quote.id"
        class="dropdown-result-item"
        role="option"
        tabindex="0"
        @click="handleSelectOrder(item.quote.id)"
        @keydown.enter="handleSelectOrder(item.quote.id)"
      >
        <!-- Icon Anchor -->
        <div class="result-icon-box">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <!-- Middle Content -->
        <div class="result-main-col">
          <div class="result-top-row">
            <span class="product-lead-title" :title="item.items[0]?.product_title_snapshot">
              {{ item.items[0]?.product_title_snapshot || 'Pedido sin productos' }}
            </span>
            <span v-if="item.items.length > 1" class="items-count-tag">
              +{{ item.items.length - 1 }}
            </span>
          </div>
          <div class="result-sub-row">
            <span class="provider-text">
              {{ counterpartiesMap.get(getCounterpartyId(item.quote))?.name || (isProvider ? 'Comprador' : 'Proveedor') }}
            </span>
            <span class="row-sep">•</span>
            <span class="short-id-tag">#{{ getShortId(item.quote.id) }}</span>
            <span class="row-sep">•</span>
            <span class="amount-text">{{ getQuoteTotal(item) }}</span>
          </div>
        </div>
        <!-- Trailing Status -->
        <div class="result-status-col">
          <QuoteStatusBadge :status="item.quote.status" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 420px;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 12px;
  background-color: #ffffff;
  padding: 0.55rem 0.85rem;
  gap: 0.6rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search-input-wrapper:focus-within {
  border-color: var(--light-teal, #189c94);
  box-shadow: 0 0 0 3px rgba(24, 156, 148, 0.12);
}
.search-icon {
  color: #94a3b8;
  font-size: 0.95rem;
}
.search-input-wrapper input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.9rem;
  color: var(--text-dark, #1e293b);
  background: transparent;
}
.btn-clear-search {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-clear-search:hover {
  color: var(--text-dark, #1e293b);
}
/* Dropdown Shell */
.search-results-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid var(--border-gray, #e0e0e0);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  max-height: 360px;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 0.35rem 0;
}
/* Result Row Layout */
.dropdown-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  outline: none;
  transition: background-color 0.15s ease;
}
.dropdown-result-item:last-child {
  border-bottom: none;
}
.dropdown-result-item:hover,
.dropdown-result-item:focus-visible {
  background-color: #f1f5f9;
}
/* Anchor Icon */
.result-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background-color: #e6f7f5;
  color: var(--light-teal, #189c94);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}
/* Middle Details */
.result-main-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.result-top-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.product-lead-title {
  font-weight: 700;
  font-size: 0.88rem;
  color: var(--primary-blue, #083c5a);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.items-count-tag {
  background-color: #e2e8f0;
  color: #475569;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 6px;
  flex-shrink: 0;
}
.result-sub-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.provider-text {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}
.row-sep {
  color: #cbd5e1;
}
.short-id-tag {
  font-family: "Lato", sans-serif;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
}
.amount-text {
  font-weight: 700;
  color: var(--primary-orange, #ff6a00);
}
.result-status-col {
  flex-shrink: 0;
}
/* Empty State */
.dropdown-empty-state {
  padding: 1.75rem 1rem;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.88rem;
}
.dropdown-empty-state i {
  font-size: 1.4rem;
}
</style>
