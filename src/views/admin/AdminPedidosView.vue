<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import {
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationEllipsis,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "reka-ui";
import { useQuoteApi } from "@/api/modules/commerce/quote/useQuoteApi";
import { useUserProfileApi } from "@/api/modules/identity/user_profile/useUserProfileApi";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import UuidBadge from "@/components/common/UuidBadge.vue";
import type { QuoteAggregateResponse, QuoteStatus } from "@/api";

const quoteApi = useQuoteApi();
const userProfileApi = useUserProfileApi();
const organizationApi = useOrganizationApi();

// State
const quotesList = ref<QuoteAggregateResponse[]>([]);
const totalOrders = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

// Filters
type StatusTabFilter = QuoteStatus | "all";
const selectedStatus = ref<StatusTabFilter>("all");
const searchQuery = ref("");

const STATUS_TABS: { label: string; value: StatusTabFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendientes", value: "pending_provider" },
  { label: "Aceptados", value: "accepted" },
  { label: "Pagados", value: "paid" },
  { label: "Entregados", value: "fulfilled" },
  { label: "Cancelados", value: "cancelled" },
  { label: "Rechazados", value: "rejected" },
];

// Detail modal
const isDetailOpen = ref(false);
const selectedOrder = ref<QuoteAggregateResponse | null>(null);

// Cached participant names
const buyerNames = ref<Record<string, string>>({});
const providerNames = ref<Record<string, string>>({});

// Helpers
function getQuoteUnits(quote: QuoteAggregateResponse): number {
  return quote.items.reduce((sum, it) => sum + it.quantity, 0);
}

function getQuoteTotalAmount(quote: QuoteAggregateResponse): number {
  return quote.items.reduce((sum, it) => {
    const discount = it.discount_percentage ? it.discount_percentage / 100 : 0;
    const finalPrice = it.unit_price_snapshot * (1 - discount);
    return sum + it.quantity * finalPrice;
  }, 0);
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-NI", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
};

function getStatusBadge(status: QuoteStatus) {
  switch (status) {
    case "pending_provider":
      return { label: "Pendiente", badgeClass: "bg-orange-100/70 text-[#ea580c] border border-orange-200/50" };
    case "accepted":
      return { label: "Aceptado", badgeClass: "bg-blue-100/70 text-blue-700 border border-blue-200/50" };
    case "paid":
      return { label: "Pagado", badgeClass: "bg-emerald-100/70 text-emerald-700 border border-emerald-200/50" };
    case "fulfilled":
      return { label: "Entregado", badgeClass: "bg-teal-100/70 text-[#00a896] border border-teal-200/50" };
    case "cancelled":
      return { label: "Cancelado", badgeClass: "bg-slate-200 text-slate-700 border border-slate-300/50" };
    case "rejected":
      return { label: "Rechazado", badgeClass: "bg-red-100/70 text-red-700 border border-red-200/50" };
    case "draft":
    default:
      return { label: "Borrador", badgeClass: "bg-slate-100 text-slate-600 border border-slate-200" };
  }
}

function getShippingLabel(method: string) {
  switch (method) {
    case "home_delivery":
      return "Envío a domicilio";
    case "in_store_pickup":
      return "Retiro en tienda";
    default:
      return method;
  }
}

function getPaymentLabel(pref: string) {
  switch (pref) {
    case "card":
      return "Tarjeta";
    case "transfer":
      return "Transferencia bancaria";
    case "virtual_wallet":
      return "Billetera Mercanto";
    default:
      return pref;
  }
}

// Background name resolver
async function resolveParticipants(quotes: QuoteAggregateResponse[]) {
  const buyerIdsToFetch = [
    ...new Set(
      quotes
        .map((q) => q.quote.buyer_id)
        .filter((id) => id && !buyerNames.value[id])
    ),
  ];

  const providerIdsToFetch = [
    ...new Set(
      quotes
        .map((q) => q.quote.provider_id)
        .filter((id) => id && !providerNames.value[id])
    ),
  ];

  await Promise.allSettled([
    ...buyerIdsToFetch.map(async (id) => {
      try {
        const p = await userProfileApi.getUserProfile(id);
        buyerNames.value[id] = `${p.first_name} ${p.last_name}`.trim();
      } catch {
        buyerNames.value[id] = `Comprador (${id.slice(0, 8)})`;
      }
    }),
    ...providerIdsToFetch.map(async (id) => {
      try {
        const org = await organizationApi.getPublicProvider(id);
        providerNames.value[id] = org.company_name;
      } catch {
        providerNames.value[id] = `Proveedor (${id.slice(0, 8)})`;
      }
    }),
  ]);
}

// Data fetching
async function fetchOrders() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const offset = (currentPage.value - 1) * pageSize.value;
    const statuses = selectedStatus.value === "all" ? undefined : [selectedStatus.value];
    const searchTerm = searchQuery.value.trim() || undefined;

    const res = await quoteApi.getAllQuotes({
      limit: pageSize.value,
      offset,
      statuses,
      search_term: searchTerm,
    });

    quotesList.value = res.data;
    totalOrders.value = res.total;
    totalPages.value = Math.max(1, Math.ceil(res.total / pageSize.value));

    // Resolve buyer and provider display names in background
    resolveParticipants(res.data);
  } catch (err: any) {
    console.error("[AdminPedidosView] Error loading orders:", err);
    errorMsg.value = err?.message || "No se pudieron cargar los pedidos. Por favor, intenta de nuevo.";
    quotesList.value = [];
  } finally {
    isLoading.value = false;
  }
}

function openDetail(order: QuoteAggregateResponse) {
  selectedOrder.value = order;
  isDetailOpen.value = true;
}

// Search debounce
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchOrders();
  }, 350);
});

watch([selectedStatus, pageSize], () => {
  currentPage.value = 1;
  fetchOrders();
});

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Pedidos registrados
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Monitorea y audita los pedidos y cotizaciones realizados entre compradores y proveedores.
        </p>
      </div>

      <button
        @click="fetchOrders"
        :disabled="isLoading"
        class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer disabled:opacity-50"
      >
        <i :class="['fa-solid fa-arrows-rotate text-slate-400', { 'fa-spin': isLoading }]"></i>
        <span>Actualizar</span>
      </button>
    </div>

    <!-- Filters Bar -->
    <div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs space-y-4">
      <!-- Status Tabs -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none touch-pan-x min-w-0">
        <button
          v-for="tab in STATUS_TABS"
          :key="tab.value"
          @click="selectedStatus = tab.value"
          :class="[
            'px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer shrink-0',
            selectedStatus === tab.value
              ? 'bg-[#00a896] text-white shadow-xs'
              : 'bg-slate-100/70 text-slate-600 hover:bg-slate-200/60',
          ]"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Search & Page Size Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div class="relative flex-1 max-w-md">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por ID, producto, notas o dirección..."
            class="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#00a896] focus:ring-2 focus:ring-[#00a896]/15 text-[#023859] placeholder:text-slate-400"
          />
        </div>

        <div class="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
          <span>Mostrar:</span>
          <select
            v-model="pageSize"
            class="rounded-lg border border-slate-200 px-2 py-1 text-xs text-[#023859] font-medium bg-white focus:outline-none focus:border-[#00a896]"
          >
            <option :value="10">10 por pág.</option>
            <option :value="25">25 por pág.</option>
            <option :value="50">50 por pág.</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMsg"
      class="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-exclamation text-base text-red-500"></i>
        <span>{{ errorMsg }}</span>
      </div>
      <button
        @click="fetchOrders"
        class="font-bold underline text-red-800 hover:text-red-900 cursor-pointer"
      >
        Reintentar
      </button>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="isLoading && quotesList.length === 0"
      class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3"
    >
      <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00a896]"></i>
      <p class="text-xs font-medium text-slate-400">Cargando pedidos globales...</p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="quotesList.length === 0"
      class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center"
    >
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <i class="fa-solid fa-box-open text-xl"></i>
      </div>
      <p class="text-sm font-bold text-[#023859]">No se encontraron pedidos</p>
      <p class="text-xs text-slate-400 mt-1 max-w-sm">
        No hay pedidos o cotizaciones que coincidan con los filtros seleccionados.
      </p>
    </div>

    <!-- Orders Table -->
    <div v-else class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[760px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th class="px-5 py-3.5">ID Pedido</th>
              <th class="px-5 py-3.5">Comprador</th>
              <th class="px-5 py-3.5">Proveedor</th>
              <th class="px-5 py-3.5">Monto</th>
              <th class="px-5 py-3.5">Productos</th>
              <th class="px-5 py-3.5">Fecha</th>
              <th class="px-5 py-3.5">Estado</th>
              <th class="px-5 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="quoteAgg in quotesList"
              :key="quoteAgg.quote.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <!-- ID Pedido -->
              <td class="px-5 py-4">
                <UuidBadge
                  :uuid="quoteAgg.quote.id"
                  mode="crockford-compact"
                  prefix="ORD-"
                  size="sm"
                  variant="subtle"
                />
              </td>

              <!-- Comprador -->
              <td class="px-5 py-4">
                <div class="flex flex-col items-start gap-0.5">
                  <span class="font-bold text-xs text-[#023859]">
                    {{ buyerNames[quoteAgg.quote.buyer_id] || "Cargando..." }}
                  </span>
                  <UuidBadge
                    :uuid="quoteAgg.quote.buyer_id"
                    mode="hex-short"
                    size="xs"
                    variant="ghost"
                  />
                </div>
              </td>

              <!-- Proveedor -->
              <td class="px-5 py-4">
                <div class="flex flex-col items-start gap-0.5">
                  <span class="font-semibold text-xs text-slate-700">
                    {{ providerNames[quoteAgg.quote.provider_id] || "Cargando..." }}
                  </span>
                  <UuidBadge
                    :uuid="quoteAgg.quote.provider_id"
                    mode="hex-short"
                    size="xs"
                    variant="ghost"
                  />
                </div>
              </td>

              <!-- Monto -->
              <td class="px-5 py-4 font-bold text-xs text-[#023859]">
                {{ formatCurrency(getQuoteTotalAmount(quoteAgg)) }}
              </td>

              <!-- Productos / Cantidad -->
              <td class="px-5 py-4 text-xs text-slate-500">
                <span class="font-medium text-slate-700">{{ getQuoteUnits(quoteAgg) }} unds</span>
                <span class="text-[10px] text-slate-400 block">({{ quoteAgg.items.length }} ítems)</span>
              </td>

              <!-- Fecha -->
              <td class="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                {{ formatDate(quoteAgg.quote.created_at || quoteAgg.quote.updated_at) }}
              </td>

              <!-- Estado -->
              <td class="px-5 py-4">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap',
                    getStatusBadge(quoteAgg.quote.status).badgeClass,
                  ]"
                >
                  {{ getStatusBadge(quoteAgg.quote.status).label }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-5 py-4 text-right">
                <button
                  type="button"
                  @click="openDetail(quoteAgg)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-[#00a896] bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/50 rounded-lg transition-colors cursor-pointer"
                >
                  <i class="fa-solid fa-eye text-[11px]"></i>
                  <span>Detalle</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer using Reka UI -->
      <div
        v-if="totalOrders > 0"
        class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/30"
      >
        <span class="text-xs text-slate-400">
          Mostrando página <strong class="text-slate-600">{{ currentPage }}</strong> de
          <strong class="text-slate-600">{{ totalPages }}</strong> ({{ totalOrders }} pedidos registrados)
        </span>

        <PaginationRoot
          v-model:page="currentPage"
          :total="totalOrders"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
          @update:page="() => fetchOrders()"
        >
          <PaginationList v-slot="{ items }" class="flex items-center gap-1.5">
            <PaginationPrev
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors bg-white shadow-2xs"
            >
              <i class="fa-solid fa-chevron-left text-[10px]"></i>
              <span class="hidden sm:inline">Anterior</span>
            </PaginationPrev>

            <template v-for="(pageItem, index) in items">
              <PaginationListItem
                v-if="pageItem.type === 'page'"
                :key="index"
                :value="pageItem.value"
                class="h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors border data-[selected=true]:border-[#00a896] data-[selected=true]:bg-[#00a896] data-[selected=true]:text-white data-[selected=undefined]:border-slate-200 data-[selected=undefined]:text-slate-600 data-[selected=undefined]:hover:bg-slate-50 bg-white"
              >
                {{ pageItem.value }}
              </PaginationListItem>
              <PaginationEllipsis
                v-else
                :key="pageItem.type"
                :index="index"
                class="h-8 w-8 flex items-center justify-center text-xs text-slate-400"
              >
                &#8230;
              </PaginationEllipsis>
            </template>

            <PaginationNext
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors bg-white shadow-2xs"
            >
              <span class="hidden sm:inline">Siguiente</span>
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </PaginationNext>
          </PaginationList>
        </PaginationRoot>
      </div>
    </div>

    <!-- Order Detail Dialog using Reka UI -->
    <DialogRoot v-model:open="isDetailOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 animate-in fade-in" />
        <DialogContent
          class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl z-50 max-h-[90vh] overflow-y-auto space-y-5"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-3 border-b border-slate-100">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <DialogTitle class="font-serif text-lg font-bold text-[#023859]">
                  Detalle del Pedido
                </DialogTitle>
                <span
                  v-if="selectedOrder"
                  :class="[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                    getStatusBadge(selectedOrder.quote.status).badgeClass,
                  ]"
                >
                  {{ getStatusBadge(selectedOrder.quote.status).label }}
                </span>
              </div>
              <p class="text-xs text-slate-400">
                Información completa de los productos y participantes.
              </p>
            </div>

            <DialogClose class="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-100">
              <i class="fa-solid fa-xmark text-lg"></i>
            </DialogClose>
          </div>

          <div v-if="selectedOrder" class="space-y-5 text-xs">
            <!-- Order ID -->
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span class="font-semibold text-slate-500">ID de Cotización:</span>
              <UuidBadge
                :uuid="selectedOrder.quote.id"
                mode="crockford-full"
                prefix="ORD-"
                size="md"
                variant="outline"
              />
            </div>

            <!-- Participants & Logistics Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comprador</span>
                <p class="font-bold text-[#023859] text-xs">
                  {{ buyerNames[selectedOrder.quote.buyer_id] || selectedOrder.quote.buyer_id }}
                </p>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400">UUID:</span>
                  <UuidBadge :uuid="selectedOrder.quote.buyer_id" mode="full" size="xs" variant="ghost" />
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</span>
                <p class="font-bold text-[#023859] text-xs">
                  {{ providerNames[selectedOrder.quote.provider_id] || selectedOrder.quote.provider_id }}
                </p>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400">UUID:</span>
                  <UuidBadge :uuid="selectedOrder.quote.provider_id" mode="full" size="xs" variant="ghost" />
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de pago</span>
                <p class="font-semibold text-slate-700">
                  {{ getPaymentLabel(selectedOrder.quote.payment_preference) }}
                </p>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Método de envío</span>
                <p class="font-semibold text-slate-700">
                  {{ getShippingLabel(selectedOrder.quote.shipping_preference) }}
                </p>
              </div>
            </div>

            <!-- Shipping Address & Buyer Notes -->
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div>
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dirección de entrega</span>
                <p class="font-medium text-slate-700 mt-0.5">{{ selectedOrder.quote.shipping_address }}</p>
              </div>
              <div v-if="selectedOrder.quote.buyer_notes">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notas del comprador</span>
                <p class="font-medium text-slate-600 italic mt-0.5">{{ selectedOrder.quote.buyer_notes }}</p>
              </div>
            </div>

            <!-- Items Table -->
            <div class="space-y-2">
              <span class="text-xs font-bold text-[#023859]">Productos solicitados ({{ selectedOrder.items.length }})</span>
              <div class="rounded-xl border border-slate-200 overflow-hidden">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th class="py-2.5 px-3">Producto</th>
                      <th class="py-2.5 px-3 text-center">Cant.</th>
                      <th class="py-2.5 px-3 text-right">Precio unitario</th>
                      <th class="py-2.5 px-3 text-right">Descuento</th>
                      <th class="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="it in selectedOrder.items" :key="`${it.product_id}-${JSON.stringify(it.selected_spec || {})}`">
                      <td class="py-2.5 px-3 font-medium text-slate-800">
                        {{ it.product_title_snapshot }}
                        <!-- TODO: Redesign admin order items view to highlight product specification variants -->
                        <span
                          v-if="it.selected_spec && Object.keys(it.selected_spec).length > 0"
                          class="block text-[11px] text-slate-400 font-normal"
                        >
                          {{ Object.entries(it.selected_spec).map(([k, v]) => `${k}: ${v}`).join(', ') }}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-center text-slate-600 font-mono">
                        {{ it.quantity }}
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-600">
                        {{ formatCurrency(it.unit_price_snapshot) }}
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-500">
                        <span v-if="it.discount_percentage" class="text-emerald-600 font-bold">
                          -{{ it.discount_percentage }}%
                        </span>
                        <span v-else class="text-slate-300">-</span>
                      </td>
                      <td class="py-2.5 px-3 text-right font-bold text-[#023859]">
                        {{ formatCurrency(it.quantity * it.unit_price_snapshot * (1 - (it.discount_percentage || 0) / 100)) }}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot class="bg-slate-50/70 border-t border-slate-200 font-bold">
                    <tr>
                      <td colspan="4" class="py-2.5 px-3 text-right text-slate-600">Total a pagar:</td>
                      <td class="py-2.5 px-3 text-right text-[#00a896] text-sm font-bold">
                        {{ formatCurrency(getQuoteTotalAmount(selectedOrder)) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Timestamps -->
            <div class="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              <span>Registrado: {{ formatDate(selectedOrder.quote.created_at) }}</span>
              <span>Última actualización: {{ formatDate(selectedOrder.quote.updated_at) }}</span>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
