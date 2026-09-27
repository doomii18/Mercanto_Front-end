<script setup lang="ts">
import { ref, computed } from "vue";

const activeTab = ref<"Todos" | "Recargas" | "Compras">("Todos");

const movimientos = [
  {
    fechaHora: "17 Sep 2026, 03:10 PM",
    tipo: "Recarga",
    descripcion: "Recarga de saldo vía depósito bancario",
    monto: "+ C$ 1,500.00",
    montoClass: "text-[#00a896]",
    tipoDotClass: "bg-[#00a896]",
    estado: "Aprobada",
    badgeClass: "bg-teal-100/70 text-[#00a896]",
  },
  {
    fechaHora: "16 Sep 2026, 04:45 PM",
    tipo: "Compra",
    descripcion: "Compra de lote de abarrotes - Proveedor Don Wendy",
    monto: "- C$ 2,450.00",
    montoClass: "text-[#f97316]",
    tipoDotClass: "bg-[#f97316]",
    estado: "Completada",
    badgeClass: "bg-teal-100/70 text-[#00a896]",
  },
  {
    fechaHora: "15 Sep 2026, 11:20 AM",
    tipo: "Recarga",
    descripcion: "Recarga de saldo vía depósito bancario",
    monto: "+ C$ 3,000.00",
    montoClass: "text-[#00a896]",
    tipoDotClass: "bg-[#00a896]",
    estado: "Aprobada",
    badgeClass: "bg-teal-100/70 text-[#00a896]",
  },
  {
    fechaHora: "10 Sep 2026, 02:15 PM",
    tipo: "Compra",
    descripcion: "Compra de envases plásticos - Distribuidora del Norte",
    monto: "- C$ 1,200.00",
    montoClass: "text-[#f97316]",
    tipoDotClass: "bg-[#f97316]",
    estado: "Completada",
    badgeClass: "bg-teal-100/70 text-[#00a896]",
  },
];

const filteredMovimientos = computed(() => {
  if (activeTab.value === "Todos") return movimientos;
  if (activeTab.value === "Recargas") return movimientos.filter(m => m.tipo === "Recarga");
  if (activeTab.value === "Compras") return movimientos.filter(m => m.tipo === "Compra");
  return movimientos;
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Page Header -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
        Movimientos del usuario
      </h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Consulta el registro histórico de recargas, compras y reembolsos.
      </p>
    </div>

    <!-- User Header Card -->
    <div class="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img
          src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
          alt="María López Vasquez"
          class="h-14 w-14 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
        />
        <div class="space-y-0.5">
          <h3 class="font-serif text-lg font-bold text-[#023859]">
            María López Vasquez
          </h3>
          <p class="text-xs text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>maria.lopez@gmail.com</span>
            <span>•</span>
            <span>Registro: 12 Jun 2026</span>
            <span>•</span>
            <span class="font-semibold text-slate-600">Estado: Activa</span>
          </p>
        </div>
      </div>

      <!-- Right Side: Saldo Disponible -->
      <div class="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
        <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Saldo Disponible
        </p>
        <p class="font-serif text-2xl font-bold text-[#00a896] leading-tight">
          C$ 4,500.00
        </p>
      </div>
    </div>

    <!-- Main Card containing Tabs & Table -->
    <div class="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xs space-y-6">
      <!-- Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-100 pb-4">
        <button
          v-for="tab in (['Todos', 'Recargas', 'Compras'] as const)"
          :key="tab"
          @click="activeTab = tab"
          :class="[
            'px-5 py-2 rounded-xl text-xs font-bold transition-all',
            activeTab === tab
              ? 'bg-[#00a896] text-white shadow-xs'
              : 'text-slate-500 hover:text-[#023859] hover:bg-slate-50'
          ]"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[640px]">
          <thead>
            <tr class="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
              <th class="py-3 px-3">Fecha y Hora</th>
              <th class="py-3 px-3">Tipo</th>
              <th class="py-3 px-3">Descripción</th>
              <th class="py-3 px-3">Monto</th>
              <th class="py-3 px-3 text-right">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(mov, idx) in filteredMovimientos"
              :key="idx"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="py-4 px-3 text-xs text-slate-400">
                {{ mov.fechaHora }}
              </td>
              <td class="py-4 px-3">
                <div class="flex items-center gap-2">
                  <span :class="['h-2 w-2 rounded-full inline-block shrink-0', mov.tipoDotClass]"></span>
                  <span class="font-bold text-xs text-[#023859]">{{ mov.tipo }}</span>
                </div>
              </td>
              <td class="py-4 px-3 text-xs text-slate-600 font-medium">
                {{ mov.descripcion }}
              </td>
              <td :class="['py-4 px-3 font-bold text-xs', mov.montoClass]">
                {{ mov.monto }}
              </td>
              <td class="py-4 px-3 text-right">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', mov.badgeClass]">
                  {{ mov.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
