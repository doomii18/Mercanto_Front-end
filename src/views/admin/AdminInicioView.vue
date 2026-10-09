<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useDepositApi } from "@/api/modules/wallet/deposit/useDepositApi";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import type { DepositRequestSummaryResponse, FundingMetricsResponse } from "@/api";

const router = useRouter();
const depositApi = useDepositApi();
const contextStore = useUserContextStore();

const greetingName = computed(() => {
  if (contextStore.displayName && contextStore.displayName !== "Usuario") {
    return contextStore.displayName;
  }
  return contextStore.isAuditor ? "Auditor" : "Admin";
});

const solicitudes = ref<DepositRequestSummaryResponse[]>([]);
const metrics = ref<FundingMetricsResponse | null>(null);
const isLoading = ref(true);

const todayLabel = computed(() => {
  return new Intl.DateTimeFormat("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
});

const formatCurrency = (amount?: number | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return "N/A";
  return new Intl.NumberFormat("es-NI", {
    style: "currency",
    currency: "NIO",
  }).format(amount);
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const timeStr = d.toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Hoy, ${timeStr}`;
  }

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return `Ayer, ${timeStr}`;
  }

  const dateFormatted = d.toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
  });
  return `${dateFormatted}, ${timeStr}`;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return {
        label: "Pendiente",
        style: "bg-orange-100/70 text-[#ea580c]",
      };
    case "approved":
      return {
        label: "Aprobada",
        style: "bg-teal-100/70 text-[#00a896]",
      };
    case "rejected":
      return {
        label: "Rechazada",
        style: "bg-slate-200 text-slate-700",
      };
    default:
      return {
        label: "N/A",
        style: "bg-slate-100 text-slate-500",
      };
  }
};

const stats = computed(() => [
  {
    label: "Recargas pendientes",
    value: metrics.value ? metrics.value.pending.toString() : "0",
    subtext: "Esperando revisión",
    icon: "fa-regular fa-clock text-[#f97316]",
    iconBg: "bg-orange-50",
    subtextColor: "text-[#f97316]",
  },
  {
    label: "Aprobadas",
    value: metrics.value ? metrics.value.approved.toString() : "0",
    subtext: "Acreditadas con éxito",
    icon: "fa-regular fa-circle-check text-[#00a896]",
    iconBg: "bg-teal-50",
    subtextColor: "text-[#00a896]",
  },
  {
    label: "Rechazadas",
    value: metrics.value ? metrics.value.rejected.toString() : "0",
    subtext: "Depósitos no validados",
    icon: "fa-solid fa-triangle-exclamation text-[#f97316]",
    iconBg: "bg-orange-50",
    subtextColor: "text-[#f97316]",
  },
  {
    label: "Total de solicitudes",
    value: metrics.value ? metrics.value.all.toString() : "0",
    subtext: "Histórico acumulado",
    icon: "fa-solid fa-chart-line text-[#023859]",
    iconBg: "bg-slate-100",
    subtextColor: "text-[#023859]",
  },
]);

async function loadData() {
  isLoading.value = true;
  try {
    const [rechargesRes, metricsRes] = await Promise.allSettled([
      depositApi.getRecharges({
        limit: 5,
        sort_by: "created_at",
        sort_direction: "desc",
      }),
      depositApi.getRechargeMetrics(),
    ]);

    if (rechargesRes.status === "fulfilled") {
      solicitudes.value = rechargesRes.value.data;
    }
    if (metricsRes.status === "fulfilled") {
      metrics.value = metricsRes.value;
    }
  } catch (error) {
    console.error("Error al cargar solicitudes de recarga:", error);
  } finally {
    isLoading.value = false;
  }
}

const navigateToDetail = (id: string) => {
  router.push({ name: "admin-payment-detail", params: { id } });
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header Title & Date -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
          Hola, {{ greetingName }}
        </h1>
        <p class="text-xs sm:text-sm text-slate-400 mt-1">
          Bienvenido de vuelta. Aquí está el resumen de las operaciones de hoy.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <!-- Date Badge -->
        <div class="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-2xs">
          <i class="fa-regular fa-calendar-days text-slate-400"></i>
          <span>{{ todayLabel }}</span>
        </div>

        <!-- Refresh Button -->
        <button
          type="button"
          @click="loadData"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <i :class="['fa-solid fa-arrows-rotate', isLoading ? 'animate-spin text-[#00a896]' : 'text-slate-400']"></i>
        </button>
      </div>
    </div>

    <!-- 4 Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs transition-shadow hover:shadow-md flex justify-between items-start"
      >
        <div class="space-y-1">
          <p class="text-xs font-medium text-slate-400">{{ stat.label }}</p>
          <p class="text-2xl font-bold font-serif text-[#023859] leading-none pt-1">
            <span v-if="isLoading && !metrics" class="inline-block h-6 w-12 bg-slate-100 rounded animate-pulse"></span>
            <span v-else>{{ stat.value }}</span>
          </p>
          <p :class="['text-xs font-semibold pt-1', stat.subtextColor]">{{ stat.subtext }}</p>
        </div>
        <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg', stat.iconBg]">
          <i :class="stat.icon"></i>
        </div>
      </div>
    </div>

    <!-- Solicitudes de recarga recientes Card -->
    <div class="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
        <h3 class="font-serif text-lg font-bold text-[#023859]">
          Solicitudes de recarga recientes
        </h3>
        <router-link
          :to="{ name: 'admin-payments' }"
          class="text-xs font-bold text-[#00a896] hover:underline"
        >
          Ver todas las solicitudes
        </router-link>
      </div>

      <!-- Table container with responsive overflow -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
              <th class="px-6 py-3.5">Referencia / ID</th>
              <th class="px-6 py-3.5">Usuario</th>
              <th class="px-6 py-3.5">Monto</th>
              <th class="px-6 py-3.5">Banco</th>
              <th class="px-6 py-3.5">Fecha</th>
              <th class="px-6 py-3.5">Estado</th>
              <th class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <!-- Loading Skeletons -->
            <template v-if="isLoading && solicitudes.length === 0">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-6 py-4"><div class="h-3 w-20 rounded bg-slate-200"></div></td>
                <td class="px-6 py-4"><div class="h-3 w-32 rounded bg-slate-200"></div></td>
                <td class="px-6 py-4"><div class="h-3 w-24 rounded bg-slate-200"></div></td>
                <td class="px-6 py-4"><div class="h-3 w-24 rounded bg-slate-100"></div></td>
                <td class="px-6 py-4"><div class="h-3 w-28 rounded bg-slate-100"></div></td>
                <td class="px-6 py-4"><div class="h-5 w-20 rounded-full bg-slate-100"></div></td>
                <td class="px-6 py-4 text-right"><div class="h-3 w-14 rounded bg-slate-200 ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="solicitudes.length === 0">
              <td colspan="7" class="px-6 py-12 text-center text-slate-400">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <i class="fa-solid fa-receipt text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#023859]">No hay solicitudes de recarga recientes</p>
                <p class="text-xs text-slate-400 mt-0.5">Las nuevas solicitudes registradas por los usuarios aparecerán aquí.</p>
              </td>
            </tr>

            <!-- Real Data Rows -->
            <tr
              v-else
              v-for="sol in solicitudes"
              :key="sol.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="px-6 py-4 font-bold text-xs text-[#023859] font-mono" :title="`ID: ${sol.id}`">
                {{ sol.reference_code || sol.id.slice(0, 8) }}
              </td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">
                <span>{{ sol.user_full_name?.trim() || sol.user_email || 'N/A' }}</span>
              </td>
              <td class="px-6 py-4 font-bold text-xs text-[#023859]">
                {{ formatCurrency(sol.amount) }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-500">
                {{ sol.bank_name || 'N/A' }}
              </td>
              <td class="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                {{ formatDate(sol.deposited_at || sol.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', getStatusBadge(sol.status).style]">
                  {{ getStatusBadge(sol.status).label }}
                </span>
              </td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <button
                  @click="navigateToDetail(sol.id)"
                  class="text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  Revisar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
