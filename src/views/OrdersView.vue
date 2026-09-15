<script setup lang="ts">
import { ref, computed, watch, onMounted, onScopeDispose } from "vue";
import { useRouter } from "vue-router";
import { useQuoteApi } from "@/composables/api/useQuoteApi";
import { useUserContextStore } from "../stores/userContextStore";
import { useNotificationStore } from "@/stores/notificationStore";
import type {
  QuoteAggregateResponse,
  QuoteStatus,
  AccountQuoteFiltersQuery,
  ProviderQuoteFiltersQuery,
} from "../api/services/quote/types";
import QuoteListItem from "../components/quote/QuoteListItem.vue";
import QuoteSearchBox from "../components/quote/QuoteSearchBox.vue";
import { useOrganizationApi } from "@/composables/api/useOrganizationApi";
import { useUserProfileApi } from "@/composables/api/useUserProfileApi";

interface CounterpartyInfo {
  name: string;
  avatarBlobId: string | null;
}

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
const contextStore = useUserContextStore();
const notificationStore = useNotificationStore();
const organizationApi = useOrganizationApi();
const userProfileApi = useUserProfileApi();
const quoteApi = useQuoteApi();


const isProvider = computed(() => contextStore.isProvider);
const providerId = computed(() => contextStore.activeOrganizationId);

const filterOptions: FilterOption[] = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending_provider" },
  { label: "Aceptados", value: "accepted" },
  { label: "Pagados", value: "paid" },
  { label: "Recibidos", value: "fulfilled" },
];

const currentFilter = ref<FilterTab>("all");
const quotes = ref<QuoteAggregateResponse[]>([]);
const counterpartiesMap = ref<Map<string, CounterpartyInfo>>(new Map());
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
let lastRequestId = 0;

const visibleQuotes = computed(() => quotes.value);
const filteredQuotes = computed(() => quotes.value);

const loadOrders = async () => {
  const currentRequestId = ++lastRequestId;
  isLoading.value = true;
  errorMessage.value = null;

  const statuses =
    currentFilter.value === "all"
      ? ALLOWED_STATUSES
      : [currentFilter.value];

  try {
    let response;
    if (isProvider.value && providerId.value) {
      const params: ProviderQuoteFiltersQuery = {
        limit: 20,
        offset: 0,
        statuses,
      };
      response = await quoteApi.getProviderQuotes(providerId.value, params);
    } else {
      const params: AccountQuoteFiltersQuery = {
        limit: 20,
        offset: 0,
        statuses,
      };
      response = await quoteApi.getMyQuotes(params);
    }

    if (currentRequestId === lastRequestId) {
      quotes.value = response.data;

      const counterpartIds = new Set<string>();
      response.data.forEach((item) => {
        const id = isProvider.value ? item.quote.buyer_id : item.quote.provider_id;
        if (id) counterpartIds.add(id);
      });

      const missingIds = Array.from(counterpartIds).filter(
        (id) => !counterpartiesMap.value.has(id)
      );

      if (missingIds.length > 0) {
        const entries = await Promise.allSettled(
          missingIds.map(async (id) => {
            if (isProvider.value) {
              const profile = await userProfileApi.getUserProfile(id);
              return [
                id,
                {
                  name: `${profile.first_name} ${profile.last_name}`.trim() || "Comprador",
                  avatarBlobId: profile.avatar_blob_id ?? null,
                },
              ] as const;
            } else {
              const prov = await organizationApi.getPublicProvider(id);
              return [
                id,
                {
                  name: prov.company_name,
                  avatarBlobId: prov.logo_blob_id ?? null,
                },
              ] as const;
            }
          })
        );

        if (currentRequestId === lastRequestId) {
          const nextMap = new Map(counterpartiesMap.value);
          for (const result of entries) {
            if (result.status === "fulfilled") {
              const [id, info] = result.value;
              nextMap.set(id, info);
            }
          }
          counterpartiesMap.value = nextMap;
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


const unsubscribeQuoteStatus = notificationStore.onType(
  "QuoteStatusChanged",
  (event) => {
    const { quote_id, new_status } = event;
    const isQuoteVisible = quotes.value.some((q) => q.quote.id === quote_id);

    if (isQuoteVisible) {
      const statusMatchesFilter =
        currentFilter.value === "all" ||
        currentFilter.value === new_status;

      if (statusMatchesFilter) {
        loadOrders();
      } else {
        quotes.value = quotes.value.filter((q) => q.quote.id !== quote_id);
      }
    }
  }
);

onScopeDispose(() => {
  unsubscribeQuoteStatus();
});

onMounted(() => {
  loadOrders();
});

watch(currentFilter, () => {
  loadOrders();
});

const handleSelectQuote = (quoteId: string) => {
  router.push({ name: "quote-detail", params: { id: quoteId } });
};
</script>

<template>
  <div class="flex flex-col w-full">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6 mb-7">
      <h1 class="font-serif text-3xl font-bold text-neutral-900 m-0">
        {{ isProvider ? "Pedidos Recibidos" : "Mis Pedidos" }}
      </h1>
      <QuoteSearchBox
        :quotes="visibleQuotes"
        :counterparties-map="counterpartiesMap"
        :is-provider="isProvider"
        :placeholder="isProvider ? 'Buscar por ID, producto o comprador...' : 'Buscar por ID, producto o proveedor...'"
      />
    </div>

    <div class="flex items-end gap-6 md:gap-9 w-full border-b border-neutral-200 mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="filter in filterOptions"
        :key="filter.value"
        type="button"
        :class="[
          'bg-transparent border-0 border-b-2 pb-2 -mb-px font-serif text-lg font-medium whitespace-nowrap cursor-pointer transition-colors',
          currentFilter === filter.value
            ? 'text-teal-700 border-teal-700'
            : 'text-neutral-500 border-transparent hover:text-teal-700'
        ]"
        @click="currentFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-16 px-6 text-center text-neutral-500 gap-3"
    >
      <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
      <span>Cargando pedidos...</span>
    </div>

    <div
      v-else-if="errorMessage"
      class="flex flex-col items-center justify-center py-16 px-6 text-center text-neutral-500 gap-3"
    >
      <i class="fa-solid fa-circle-exclamation text-4xl text-error"></i>
      <p class="text-neutral-900 m-0">{{ errorMessage }}</p>
      <button
        type="button"
        class="mt-2 py-2 px-6 bg-teal-700 text-white border-0 rounded-lg font-semibold cursor-pointer hover:bg-teal-800 transition-colors"
        @click="loadOrders"
      >
        Reintentar
      </button>
    </div>

    <div
      v-else-if="filteredQuotes.length === 0"
      class="flex flex-col items-center justify-center py-16 px-6 text-center text-neutral-500 gap-3"
    >
      <i class="fa-regular fa-folder-open text-5xl text-neutral-300"></i>
      <h3 class="text-lg font-bold font-serif text-neutral-900 m-0">No hay pedidos en esta sección</h3>
      <p class="text-sm text-neutral-500 m-0">Los pedidos correspondientes a este estado aparecerán aquí.</p>
    </div>

    <div v-else class="flex flex-col gap-5">
      <QuoteListItem
        v-for="item in filteredQuotes"
        :key="item.quote.id"
        :quote-aggregate="item"
        :counterparty="counterpartiesMap.get(isProvider ? item.quote.buyer_id : item.quote.provider_id)"
        @select="handleSelectQuote"
      />
    </div>
  </div>
</template>
