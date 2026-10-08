<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Doughnut } from "vue-chartjs";
import { useAnalyticsApi } from "@/api/modules/analytics/useAnalyticsApi";

ChartJS.register(ArcElement, Tooltip);

export interface CategorySalesItemUI {
  name: string;
  pct: number;
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
const totalAmountFormatted = ref("N/A");
const categorySales = ref<CategorySalesItemUI[]>([]);

const PALETTE = [
  "#023859",
  "#00a896",
  "#f97316",
  "#3b82f6",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#14b8a6",
];

const chartData = computed<ChartData<"doughnut">>(() => {
  if (categorySales.value.length === 0) {
    return {
      labels: ["Sin datos"],
      datasets: [
        {
          data: [100],
          backgroundColor: ["#e2e8f0"],
          borderColor: ["#ffffff"],
          borderWidth: 2,
        },
      ],
    };
  }

  return {
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
  };
});

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: categorySales.value.length > 0,
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

async function loadCategorySales() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getCategorySales({
      start_time: props.startDate,
      end_time: props.endDate,
    });

    totalAmountFormatted.value = data.period_total_amount.toLocaleString("es-NI", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    categorySales.value = data.categories.map((cat, idx) => ({
      name: cat.category_name || "N/A",
      pct: Math.round(cat.percentage),
      color: PALETTE[idx % PALETTE.length],
    }));
  } catch (err) {
    console.error("Failed to load category sales:", err);
    hasError.value = true;
    totalAmountFormatted.value = "N/A";
    categorySales.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadCategorySales();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Ventas por categoría</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="flex items-center gap-4 animate-pulse">
      <div class="w-[130px] h-[130px] rounded-full bg-slate-100 shrink-0"></div>
      <div class="space-y-2 flex-1">
        <div v-for="i in 4" :key="i" class="h-3 bg-slate-100 rounded w-full"></div>
      </div>
    </div>

    <!-- Chart & Legend -->
    <div v-else class="flex items-center gap-4">
      <div class="relative w-[130px] h-[130px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-[9px] font-bold text-primary">C$</span>
          <span class="text-[11px] font-extrabold text-primary leading-tight">{{ totalAmountFormatted }}</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="space-y-2 text-xs flex-1">
        <template v-if="categorySales.length > 0">
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
        </template>
        <template v-else>
          <p class="text-[11px] text-slate-400 italic">No hay ventas registradas</p>
        </template>
      </div>
    </div>
  </div>
</template>
