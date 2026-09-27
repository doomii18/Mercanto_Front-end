<script setup lang="ts">
const reportesSummary = [
  { title: "Ventas del mes", value: "C$ 485,200.00", icon: "fa-solid fa-chart-line text-[#00a896]", bg: "bg-teal-50" },
  { title: "Usuarios activos", value: "3,248", icon: "fa-solid fa-users text-[#023859]", bg: "bg-slate-100" },
  { title: "Transacciones procesadas", value: "1,420", icon: "fa-solid fa-money-bill-transfer text-[#f97316]", bg: "bg-orange-50" },
];
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
        Reportes del sistema
      </h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Métricas generales de rendimiento de la plataforma Mercanto.
      </p>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        v-for="rep in reportesSummary"
        :key="rep.title"
        class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex items-center gap-4"
      >
        <div :class="['flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl', rep.bg]">
          <i :class="rep.icon"></i>
        </div>
        <div>
          <p class="text-xs text-slate-400 font-medium">{{ rep.title }}</p>
          <p class="font-serif text-xl font-bold text-[#023859]">{{ rep.value }}</p>
        </div>
      </div>
    </div>

    <!-- Export Section Card -->
    <div class="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs space-y-4">
      <h3 class="font-serif text-lg font-bold text-[#023859]">
        Descargar reportes ejecutivos
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#00a896] hover:bg-teal-50/40 transition-all text-left">
          <div>
            <p class="text-xs font-bold text-[#023859]">Reporte mensual de recargas</p>
            <p class="text-[11px] text-slate-400">PDF • Formato oficial</p>
          </div>
          <i class="fa-solid fa-download text-[#00a896] text-sm"></i>
        </button>
        <button class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#00a896] hover:bg-teal-50/40 transition-all text-left">
          <div>
            <p class="text-xs font-bold text-[#023859]">Consolidado de ventas por proveedor</p>
            <p class="text-[11px] text-slate-400">EXCEL • Formato XLS</p>
          </div>
          <i class="fa-solid fa-download text-[#00a896] text-sm"></i>
        </button>
        <button class="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#00a896] hover:bg-teal-50/40 transition-all text-left">
          <div>
            <p class="text-xs font-bold text-[#023859]">Auditoría de usuarios activos</p>
            <p class="text-[11px] text-slate-400">CSV • Exportación de datos</p>
          </div>
          <i class="fa-solid fa-download text-[#00a896] text-sm"></i>
        </button>
      </div>
    </div>
  </div>
</template>
