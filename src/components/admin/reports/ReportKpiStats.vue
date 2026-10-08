<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAnalyticsApi } from "@/api/modules/analytics/useAnalyticsApi";
import type { KpiReportMetrics } from "@/api/modules/analytics/types.d";

export interface KpiItem {
  label: string;
  period: string;
  value: string;
  change: string;
  changeLabel: string;
  positive: boolean;
}

const props = defineProps<{
  stats?: KpiItem[];
  startDate?: string;
  endDate?: string;
}>();

const analyticsApi = useAnalyticsApi();
const isLoading = ref(false);
const hasError = ref(false);
const liveStats = ref<KpiItem[]>([]);

function formatCurrency(amount: number): string {
  return `C$ ${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCount(count: number): string {
  return count.toLocaleString("es-NI");
}

function formatChange(changePct: number): string {
  const prefix = changePct > 0 ? "+" : "";
  return `${prefix}${changePct}%`;
}

function mapMetricsToKpis(metrics: KpiReportMetrics): KpiItem[] {
  return [
    {
      label: "Ventas totales",
      period: "Este período",
      value: formatCurrency(metrics.sales.current_value),
      change: formatChange(metrics.sales.percentage_change),
      changeLabel: "vs. período ant.",
      positive: metrics.sales.is_positive,
    },
    {
      label: "Pedidos totales",
      period: "Este período",
      value: formatCount(metrics.orders.current_value),
      change: formatChange(metrics.orders.percentage_change),
      changeLabel: "vs. período ant.",
      positive: metrics.orders.is_positive,
    },
    {
      label: "Proveedores activos",
      period: "Este período",
      value: formatCount(metrics.active_providers.current_value),
      change: formatChange(metrics.active_providers.percentage_change),
      changeLabel: "vs. período ant.",
      positive: metrics.active_providers.is_positive,
    },
    {
      label: "Compradores activos",
      period: "Este período",
      value: formatCount(metrics.active_buyers.current_value),
      change: formatChange(metrics.active_buyers.percentage_change),
      changeLabel: "vs. período ant.",
      positive: metrics.active_buyers.is_positive,
    },
    {
      label: "Comisiones",
      period: "Este período",
      value: formatCurrency(metrics.commissions.current_value),
      change: formatChange(metrics.commissions.percentage_change),
      changeLabel: "vs. período ant.",
      positive: metrics.commissions.is_positive,
    },
  ];
}

async function loadKpiData() {
  if (props.stats && props.stats.length > 0) {
    liveStats.value = props.stats;
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getKpiMetrics({
      start_time: props.startDate,
      end_time: props.endDate,
    });
    liveStats.value = mapMetricsToKpis(data);
  } catch (err) {
    console.error("Failed to load KPI stats:", err);
    hasError.value = true;
    liveStats.value = [
      { label: "Ventas totales", period: "N/A", value: "N/A", change: "0%", changeLabel: "vs. ant.", positive: true },
      { label: "Pedidos totales", period: "N/A", value: "N/A", change: "0%", changeLabel: "vs. ant.", positive: true },
      { label: "Proveedores activos", period: "N/A", value: "N/A", change: "0%", changeLabel: "vs. ant.", positive: true },
      { label: "Compradores activos", period: "N/A", value: "N/A", change: "0%", changeLabel: "vs. ant.", positive: true },
      { label: "Comisiones", period: "N/A", value: "N/A", change: "0%", changeLabel: "vs. ant.", positive: true },
    ];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadKpiData();
});
</script>

<template>
  <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    <!-- Skeleton loader -->
    <template v-if="isLoading && liveStats.length === 0">
      <div
        v-for="i in 5"
        :key="i"
        class="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs space-y-2 animate-pulse"
      >
        <div class="h-3 bg-slate-100 rounded w-2/3"></div>
        <div class="h-6 bg-slate-100 rounded w-1/2"></div>
        <div class="h-3 bg-slate-100 rounded w-3/4"></div>
      </div>
    </template>

    <!-- Real / Loaded KPIs -->
    <template v-else>
      <div
        v-for="kpi in liveStats"
        :key="kpi.label"
        class="rounded-2xl border border-slate-100 bg-white p-4 shadow-2xs space-y-1"
      >
        <div class="flex items-start justify-between">
          <p class="text-[11px] font-medium text-slate-500 leading-tight">{{ kpi.label }}</p>
          <span class="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{{ kpi.period }}</span>
        </div>
        <p class="text-lg sm:text-xl font-bold text-primary leading-tight">{{ kpi.value }}</p>
        <div
          class="flex items-center gap-1 text-[11px] font-semibold"
          :class="kpi.positive ? 'text-accent' : 'text-red-500'"
        >
          <i
            :class="kpi.positive ? 'fa-solid fa-arrow-trend-up' : 'fa-solid fa-arrow-trend-down'"
            class="text-[10px]"
          ></i>
          <span>{{ kpi.change }} {{ kpi.changeLabel }}</span>
        </div>
      </div>
    </template>
  </div>
</template>
