<script setup lang="ts">
import { ref } from "vue";
const activeTab = ref('recargas');

const transfers = [
  {
    date: "18 sep, 03:20 PM",
    desc: "Recarga registrada",
    bank: "Banco Lafise",
    ref: "1234567",
    amount: "+ C$ 3,000.00",
    status: "Aprobada"
  },
  {
    date: "18 sep, 10:15 AM",
    desc: "Recarga registrada",
    bank: "BAC Credomatic",
    ref: "9876543",
    amount: "+ C$ 1,500.00",
    status: "Aprobada"
  },
  {
    date: "17 sep, 05:25 PM",
    desc: "Recarga registrada",
    bank: "Banco Lafise",
    ref: "1234568",
    amount: "+ C$ 2,000.00",
    status: "Pendiente"
  },
  {
    date: "16 sep, 09:10 AM",
    desc: "Recarga registrada",
    bank: "BAC Credomatic",
    ref: "9876542",
    amount: "+ C$ 5,000.00",
    status: "Aprobada"
  },
  {
    date: "15 sep, 04:30 PM",
    desc: "Recarga registrada",
    bank: "Banco Ficohsa",
    ref: "4567890",
    amount: "+ C$ 1,000.00",
    status: "Rechazada"
  },
  {
    date: "14 sep, 11:15 AM",
    desc: "Recarga registrada",
    bank: "Banco Lafise",
    ref: "1234565",
    amount: "+ C$ 2,500.00",
    status: "Aprobada"
  },
];
</script>

<template>
  <div class="flex-1 min-w-0 bg-white overflow-y-auto flex flex-col">
    <!-- Header Area -->
    <div class="flex items-center justify-between px-8 py-6 border-b border-[#eee] max-md:px-4 shrink-0 bg-white sticky top-0 z-10">
      <div class="flex-1 flex justify-between items-center bg-[#f4f7f9] rounded-full px-4 py-2 mr-4 max-w-lg">
        <div class="flex items-center gap-2 text-[#888] flex-1">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" placeholder="Buscar productos..." class="bg-transparent border-none outline-none text-sm w-full" />
        </div>
      </div>
      <div class="flex items-center gap-4 shrink-0">
        <button class="relative text-[#64748b] hover:text-[#083c5a]">
          <i class="fa-regular fa-bell text-xl"></i>
          <span class="absolute top-0 right-0 w-2 h-2 bg-[#ff6a00] rounded-full"></span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gray-300 overflow-hidden"></div>
          <div class="flex flex-col max-md:hidden">
            <span class="text-xs font-bold text-[#083c5a]">María López</span>
            <span class="text-[0.65rem] text-[#64748b]">Comprador</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="p-8 max-md:p-4 max-w-5xl mx-auto w-full">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-[#083c5a] font-serif mb-1">Transferencias</h1>
        <p class="text-[0.9rem] text-[#64748b]">Historial de movimientos de tu billetera virtual.</p>
      </div>

      <div class="flex gap-4 mb-8">
        <button 
          @click="activeTab = 'recargas'"
          class="px-6 py-2 rounded-lg font-bold text-sm transition-colors"
          :class="activeTab === 'recargas' ? 'bg-[#f97316] text-white shadow-sm' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'"
        >
          Recargas
        </button>
        <button 
          @click="activeTab = 'compras'"
          class="px-6 py-2 rounded-lg font-bold text-sm transition-colors"
          :class="activeTab === 'compras' ? 'bg-[#f97316] text-white shadow-sm' : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]'"
        >
          Compras
        </button>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto w-full mb-8">
        <table class="w-full min-w-[600px] text-left border-collapse">
          <thead>
            <tr class="border-b border-[#eee]">
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/4">Fecha</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/3">Descripción</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-1/4">Monto</th>
              <th class="py-4 px-2 text-[0.8rem] text-[#888] font-semibold w-[15%]">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in transfers" :key="idx" class="border-b border-[#eee] hover:bg-[#f8fafc] transition-colors group">
              <td class="py-5 px-2 text-[0.85rem] text-[#333] font-medium">{{ item.date }}</td>
              <td class="py-5 px-2">
                <div class="flex flex-col">
                  <span class="text-[0.9rem] font-bold text-[#083c5a]">{{ item.desc }}</span>
                  <span class="text-[0.7rem] text-[#888]">{{ item.bank }} • Ref: {{ item.ref }}</span>
                </div>
              </td>
              <td class="py-5 px-2 text-[0.95rem] font-bold text-[#189c94]">{{ item.amount }}</td>
              <td class="py-5 px-2">
                <span class="px-3 py-1 text-[0.7rem] font-bold rounded-full inline-block text-center w-24"
                      :class="{
                        'bg-[#e6f7f5] text-[#189c94]': item.status === 'Aprobada',
                        'bg-[#fff7ed] text-[#f97316]': item.status === 'Pendiente',
                        'bg-[#fef2f2] text-[#ef4444]': item.status === 'Rechazada'
                      }">
                  {{ item.status }}
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
          <span class="text-[#083c5a] text-[0.85rem] font-bold mb-0.5">¿Tienes dudas sobre una transferencia?</span>
          <span class="text-[#64748b] text-xs">Las solicitudes de recarga tardan entre 1 a 24 horas hábiles en ser acreditadas tras la validación bancaria.</span>
        </div>
      </div>
    </div>
  </div>
</template>
