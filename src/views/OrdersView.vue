<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { quoteApi, organizationApi } from "../api";
import type {
  QuoteAggregateResponse,
  QuoteStatus,
  AccountQuoteFiltersQuery,
} from "../api/services/quote/types";
import type { PublicProviderDto } from "../api/services/organization/types";
import QuoteListItem from "../components/quote/QuoteListItem.vue";
import QuoteSearchBox from "../components/quote/QuoteSearchBox.vue";

const ALLOWED_STATUSES: QuoteStatus[] = [
  "pending_provider",
  "accepted",
  "paid",
  "fulfilled",
];

type AllowedStatus = Exclude<QuoteStatus, "cancelled" | "rejected" | "draft">;
type FilterTab = "all" | AllowedStatus;

interface FilterOption {
  label: string;
  value: FilterTab;
}

const router = useRouter();

const filterOptions: FilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending_provider" },
  { label: "Aceptados", value: "accepted" },
  { label: "Pagados", value: "paid" },
  { label: "Recibidos", value: "fulfilled" },
];

const currentFilter = ref<FilterTab>("all");
const quotes = ref<QuoteAggregateResponse[]>([]);
const providersMap = ref<Map<string, PublicProviderDto>>(new Map());
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);

let lastRequestId = 0;

const visibleQuotes = computed(() => quotes.value);
const filteredQuotes = computed(() => quotes.value);

const loadOrders = async () => {
  const currentRequestId = ++lastRequestId;
  isLoading.value = true;
  errorMessage.value = null;

  const params: AccountQuoteFiltersQuery = {
    limit: 20,
    offset: 0,
    statuses:
      currentFilter.value === "all"
        ? ALLOWED_STATUSES
        : [currentFilter.value],
  };

  try {
    const response = await quoteApi.getMyQuotes(params);

    if (currentRequestId === lastRequestId) {
      quotes.value = response.data;

      const uniqueProviderIds = Array.from(
        new Set(
          response.data
            .map((item) => item.quote.provider_id)
            .filter((id): id is string => Boolean(id) && !providersMap.value.has(id))
        )
      );

      if (uniqueProviderIds.length > 0) {
        const providerEntries = await Promise.allSettled(
          uniqueProviderIds.map(async (id) => {
            const prov = await organizationApi.getOrganization(id);
            return [id, prov] as const;
          })
        );

        if (currentRequestId === lastRequestId) {
          const nextMap = new Map(providersMap.value);
          for (const result of providerEntries) {
            if (result.status === "fulfilled") {
              const [id, prov] = result.value;
              nextMap.set(id, prov);
            }
          }
          providersMap.value = nextMap;
        }
      }
    }
  } catch (err: any) {
    if (currentRequestId === lastRequestId) {
      console.error("Failed to fetch orders:", err);
      errorMessage.value = err.message || "Error al cargar la lista de pedidos.";
      quotes.value = [];
    }
  } finally {
    if (currentRequestId === lastRequestId) {
      isLoading.value = false;
    }
  }
};

watch(currentFilter, () => {
  loadOrders();
});

const handleSelectQuote = (quoteId: string) => {
  router.push({ name: "quote-detail", params: { id: quoteId } });
};

onMounted(() => {
  loadOrders();
});
</script>

<template>
  <div class="orders-view-shell">
    <div class="orders-header-row">
      <h1 class="orders-page-title">Mis Pedidos</h1>
      <QuoteSearchBox
        :quotes="visibleQuotes"
        :providers-map="providersMap"
        placeholder="Buscar por ID, producto o proveedor..."
      />
    </div>

    <div class="filter-bar">
      <button
        v-for="filter in filterOptions"
        :key="filter.value"
        type="button"
        :class="['filter-btn', { active: currentFilter === filter.value }]"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando pedidos...</span>
    </div>

    <div v-else-if="errorMessage" class="error-state">
      <i class="fa-solid fa-circle-exclamation error-icon"></i>
      <p>{{ errorMessage }}</p>
      <button type="button" class="btn-retry" @click="loadOrders">
        Reintentar
      </button>
    </div>

    <div v-else-if="filteredQuotes.length === 0" class="empty-state">
      <i class="fa-regular fa-folder-open empty-icon"></i>
      <h3>No hay pedidos en esta sección</h3>
      <p>Los pedidos correspondientes a este estado aparecerán aquí.</p>
    </div>

    <div v-else class="quotes-list">
      <QuoteListItem
        v-for="item in filteredQuotes"
        :key="item.quote.id"
        :quote-aggregate="item"
        @select="handleSelectQuote"
      />
    </div>
  </div>
</template>

<style scoped>
.orders-view-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.orders-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.75rem;
}

.orders-page-title {
  font-family: 'Lora', serif;
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--primary-blue, #083c5a);
  margin: 0;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 2.25rem;
  width: 100%;
  border-bottom: 1.5px solid #e2e8f0;
  margin-bottom: 2rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0 0 0.55rem 0;
  margin-bottom: -1.5px;
  font-family: 'Lora', serif;
  font-size: 1.15rem;
  font-weight: 500;
  color: #8c9ba5;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.filter-btn:hover {
  color: var(--light-teal, #189c94);
}

.filter-btn.active {
  color: var(--light-teal, #189c94);
  border-bottom: 2px solid var(--light-teal, #189c94);
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  color: #64748b;
  gap: 0.75rem;
}

.error-icon {
  font-size: 2.5rem;
  color: #ef4444;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
}

.empty-state h3 {
  font-size: 1.15rem;
  color: var(--primary-blue, #083c5a);
  margin: 0;
}

.empty-state p {
  font-size: 0.9rem;
  margin: 0;
}

.btn-retry {
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

@media (max-width: 768px) {
  .orders-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .filter-bar {
    gap: 1.5rem;
  }
}
</style>
