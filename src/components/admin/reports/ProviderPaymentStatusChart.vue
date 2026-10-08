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

export interface ProviderPaymentItemUI {
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
const totalRequestsFormatted = ref("0");
const paymentStatus = ref<ProviderPaymentItemUI[]>([]);

const PALETTE = ["#023859", "#f97316", "#e11d48", "#00a896", "#8b5cf6"];

function getPaymentColor(label: string, idx: number): string {
  const lower = label.toLowerCase();
  if (lower.includes("pagad") || lower.includes("completad")) {
    return "#023859";
  }
  if (lower.includes("por pagar") || lower.includes("pendient")) {
    return "#f97316";
  }
  if (lower.includes("rechaz") || lower.includes("cancel")) {
    return "#e11d48";
  }
  return PALETTE[idx % PALETTE.length];
}

const remainderPct = computed(() => {
  const sum = paymentStatus.value.reduce((acc, curr) => acc + curr.pct, 0);
  return Math.max(0, 100 - sum);
});

const chartData = computed<ChartData<"doughnut">>(() => {
  if (paymentStatus.value.length === 0) {
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

  const hasRemainder = remainderPct.value > 0;
  return {
    labels: [
      ...paymentStatus.value.map((p) => p.label),
      ...(hasRemainder ? ["Restante"] : []),
    ],
    datasets: [
      {
        data: [
          ...paymentStatus.value.map((p) => p.pct),
          ...(hasRemainder ? [remainderPct.value] : []),
        ],
        backgroundColor: [
          ...paymentStatus.value.map((p) => p.color),
          ...(hasRemainder ? ["transparent"] : []),
        ],
        borderColor: [
          ...paymentStatus.value.map(() => "#ffffff"),
          ...(hasRemainder ? ["transparent"] : []),
        ],
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };
});

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
      enabled: paymentStatus.value.length > 0,
      filter: (tooltipItem) => tooltipItem.dataIndex < paymentStatus.value.length,
      backgroundColor: "#023859",
      padding: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context) => {
          const item = paymentStatus.value[context.dataIndex];
          return item ? ` ${item.label}: ${item.pct}% (${item.count} solicitudes)` : "";
        },
      },
    },
  },
}));

async function loadPaymentStatus() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getProviderPayouts({
      start_time: props.startDate,
      end_time: props.endDate,
    });

    const totalCount = data.items.reduce((sum, item) => sum + item.request_count, 0);
    totalRequestsFormatted.value = totalCount.toLocaleString("es-NI");

    paymentStatus.value = data.items.map((item, idx) => ({
      label: item.label || "N/A",
      count: item.request_count,
      pct: Math.round(item.percentage),
      color: getPaymentColor(item.label, idx),
    }));
  } catch (err) {
    console.error("Failed to load provider payout status:", err);
    hasError.value = true;
    totalRequestsFormatted.value = "N/A";
    paymentStatus.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadPaymentStatus();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Estado de pagos a proveedores</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="flex items-center gap-4 animate-pulse">
      <div class="w-[120px] h-[120px] rounded-full bg-slate-100 shrink-0"></div>
      <div class="space-y-2.5 flex-1">
        <div v-for="i in 3" :key="i" class="h-3 bg-slate-100 rounded w-full"></div>
      </div>
    </div>

    <!-- Chart & Legend -->
    <div v-else class="flex items-center gap-4">
      <div class="relative w-[120px] h-[120px] flex items-center justify-center shrink-0">
        <Doughnut :data="chartData" :options="chartOptions" />
        <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span class="text-base font-extrabold text-primary leading-none">{{ totalRequestsFormatted }}</span>
          <span class="text-[8px] font-semibold text-slate-400 mt-0.5">Solicitudes</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="space-y-2.5 flex-1 text-xs">
        <template v-if="paymentStatus.length > 0">
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
        </template>
        <template v-else>
          <p class="text-[11px] text-slate-400 italic">No hay solicitudes de pago registradas</p>
        </template>
      </div>
    </div>
  </div>
</template>
