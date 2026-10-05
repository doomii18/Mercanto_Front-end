<script setup lang="ts">
import { ref, computed, watch, onMounted, onScopeDispose } from "vue";
import { useRouter } from "vue-router";
import { useQuoteApi } from "@/api/modules/commerce/quote/useQuoteApi";
import { useUserContextStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notifications";
import type {
  QuoteAggregateResponse,
  QuoteStatus,
  AccountQuoteFiltersQuery,
  ProviderQuoteFiltersQuery,
} from "@/api";
import QuoteListItem from "@/components/quote/QuoteListItem.vue";
import QuoteSearchBox from "@/components/quote/QuoteSearchBox.vue";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";

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

const visibleQuotes = computed(() => {
  return quotes.value.filter((item) =>
    ALLOWED_STATUSES.includes(item.quote.status as QuoteStatus)
  );
});

const filteredQuotes = computed(() => {
  if (currentFilter.value === "all") {
    return quotes.value.filter((item) =>
      ALLOWED_STATUSES.includes(item.quote.status as QuoteStatus)
    );
  }
  return quotes.value.filter((item) => item.quote.status === currentFilter.value);
});

const loadOrders = async () => {
  const currentRequestId = ++lastRequestId;
  isLoading.value = true;
  errorMessage.value = null;

  try {
    let response;
    if (isProvider.value && providerId.value) {
      const params: ProviderQuoteFiltersQuery = {
        limit: 50,
        offset: 0,
        ...(currentFilter.value !== "all" ? { statuses: [currentFilter.value] } : {}),
      };
      response = await quoteApi.getProviderQuotes(providerId.value, params);
    } else {
      const params: AccountQuoteFiltersQuery = {
        limit: 50,
        offset: 0,
        ...(currentFilter.value !== "all" ? { statuses: [currentFilter.value] } : {}),
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
  <div class="flex flex-col flex-1 min-h-0 overflow-y-auto w-full p-4 sm:p-6 lg:p-10">
    <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4 md:gap-6 mb-7">
      <h1 class="font-serif text-3xl font-bold text-neutral-900 m-0">
        {{ isProvider ? "Pedidos Recibidos" : "Mis Pedidos" }}
      </h1>
      <QuoteSearchBox
        :quotes="visibleQuotes"
        :counterparties-map="counterpartiesMap"
        :is-provider="isProvider"
        placeholder="Buscar por ID, producto, notas o dirección..."
      />
    </div>

    <!-- Filter Tabs Container -->
    <div class="w-full max-w-full min-w-0 border-b border-neutral-200 mb-6 sm:mb-8">
      <nav
        class="flex items-end gap-4 sm:gap-6 md:gap-9 overflow-x-auto touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mb-px px-0.5"
        aria-label="Filtro de pedidos"
      >
        <button
          v-for="filter in filterOptions"
          :key="filter.value"
          type="button"
          :class="[
            'bg-transparent border-b-2 py-2 sm:py-2.5 md:py-3 font-serif text-sm sm:text-base md:text-lg font-medium whitespace-nowrap cursor-pointer transition-colors leading-normal shrink-0',
            currentFilter === filter.value
              ? 'text-teal-700 border-teal-700 font-semibold'
              : 'text-neutral-500 border-transparent hover:text-teal-700'
          ]"
          @click="currentFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </nav>
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
