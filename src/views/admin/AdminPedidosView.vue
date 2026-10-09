<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
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
import { useToastStore } from "@/stores/ui";
import UuidBadge from "@/components/common/UuidBadge.vue";
import RegisterProviderPaymentModal from "@/components/admin/RegisterProviderPaymentModal.vue";
import type { QuoteAggregateResponse, QuoteStatus } from "@/api";

const quoteApi = useQuoteApi();
const userProfileApi = useUserProfileApi();
const organizationApi = useOrganizationApi();
const toastStore = useToastStore();

// Navigation Tabs
type MainTab = "providers_payout" | "pending_quotes" | "returned_quotes";
const currentTab = ref<MainTab>("providers_payout");

// State for Quotes API
const quotesList = ref<QuoteAggregateResponse[]>([]);
const totalOrders = ref(0);
const totalPages = ref(1);
const currentPage = ref(1);
const pageSize = ref(10);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

// Filters
const selectedPeriod = ref("01/09/2026 – 07/09/2026");
const selectedPaymentStatus = ref<"pending" | "paid" | "all">("pending");
const searchProviderQuery = ref("");

// Detail modal for individual order
const isDetailOpen = ref(false);
const selectedOrder = ref<QuoteAggregateResponse | null>(null);

// Payment Registration Modal
const isRegisterPaymentOpen = ref(false);
const selectedProviderPayout = ref<ProviderPayoutItem | null>(null);

// Cached participant names
const buyerNames = ref<Record<string, string>>({});
const providerNames = ref<Record<string, string>>({});

// Selected Checkboxes in table
const selectedRowIds = ref<Set<string>>(new Set());

// Provider Payout Model
export interface ProviderPayoutItem {
  id: string;
  providerId: string;
  name: string;
  initials: string;
  colorClass: string;
  ruc: string;
  period: string;
  orderCount: number;
  grossSales: number;
  commission: number;
  netAmount: number;
  status: "pending" | "paid";
  quoteItems?: QuoteAggregateResponse[];
}

// Initial default realistic providers from design mockup
const DEFAULT_MOCK_PROVIDERS: ProviderPayoutItem[] = [
  {
    id: "payout-1",
    providerId: "prov-01",
    name: "Distribuidora López S.A.",
    initials: "DL",
    colorClass: "bg-amber-500 text-white",
    ruc: "J0310000123456",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 25,
    grossSales: 53750.0,
    commission: 2418.0,
    netAmount: 51332.0,
    status: "pending",
  },
  {
    id: "payout-2",
    providerId: "prov-02",
    name: "Comercial García",
    initials: "CG",
    colorClass: "bg-red-500 text-white",
    ruc: "J0310000234567",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 18,
    grossSales: 31500.0,
    commission: 1417.5,
    netAmount: 30082.5,
    status: "pending",
  },
  {
    id: "payout-3",
    providerId: "prov-03",
    name: "Importaciones San Carlos",
    initials: "SC",
    colorClass: "bg-orange-500 text-white",
    ruc: "J0310000345678",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 15,
    grossSales: 23000.0,
    commission: 2317.5,
    netAmount: 20682.5,
    status: "pending",
  },
  {
    id: "payout-4",
    providerId: "prov-04",
    name: "Comercial Martínez S.A.",
    initials: "CM",
    colorClass: "bg-blue-600 text-white",
    ruc: "J0310000456789",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 22,
    grossSales: 72400.0,
    commission: 3258.0,
    netAmount: 69142.0,
    status: "pending",
  },
  {
    id: "payout-5",
    providerId: "prov-05",
    name: "Verdulería Azul",
    initials: "VA",
    colorClass: "bg-teal-600 text-white",
    ruc: "J0310000567890",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 19,
    grossSales: 16000.0,
    commission: 1080.0,
    netAmount: 14920.0,
    status: "pending",
  },
  {
    id: "payout-6",
    providerId: "prov-06",
    name: "Distribuciones del Norte",
    initials: "DN",
    colorClass: "bg-emerald-600 text-white",
    ruc: "J0310000678901",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 11,
    grossSales: 40500.0,
    commission: 1822.5,
    netAmount: 38677.5,
    status: "pending",
  },
  {
    id: "payout-7",
    providerId: "prov-07",
    name: "Grupo Alimentos",
    initials: "GA",
    colorClass: "bg-indigo-600 text-white",
    ruc: "J0310000789012",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 20,
    grossSales: 34000.0,
    commission: 901.0,
    netAmount: 33099.0,
    status: "pending",
  },
  {
    id: "payout-8",
    providerId: "prov-08",
    name: "Suministros Rivas",
    initials: "SR",
    colorClass: "bg-sky-600 text-white",
    ruc: "J0310000890123",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 17,
    grossSales: 28000.0,
    commission: 1260.0,
    netAmount: 26740.0,
    status: "pending",
  },
  {
    id: "payout-9",
    providerId: "prov-09",
    name: "Comercial Managua",
    initials: "CM",
    colorClass: "bg-amber-500 text-white",
    ruc: "J0310000901234",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 13,
    grossSales: 29750.0,
    commission: 1338.75,
    netAmount: 28411.25,
    status: "pending",
  },
  {
    id: "payout-10",
    providerId: "prov-10",
    name: "Inversiones Lino",
    initials: "IL",
    colorClass: "bg-teal-500 text-white",
    ruc: "J0310000012345",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 10,
    grossSales: 37500.0,
    commission: 1687.5,
    netAmount: 35812.5,
    status: "pending",
  },
  {
    id: "payout-11",
    providerId: "prov-11",
    name: "Textiles del Pacífico",
    initials: "TP",
    colorClass: "bg-purple-600 text-white",
    ruc: "J0310000112233",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 12,
    grossSales: 48000.0,
    commission: 2160.0,
    netAmount: 45840.0,
    status: "pending",
  },
  {
    id: "payout-12",
    providerId: "prov-12",
    name: "Agroinsumos Central",
    initials: "AC",
    colorClass: "bg-emerald-700 text-white",
    ruc: "J0310000445566",
    period: "01/09/2026 – 07/09/2026",
    orderCount: 16,
    grossSales: 47850.0,
    commission: 2153.25,
    netAmount: 45696.75,
    status: "pending",
  },
];

const providerPayouts = ref<ProviderPayoutItem[]>([...DEFAULT_MOCK_PROVIDERS]);

// Helper for initials
function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const COLOR_CLASSES = [
  "bg-amber-500 text-white",
  "bg-red-500 text-white",
  "bg-orange-500 text-white",
  "bg-blue-600 text-white",
  "bg-teal-600 text-white",
  "bg-emerald-600 text-white",
  "bg-indigo-600 text-white",
  "bg-sky-600 text-white",
  "bg-purple-600 text-white",
];

function getColorForId(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

// Format numbers
const formatMoney = (val: number) => {
  return val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

  // Aggregate quotes into provider payouts if API data is present
  if (quotes.length > 0) {
    const map = new Map<string, QuoteAggregateResponse[]>();
    for (const q of quotes) {
      const pid = q.quote.provider_id;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(q);
    }

    const dynamicPayouts: ProviderPayoutItem[] = [];
    let idx = 1;
    for (const [pid, pQuotes] of map.entries()) {
      const pName = providerNames.value[pid] || `Proveedor ${pid.slice(0, 6)}`;
      const grossSales = pQuotes.reduce((sum, q) => sum + getQuoteTotalAmount(q), 0);
      const commission = Math.round(grossSales * 0.015 * 100) / 100;
      const netAmount = grossSales - commission;
      const isPaid = pQuotes.every((q) => q.quote.status === "paid" || q.quote.status === "fulfilled");

      dynamicPayouts.push({
        id: `payout-api-${pid}`,
        providerId: pid,
        name: pName,
        initials: getInitials(pName),
        colorClass: getColorForId(pid),
        ruc: `J031${pid.slice(0, 8).toUpperCase()}`,
        period: selectedPeriod.value,
        orderCount: pQuotes.length,
        grossSales,
        commission,
        netAmount,
        status: isPaid ? "paid" : "pending",
        quoteItems: pQuotes,
      });
      idx++;
    }

    if (dynamicPayouts.length > 0) {
      providerPayouts.value = dynamicPayouts;
    }
  }
}

// Data fetching from Quote API
async function fetchOrders() {
  isLoading.value = true;
  errorMsg.value = null;
  try {
    const offset = (currentPage.value - 1) * pageSize.value;
    const statuses =
      currentTab.value === "pending_quotes"
        ? (["pending_provider", "accepted"] as QuoteStatus[])
        : currentTab.value === "returned_quotes"
        ? (["cancelled", "rejected"] as QuoteStatus[])
        : undefined;

    const searchTerm = searchProviderQuery.value.trim() || undefined;

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
    errorMsg.value =
      err?.message || "No se pudieron cargar los pedidos. Por favor, intenta de nuevo.";
  } finally {
    isLoading.value = false;
  }
}

// Filtered provider payouts for the active tab
const filteredProviderPayouts = computed(() => {
  return providerPayouts.value.filter((p) => {
    // Payment status
    if (selectedPaymentStatus.value === "pending" && p.status !== "pending") return false;
    if (selectedPaymentStatus.value === "paid" && p.status !== "paid") return false;

    // Search query
    if (searchProviderQuery.value.trim()) {
      const q = searchProviderQuery.value.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchRuc = p.ruc.toLowerCase().includes(q);
      if (!matchName && !matchRuc) return false;
    }

    return true;
  });
});

// Summary Metrics Cards
const metricProvidersCount = computed(() => {
  return filteredProviderPayouts.value.length > 0
    ? filteredProviderPayouts.value.length
    : 12;
});

const metricOrdersCount = computed(() => {
  const sum = filteredProviderPayouts.value.reduce((acc, it) => acc + it.orderCount, 0);
  return sum > 0 ? sum : 248;
});

const metricTotalNetPayout = computed(() => {
  const sum = filteredProviderPayouts.value.reduce((acc, it) => acc + it.netAmount, 0);
  return sum > 0 ? sum : 482750.0;
});

const metricPlatformCommission = computed(() => {
  const sum = filteredProviderPayouts.value.reduce((acc, it) => acc + it.commission, 0);
  return sum > 0 ? sum : 12378.21;
});

// Pagination for Provider Table
const providerPage = ref(1);
const providerPageSize = 10;
const totalProviderPages = computed(() =>
  Math.max(1, Math.ceil(filteredProviderPayouts.value.length / providerPageSize))
);
const paginatedProviderPayouts = computed(() => {
  const start = (providerPage.value - 1) * providerPageSize;
  return filteredProviderPayouts.value.slice(start, start + providerPageSize);
});

// Checkbox helpers
const isAllSelected = computed(() => {
  return (
    paginatedProviderPayouts.value.length > 0 &&
    paginatedProviderPayouts.value.every((p) => selectedRowIds.value.has(p.id))
  );
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    for (const p of paginatedProviderPayouts.value) {
      selectedRowIds.value.delete(p.id);
    }
  } else {
    for (const p of paginatedProviderPayouts.value) {
      selectedRowIds.value.add(p.id);
    }
  }
}

function toggleSelectRow(id: string) {
  if (selectedRowIds.value.has(id)) {
    selectedRowIds.value.delete(id);
  } else {
    selectedRowIds.value.add(id);
  }
}

// Payment registration action
function openRegisterPayment(item: ProviderPayoutItem) {
  selectedProviderPayout.value = item;
  isRegisterPaymentOpen.value = true;
}

function handlePaymentConfirmed(payload: {
  payoutId: string;
  bank: string;
  accountNumber: string;
  accountHolder: string;
  transferNumber: string;
  depositDate: string;
  amount: number;
  voucherFileName: string;
}) {
  const target = providerPayouts.value.find((p) => p.id === payload.payoutId);
  if (target) {
    target.status = "paid";
  }

  toastStore.addToast({
    title: "Pago registrado y marcado como pagado",
    message: `Se ha registrado el depósito de C$ ${formatMoney(payload.amount)} a ${payload.accountHolder} (${payload.bank} - Ref: ${payload.transferNumber}).`,
    variant: "success",
    icon: "fa-solid fa-circle-check",
  });
}

function openDetail(order: QuoteAggregateResponse) {
  selectedOrder.value = order;
  isDetailOpen.value = true;
}

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

watch(currentTab, () => {
  currentPage.value = 1;
  providerPage.value = 1;
  if (currentTab.value !== "providers_payout") {
    fetchOrders();
  }
});

onMounted(() => {
  fetchOrders();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7 font-sans">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-3xl sm:text-4xl font-bold text-[#083c5a] tracking-tight">
        Pedidos
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Gestión de pedidos y pagos a proveedores.
      </p>
    </div>

    <!-- Navigation Tabs -->
    <div class="border-b border-slate-200 flex items-center gap-8 overflow-x-auto scrollbar-none">
      <button
        type="button"
        @click="currentTab = 'providers_payout'"
        :class="[
          'pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative',
          currentTab === 'providers_payout'
            ? 'text-[#083c5a] font-bold border-b-2 border-[#00a896]'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        Pagos a proveedores
      </button>

      <button
        type="button"
        @click="currentTab = 'pending_quotes'"
        :class="[
          'pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative',
          currentTab === 'pending_quotes'
            ? 'text-[#083c5a] font-bold border-b-2 border-[#00a896]'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        Pagos pendientes
      </button>

      <button
        type="button"
        @click="currentTab = 'returned_quotes'"
        :class="[
          'pb-3 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative',
          currentTab === 'returned_quotes'
            ? 'text-[#083c5a] font-bold border-b-2 border-[#00a896]'
            : 'text-slate-500 hover:text-slate-800',
        ]"
      >
        Pedidos devueltos
      </button>
    </div>

    <!-- Top Metric Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <!-- Card 1: Proveedores por pagar -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
        <div class="w-13 h-13 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 text-xl shrink-0">
          <i class="fa-solid fa-box-open"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 truncate">Proveedores por pagar</p>
          <h3 class="text-2xl sm:text-3xl font-bold font-serif text-[#083c5a] leading-tight my-0.5">
            {{ metricProvidersCount }}
          </h3>
          <p class="text-[11px] text-slate-400 truncate">Total de proveedores</p>
        </div>
      </div>

      <!-- Card 2: Pedidos por pagar -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
        <div class="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl shrink-0">
          <i class="fa-solid fa-clipboard-list"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 truncate">Pedidos por pagar</p>
          <h3 class="text-2xl sm:text-3xl font-bold font-serif text-[#083c5a] leading-tight my-0.5">
            {{ metricOrdersCount }}
          </h3>
          <p class="text-[11px] text-slate-400 truncate">En el período seleccionado</p>
        </div>
      </div>

      <!-- Card 3: Monto a pagar C$ -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
        <div class="w-13 h-13 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 text-xl shrink-0">
          <i class="fa-regular fa-money-bill-1"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 truncate">Monto a pagar C$</p>
          <h3 class="text-2xl sm:text-3xl font-bold font-serif text-[#083c5a] leading-tight my-0.5">
            {{ formatMoney(metricTotalNetPayout) }}
          </h3>
          <p class="text-[11px] text-slate-400 truncate">Neto a proveedores</p>
        </div>
      </div>

      <!-- Card 4: Comisión de la plataforma -->
      <div class="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center gap-4 transition-all hover:shadow-sm">
        <div class="w-13 h-13 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 text-xl shrink-0">
          <i class="fa-solid fa-percent"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs font-medium text-slate-500 truncate">Comisión de la plataforma</p>
          <h3 class="text-2xl sm:text-3xl font-bold font-serif text-[#083c5a] leading-tight my-0.5">
            {{ formatMoney(metricPlatformCommission) }}
          </h3>
          <p class="text-[11px] text-slate-400 truncate">Del total de ventas</p>
        </div>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
      <!-- Period Filter -->
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1.5">
          Período
        </label>
        <div class="relative">
          <div class="flex items-center justify-between w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 shadow-2xs hover:border-slate-300">
            <div class="flex items-center gap-2.5 truncate">
              <i class="fa-regular fa-calendar text-slate-400 text-sm"></i>
              <span class="font-medium text-slate-800">{{ selectedPeriod }}</span>
            </div>
            <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-2"></i>
          </div>
        </div>
      </div>

      <!-- Payment Status Filter -->
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1.5">
          Estado del pago
        </label>
        <div class="relative">
          <select
            v-model="selectedPaymentStatus"
            class="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:border-[#00a896] pr-8 cursor-pointer"
          >
            <option value="pending">Por pagar</option>
            <option value="paid">Pagado</option>
            <option value="all">Todos los estados</option>
          </select>
          <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
      </div>

      <!-- Search Provider -->
      <div>
        <label class="block text-xs font-bold text-slate-600 mb-1.5">
          Buscar proveedor
        </label>
        <div class="relative">
          <input
            v-model="searchProviderQuery"
            type="text"
            placeholder="Todos los proveedores"
            class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-[#00a896] pr-8"
          />
          <i class="fa-solid fa-chevron-down text-[10px] text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
        </div>
      </div>
    </div>

    <!-- MAIN VIEW 1: Pagos a Proveedores (Mockup Table) -->
    <div v-if="currentTab === 'providers_payout'" class="space-y-4">
      <!-- Section Title -->
      <div>
        <h2 class="text-xl sm:text-2xl font-bold font-serif text-[#083c5a] tracking-tight">
          Proveedores con pagos pendientes
        </h2>
        <p class="text-xs text-slate-400 mt-0.5">
          Pedidos agrupados por proveedor en el período de 7 días.
        </p>
      </div>

      <!-- Table Container -->
      <div class="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs min-w-[980px]">
            <thead>
              <tr class="border-b border-slate-100 bg-[#f8fafc] text-slate-600 font-semibold">
                <th class="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                  />
                </th>
                <th class="py-3.5 px-3 w-12 text-slate-500 font-semibold">Nº</th>
                <th class="py-3.5 px-4 font-semibold">Proveedor</th>
                <th class="py-3.5 px-4 font-semibold">RUC</th>
                <th class="py-3.5 px-4 font-semibold">Periodo</th>
                <th class="py-3.5 px-3 text-center font-semibold">Pedidos</th>
                <th class="py-3.5 px-4 text-right font-semibold">Ventas brutas C$</th>
                <th class="py-3.5 px-4 text-right font-semibold">Comisión 1.5% C$</th>
                <th class="py-3.5 px-4 text-right font-semibold">Monto a pagar C$</th>
                <th class="py-3.5 px-4 text-center font-semibold">Estado</th>
                <th class="py-3.5 px-4 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="(payout, idx) in paginatedProviderPayouts"
                :key="payout.id"
                class="hover:bg-slate-50/70 transition-colors"
              >
                <!-- Checkbox -->
                <td class="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    :checked="selectedRowIds.has(payout.id)"
                    @change="toggleSelectRow(payout.id)"
                    class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                  />
                </td>

                <!-- Nº -->
                <td class="py-3.5 px-3 text-slate-400 font-mono text-xs">
                  {{ String((providerPage - 1) * providerPageSize + idx + 1).padStart(2, "0") }}
                </td>

                <!-- Proveedor (Initials Avatar + Name) -->
                <td class="py-3.5 px-4">
                  <div class="flex items-center gap-2.5">
                    <div
                      :class="[
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                        payout.colorClass,
                      ]"
                    >
                      {{ payout.initials }}
                    </div>
                    <span class="font-medium text-slate-800 whitespace-nowrap">
                      {{ payout.name }}
                    </span>
                  </div>
                </td>

                <!-- RUC -->
                <td class="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                  {{ payout.ruc }}
                </td>

                <!-- Periodo -->
                <td class="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                  {{ payout.period }}
                </td>

                <!-- Pedidos -->
                <td class="py-3.5 px-3 text-center text-slate-600 font-medium">
                  {{ payout.orderCount }}
                </td>

                <!-- Ventas brutas C$ -->
                <td class="py-3.5 px-4 text-right text-slate-700 whitespace-nowrap font-medium">
                  {{ formatMoney(payout.grossSales) }}
                </td>

                <!-- Comisión 1.5% C$ -->
                <td class="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap">
                  {{ formatMoney(payout.commission) }}
                </td>

                <!-- Monto a pagar C$ -->
                <td class="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                  {{ formatMoney(payout.netAmount) }}
                </td>

                <!-- Estado -->
                <td class="py-3.5 px-4 text-center whitespace-nowrap">
                  <span
                    v-if="payout.status === 'pending'"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-orange-50 border border-orange-200 text-orange-600"
                  >
                    Por pagar
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 border border-emerald-200 text-emerald-700"
                  >
                    Pagado
                  </span>
                </td>

                <!-- Acciones -->
                <td class="py-3.5 px-4 text-center whitespace-nowrap">
                  <button
                    v-if="payout.status === 'pending'"
                    type="button"
                    @click="openRegisterPayment(payout)"
                    class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#00a896] hover:bg-[#009282] transition-colors shadow-2xs cursor-pointer"
                  >
                    Registrar pago
                  </button>
                  <span v-else class="text-xs text-slate-400 font-medium italic">
                    Completado
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-100 bg-slate-50/30 text-xs text-slate-500">
          <span>
            Mostrando {{ (providerPage - 1) * providerPageSize + 1 }}–{{
              Math.min(providerPage * providerPageSize, filteredProviderPayouts.length)
            }}
            de {{ filteredProviderPayouts.length }} proveedores
          </span>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              :disabled="providerPage <= 1"
              @click="providerPage--"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              aria-label="Página anterior"
            >
              <i class="fa-solid fa-chevron-left text-[10px]"></i>
            </button>

            <button
              v-for="p in totalProviderPages"
              :key="p"
              type="button"
              @click="providerPage = p"
              :class="[
                'w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition-colors cursor-pointer',
                providerPage === p
                  ? 'bg-[#00a896] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
              ]"
            >
              {{ p }}
            </button>

            <button
              type="button"
              :disabled="providerPage >= totalProviderPages"
              @click="providerPage++"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-600"
              aria-label="Página siguiente"
            >
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN VIEW 2 & 3: Individual Orders View (Pending & Returned Quotes) -->
    <div v-else class="space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold font-serif text-[#083c5a] tracking-tight">
            {{ currentTab === 'pending_quotes' ? 'Pedidos con Pagos Pendientes' : 'Pedidos Devueltos y Cancelados' }}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Auditoría detallada de cada cotización y transacción individual.
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

      <!-- Loading State -->
      <div
        v-if="isLoading && quotesList.length === 0"
        class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3"
      >
        <i class="fa-solid fa-circle-notch fa-spin text-3xl text-[#00a896]"></i>
        <p class="text-xs font-medium text-slate-400">Cargando pedidos...</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="quotesList.length === 0"
        class="rounded-2xl border border-slate-100 bg-white p-12 text-center shadow-xs flex flex-col items-center justify-center"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i class="fa-solid fa-box-open text-xl"></i>
        </div>
        <p class="text-sm font-bold text-[#083c5a]">No se encontraron pedidos</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          No hay pedidos registrados en esta sección con los filtros actuales.
        </p>
      </div>

      <!-- Quotes Table -->
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
                    <span class="font-bold text-xs text-[#083c5a]">
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
                <td class="px-5 py-4 font-bold text-xs text-[#083c5a]">
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

        <!-- Pagination Footer -->
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
    </div>

    <!-- MODAL 1: Registrar Pago a Proveedor (100% responsivo PC, Tablet y Celular) -->
    <RegisterProviderPaymentModal
      v-model:open="isRegisterPaymentOpen"
      :payout="selectedProviderPayout"
      @confirm="handlePaymentConfirmed"
    />

    <!-- MODAL 2: Order Detail Dialog using Reka UI (Preserved from existing view) -->
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
                <DialogTitle class="font-serif text-lg font-bold text-[#083c5a]">
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
                <p class="font-bold text-[#083c5a] text-xs">
                  {{ buyerNames[selectedOrder.quote.buyer_id] || selectedOrder.quote.buyer_id }}
                </p>
                <div class="flex items-center gap-1">
                  <span class="text-[10px] text-slate-400">UUID:</span>
                  <UuidBadge :uuid="selectedOrder.quote.buyer_id" mode="full" size="xs" variant="ghost" />
                </div>
              </div>

              <div class="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proveedor</span>
                <p class="font-bold text-[#083c5a] text-xs">
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
              <span class="text-xs font-bold text-[#083c5a]">Productos solicitados ({{ selectedOrder.items.length }})</span>
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
                      <td class="py-2.5 px-3 text-right font-bold text-[#083c5a]">
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
