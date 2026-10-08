<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
import { useAnalyticsApi } from "@/api/modules/analytics/useAnalyticsApi";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

export interface BankRechargeItemUI {
  bank: string;
  amount: string;
  value: number;
  color: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    startDate?: string;
    endDate?: string;
  }>(),
  {
    period: "Este mes",
  }
);

const analyticsApi = useAnalyticsApi();
const isLoading = ref(false);
const hasError = ref(false);
const bankData = ref<BankRechargeItemUI[]>([]);

const PALETTE = ["#023859", "#00a896", "#f97316", "#3b82f6", "#a855f7", "#64748b"];

function formatCompactCurrency(val: number): string {
  if (val >= 1_000_000) {
    return `C$${(val / 1_000_000).toFixed(1)}M`;
  }
  if (val >= 1_000) {
    return `C$${(val / 1_000).toFixed(0)}K`;
  }
  return `C$${val.toFixed(0)}`;
}

const chartData = computed<ChartData<"bar">>(() => {
  if (bankData.value.length === 0) {
    return {
      labels: ["Sin datos"],
      datasets: [
        {
          data: [0],
          backgroundColor: ["#e2e8f0"],
        },
      ],
    };
  }

  return {
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
  };
});

const chartOptions = computed<ChartOptions<"bar">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: bankData.value.length > 0,
      backgroundColor: "#023859",
      padding: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context) => {
          const item = bankData.value[context.dataIndex];
          return item ? ` Monto: ${item.amount}` : "";
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
    },
  },
}));

async function loadBankRecharges() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getBankRecharges({
      start_time: props.startDate,
      end_time: props.endDate,
    });

    bankData.value = data.banks.map((b, idx) => ({
      bank: b.bank_name || "N/A",
      amount: formatCompactCurrency(b.total_amount),
      value: b.total_amount,
      color: PALETTE[idx % PALETTE.length],
    }));
  } catch (err) {
    console.error("Failed to load bank recharges:", err);
    hasError.value = true;
    bankData.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadBankRecharges();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Recargas por banco</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="h-40 flex items-end gap-2 p-2 animate-pulse">
      <div v-for="i in 5" :key="i" class="flex-1 bg-slate-100 rounded-t-md" :style="{ height: `${20 + i * 15}%` }"></div>
    </div>

    <!-- Real Content -->
    <template v-else>
      <template v-if="bankData.length > 0">
        <!-- Amount Badges on Top of Columns -->
        <div class="grid gap-2 text-center pt-2" :style="{ gridTemplateColumns: `repeat(${bankData.length}, minmax(0, 1fr))` }">
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
      </template>

      <!-- Empty State -->
      <div v-else class="h-36 flex items-center justify-center text-xs text-slate-400 italic">
        No hay recargas bancarias registradas en este período
      </div>
    </template>
  </div>
</template>
