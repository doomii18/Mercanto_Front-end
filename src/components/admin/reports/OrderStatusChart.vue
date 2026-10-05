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

export interface OrderStatusItem {
  label: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalOrders?: string;
  }>(),
  {
    period: "Este mes",
    totalOrders: "1.245",
  }
);

// Self-contained mock data (ready for future API fetching)
const orderStatus = ref<OrderStatusItem[]>([
  { label: "Entregados", pct: 72, color: "#023859" },
  { label: "En camino",  pct: 14, color: "#00a896" },
  { label: "Cancelados", pct:  9, color: "#f97316" },
  { label: "Pendientes", pct:  5, color: "#e11d48" },
]);

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: orderStatus.value.map((o) => o.label),
  datasets: [
    {
      data: orderStatus.value.map((o) => o.pct),
      backgroundColor: orderStatus.value.map((o) => o.color),
      borderColor: "#ffffff",
      borderWidth: 2,
      hoverOffset: 4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "64%",
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
      <h3 class="text-sm font-bold text-slate-800">Estado de pedidos</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- Real Chart.js Doughnut Container -->
      <div class="relative w-[140px] h-[140px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <!-- Center Text Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-base font-extrabold text-primary leading-none">{{ props.totalOrders }}</span>
          <span class="text-[9px] font-semibold text-slate-400 mt-0.5">pedidos</span>
        </div>
      </div>

      <!-- Legend matching Mockup -->
      <div class="space-y-2.5 flex-1 text-xs">
        <div
          v-for="ord in orderStatus"
          :key="ord.label"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: ord.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ ord.label }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ ord.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
