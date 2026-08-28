<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { quoteApi, organizationApi } from "../api";
import type { QuoteAggregateResponse, QuoteStatus } from "../api/services/quote/types";
import type { OrganizationResponse } from "../api/services/organization/types";
import QuoteListItem from "../components/quote/QuoteListItem.vue";

type TabFilter = "all" | "pending_provider" | "accepted" | "paid" | "fulfilled";

const router = useRouter();
const quotes = ref<QuoteAggregateResponse[]>([]);
const isLoading = ref(true);
const activeTab = ref<TabFilter>("all");
const searchQuery = ref("");
const isSearchDropdownOpen = ref(false);

const providerCache = new Map<string, OrganizationResponse>();
const loadedProviders = ref<Record<string, OrganizationResponse>>({});

const formatCode = (id: string): string => {
  return `MC-${id.slice(0, 8).toUpperCase()}`;
};

const formatDate = (isoString?: string): string => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const calcUnits = (items: QuoteAggregateResponse["items"]): number => {
  return items.reduce((acc, item) => acc + item.quantity, 0);
};

const fetchProvider = async (providerId: string): Promise<OrganizationResponse | null> => {
  if (!providerId) return null;
  if (providerCache.has(providerId)) {
    return providerCache.get(providerId)!;
  }
  try {
    const org = await organizationApi.getOrganization(providerId);
    providerCache.set(providerId, org);
    loadedProviders.value = { ...loadedProviders.value, [providerId]: org };
    return org;
  } catch (err) {
    console.error(`Failed to fetch provider ${providerId}:`, err);
    return null;
  }
};

const fetchQuotes = async () => {
  isLoading.value = true;
  try {
    const res = await quoteApi.getMyQuotes({ limit: 50, offset: 0 });
    quotes.value = res.data;

    const uniqueProviderIds = Array.from(new Set(res.data.map((q) => q.quote.provider_id)));
    await Promise.all(uniqueProviderIds.map((id) => fetchProvider(id)));
  } catch (err) {
    console.error("Failed to load quotes:", err);
  } finally {
    isLoading.value = false;
  }
};

const navigateToDetail = (quoteId: string) => {
  isSearchDropdownOpen.value = false;
  router.push({ name: "quote-detail", params: { id: quoteId } });
};

const filteredQuotes = computed(() => {
  return quotes.value.filter((aggregate) => {
    const status = aggregate.quote.status as QuoteStatus;
    const matchesTab = activeTab.value === "all" || status === activeTab.value;

    const q = searchQuery.value.trim().toLowerCase();
    const providerName = loadedProviders.value[aggregate.quote.provider_id]?.company_name?.toLowerCase() || "";
    const matchesSearch =
      !q ||
      aggregate.quote.id.toLowerCase().includes(q) ||
      formatCode(aggregate.quote.id).toLowerCase().includes(q) ||
      providerName.includes(q) ||
      aggregate.items.some((i) => i.product_title_snapshot.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });
});

const liveSearchMatches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return quotes.value.filter((aggregate) => {
    const providerName = loadedProviders.value[aggregate.quote.provider_id]?.company_name?.toLowerCase() || "";
    return (
      aggregate.quote.id.toLowerCase().includes(q) ||
      formatCode(aggregate.quote.id).toLowerCase().includes(q) ||
      providerName.includes(q) ||
      aggregate.items.some((i) => i.product_title_snapshot.toLowerCase().includes(q))
    );
  });
});

onMounted(() => {
  fetchQuotes();
});
</script>

<template>
  <div class="orders-shell">
    <div class="pedidos-header">
      <div>
        <h2 class="pedidos-title">Mis Pedidos</h2>
        <p class="pedidos-subtitle">Consulta y monitorea tus cotizaciones y compras realizadas</p>
      </div>

      <div class="search-wrapper-container">
        <div class="search-bar">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Busca por ID, producto o proveedor..."
            @focus="isSearchDropdownOpen = true"
          />
          <i class="fa-solid fa-magnifying-glass"></i>
        </div>

        <div v-if="isSearchDropdownOpen" class="search-dropdown-menu">
          <div class="dropdown-top-header">
            <input
              v-model="searchQuery"
              type="text"
              class="dropdown-search-input"
              placeholder="Busca por ID, producto o proveedor..."
            />
            <button
              type="button"
              class="btn-clear-search"
              @click="isSearchDropdownOpen = false; searchQuery = ''"
            >
              ✕
            </button>
          </div>

          <div v-if="!searchQuery.trim()" class="search-recent-block">
            <span class="group-period-title">Cotizaciones Recientes</span>
            <div
              v-for="item in quotes.slice(0, 5)"
              :key="item.quote.id"
              class="dropdown-item-row"
              @click="navigateToDetail(item.quote.id)"
            >
              <div class="item-left-info">
                <i class="fa-solid fa-bag-shopping bag-icon"></i>
                <strong class="item-code">{{ formatCode(item.quote.id) }}</strong>
              </div>
              <span class="item-count-text">{{ calcUnits(item.items) }} unds</span>
            </div>
          </div>

          <div v-else class="search-live-results">
            <div class="results-subheading">Resultados para "{{ searchQuery }}"</div>
            <div v-if="liveSearchMatches.length === 0" class="no-results-msg">
              No se encontraron pedidos correspondientes.
            </div>
            <div
              v-for="match in liveSearchMatches"
              :key="match.quote.id"
              class="live-result-row"
              @click="navigateToDetail(match.quote.id)"
            >
              <div class="item-left-info">
                <i class="fa-solid fa-bag-shopping bag-icon"></i>
                <div class="result-main-text">
                  <strong>{{ formatCode(match.quote.id) }}</strong>
                  <span>{{ loadedProviders[match.quote.provider_id]?.company_name || 'Proveedor' }}</span>
                </div>
              </div>
              <span class="result-date-text">{{ formatDate(match.quote.updated_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button :class="['tab-btn', { active: activeTab === 'all' }]" @click="activeTab = 'all'">Todos</button>
      <button :class="['tab-btn', { active: activeTab === 'pending_provider' }]" @click="activeTab = 'pending_provider'">Pendientes</button>
      <button :class="['tab-btn', { active: activeTab === 'accepted' }]" @click="activeTab = 'accepted'">Aceptados</button>
      <button :class="['tab-btn', { active: activeTab === 'paid' }]" @click="activeTab = 'paid'">Pagados</button>
      <button :class="['tab-btn', { active: activeTab === 'fulfilled' }]" @click="activeTab = 'fulfilled'">Recibidos</button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando cotizaciones...</span>
    </div>

    <div v-else-if="filteredQuotes.length === 0" class="empty-state">
      <i class="fa-solid fa-box-open empty-icon"></i>
      <p>No se encontraron cotizaciones con los filtros seleccionados.</p>
    </div>

    <div v-else class="orders-list">
      <QuoteListItem
        v-for="aggregate in filteredQuotes"
        :key="aggregate.quote.id"
        :quote-aggregate="aggregate"
        @select="navigateToDetail"
      />
    </div>
  </div>
</template>

<style scoped>
.orders-shell {
  display: flex;
  flex-direction: column;
}

.pedidos-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1.5rem;
}

.pedidos-title {
  font-size: 1.8rem;
  color: var(--primary-blue, #083c5a);
  margin-bottom: 0.5rem;
}

.pedidos-subtitle {
  color: #64748b;
  font-size: 1rem;
}

.search-wrapper-container {
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid var(--border-gray, #e0e0e0);
  border-radius: 30px;
  padding: 0.55rem 1.2rem;
  width: 360px;
  transition: border-color 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--light-teal, #189c94);
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #333;
}

.search-bar i {
  color: var(--primary-blue, #083c5a);
}

.search-dropdown-menu {
  position: absolute;
  top: -2px;
  right: 0;
  width: 380px;
  background: #ffffff;
  border: 1.5px solid var(--border-gray, #8e9ca8);
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid #edf0f2;
}

.dropdown-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: var(--primary-blue, #083c5a);
}

.btn-clear-search {
  background: none;
  border: none;
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
}

.search-recent-block,
.search-live-results {
  padding: 0.8rem 1.2rem 1.2rem;
  max-height: 380px;
  overflow-y: auto;
}

.group-period-title,
.results-subheading {
  display: block;
  color: var(--light-teal, #00a896);
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.dropdown-item-row,
.live-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.dropdown-item-row:hover,
.live-result-row:hover {
  background-color: #f0f2f5;
}

.item-left-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.bag-icon {
  color: var(--primary-blue, #083c5a);
}

.item-code {
  color: var(--primary-blue, #083c5a);
  font-weight: 700;
}

.item-count-text,
.result-date-text {
  color: #888;
  font-size: 0.85rem;
}

.result-main-text {
  display: flex;
  flex-direction: column;
}

.result-main-text strong {
  color: var(--primary-blue, #083c5a);
  font-size: 0.95rem;
}

.result-main-text span {
  color: #666;
  font-size: 0.8rem;
}

.no-results-msg {
  color: #888;
  font-size: 0.9rem;
  text-align: center;
  padding: 1.5rem 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid var(--border-gray, #e0e0e0);
  margin-bottom: 2rem;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  background: none;
  border: none;
  font-size: 0.95rem;
  color: #64748b;
  padding: 0.6rem 0.2rem;
  cursor: pointer;
  position: relative;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.tab-btn.active {
  color: var(--light-teal, #00a896);
  font-weight: 600;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--light-teal, #00a896);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 1rem;
  color: #64748b;
  font-size: 1rem;
}

.empty-icon {
  font-size: 3rem;
  color: #cbd5e1;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .pedidos-header {
    flex-direction: column;
  }
  .search-bar,
  .search-dropdown-menu {
    width: 100%;
  }
}
</style>
