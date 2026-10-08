<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAnalyticsApi } from "@/api/modules/analytics/useAnalyticsApi";

export interface TopProviderItemUI {
  rank: number;
  name: string;
  category: string;
  sales: string;
  orders: number;
  rankColor: string;
}

const props = withDefaults(
  defineProps<{
    period?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }>(),
  {
    period: "Este mes",
    limit: 5,
  }
);

const analyticsApi = useAnalyticsApi();
const isLoading = ref(false);
const hasError = ref(false);
const topProviders = ref<TopProviderItemUI[]>([]);

function getRankBadgeClass(rank: number): string {
  switch (rank) {
    case 1:
      return "bg-[#023859] text-white";
    case 2:
      return "bg-[#00a896] text-white";
    case 3:
      return "bg-[#f97316] text-white";
    default:
      return "bg-slate-300 text-slate-700";
  }
}

async function loadTopProviders() {
  isLoading.value = true;
  hasError.value = false;
  try {
    const data = await analyticsApi.getTopProviders({
      start_time: props.startDate,
      end_time: props.endDate,
      limit: props.limit,
    });

    topProviders.value = data.providers.map((prov) => ({
      rank: prov.rank,
      name: prov.name || "N/A",
      category: prov.main_category || "N/A",
      sales: `C$ ${prov.total_sales.toLocaleString("es-NI", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
      orders: prov.order_count,
      rankColor: getRankBadgeClass(prov.rank),
    }));
  } catch (err) {
    console.error("Failed to load top providers:", err);
    hasError.value = true;
    topProviders.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTopProviders();
});
</script>

<template>
  <div class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-800">Top {{ props.limit }} proveedores por ventas</h3>
      <span class="text-[11px] font-semibold text-slate-400">{{ props.period }}</span>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="isLoading" class="space-y-3 animate-pulse pt-2">
      <div v-for="i in 4" :key="i" class="h-8 bg-slate-100 rounded-xl w-full"></div>
    </div>

    <template v-else>
      <template v-if="topProviders.length > 0">
        <div class="text-[10px] font-semibold text-slate-400 grid grid-cols-12 gap-2 px-1">
          <span class="col-span-1">#</span>
          <span class="col-span-6">Proveedor</span>
          <span class="col-span-3 text-right">Ventas (C$)</span>
          <span class="col-span-2 text-right">Pedidos</span>
        </div>

        <div class="space-y-2">
          <div
            v-for="prov in topProviders"
            :key="prov.rank"
            class="grid grid-cols-12 gap-2 items-center px-1 py-2 rounded-xl hover:bg-slate-50/70 transition-colors"
          >
            <div class="col-span-1">
              <span
                :class="['flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', prov.rankColor]"
              >
                {{ prov.rank }}
              </span>
            </div>

            <div class="col-span-6 min-w-0">
              <p class="text-xs font-bold text-slate-800 truncate leading-tight">{{ prov.name }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ prov.category }}</p>
            </div>

            <p class="col-span-3 text-right text-xs font-bold text-primary">{{ prov.sales }}</p>
            <p class="col-span-2 text-right text-xs font-semibold text-slate-500">{{ prov.orders }}</p>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="h-32 flex items-center justify-center text-xs text-slate-400 italic">
        No hay datos de proveedores en este período
      </div>
    </template>
  </div>
</template>
