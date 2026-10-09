<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationEllipsis,
} from "reka-ui";
import { useDepositApi } from "@/api/modules/wallet/deposit/useDepositApi";
import { useWithdrawalApi } from "@/api/modules/wallet/withdrawal/useWithdrawalApi";
import { usePlatformBankAccountApi } from "@/api/modules/wallet/platform_bank_account/usePlatformBankAccountApi";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import { useToastStore } from "@/stores/ui";
import type {
  DepositRequestSummaryResponse,
  WithdrawalRequestSummaryResponse,
  FundingMetricsResponse,
  WithdrawalMetricsResponse,
  PlatformBankAccountResponse,
  DepositRequestStatus,
  WithdrawalRequestStatus,
} from "@/api";

const router = useRouter();
const depositApi = useDepositApi();
const withdrawalApi = useWithdrawalApi();
const bankAccountApi = usePlatformBankAccountApi();
const contextStore = useUserContextStore();
const toastStore = useToastStore();

const isAdmin = computed(() => contextStore.isAdmin);

type OperationType = "deposits" | "withdrawals";
const operationType = ref<OperationType>("deposits");

type TabType = "Todas" | "Pendientes" | "Aprobadas" | "Rechazadas";
const activeTab = ref<TabType>("Todas");
const searchQuery = ref("");
const selectedBankId = ref("all");

// Data lists
const solicitudes = ref<DepositRequestSummaryResponse[]>([]);
const withdrawalSolicitudes = ref<WithdrawalRequestSummaryResponse[]>([]);
const bankAccounts = ref<PlatformBankAccountResponse[]>([]);

// Metrics
const metrics = ref<FundingMetricsResponse | null>(null);
const withdrawalMetrics = ref<WithdrawalMetricsResponse | null>(null);

const isLoading = ref(false);
const currentPage = ref(1);
const pageSize = 15;
const totalPages = ref(1);
const totalItems = ref(0);

// Action modals for withdrawals
const showCompleteModal = ref(false);
const showRejectModal = ref(false);
const selectedWithdrawal = ref<WithdrawalRequestSummaryResponse | null>(null);
const payoutReferenceCode = ref("");
const rejectionReason = ref("");
const isActionLoading = ref(false);

const counts = computed(() => {
  const currentMetrics = operationType.value === "deposits" ? metrics.value : withdrawalMetrics.value;
  return {
    Todas: currentMetrics?.all ?? 0,
    Pendientes: currentMetrics?.pending ?? 0,
    Aprobadas: currentMetrics?.approved ?? 0,
    Rechazadas: currentMetrics?.rejected ?? 0,
  };
});

const statusFilterMap: Record<TabType, DepositRequestStatus | undefined> = {
  Todas: undefined,
  Pendientes: "pending",
  Aprobadas: "approved",
  Rechazadas: "rejected",
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

const formatDate = (dateStr: string) => {
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

const getStatusBadge = (status?: DepositRequestStatus | WithdrawalRequestStatus) => {
  switch (status) {
    case "pending":
      return { label: "Pendiente", badgeClass: "bg-orange-100/70 text-[#ea580c]" };
    case "approved":
      return { label: operationType.value === "deposits" ? "Aprobada" : "Completada", badgeClass: "bg-teal-100/70 text-[#00a896]" };
    case "rejected":
    default:
      return { label: "Rechazada", badgeClass: "bg-slate-200 text-slate-700" };
  }
};

async function loadDepositMetrics() {
  try {
    metrics.value = await depositApi.getRechargeMetrics();
  } catch (err) {
    console.error("[AdminPagos] Error loading recharge metrics:", err);
  }
}

async function loadWithdrawalMetrics() {
  try {
    withdrawalMetrics.value = await withdrawalApi.getWithdrawalMetrics();
  } catch (err) {
    console.error("[AdminPagos] Error loading withdrawal metrics:", err);
  }
}

async function loadBankAccounts() {
  try {
    bankAccounts.value = await bankAccountApi.getPlatformBankAccounts();
  } catch (err) {
    console.error("[AdminPagos] Error loading bank accounts:", err);
  }
}

async function fetchRecharges() {
  isLoading.value = true;
  try {
    const status = statusFilterMap[activeTab.value];
    const offset = (currentPage.value - 1) * pageSize;
    const res = await depositApi.getRecharges({
      status,
      search_term: searchQuery.value.trim() || undefined,
      platform_bank_account_id:
        selectedBankId.value && selectedBankId.value !== "all"
          ? selectedBankId.value
          : undefined,
      limit: pageSize,
      offset,
    });
    solicitudes.value = res.data;
    totalItems.value = res.total;
    totalPages.value = Math.max(1, Math.ceil(res.total / pageSize));
  } catch (err) {
    console.error("[AdminPagos] Error fetching recharges:", err);
    solicitudes.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function fetchWithdrawals() {
  isLoading.value = true;
  try {
    const status = statusFilterMap[activeTab.value] as WithdrawalRequestStatus | undefined;
    const offset = (currentPage.value - 1) * pageSize;
    const res = await withdrawalApi.getWithdrawals({
      status,
      search_term: searchQuery.value.trim() || undefined,
      limit: pageSize,
      offset,
    });
    withdrawalSolicitudes.value = res.data;
    totalItems.value = res.total;
    totalPages.value = Math.max(1, Math.ceil(res.total / pageSize));
  } catch (err) {
    console.error("[AdminPagos] Error fetching withdrawals:", err);
    withdrawalSolicitudes.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleFetch() {
  if (operationType.value === "deposits") {
    fetchRecharges();
  } else {
    fetchWithdrawals();
  }
}

function switchOperationType(type: OperationType) {
  operationType.value = type;
  currentPage.value = 1;
  activeTab.value = "Todas";
  searchQuery.value = "";
  if (type === "deposits") {
    loadDepositMetrics();
    fetchRecharges();
  } else {
    loadWithdrawalMetrics();
    fetchWithdrawals();
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentPage.value = 1;
    handleFetch();
  }, 350);
});

watch([activeTab, selectedBankId], () => {
  currentPage.value = 1;
  handleFetch();
});

onMounted(async () => {
  await Promise.all([
    loadDepositMetrics(),
    loadWithdrawalMetrics(),
    loadBankAccounts(),
    fetchRecharges(),
  ]);
});

const goToDetail = (id: string) => {
  router.push({ name: "admin-payment-detail", params: { id } });
};

// Withdrawal actions
function openCompleteModal(withdrawal: WithdrawalRequestSummaryResponse) {
  selectedWithdrawal.value = withdrawal;
  payoutReferenceCode.value = "";
  showCompleteModal.value = true;
}

function openRejectModal(withdrawal: WithdrawalRequestSummaryResponse) {
  selectedWithdrawal.value = withdrawal;
  rejectionReason.value = "";
  showRejectModal.value = true;
}

async function handleCompleteWithdrawal() {
  if (!selectedWithdrawal.value) return;
  if (!payoutReferenceCode.value.trim()) {
    toastStore.addToast({
      title: "Campo requerido",
      message: "Ingresa el número de confirmación bancaria o referencia de transferencia.",
      variant: "error",
    });
    return;
  }

  isActionLoading.value = true;
  try {
    await withdrawalApi.completeWithdrawal(selectedWithdrawal.value.id, {
      payout_reference_code: payoutReferenceCode.value.trim(),
    });

    toastStore.addToast({
      title: "Retiro completado",
      message: "La transferencia ha sido marcada como completada en el sistema.",
      variant: "success",
    });

    showCompleteModal.value = false;
    await Promise.all([loadWithdrawalMetrics(), fetchWithdrawals()]);
  } catch (err: any) {
    console.error("[AdminPagos] Error completing withdrawal:", err);
    toastStore.addToast({
      title: "Error al completar retiro",
      message: err.message || "No se pudo completar la extracción.",
      variant: "error",
    });
  } finally {
    isActionLoading.value = false;
  }
}

async function handleRejectWithdrawal() {
  if (!selectedWithdrawal.value) return;
  if (!rejectionReason.value.trim()) {
    toastStore.addToast({
      title: "Campo requerido",
      message: "Por favor indica el motivo del rechazo.",
      variant: "error",
    });
    return;
  }

  isActionLoading.value = true;
  try {
    await withdrawalApi.rejectWithdrawal(selectedWithdrawal.value.id, {
      reason: rejectionReason.value.trim(),
    });

    toastStore.addToast({
      title: "Retiro rechazado",
      message: "La solicitud fue rechazada y los fondos fueron reembolsados a la billetera del cliente.",
      variant: "info",
    });

    showRejectModal.value = false;
    await Promise.all([loadWithdrawalMetrics(), fetchWithdrawals()]);
  } catch (err: any) {
    console.error("[AdminPagos] Error rejecting withdrawal:", err);
    toastStore.addToast({
      title: "Error al rechazar retiro",
      message: err.message || "No se pudo rechazar la solicitud.",
      variant: "error",
    });
  } finally {
    isActionLoading.value = false;
  }
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
    <!-- Header with quick counts -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Gestión de pagos y transferencias
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Concilia depósitos entrantes y procesa solicitudes de extracción bancaria.
        </p>
      </div>

      <!-- Quick counts summary card -->
      <div class="flex items-center gap-4 self-start sm:self-auto bg-white border border-slate-100 rounded-2xl px-5 py-3 shadow-xs shrink-0">
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pendientes</span>
          <span class="text-base font-bold text-[#ea580c]">
            {{ operationType === 'deposits' ? (metrics?.pending ?? 0) : (withdrawalMetrics?.pending ?? 0) }}
          </span>
        </div>
        <div class="h-8 w-px bg-slate-100"></div>
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {{ operationType === 'deposits' ? 'Aprobadas' : 'Completadas' }}
          </span>
          <span class="text-base font-bold text-[#00a896]">
            {{ operationType === 'deposits' ? (metrics?.approved ?? 0) : (withdrawalMetrics?.approved ?? 0) }}
          </span>
        </div>
        <div class="h-8 w-px bg-slate-100"></div>
        <div class="flex flex-col">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
          <span class="text-base font-bold text-[#023859]">
            {{ operationType === 'deposits' ? (metrics?.all ?? 0) : (withdrawalMetrics?.all ?? 0) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Operation Type Switcher (Recargas vs Retiros) -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
      <button
        @click="switchOperationType('deposits')"
        :class="[
          'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
          operationType === 'deposits'
            ? 'bg-[#00a896] text-white shadow-xs'
            : 'text-slate-500 hover:text-[#023859] hover:bg-slate-100'
        ]"
      >
        <i class="fa-solid fa-circle-arrow-down text-xs"></i>
        <span>Recargas (Depósitos)</span>
        <span class="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold" v-if="metrics">
          {{ metrics.all }}
        </span>
      </button>

      <button
        @click="switchOperationType('withdrawals')"
        :class="[
          'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
          operationType === 'withdrawals'
            ? 'bg-[#00a896] text-white shadow-xs'
            : 'text-slate-500 hover:text-[#023859] hover:bg-slate-100'
        ]"
      >
        <i class="fa-solid fa-circle-arrow-up text-xs"></i>
        <span>Retiros (Extracciones)</span>
        <span class="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold" v-if="withdrawalMetrics">
          {{ withdrawalMetrics.all }}
        </span>
      </button>
    </div>

    <!-- Main Card Container -->
    <div class="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xs space-y-6 w-full min-w-0">
      <!-- Tabs Bar with dynamic counts (Reka UI Tabs) -->
      <TabsRoot v-model="activeTab" class="w-full">
        <TabsList class="flex items-center gap-6 border-b border-slate-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger
            v-for="tab in (['Todas', 'Pendientes', 'Aprobadas', 'Rechazadas'] as const)"
            :key="tab"
            :value="tab"
            class="pb-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer outline-none data-[state=active]:border-[#00a896] data-[state=active]:text-[#00a896] data-[state=active]:font-bold data-[state=inactive]:border-transparent data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-800"
          >
            <span>{{ tab }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors',
                activeTab === tab ? 'bg-teal-100/80 text-[#00a896]' : 'bg-slate-100 text-slate-500'
              ]"
            >
              {{ counts[tab] }}
            </span>
          </TabsTrigger>
        </TabsList>
      </TabsRoot>

      <!-- Filters Row: Search input + Bank select (only for deposits) -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <!-- Search Input -->
        <div class="relative flex-1 min-w-0 max-w-md">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="operationType === 'deposits' ? 'Buscar por referencia o ID de solicitud...' : 'Buscar por motivo de rechazo o ID de solicitud...'"
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-[#023859] placeholder-slate-400 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 font-medium transition-all"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <!-- Bank Filter (Deposit mode) -->
        <div v-if="operationType === 'deposits'" class="w-full sm:w-auto shrink-0">
          <SelectRoot v-model="selectedBankId">
            <SelectTrigger
              class="flex h-10 w-full sm:w-64 items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-semibold text-slate-600 outline-none transition-all hover:bg-slate-50 focus:border-[#00a896] focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer"
            >
              <div class="flex items-center gap-2 truncate">
                <i class="fa-solid fa-building-columns text-xs text-slate-400 shrink-0"></i>
                <SelectValue placeholder="Todos los bancos" class="truncate" />
              </div>
              <SelectIcon class="shrink-0 ml-2">
                <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                position="popper"
                :side-offset="4"
                class="z-50 min-w-(--reka-select-trigger-width) max-w-xs overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg animate-in fade-in-80"
              >
                <SelectViewport>
                  <SelectItem
                    value="all"
                    class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition-colors hover:bg-[#e6f7f5] hover:text-[#00a896] cursor-pointer data-[highlighted]:bg-[#e6f7f5] data-[highlighted]:text-[#00a896]"
                  >
                    <SelectItemText>Todos los bancos</SelectItemText>
                    <SelectItemIndicator>
                      <i class="fa-solid fa-check text-xs text-[#00a896]"></i>
                    </SelectItemIndicator>
                  </SelectItem>
                  <SelectItem
                    v-for="b in bankAccounts"
                    :key="b.id"
                    :value="b.id"
                    class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-[#e6f7f5] hover:text-[#00a896] cursor-pointer data-[highlighted]:bg-[#e6f7f5] data-[highlighted]:text-[#00a896]"
                  >
                    <SelectItemText class="truncate">{{ b.bank_name }} ({{ b.account_number }})</SelectItemText>
                    <SelectItemIndicator>
                      <i class="fa-solid fa-check text-xs text-[#00a896]"></i>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#00a896]"></i>
        <span class="text-xs font-medium">Cargando registros...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="operationType === 'deposits' ? solicitudes.length === 0 : withdrawalSolicitudes.length === 0"
        class="py-12 flex flex-col items-center justify-center text-center"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i class="fa-solid fa-receipt text-xl"></i>
        </div>
        <p class="text-sm font-bold text-[#023859]">No hay solicitudes registradas</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          No se encontraron registros para el filtro seleccionado.
        </p>
      </div>

      <!-- Table: Recargas (Deposits) -->
      <div v-else-if="operationType === 'deposits'" class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th class="py-3.5 px-3">ID Solicitud</th>
              <th class="py-3.5 px-3">Usuario</th>
              <th class="py-3.5 px-3">Monto</th>
              <th class="py-3.5 px-3">Banco destino</th>
              <th class="py-3.5 px-3">Referencia</th>
              <th class="py-3.5 px-3">Fecha registro</th>
              <th class="py-3.5 px-3">Estado</th>
              <th class="py-3.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="sol in solicitudes"
              :key="sol.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="py-4 px-3 font-mono text-xs font-bold text-[#023859]">
                {{ sol.id.slice(0, 8) }}...
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#023859]">
                <div class="flex flex-col">
                  <span>{{ sol.user_full_name || "Usuario" }}</span>
                  <span class="text-[10px] text-slate-400 font-normal">{{ sol.user_email }}</span>
                </div>
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#023859]">
                {{ formatCurrency(sol.amount) }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-600 font-medium">
                {{ sol.bank_name }}
              </td>
              <td class="py-4 px-3 text-xs font-mono font-medium text-slate-500">
                {{ sol.reference_code || "Sin referencia" }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-400">
                {{ formatDate(sol.created_at) }}
              </td>
              <td class="py-4 px-3">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', getStatusBadge(sol.status).badgeClass]">
                  {{ getStatusBadge(sol.status).label }}
                </span>
              </td>
              <td class="py-4 px-3 text-right">
                <button
                  @click="goToDetail(sol.id)"
                  class="text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  Revisar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table: Retiros (Withdrawals) -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[720px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th class="py-3.5 px-3">ID Solicitud</th>
              <th class="py-3.5 px-3">Usuario</th>
              <th class="py-3.5 px-3">Monto a Extraer</th>
              <th class="py-3.5 px-3">Banco destino</th>
              <th class="py-3.5 px-3">Cuenta destino</th>
              <th class="py-3.5 px-3">Fecha solicitud</th>
              <th class="py-3.5 px-3">Estado</th>
              <th class="py-3.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="w in withdrawalSolicitudes"
              :key="w.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="py-4 px-3 font-mono text-xs font-bold text-[#023859]">
                {{ w.id.slice(0, 8) }}...
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#023859]">
                <div class="flex flex-col">
                  <span>{{ w.user_full_name || "Usuario" }}</span>
                  <span class="text-[10px] text-slate-400 font-normal">{{ w.user_email }}</span>
                </div>
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#ea580c]">
                {{ formatCurrency(w.amount) }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-700 font-medium">
                {{ w.target_bank_name }}
              </td>
              <td class="py-4 px-3 text-xs font-mono font-medium text-slate-500">
                {{ w.target_account_number }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-400">
                {{ formatDate(w.created_at) }}
              </td>
              <td class="py-4 px-3">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', getStatusBadge(w.status).badgeClass]">
                  {{ getStatusBadge(w.status).label }}
                </span>
              </td>
              <td class="py-4 px-3 text-right">
                <div v-if="w.status === 'pending'" class="flex items-center justify-end gap-2">
                  <template v-if="isAdmin">
                    <button
                      @click="openCompleteModal(w)"
                      class="px-3 py-1 bg-[#00a896] hover:bg-[#009688] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Completar
                    </button>
                    <button
                      @click="openRejectModal(w)"
                      class="px-2.5 py-1 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Rechazar
                    </button>
                  </template>
                  <span v-else class="text-xs text-amber-600 font-medium">Pendiente</span>
                </div>
                <span v-else class="text-xs text-slate-400 italic">Procesada</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls using Reka UI -->
      <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 mt-4">
        <span class="text-xs text-slate-400">
          Mostrando página {{ currentPage }} de {{ totalPages }} ({{ totalItems }} registros)
        </span>

        <PaginationRoot
          v-model:page="currentPage"
          :total="totalItems"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
          @update:page="() => handleFetch()"
        >
          <PaginationList v-slot="{ items }" class="flex items-center gap-1.5">
            <PaginationPrev
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
            >
              <i class="fa-solid fa-chevron-left text-[10px]"></i>
              <span class="hidden sm:inline">Anterior</span>
            </PaginationPrev>

            <template v-for="(pageItem, index) in items">
              <PaginationListItem
                v-if="pageItem.type === 'page'"
                :key="index"
                :value="pageItem.value"
                class="h-8 w-8 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors border data-[selected=true]:border-[#00a896] data-[selected=true]:bg-[#00a896] data-[selected=true]:text-white data-[selected=undefined]:border-slate-200 data-[selected=undefined]:text-slate-600 data-[selected=undefined]:hover:bg-slate-50"
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
              class="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
            >
              <span class="hidden sm:inline">Siguiente</span>
              <i class="fa-solid fa-chevron-right text-[10px]"></i>
            </PaginationNext>
          </PaginationList>
        </PaginationRoot>
      </div>
    </div>

    <!-- Complete Withdrawal Modal -->
    <div
      v-if="isAdmin && showCompleteModal && selectedWithdrawal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
      @click.self="showCompleteModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-serif text-lg font-bold text-[#023859]">
            Completar retiro bancario
          </h3>
          <button @click="showCompleteModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="space-y-2 text-xs">
          <p class="text-slate-500">
            Confirma que la transferencia hacia la cuenta del usuario ha sido ejecutada.
          </p>
          <div class="rounded-xl bg-slate-50 p-3 space-y-1.5 font-medium">
            <div class="flex justify-between">
              <span class="text-slate-400">Usuario:</span>
              <span class="font-bold text-slate-700">{{ selectedWithdrawal.user_full_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Banco:</span>
              <span class="font-bold text-slate-700">{{ selectedWithdrawal.target_bank_name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Cuenta:</span>
              <span class="font-mono text-slate-700">{{ selectedWithdrawal.target_account_number }}</span>
            </div>
            <div class="flex justify-between border-t border-slate-200/60 pt-1">
              <span class="text-slate-400">Monto transferido:</span>
              <span class="font-bold text-[#00a896] text-sm">{{ formatCurrency(selectedWithdrawal.amount) }}</span>
            </div>
          </div>
        </div>

        <form @submit.prevent="handleCompleteWithdrawal" class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-bold text-[#00a896] uppercase tracking-wider">
              Número de referencia / transferencia bancaria *
            </label>
            <input
              v-model="payoutReferenceCode"
              type="text"
              required
              placeholder="Ej: REF-9842148291"
              class="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs text-[#023859] font-mono outline-none focus:border-[#00a896] focus:ring-2 focus:ring-[#00a896]/15"
            />
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              :disabled="isActionLoading"
              @click="showCompleteModal = false"
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isActionLoading"
              class="flex-1 rounded-xl bg-[#00a896] hover:bg-[#009688] py-2.5 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i v-if="isActionLoading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
              <span>{{ isActionLoading ? "Procesando..." : "Confirmar completado" }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reject Withdrawal Modal -->
    <div
      v-if="isAdmin && showRejectModal && selectedWithdrawal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in"
      @click.self="showRejectModal = false"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-serif text-lg font-bold text-red-600">
            Rechazar retiro bancario
          </h3>
          <button @click="showRejectModal = false" class="text-slate-400 hover:text-slate-600 transition-colors p-1 cursor-pointer">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <div class="space-y-2 text-xs">
          <p class="text-slate-600">
            Al rechazar este retiro, los <strong>{{ formatCurrency(selectedWithdrawal.amount) }}</strong> serán reembolsados automáticamente al saldo disponible de la billetera virtual del cliente.
          </p>
        </div>

        <form @submit.prevent="handleRejectWithdrawal" class="space-y-4">
          <div>
            <label class="mb-1.5 block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Motivo del rechazo *
            </label>
            <textarea
              v-model="rejectionReason"
              required
              rows="3"
              placeholder="Indica el motivo (ej: Número de cuenta bancaria inválido o titular no coincide)..."
              class="w-full rounded-xl border border-slate-200 py-2.5 px-3.5 text-xs text-[#023859] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              :disabled="isActionLoading"
              @click="showRejectModal = false"
              class="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isActionLoading"
              class="flex-1 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <i v-if="isActionLoading" class="fa-solid fa-circle-notch fa-spin text-xs"></i>
              <span>{{ isActionLoading ? "Rechazando..." : "Confirmar rechazo" }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
