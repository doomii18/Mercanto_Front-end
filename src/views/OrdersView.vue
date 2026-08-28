<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { quoteApi, organizationApi } from "../api";
import type { QuoteAggregateResponse } from "../api/services/quote/types";
import type { PublicProviderDto } from "../api/services/organization/types";
import QuoteListItem from "../components/quote/QuoteListItem.vue";
import QuoteSearchBox from "../components/quote/QuoteSearchBox.vue";

const router = useRouter();

const quotes = ref<QuoteAggregateResponse[]>([]);
const providers = ref<Map<string, PublicProviderDto>>(new Map());
const isLoading = ref(true);
const selectedTab = ref<string>("all");

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "pending_provider", label: "Pendientes" },
  { key: "accepted", label: "En proceso" },
  { key: "paid", label: "Pagados" },
  { key: "fulfilled", label: "Recibidos" },
  { key: "cancelled", label: "Cancelados" },
];

const loadQuotes = async () => {
  isLoading.value = true;
  try {
    const res = await quoteApi.getMyQuotes({ limit: 50, offset: 0 });
    quotes.value = res.data;

    const providerIds = [
      ...new Set(res.data.map((q) => q.quote.provider_id).filter(Boolean)),
    ];

    await Promise.all(
      providerIds.map(async (id) => {
        if (!providers.value.has(id)) {
          const org = await organizationApi.getOrganization(id);
          providers.value.set(id, org);
        }
      })
    );
  } catch (err) {
    console.error("Failed to load orders:", err);
  } finally {
    isLoading.value = false;
  }
};

const tabFilteredQuotes = computed(() => {
  if (selectedTab.value === "all") return quotes.value;
  return quotes.value.filter((q) => q.quote.status === selectedTab.value);
});

const handleSelectOrder = (quoteId: string) => {
  router.push({ name: "quote-detail", params: { id: quoteId } });
};

onMounted(() => {
  loadQuotes();
});
</script>

<template>
  <div class="orders-view">
    <div class="orders-header">
      <h1 class="page-title">Mis Pedidos</h1>

      <QuoteSearchBox
        :quotes="quotes"
        :providers-map="providers"
      />
    </div>

    <div class="tabs-row">
      <button
        v-for="tab in STATUS_TABS"
        :key="tab.key"
        type="button"
        :class="['tab-btn', { active: selectedTab === tab.key }]"
        @click="selectedTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-spinner fa-spin"></i>
      <span>Cargando pedidos...</span>
    </div>

    <div v-else-if="tabFilteredQuotes.length === 0" class="empty-state">
      <i class="fa-solid fa-box-open"></i>
      <p>No tienes pedidos en esta sección.</p>
    </div>

    <div v-else class="orders-list">
      <QuoteListItem
        v-for="quote in tabFilteredQuotes"
        :key="quote.quote.id"
        :quote-aggregate="quote"
        @select="handleSelectOrder"
      />
    </div>
  </div>
</template>

<style scoped>
.orders-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-title {
  font-family: "Lora", serif;
  font-size: 1.8rem;
  color: var(--primary-blue, #083c5a);
}

.tabs-row {
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border-gray, #e0e0e0);
  padding-bottom: 0.5rem;
  overflow-x: auto;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.45rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.tab-btn.active {
  background-color: var(--light-teal, #189c94);
  color: #ffffff;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1rem;
  gap: 0.8rem;
  color: #94a3b8;
}

.empty-state i {
  font-size: 2.5rem;
}

.empty-state p {
  font-size: 0.95rem;
}
</style>
