<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const transactions = ref([
  {
    dateGroup: "Hoy",
    items: [
      {
        title: "Recarga aprobada",
        subtitle: "Banco A • 17 sep, 03:20 PM",
        amount: "+ C$ 3,000.00",
        status: "Aprobada",
        type: "recharge",
      },
      {
        title: "Compra",
        subtitle: "Proveedor Don Carlos • 17 sep, 02:40 PM",
        amount: "- C$ 2,450.00",
        status: "Completada",
        type: "purchase",
      },
      {
        title: "Recarga aprobada",
        subtitle: "Banco B • 17 sep, 10:15 AM",
        amount: "+ C$ 1,500.00",
        status: "Aprobada",
        type: "recharge",
      },
    ]
  },
  {
    dateGroup: "18 de septiembre de 2026",
    items: [
      {
        title: "Recarga aprobada",
        subtitle: "Banco A • 18 sep, 03:20 PM",
        amount: "+ C$ 3,000.00",
        status: "Aprobada",
        type: "recharge",
      },
      {
        title: "Compra",
        subtitle: "Proveedor Don Carlos • 18 sep, 02:40 PM",
        amount: "- C$ 2,450.00",
        status: "Completada",
        type: "purchase",
      },
      {
        title: "Recarga aprobada",
        subtitle: "Banco B • 18 sep, 10:15 AM",
        amount: "+ C$ 1,500.00",
        status: "Aprobada",
        type: "recharge",
      },
    ]
  }
]);

</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto">
    <!-- Header Area -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-[#eee] max-md:px-4 shrink-0 bg-white sticky top-0 z-10">
      <div class="flex-1 flex justify-between items-center bg-[#f4f7f9] rounded-full px-4 py-2 mr-4 max-w-lg">
        <div class="flex items-center gap-2 text-[#888] flex-1">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Buscar productos, proveedores..." class="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0">
        <button class="relative text-[#64748b] hover:text-[#083c5a]">
          <i class="fa-regular fa-bell text-xl"></i>
          <span class="absolute top-0 right-0 w-2 h-2 bg-[#ff6a00] rounded-full"></span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden">
            <!-- avatar img -->
          </div>
          <div class="flex flex-col max-md:hidden">
            <span class="text-xs font-bold text-[#083c5a]">María López</span>
            <span class="text-[0.65rem] text-[#64748b]">Comprador</span>
          </div>
        </div>
      </div>
    </div>

    <div class="p-8 max-md:p-4 max-w-5xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Mi billetera</h1>
        <p class="text-[0.9rem] text-[#64748b]">Tu saldo disponible para realizar compras en Mercanto.</p>
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
              <span class="text-3xl font-bold">C$ 4,500.00</span>
            </div>
          </div>
          <button @click="router.push({ name: 'wallet-recharge' })" class="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm flex items-center gap-2">
            <span>+</span> Recargar saldo
          </button>
        </div>

        <div class="bg-white rounded-xl flex items-center justify-between shadow-sm overflow-hidden text-[#083c5a]">
          <button @click="router.push({ name: 'wallet-recharge' })" class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors border-r border-[#eee]">
            <i class="fa-solid fa-arrow-down text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Recargar</span>
          </button>
          <button @click="router.push({ name: 'wallet-transfers' })" class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors border-r border-[#eee]">
            <i class="fa-solid fa-arrow-right-arrow-left text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Transferencias</span>
          </button>
          <button class="flex-1 py-4 flex flex-col items-center gap-1.5 hover:bg-[#f8fafc] transition-colors">
            <i class="fa-solid fa-cart-shopping text-[#189c94] text-lg"></i>
            <span class="text-sm font-semibold">Comprar</span>
          </button>
        </div>
      </div>

      <!-- Movements -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-[1.1rem] font-bold text-[#083c5a] font-serif">Últimos movimientos</h3>
        <button @click="router.push({ name: 'wallet-transfers' })" class="text-[#189c94] text-sm font-semibold hover:underline">Ver todos</button>
      </div>

      <div class="flex flex-col gap-6 mb-8">
        <div v-for="(group, gIdx) in transactions" :key="gIdx">
          <h4 class="text-sm font-bold text-[#64748b] mb-3">{{ group.dateGroup }}</h4>
          <div class="flex flex-col gap-3">
            <div v-for="(item, idx) in group.items" :key="idx" class="flex items-center justify-between bg-white border border-[#eee] rounded-xl p-4 hover:shadow-sm transition-shadow">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" :class="item.type === 'recharge' ? 'bg-[#e6f7f5] text-[#189c94]' : 'bg-[#fef2f2] text-[#ef4444]'">
                  <i v-if="item.type === 'recharge'" class="fa-solid fa-arrow-down-left"></i>
                  <i v-else class="fa-solid fa-cart-shopping"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-[0.95rem] font-bold text-[#083c5a]">{{ item.title }}</span>
                  <span class="text-xs text-[#64748b]">{{ item.subtitle }}</span>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <span class="font-bold whitespace-nowrap" :class="item.type === 'recharge' ? 'text-[#189c94]' : 'text-[#ef4444]'">{{ item.amount }}</span>
                <div class="px-2.5 py-1 text-[0.7rem] font-semibold rounded-md hidden sm:block"
                     :class="item.status === 'Aprobada' ? 'bg-[#e6f7f5] text-[#189c94]' : 'bg-[#f1f5f9] text-[#64748b]'">
                  {{ item.status }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info alert -->
      <div class="bg-[#f4f7f9] border border-[#e2e8f0] rounded-xl p-4 flex gap-3 items-start">
        <i class="fa-solid fa-circle-info text-[#189c94] mt-0.5"></i>
        <div class="flex flex-col">
          <span class="text-[#083c5a] text-[0.85rem] font-bold mb-0.5">¿Cómo funciona tu billetera?</span>
          <span class="text-[#64748b] text-xs">Realizá un depósito bancario, regístralo y realizá compras de forma inmediata.</span>
        </div>
      </div>
    </div>
  </div>
</template>
