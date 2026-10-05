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

export interface ProviderPaymentItem {
  label: string;
  pct: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    totalProviders?: string;
  }>(),
  {
    period: "Este mes",
    totalProviders: "24",
  }
);

// Self-contained mock data (ready for future API fetching)
const paymentStatus = ref<ProviderPaymentItem[]>([
  { label: "Pagados",   pct: 54, color: "#023859" },
  { label: "Por Pagar", pct: 29, color: "#f97316" },
]);

// Include empty remainder segment (100 - 54 - 29 = 17%) to render the open arc from the mockup
const remainderPct = computed(() => {
  const sum = paymentStatus.value.reduce((acc, curr) => acc + curr.pct, 0);
  return Math.max(0, 100 - sum);
});

const chartData = computed<ChartData<"doughnut">>(() => ({
  labels: [...paymentStatus.value.map((p) => p.label), "Restante"],
  datasets: [
    {
      data: [...paymentStatus.value.map((p) => p.pct), remainderPct.value],
      backgroundColor: [...paymentStatus.value.map((p) => p.color), "transparent"],
      borderColor: [...paymentStatus.value.map(() => "#ffffff"), "transparent"],
      borderWidth: 2,
      hoverOffset: 4,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  rotation: -90,
  circumference: 360,
  cutout: "66%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      filter: (tooltipItem) => tooltipItem.dataIndex < paymentStatus.value.length,
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
      <h3 class="text-sm font-bold text-slate-800">Estado de pagos a proveedores</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <div class="flex items-center gap-4">
      <!-- Real Chart.js Doughnut Container -->
      <div class="relative w-[120px] h-[120px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <!-- Center Text Overlay -->
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-base font-extrabold text-primary leading-none">{{ props.totalProviders }}</span>
          <span class="text-[8px] font-semibold text-slate-400 mt-0.5">Proveedores</span>
        </div>
      </div>

      <!-- Legend matching Mockup -->
      <div class="space-y-2.5 flex-1 text-xs">
        <div
          v-for="pay in paymentStatus"
          :key="pay.label"
          class="flex items-center justify-between gap-2"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ background: pay.color }"></span>
            <span class="text-slate-600 text-[11px] truncate">{{ pay.label }}</span>
          </div>
          <span class="font-bold text-slate-700 text-[11px] shrink-0">{{ pay.pct }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
