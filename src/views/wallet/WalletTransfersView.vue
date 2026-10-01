<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/walletStore";
import type { LedgerEntryResponse } from "@/api/modules/wallet/types";

const router = useRouter();
const walletStore = useWalletStore();
const activeTab = ref<"todas" | "recargas" | "compras">("todas");
const searchQuery = ref("");

onMounted(async () => {
  await Promise.all([
    walletStore.fetchWallet(),
    walletStore.fetchLedger({ limit: 50, offset: 0 }),
  ]);
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

function getTransactionMeta(entry: LedgerEntryResponse) {
  switch (entry.kind) {
    case "deposit":
      return {
        title: "Acreditación de saldo",
        subtitle: entry.reference_notes || "Depósito a billetera virtual",
        amountStr: `+ ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-arrow-down-left",
        amountClass: "text-[#189c94]",
        status: "Aprobada",
        statusClass: "bg-[#e6f7f5] text-[#189c94]",
        category: "recargas",
      };
    case "payment":
      return {
        title: "Pago de orden",
        subtitle:
          entry.reference_notes ||
          (entry.quote_id
            ? `Cotización #${entry.quote_id.slice(0, 8)}`
            : "Pago de orden"),
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-cart-shopping",
        amountClass: "text-[#ef4444]",
        status: "Completada",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
        category: "compras",
      };
    case "withdrawal":
      return {
        title: "Retiro / Débito",
        subtitle: entry.reference_notes || "Débito registrado",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-arrow-up-right",
        amountClass: "text-[#ef4444]",
        status: "Debitado",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
        category: "compras",
      };
    case "refund":
      return {
        title: "Reembolso",
        subtitle:
          entry.reference_notes ||
          (entry.quote_id
            ? `Reembolso de orden #${entry.quote_id.slice(0, 8)}`
            : "Reembolso acreditado"),
        amountStr: `+ ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-rotate-left",
        amountClass: "text-[#189c94]",
        status: "Reembolsado",
        statusClass: "bg-[#e6f7f5] text-[#189c94]",
        category: "recargas",
      };
    case "commission":
      return {
        title: "Comisión de plataforma",
        subtitle: entry.reference_notes || "Comisión de servicio",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-receipt",
        amountClass: "text-[#f59e0b]",
        status: "Comisión",
        statusClass: "bg-[#fffbeb] text-[#f59e0b]",
        category: "compras",
      };
    default:
      return {
        title: "Movimiento",
        subtitle: entry.reference_notes || "Operación registrada",
        amountStr: formatCurrency(entry.amount),
        icon: "fa-solid fa-wallet",
        amountClass: "text-[#083c5a]",
        status: "Registrada",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
        category: "todas",
      };
  }
}

const filteredEntries = computed(() => {
  let list = walletStore.ledgerEntries || [];

  if (activeTab.value === "recargas") {
    list = list.filter((e) => e.kind === "deposit" || e.kind === "refund");
  } else if (activeTab.value === "compras") {
    list = list.filter(
      (e) =>
        e.kind === "payment" || e.kind === "withdrawal" || e.kind === "commission"
    );
  }

  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return list;

  return list.filter((entry) => {
    const meta = getTransactionMeta(entry);
    return (
      meta.title.toLowerCase().includes(query) ||
      meta.subtitle.toLowerCase().includes(query) ||
      meta.status.toLowerCase().includes(query) ||
      entry.amount.toString().includes(query) ||
      entry.id.toLowerCase().includes(query)
    );
  });
});
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto flex flex-col">
    <!-- Content -->
    <div class="p-8 max-md:p-4 max-w-5xl mx-auto w-full">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="text-slate-400 hover:text-[#083c5a] transition-colors p-1"
              title="Volver a mi billetera"
              @click="router.push({ name: 'wallet' })"
            >
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Transferencias</h1>
          </div>
          <p class="text-[0.9rem] text-[#64748b]">Historial completo de movimientos de tu billetera virtual.</p>
        </div>

        <div class="flex items-center gap-2 bg-[#f4f7f9] rounded-full px-4 py-2 border border-slate-200 text-sm w-full sm:w-72">
          <i class="fa-solid fa-magnifying-glass text-[#888]"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar transferencias..."
            class="bg-transparent border-none outline-none text-sm w-full text-[#083c5a] placeholder:text-[#888]"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="text-[#888] hover:text-[#083c5a] text-xs"
            @click="searchQuery = ''"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div class="flex gap-3 mb-8 flex-wrap">
        <button 
          @click="activeTab = 'todas'"
          class="px-5 py-2 rounded-lg font-bold text-sm transition-colors"
          :class="activeTab === 'todas' ? 'bg-[#083c5a] text-white shadow-sm' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'"
        >
          Todas
        </button>
        <button 
          @click="activeTab = 'recargas'"
          class="px-5 py-2 rounded-lg font-bold text-sm transition-colors"
          :class="activeTab === 'recargas' ? 'bg-[#f97316] text-white shadow-sm' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'"
        >
          Acreditaciones
        </button>
        <button 
          @click="activeTab = 'compras'"
          class="px-5 py-2 rounded-lg font-bold text-sm transition-colors"
          :class="activeTab === 'compras' ? 'bg-[#f97316] text-white shadow-sm' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'"
        >
          Pagos y Débitos
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="walletStore.isLedgerLoading && (walletStore.ledgerEntries || []).length === 0" class="py-12 flex justify-center items-center text-slate-400 gap-2">
        <i class="fa-solid fa-spinner fa-spin text-xl text-[#189c94]"></i>
        <span class="text-sm">Cargando transferencias...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredEntries.length === 0"
        class="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 mb-8"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <h4 class="font-bold text-slate-700 text-sm mb-1">
          {{ searchQuery ? "No se encontraron resultados" : "Sin movimientos registrados" }}
        </h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          {{
            searchQuery
              ? `No hay transferencias que coincidan con "${searchQuery}".`
              : "No se encontraron movimientos registrados en esta categoría."
          }}
        </p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto w-full mb-8">
        <table class="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eee]">
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/4">Tipo</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/3">Detalle</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/4">Monto</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-[15%]">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filteredEntries"
              :key="item.id"
              class="border-b border-[#eee] hover:bg-[#f8fafc] transition-colors group"
            >
              <td class="py-5 px-2">
                <span class="text-[0.85rem] text-[#333] font-semibold">
                  {{ getTransactionMeta(item).title }}
                </span>
              </td>
              <td class="py-5 px-2">
                <div class="flex flex-col">
                  <span class="text-[0.85rem] text-[#083c5a] font-medium">
                    {{ getTransactionMeta(item).subtitle }}
                  </span>
                  <span class="text-[0.7rem] text-[#888] font-mono">
                    ID: {{ item.id.slice(0, 13) }}...
                  </span>
                </div>
              </td>
              <td
                class="py-5 px-2 text-[0.95rem] font-bold"
                :class="getTransactionMeta(item).amountClass"
              >
                {{ getTransactionMeta(item).amountStr }}
              </td>
              <td class="py-5 px-2">
                <span
                  class="px-3 py-1 text-[0.7rem] font-bold rounded-full inline-block text-center w-24"
                  :class="getTransactionMeta(item).statusClass"
                >
                  {{ getTransactionMeta(item).status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Info alert -->
      <div class="bg-[#f4f7f9] border border-[#e2e8f0] rounded-xl p-4 flex gap-3 items-start">
        <i class="fa-solid fa-circle-info text-[#189c94] mt-0.5"></i>
        <div class="flex flex-col">
          <span class="text-[#083c5a] text-[0.85rem] font-bold mb-0.5">Transacciones registradas en el libro mayor</span>
          <span class="text-[#64748b] text-xs">
            Cada movimiento de tu billetera queda registrado de forma inmutable y con verificación de saldo en el servidor.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
