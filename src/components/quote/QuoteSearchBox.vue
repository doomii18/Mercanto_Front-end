<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import type { QuoteAggregateResponse, QuoteStatus } from "../../api/services/quote/types";
import type { PublicProviderDto } from "../../api/services/organization/types";
import QuoteIdBadge from "./QuoteIdBadge.vue";
import { uuidToCrockford } from "../../utils/formatters";

const props = withDefaults(
  defineProps<{
    quotes: QuoteAggregateResponse[];
    providersMap?: Map<string, PublicProviderDto>;
    placeholder?: string;
  }>(),
  {
    providersMap: () => new Map(),
    placeholder: "Buscar por ID, producto o proveedor...",
  }
);

const router = useRouter();
const searchBoxRef = ref<HTMLElement | null>(null);
const searchQuery = ref("");
const isDropdownOpen = ref(false);

const STATUS_CONFIG: Record<QuoteStatus, { label: string; class: string; icon: string }> = {
  draft: { label: "Borrador", class: "status-draft", icon: "fa-regular fa-file-lines" },
  pending_provider: { label: "Pendiente", class: "status-pending", icon: "fa-regular fa-clock" },
  accepted: { label: "En proceso", class: "status-accepted", icon: "fa-regular fa-clock" },
  paid: { label: "Pagado", class: "status-paid", icon: "fa-solid fa-receipt" },
  fulfilled: { label: "Recibido", class: "status-fulfilled", icon: "fa-regular fa-circle-check" },
  rejected: { label: "Rechazado", class: "status-rejected", icon: "fa-solid fa-circle-xmark" },
  cancelled: { label: "Cancelado", class: "status-cancelled", icon: "fa-solid fa-ban" },
};

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return [];

  return props.quotes.filter((aggregate) => {
    const q = aggregate.quote;
    const crockford = uuidToCrockford(q.id).toLowerCase();
    const providerName = props.providersMap.get(q.provider_id)?.company_name.toLowerCase() || "";
    const itemsMatch = aggregate.items.some((item) =>
      item.product_title_snapshot.toLowerCase().includes(query)
    );

    return (
      q.id.toLowerCase().includes(query) ||
      crockford.includes(query) ||
      providerName.includes(query) ||
      itemsMatch
    );
  });
});

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
    >
      <div v-if="searchResults.length === 0" class="dropdown-empty-state">
        <i class="fa-regular fa-folder-open"></i>
        <span>No se encontraron pedidos</span>
      </div>

      <div
        v-for="item in searchResults"
        :key="item.quote.id"
        class="dropdown-result-item"
        @click="handleSelectOrder(item.quote.id)"
      >
        <div class="result-top-line">
          <QuoteIdBadge :quote-id="item.quote.id" size="sm" />
          <span :class="['result-status-pill', STATUS_CONFIG[item.quote.status as QuoteStatus]?.class || 'status-draft']">
            <i :class="STATUS_CONFIG[item.quote.status as QuoteStatus]?.icon"></i>
            {{ STATUS_CONFIG[item.quote.status as QuoteStatus]?.label || item.quote.status }}
          </span>
        </div>

        <div class="result-details">
          <span class="result-provider">
            {{ providersMap.get(item.quote.provider_id)?.company_name || 'Proveedor' }}
          </span>
          <span class="result-item-names">
            {{ item.items.map((i) => i.product_title_snapshot).join(", ") }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  position: relative;
  width: 100%;
  max-width: 380px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-gray, #e0e0e0);
  border-radius: 10px;
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

/* Floating Results Dropdown */
.search-results-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background-color: #ffffff;
  border: 1px solid var(--border-gray, #e0e0e0);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-height: 320px;
  overflow-y: auto;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.dropdown-result-item {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: background-color 0.15s ease;
}

.dropdown-result-item:last-child {
  border-bottom: none;
}

.dropdown-result-item:hover {
  background-color: var(--bg-gray, #f5f7f9);
}

.result-top-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.result-status-pill {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
}

/* Status variants */
.status-draft { background-color: #f1f5f9; color: #475569; }
.status-pending { background-color: #fff7ed; color: #ea580c; }
.status-accepted { background-color: #fde8db; color: #ff6a00; }
.status-paid { background-color: #f0fdf4; color: #16a34a; }
.status-fulfilled { background-color: #d8f1ef; color: #00a896; }
.status-rejected { background-color: #fef2f2; color: #dc2626; }
.status-cancelled { background-color: #f3f4f6; color: #6b7280; }

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.result-provider {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--primary-blue, #083c5a);
}

.result-item-names {
  font-size: 0.78rem;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-empty-state {
  padding: 1.5rem;
  text-align: center;
  color: #94a3b8;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.88rem;
}
</style>
