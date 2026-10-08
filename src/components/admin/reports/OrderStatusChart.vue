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

export interface OrderStatusItemUI {
  label: string;
  count: number;
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
const totalOrdersFormatted = ref("0");
const orderStatus = ref<OrderStatusItemUI[]>([]);

const PALETTE = ["#023859", "#00a896", "#f97316", "#e11d48", "#8b5cf6", "#64748b"];

function getStatusColor(statusGroup: string, idx: number): string {
  const lower = statusGroup.toLowerCase();
  if (lower.includes("entreg") || lower.includes("cumplid") || lower.includes("completad")) {
    return "#023859";
  }
  if (lower.includes("camino") || lower.includes("aceptad")) {
    return "#00a896";
  }
  if (lower.includes("pendient") || lower.includes("borrador")) {
    return "#f97316";
  }
  if (lower.includes("cancel") || lower.includes("rechaz")) {
    return "#e11d48";
  }
  return PALETTE[idx % PALETTE.length];
}

const chartData = computed<ChartData<"doughnut">>(() => {
  if (orderStatus.value.length === 0) {
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
  };
});

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "64%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: orderStatus.value.length > 0,
      backgroundColor: "#023859",
      padding: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context) => {
          const item = orderStatus.value[context.dataIndex];
          return item ? ` ${item.label}: ${item.pct}% (${item.count.toLocaleString("es-NI")} pedidos)` : "";
        },
      },
    },
  },
}));

async function loadOrderStatus() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getOrderStatusDistribution({
      start_time: props.startDate,
      end_time: props.endDate,
    });

    totalOrdersFormatted.value = data.total_orders.toLocaleString("es-NI");

    orderStatus.value = data.breakdown.map((item, idx) => ({
      label: item.status_group || "N/A",
      count: item.order_count,
      pct: Math.round(item.percentage),
      color: getStatusColor(item.status_group, idx),
    }));
  } catch (err) {
    console.error("Failed to load order status breakdown:", err);
    hasError.value = true;
    totalOrdersFormatted.value = "N/A";
    orderStatus.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadOrderStatus();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Estado de pedidos</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="flex items-center gap-4 animate-pulse">
      <div class="w-[140px] h-[140px] rounded-full bg-slate-100 shrink-0"></div>
      <div class="space-y-2.5 flex-1">
        <div v-for="i in 4" :key="i" class="h-3 bg-slate-100 rounded w-full"></div>
      </div>
    </div>

    <!-- Chart & Legend -->
    <div v-else class="flex items-center gap-4">
      <div class="relative w-[140px] h-[140px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-base font-extrabold text-primary leading-none">{{ totalOrdersFormatted }}</span>
          <span class="text-[9px] font-semibold text-slate-400 mt-0.5">pedidos</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="space-y-2.5 flex-1 text-xs">
        <template v-if="orderStatus.length > 0">
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
        </template>
        <template v-else>
          <p class="text-[11px] text-slate-400 italic">No hay pedidos registrados</p>
        </template>
      </div>
    </div>
  </div>
</template>
