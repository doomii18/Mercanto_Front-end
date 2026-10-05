<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Doughnut } from "vue-chartjs";

ChartJS.register(ArcElement, Tooltip);

export interface CategorySalesItem {
  name: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalAmount?: string;
  }>(),
  {
    period: "Este mes",
    totalAmount: "412,850",
  }
);

// Self-contained mock data (ready for future API fetching)
const categorySales = ref<CategorySalesItem[]>([
  { name: "Automotriz", pct: 39, color: "#023859" },
  { name: "Maquillaje", pct: 22, color: "#00a896" },
  { name: "Ropa",       pct: 18, color: "#f97316" },
  { name: "Mobiliario", pct: 12, color: "#3b82f6" },
  { name: "Calzado",    pct:  9, color: "#a855f7" },
]);

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: categorySales.value.map((c) => c.name),
  datasets: [
    {
      data: categorySales.value.map((c) => c.pct),
      backgroundColor: categorySales.value.map((c) => c.color),
      borderColor: "#ffffff",
      borderWidth: 2,
      hoverOffset: 4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: "#023859",
      padding: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context) => ` ${context.label}: ${context.raw}%`,
      },
    },
  },
}));
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Ventas por categoría</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- Real Chart.js Doughnut Container -->
      <div class="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <!-- Center Text Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-[9px] font-bold text-primary">C$</span>
          <span class="text-[11px] font-extrabold text-primary leading-tight">{{ props.totalAmount }}</span>
        </div>
      </div>

      <!-- Legend matching Mockup -->
      <div class="space-y-2 text-xs flex-1">
        <div
          v-for="cat in categorySales"
          :key="cat.name"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-sm" :style="{ background: cat.color }"></span>
            <span class="text-slate-600 truncate text-[11px]">{{ cat.name }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ cat.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
