<script setup lang="ts">
import { ref, computed } from "vue";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Bar } from "vue-chartjs";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export interface BankRechargeItem {
  bank: string;
  amount: string;
  value: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
  }>(),
  {
    period: "Este mes",
  }
);

// Self-contained mock data (ready for future API fetching)
const bankData = ref<BankRechargeItem[]>([
  { bank: "BDF",     amount: "C$2.3M", value: 100, color: "#023859" },
  { bank: "BAC",     amount: "C$1.8M", value:  78, color: "#00a896" },
  { bank: "Bangro",  amount: "C$900K", value:  39, color: "#f97316" },
  { bank: "LAFISE",  amount: "C$720K", value:  31, color: "#3b82f6" },
  { bank: "Ficohsa", amount: "C$540K", value:  23, color: "#a855f7" },
]);

const chartData = computed<ChartData<"bar">>(() => ({
  labels: bankData.value.map((b) => b.bank),
  datasets: [
    {
      data: bankData.value.map((b) => b.value),
      backgroundColor: bankData.value.map((b) => b.color),
      borderRadius: {
        topLeft: 6,
        topRight: 6,
      },
      borderSkipped: false,
      maxBarThickness: 42,
    },
  ],
}));

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
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
        label: (context) => {
          const item = bankData.value[context.dataIndex];
          return ` Monto: ${item.amount}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: "#64748b",
        font: {
          size: 10,
          weight: "bold",
        },
      },
    },
    y: {
      display: false,
      beginAtZero: true,
      suggestedMax: 110,
    },
  },
}));
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Recargas por banco</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Amount Badges on Top of Columns -->
    <div class="grid grid-cols-5 gap-2 text-center pt-2">
      <span
        v-for="b in bankData"
        :key="b.bank"
        class="text-[10px] font-bold text-slate-600 truncate"
      >
        {{ b.amount }}
      </span>
    </div>

    <!-- Real Chart.js Bar Chart -->
    <div class="h-32 w-full">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>
