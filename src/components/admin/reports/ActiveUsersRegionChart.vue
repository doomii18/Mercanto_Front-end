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

export interface RegionActiveUserItem {
  name: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalUsers?: string;
  }>(),
  {
    period: "Este mes",
    totalUsers: "561",
  }
);

// Self-contained mock data (ready for future API fetching)
const regionData = ref<RegionActiveUserItem[]>([
  { name: "Pacífico",  pct: 38, color: "#023859" },
  { name: "Norte",     pct: 32, color: "#00a896" },
  { name: "Centro",    pct: 17, color: "#f97316" },
  { name: "Atlántico", pct: 13, color: "#a855f7" },
]);

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: regionData.value.map((r) => r.name),
  datasets: [
    {
      data: regionData.value.map((r) => r.pct),
      backgroundColor: regionData.value.map((r) => r.color),
      borderColor: "#ffffff",
      borderWidth: 2,
      hoverOffset: 4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "66%",
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
      <h3 class="text-sm font-bold text-slate-800">Usuarios activos por región</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- Real Chart.js Doughnut Container -->
      <div class="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <!-- Center Text Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-base font-extrabold text-primary leading-none">{{ props.totalUsers }}</span>
          <span class="text-[9px] font-semibold text-slate-400 mt-0.5">usuarios</span>
        </div>
      </div>

      <!-- Legend matching Mockup -->
      <div class="space-y-2 flex-1 text-xs">
        <div
          v-for="region in regionData"
          :key="region.name"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: region.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ region.name }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ region.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
