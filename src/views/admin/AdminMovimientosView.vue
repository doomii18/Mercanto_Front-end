<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWalletApi } from "@/api/modules/wallet/wallet/useWalletApi";
import type { VirtualWalletResponse, LedgerEntryResponse } from "@/api";
import { TabsRoot, TabsList, TabsTrigger } from "reka-ui";

const route = useRoute();
const router = useRouter();
const walletApi = useWalletApi();

const walletIdInput = ref<string>((route.query.wallet_id as string) || "");
const wallet = ref<VirtualWalletResponse | null>(null);
const ledgerEntries = ref<LedgerEntryResponse[]>([]);
const totalEntries = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

type FilterTab = "Todos" | "Recargas" | "Compras" | "Retiros";
const activeTab = ref<FilterTab>("Todos");

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

function getEntryMeta(entry: LedgerEntryResponse) {
  switch (entry.kind) {
    case "deposit":
      return {
        label: "Recarga / Depósito",
        desc: entry.reference_notes || "Depósito bancario acreditado",
        amountStr: `+ ${formatCurrency(entry.amount)}`,
        amountClass: "text-[#00a896]",
        dotClass: "bg-[#00a896]",
        badgeClass: "bg-teal-100/70 text-[#00a896]",
        status: "Acreditado",
        category: "Recargas",
      };
    case "payment":
      return {
        label: "Pago de orden",
        desc: entry.reference_notes || (entry.quote_id ? `Cotización #${entry.quote_id.slice(0, 8)}` : "Pago de orden comercial"),
        amountStr: `- ${formatCurrency(entry.amount)}`,
        amountClass: "text-[#f97316]",
        dotClass: "bg-[#f97316]",
        badgeClass: "bg-orange-100/70 text-[#ea580c]",
        status: "Completado",
        category: "Compras",
      };
    case "withdrawal":
      return {
        label: "Retiro / Extracción",
        desc: entry.reference_notes || "Extracción a cuenta bancaria",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        amountClass: "text-[#d97706]",
        dotClass: "bg-[#d97706]",
        badgeClass: "bg-amber-100/70 text-[#d97706]",
        status: "Debitado",
        category: "Retiros",
      };
    case "refund":
      return {
        label: "Reembolso",
        desc: entry.reference_notes || "Reembolso acreditado",
        amountStr: `+ ${formatCurrency(entry.amount)}`,
        amountClass: "text-[#0284c7]",
        dotClass: "bg-[#0284c7]",
        badgeClass: "bg-sky-100/70 text-[#0284c7]",
        status: "Reembolsado",
        category: "Recargas",
      };
    case "commission":
      return {
        label: "Comisión",
        desc: entry.reference_notes || "Comisión de plataforma",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        amountClass: "text-[#9333ea]",
        dotClass: "bg-[#9333ea]",
        badgeClass: "bg-purple-100/70 text-[#9333ea]",
        status: "Comisión",
        category: "Compras",
      };
    default:
      return {
        label: "Operación",
        desc: entry.reference_notes || "Movimiento registrado",
        amountStr: formatCurrency(entry.amount),
        amountClass: "text-[#023859]",
        dotClass: "bg-slate-400",
        badgeClass: "bg-slate-100 text-slate-600",
        status: "Registrado",
        category: "Todos",
      };
  }
}

const filteredMovimientos = computed(() => {
  if (activeTab.value === "Todos") return ledgerEntries.value;
  return ledgerEntries.value.filter((entry) => getEntryMeta(entry).category === activeTab.value);
});

async function loadData() {
  isLoading.value = true;
  error.value = null;

  try {
    const id = walletIdInput.value.trim();
    if (id) {
      const [walletRes, ledgerRes] = await Promise.all([
        walletApi.getWallet(id),
        walletApi.getWalletLedger(id, { limit: 50, offset: 0 }),
      ]);
      wallet.value = walletRes;
      ledgerEntries.value = ledgerRes.data;
      totalEntries.value = ledgerRes.total;
    } else {
      // Fallback: load current session wallet
      const [walletRes, ledgerRes] = await Promise.all([
        walletApi.getMyWallet(),
        walletApi.getMyWalletLedger({ limit: 50, offset: 0 }),
      ]);
      wallet.value = walletRes;
      ledgerEntries.value = ledgerRes.data;
      totalEntries.value = ledgerRes.total;
      walletIdInput.value = walletRes.id;
    }
  } catch (err: any) {
    console.error("[AdminMovimientos] Error loading wallet:", err);
    error.value = err.message || "No se pudo cargar la billetera o sus movimientos.";
    wallet.value = null;
    ledgerEntries.value = [];
  } finally {
    isLoading.value = false;
  }
}

function handleSearch() {
  if (walletIdInput.value) {
    router.replace({ query: { wallet_id: walletIdInput.value } });
  } else {
    router.replace({ query: {} });
  }
  loadData();
}

onMounted(() => {
  loadData();
});

watch(
  () => route.query.wallet_id,
  (newId) => {
    if (newId !== walletIdInput.value) {
      walletIdInput.value = (newId as string) || "";
      loadData();
    }
  }
);
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 w-full min-w-0">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Auditoría de movimientos de billetera
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Consulta en tiempo real el libro mayor inmutable y saldo de cualquier usuario.
        </p>
      </div>

      <!-- Wallet Search / Lookup Input -->
      <form @submit.prevent="handleSearch" class="flex items-center gap-2 max-w-md w-full sm:w-auto">
        <div class="relative flex-1 sm:w-80">
          <i class="fa-solid fa-wallet absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            v-model="walletIdInput"
            type="text"
            placeholder="Buscar por ID de billetera (UUID)..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-[#023859] font-mono outline-none focus:border-[#00a896] focus:ring-2 focus:ring-[#00a896]/15"
          />
        </div>
        <button
          type="submit"
          class="rounded-xl bg-[#00a896] hover:bg-[#009688] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer shrink-0"
        >
          Consultar
        </button>
      </form>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-exclamation text-red-500"></i>
        <span>{{ error }}</span>
      </div>
      <button @click="loadData" class="font-bold underline hover:text-red-900 cursor-pointer">
        Reintentar
      </button>
    </div>

    <!-- User & Wallet Header Card -->
    <div v-if="wallet" class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="h-14 w-14 rounded-2xl bg-teal-50 text-[#00a896] flex items-center justify-center text-xl shrink-0">
          <i class="fa-solid fa-wallet"></i>
        </div>
        <div class="space-y-1">
          <h3 class="font-serif text-lg font-bold text-[#023859]">
            Billetera Virtual
          </h3>
          <p class="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span class="font-mono text-[11px] text-slate-600 font-semibold">ID Billetera: {{ wallet.id }}</span>
            <span>•</span>
            <span class="text-slate-500">Última actualización: {{ formatDate(wallet.updated_at) }}</span>
            <span>•</span>
            <span class="font-semibold text-slate-600">Moneda: NIO (C$)</span>
          </p>
        </div>
      </div>

      <!-- Right Side: Saldo Disponible -->
      <div class="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Saldo Disponible en Libro Mayor
        </p>
        <p class="font-serif text-2xl font-bold text-[#00a896] leading-tight">
          {{ formatCurrency(wallet.balance) }}
        </p>
      </div>
    </div>

    <!-- Main Card containing Tabs & Table -->
    <div class="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xs space-y-6">
      <!-- Tabs using Reka UI -->
      <TabsRoot v-model="activeTab" class="w-full">
        <TabsList class="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsTrigger
            v-for="tab in (['Todos', 'Recargas', 'Compras', 'Retiros'] as const)"
            :key="tab"
            :value="tab"
            class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer outline-none data-[state=active]:bg-[#00a896] data-[state=active]:text-white data-[state=active]:shadow-xs data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50 data-[state=inactive]:hover:text-[#023859]"
          >
            {{ tab }}
          </TabsTrigger>
        </TabsList>
      </TabsRoot>

      <!-- Loading State -->
      <div v-if="isLoading" class="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
        <i class="fa-solid fa-circle-notch fa-spin text-2xl text-[#00a896]"></i>
        <span class="text-xs font-medium">Cargando libro mayor inmutable...</span>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredMovimientos.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          <i class="fa-solid fa-clock-rotate-left text-xl"></i>
        </div>
        <p class="text-sm font-bold text-[#023859]">No hay movimientos registrados</p>
        <p class="text-xs text-slate-400 mt-1 max-w-sm">
          No existen transacciones en el libro mayor para el filtro seleccionado.
        </p>
      </div>

      <!-- Table Container -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[640px]">
          <thead>
            <tr class="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              <th class="py-3 px-3">ID Registro</th>
              <th class="py-3 px-3">Tipo</th>
              <th class="py-3 px-3">Descripción / Referencia</th>
              <th class="py-3 px-3">Monto</th>
              <th class="py-3 px-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="entry in filteredMovimientos"
              :key="entry.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="py-4 px-3 text-xs font-mono font-bold text-[#023859]">
                {{ entry.id.slice(0, 8) }}...
              </td>
              <td class="py-4 px-3">
                <div class="flex items-center gap-2">
                  <span :class="['h-2 w-2 rounded-full inline-block shrink-0', getEntryMeta(entry).dotClass]"></span>
                  <span class="font-bold text-xs text-[#023859]">{{ getEntryMeta(entry).label }}</span>
                </div>
              </td>
              <td class="py-4 px-3 text-xs text-slate-600 font-medium">
                {{ getEntryMeta(entry).desc }}
              </td>
              <td :class="['py-4 px-3 font-bold text-xs', getEntryMeta(entry).amountClass]">
                {{ getEntryMeta(entry).amountStr }}
              </td>
              <td class="py-4 px-3 text-right">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', getEntryMeta(entry).badgeClass]">
                  {{ getEntryMeta(entry).status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
