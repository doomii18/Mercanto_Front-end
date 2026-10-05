<script setup lang="ts">
export interface KpiItem {
  label: string;
  period: string;
  value: string;
  change: string;
  changeLabel: string;
  positive: boolean;
}

const props = withDefaults(
  defineProps<{
    stats?: KpiItem[];
  }>(),
  {
    stats: () => [
      {
        label: "Ventas totales",
        period: "Este mes",
        value: "C$ 412,850",
        change: "+8%",
        changeLabel: "vs. mes anterior",
        positive: true,
      },
      {
        label: "Pedidos totales",
        period: "Este mes",
        value: "1,245",
        change: "+5%",
        changeLabel: "vs. mes anterior",
        positive: true,
      },
      {
        label: "Proveedores activos",
        period: "Este mes",
        value: "24",
        change: "+10%",
        changeLabel: "vs. mes anterior",
        positive: true,
      },
      {
        label: "Compradores activos",
        period: "Este mes",
        value: "537",
        change: "-3%",
        changeLabel: "vs. mes anterior",
        positive: false,
      },
      {
        label: "Comisiones (2.5)",
        period: "Este mes",
        value: "C$ 10,821",
        change: "+8%",
        changeLabel: "vs. mes anterior",
        positive: true,
      },
    ],
  }
);
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    <div
      v-for="kpi in props.stats"
      :key="kpi.label"
      class="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs space-y-1"
    >
      <div class="flex items-start justify-between">
        <p class="text-[11px] font-medium text-slate-500 leading-tight">{{ kpi.label }}</p>
        <span class="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{{ kpi.period }}</span>
      </div>
      <p class="text-lg sm:text-xl font-bold text-primary leading-tight">{{ kpi.value }}</p>
      <div
        class="flex items-center gap-1 text-[11px] font-semibold"
        :class="kpi.positive ? 'text-accent' : 'text-red-500'"
      >
        <i
          :class="kpi.positive ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"
          class="text-[10px]"
        ></i>
        <span>{{ kpi.change }} {{ kpi.changeLabel }}</span>
      </div>
    </div>
  </div>
</template>
