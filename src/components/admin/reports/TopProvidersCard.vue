<script setup lang="ts">
import { ref } from "vue";

export interface TopProviderItem {
  rank: number;
  name: string;
  category: string;
  sales: string;
  orders: number;
  rankColor: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
  }>(),
  {
    period: "Este mes",
  }
);

// Self-contained mock data (ready to fetch from API)
const topProviders = ref<TopProviderItem[]>([
  { rank: 1, name: "Distribuidora Comisigo S.A.", category: "Alimentos",          sales: "C$ 82,450", orders: 86, rankColor: "bg-[#023859] text-white" },
  { rank: 2, name: "Licores Castillo",             category: "Bebidas",            sales: "C$ 62,300", orders: 54, rankColor: "bg-[#00a896] text-white" },
  { rank: 3, name: "Importaciones Olam C.A.",      category: "Higiene y limpieza", sales: "C$ 38,900", orders: 39, rankColor: "bg-[#f97316] text-white" },
  { rank: 4, name: "Importaciones Olam C.A.",      category: "Higiene y limpieza", sales: "C$ 38,900", orders: 39, rankColor: "bg-slate-300 text-slate-700" },
]);
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Top 5 proveedores por ventas</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="text-[10px] font-semibold text-slate-400 grid grid-cols-12 gap-2 px-1">
      <span class="col-span-1">#</span>
      <span class="col-span-6">Proveedor</span>
      <span class="col-span-3 text-right">Ventas (C$)</span>
      <span class="col-span-2 text-right">Pedidos</span>
    </div>

    <div class="space-y-2">
      <div
        v-for="prov in topProviders"
        :key="prov.rank"
        class="grid grid-cols-12 gap-2 items-center px-1 py-2 rounded-xl hover:bg-slate-50/70 transition-colors"
      >
        <div class="col-span-1">
          <span
            :class="['flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', prov.rankColor]"
          >
            {{ prov.rank }}
          </span>
        </div>

        <div class="col-span-6 min-w-0">
          <p class="text-xs font-bold text-slate-800 truncate leading-tight">{{ prov.name }}</p>
          <p class="text-[10px] text-slate-400 truncate">{{ prov.category }}</p>
        </div>

        <p class="col-span-3 text-right text-xs font-bold text-primary">{{ prov.sales }}</p>
        <p class="col-span-2 text-right text-xs font-semibold text-slate-500">{{ prov.orders }}</p>
      </div>
    </div>
  </div>
</template>
