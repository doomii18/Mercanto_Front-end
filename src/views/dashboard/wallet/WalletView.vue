<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useWalletStore } from "@/stores/wallet";
import type { LedgerEntryResponse } from "@/api";

const router = useRouter();
const walletStore = useWalletStore();
const searchQuery = ref("");

onMounted(async () => {
  await Promise.all([
    walletStore.fetchWallet(),
    walletStore.fetchLedger({ limit: 20, offset: 0 }),
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
        subtitle: entry.reference_notes || "Depósito acreditado a tu billetera",
        amountStr: `+ ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-circle-arrow-down",
        iconClass: "bg-[#e6f7f5] text-[#189c94]",
        amountClass: "text-[#189c94]",
        status: "Aprobada",
        statusClass: "bg-[#e6f7f5] text-[#189c94]",
      };
    case "payment":
      return {
        title: "Pago de orden",
        subtitle:
          entry.reference_notes ||
          (entry.quote_id
            ? `Cotización #${entry.quote_id.slice(0, 8)}`
            : "Pago de pedido"),
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-cart-shopping",
        iconClass: "bg-[#fef2f2] text-[#ef4444]",
        amountClass: "text-[#ef4444]",
        status: "Completada",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
      };
    case "withdrawal":
      return {
        title: "Débito de cuenta",
        subtitle: entry.reference_notes || "Retiro o débito realizado",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-circle-arrow-up",
        iconClass: "bg-[#fffbeb] text-[#d97706]",
        amountClass: "text-[#d97706]",
        status: "Debitado",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
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
        iconClass: "bg-[#f0f9ff] text-[#0284c7]",
        amountClass: "text-[#0284c7]",
        status: "Reembolsado",
        statusClass: "bg-[#f0f9ff] text-[#0284c7]",
      };
    case "commission":
      return {
        title: "Comisión de plataforma",
        subtitle: entry.reference_notes || "Comisión por transacción",
        amountStr: `- ${formatCurrency(entry.amount)}`,
        icon: "fa-solid fa-receipt",
        iconClass: "bg-[#faf5ff] text-[#9333ea]",
        amountClass: "text-[#9333ea]",
        status: "Comisión",
        statusClass: "bg-[#faf5ff] text-[#9333ea]",
      };
    default:
      return {
        title: "Movimiento",
        subtitle: entry.reference_notes || "Transacción registrada",
        amountStr: formatCurrency(entry.amount),
        icon: "fa-solid fa-wallet",
        iconClass: "bg-[#f1f5f9] text-[#64748b]",
        amountClass: "text-[#083c5a]",
        status: "Registrada",
        statusClass: "bg-[#f1f5f9] text-[#64748b]",
      };
  }
}

const filteredLedgerEntries = computed(() => {
  const entries = walletStore.ledgerEntries || [];
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return entries;

  return entries.filter((entry) => {
    const meta = getTransactionMeta(entry);
    return (
      meta.title.toLowerCase().includes(query) ||
      meta.subtitle.toLowerCase().includes(query) ||
      meta.status.toLowerCase().includes(query) ||
      entry.amount.toString().includes(query) ||
      entry.kind.toLowerCase().includes(query)
    );
  });
});

const handleRefresh = async () => {
  await Promise.all([
    walletStore.fetchWallet(),
    walletStore.fetchLedger({ limit: 20, offset: 0 }),
  ]);
};
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto">
    <div class="p-8 max-md:p-4 max-w-5xl mx-auto">
      <!-- Title & Search Bar Area -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Mi billetera</h1>
            <button
              type="button"
              class="text-slate-400 hover:text-[#189c94] transition-colors p-1"
              title="Actualizar datos"
              :disabled="walletStore.isLoading"
              @click="handleRefresh"
            >
              <i
                class="fa-solid fa-arrows-rotate text-sm"
                :class="{ 'animate-spin': walletStore.isLoading || walletStore.isLedgerLoading }"
              ></i>
            </button>
          </div>
          <p class="text-[0.9rem] text-[#64748b]">Tu saldo disponible para realizar compras en Mercanto.</p>
        </div>

        <!-- Relocated Search Bar -->
        <div class="flex items-center gap-2 bg-[#f4f7f9] rounded-full px-4 py-2 border border-slate-200 text-sm w-full sm:w-72">
          <i class="fa-solid fa-magnifying-glass text-[#888]"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar movimientos..."
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

      <!-- Error alert banner if any -->
      <div
        v-if="walletStore.error"
        class="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-circle-exclamation text-red-500"></i>
          <span>{{ walletStore.error }}</span>
        </div>
        <button
          type="button"
          class="underline font-semibold hover:text-red-900"
          @click="handleRefresh"
        >
          Reintentar
        </button>
      </div>

      <!-- Main Wallet Card -->
      <div class="bg-[#189c94] rounded-[1.25rem] p-6 text-white mb-8 shadow-md">
        <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i class="fa-solid fa-wallet"></i>
            </div>
            <div>
              <span class="text-sm opacity-90 block">Saldo disponible</span>
              <span v-if="walletStore.isLoading && !walletStore.wallet" class="text-3xl font-bold opacity-75 animate-pulse">
                Cargando...
              </span>
              <span v-else class="text-3xl font-bold">
                {{ walletStore.formattedBalance }}
              </span>
            </div>
          </div>
          <button
            @click="router.push({ name: 'wallet-recharge' })"
            class="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <span>+</span> Recargar saldo
          </button>
        </div>

        <div class="bg-white rounded-xl flex items-center justify-between shadow-sm overflow-hidden text-[#083c5a]">
          <button
            @click="router.push({ name: 'wallet-recharge' })"
            class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors border-r border-[#eee]"
          >
            <i class="fa-solid fa-arrow-down text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Recargar</span>
          </button>
          <button
            @click="router.push({ name: 'wallet-transfers' })"
            class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors border-r border-[#eee]"
          >
            <i class="fa-solid fa-arrow-right-arrow-left text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Transferencias</span>
          </button>
          <button
            @click="router.push({ name: 'products' })"
            class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors"
          >
            <i class="fa-solid fa-cart-shopping text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Comprar</span>
          </button>
        </div>
      </div>

      <!-- Movements -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-[1.1rem] font-bold text-[#083c5a] font-serif">Últimos movimientos</h3>
        <button
          v-if="(walletStore.ledgerEntries || []).length > 0"
          @click="router.push({ name: 'wallet-transfers' })"
          class="text-[#189c94] text-sm font-semibold hover:underline"
        >
          Ver todos
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="walletStore.isLedgerLoading && (walletStore.ledgerEntries || []).length === 0" class="py-12 flex justify-center items-center text-slate-400 gap-2">
        <i class="fa-solid fa-spinner fa-spin text-xl text-[#189c94]"></i>
        <span class="text-sm">Cargando movimientos de la billetera...</span>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredLedgerEntries.length === 0"
        class="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 mb-8"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
          <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <h4 class="font-bold text-slate-700 text-sm mb-1">
          {{ searchQuery ? "No se encontraron movimientos" : "Sin movimientos registrados" }}
        </h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          {{
            searchQuery
              ? `No hay transacciones que coincidan con "${searchQuery}".`
              : "Aún no tienes transacciones en tu billetera. Cuando pagues cotizaciones o recibas fondos, aparecerán registrados aquí automáticamente."
          }}
        </p>
      </div>

      <!-- Transactions List -->
      <div v-else class="flex flex-col gap-3 mb-8">
        <div
          v-for="entry in filteredLedgerEntries"
          :key="entry.id"
          class="flex items-center justify-between bg-white border border-[#eee] rounded-xl p-4 hover:shadow-sm transition-shadow"
        >
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="getTransactionMeta(entry).iconClass"
            >
              <i :class="getTransactionMeta(entry).icon"></i>
            </div>
            <div class="flex flex-col">
              <span class="text-[0.95rem] font-bold text-[#083c5a]">
                {{ getTransactionMeta(entry).title }}
              </span>
              <span class="text-xs text-[#64748b]">
                {{ getTransactionMeta(entry).subtitle }}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <span
              class="font-bold whitespace-nowrap"
              :class="getTransactionMeta(entry).amountClass"
            >
              {{ getTransactionMeta(entry).amountStr }}
            </span>
            <div
              class="px-2.5 py-1 text-[0.7rem] font-semibold rounded-md hidden sm:block"
              :class="getTransactionMeta(entry).statusClass"
            >
              {{ getTransactionMeta(entry).status }}
            </div>
          </div>
        </div>
      </div>

      <!-- Info alert -->
      <div class="bg-[#f4f7f9] border border-[#e2e8f0] rounded-xl p-4 flex gap-3 items-start">
        <i class="fa-solid fa-circle-info text-[#189c94] mt-0.5"></i>
        <div class="flex flex-col">
          <span class="text-[#083c5a] text-[0.85rem] font-bold mb-0.5">¿Cómo funciona tu billetera virtual?</span>
          <span class="text-[#64748b] text-xs">
            Tu saldo disponible está respaldado en tiempo real por el sistema. Al aceptar y pagar una cotización, los fondos se descuentan automáticamente de tu saldo.
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
