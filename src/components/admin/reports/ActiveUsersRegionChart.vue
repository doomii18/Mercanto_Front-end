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

export interface RegionActiveUserItemUI {
  name: string;
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
const totalUsersFormatted = ref("0");
const regionData = ref<RegionActiveUserItemUI[]>([]);

const PALETTE = ["#023859", "#00a896", "#f97316", "#a855f7", "#3b82f6", "#eab308"];

const chartData = computed<ChartData<"doughnut">>(() => {
  if (regionData.value.length === 0) {
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
  };
});

const chartOptions = computed<ChartOptions<"doughnut">>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "66%",
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: regionData.value.length > 0,
      backgroundColor: "#023859",
      padding: 8,
      titleFont: { size: 11, weight: "bold" },
      bodyFont: { size: 11 },
      callbacks: {
        label: (context) => {
          const item = regionData.value[context.dataIndex];
          return item ? ` ${item.name}: ${item.pct}% (${item.count.toLocaleString("es-NI")} usuarios)` : "";
        },
      },
    },
  },
}));

async function loadRegionUsers() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getRegionUsers({
      start_time: props.startDate,
      end_time: props.endDate,
    });

    totalUsersFormatted.value = data.total_active_users.toLocaleString("es-NI");

    regionData.value = data.regions.map((r, idx) => ({
      name: r.region || "N/A",
      count: r.user_count,
      pct: Math.round(r.percentage),
      color: PALETTE[idx % PALETTE.length],
    }));
  } catch (err) {
    console.error("Failed to load region users:", err);
    hasError.value = true;
    totalUsersFormatted.value = "N/A";
    regionData.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadRegionUsers();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Usuarios activos por región</h3>
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
          <span class="text-base font-extrabold text-primary leading-none">{{ totalUsersFormatted }}</span>
          <span class="text-[9px] font-semibold text-slate-400 mt-0.5">usuarios</span>
        </div>
      </div>

      <!-- Legend -->
      <div class="space-y-2 flex-1 text-xs">
        <template v-if="regionData.length > 0">
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
        </template>
        <template v-else>
          <p class="text-[11px] text-slate-400 italic">No hay datos regionales disponibles</p>
        </template>
      </div>
    </div>
  </div>
</template>
