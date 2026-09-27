<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const activeTab = ref<"Todas" | "Pendientes" | "Aprobadas" | "Rechazadas">("Todas");
const searchQuery = ref("");
const selectedBank = ref("Todos los bancos");
const selectedDateRange = ref("Rango de fechas");

const solicitudes = ref([
  { id: "REC-000245", usuario: "María López Vasquez", monto: "C$ 2,000.00", banco: "Banco Lafise", fecha: "17 Sep 2026, 05:25 PM", estado: "Pendiente", badgeClass: "bg-orange-100/70 text-[#ea580c]" },
  { id: "REC-000244", usuario: "Juan José Pérez", monto: "C$ 1,500.00", banco: "BAC Credomatic", fecha: "17 Sep 2026, 03:10 PM", estado: "Aprobada", badgeClass: "bg-teal-100/70 text-[#00a896]" },
  { id: "REC-000243", usuario: "Laura Gómez Blandón", monto: "C$ 5,000.00", banco: "Banpro", fecha: "17 Sep 2026, 01:15 PM", estado: "Pendiente", badgeClass: "bg-orange-100/70 text-[#ea580c]" },
  { id: "REC-000242", usuario: "Wendy Solórzano", monto: "C$ 850.00", banco: "Banco Lafise", fecha: "16 Sep 2026, 06:40 PM", estado: "Rechazada", badgeClass: "bg-slate-200 text-slate-700" },
  { id: "REC-000241", usuario: "Alina Rostrán", monto: "C$ 12,000.00", banco: "BAC Credomatic", fecha: "16 Sep 2026, 11:20 AM", estado: "Aprobada", badgeClass: "bg-teal-100/70 text-[#00a896]" },
  { id: "REC-000240", usuario: "Roberto Blandino", monto: "C$ 3,400.00", banco: "Banco Lafise", fecha: "15 Sep 2026, 04:30 PM", estado: "Aprobada", badgeClass: "bg-teal-100/70 text-[#00a896]" },
  { id: "REC-000239", usuario: "Nuria Castillo", monto: "C$ 1,000.00", banco: "Banpro", fecha: "15 Sep 2026, 09:15 AM", estado: "Aprobada", badgeClass: "bg-teal-100/70 text-[#00a896]" },
]);

const counts = computed(() => ({
  Todas: 156,
  Pendientes: 24,
  Aprobadas: 122,
  Rechazadas: 10,
}));

const filteredSolicitudes = computed(() => {
  return solicitudes.value.filter((sol) => {
    // Tab filter
    if (activeTab.value === "Pendientes" && sol.estado !== "Pendiente") return false;
    if (activeTab.value === "Aprobadas" && sol.estado !== "Aprobada") return false;
    if (activeTab.value === "Rechazadas" && sol.estado !== "Rechazada") return false;

    // Search query
    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
      const matchUser = sol.usuario.toLowerCase().includes(q);
      const matchId = sol.id.toLowerCase().includes(q);
      if (!matchUser && !matchId) return false;
    }

    // Bank filter
    if (selectedBank.value !== "Todos los bancos") {
      if (!sol.banco.toLowerCase().includes(selectedBank.value.toLowerCase())) return false;
    }

    return true;
  });
});

const goToDetail = (id: string) => {
  router.push({ name: "admin-payment-detail", params: { id } });
};
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="font-serif text-2xl sm:text-3xl font-bold text-[#023859]">
        Solicitudes de recarga
      </h1>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">
        Gestiona y valida los depósitos bancarios de los usuarios.
      </p>
    </div>

    <!-- Main Card Container -->
    <div class="rounded-2xl border border-slate-100 bg-white p-4 sm:p-6 shadow-xs space-y-6">
      <!-- Tabs Bar with counts -->
      <div class="flex items-center gap-6 border-b border-slate-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          v-for="tab in (['Todas', 'Pendientes', 'Aprobadas', 'Rechazadas'] as const)"
          :key="tab"
          @click="activeTab = tab"
          :class="[
            'pb-3 font-semibold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer',
            activeTab === tab
              ? 'border-[#00a896] text-[#00a896] font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          ]"
        >
          <span>{{ tab }}</span>
          <span
            :class="[
              'rounded-full px-2 py-0.5 text-[10px] font-bold',
              activeTab === tab ? 'bg-teal-100/80 text-[#00a896]' : 'bg-slate-100 text-slate-500'
            ]"
          >
            {{ counts[tab] }}
          </span>
        </button>
      </div>

      <!-- Filters Row: Search input + Bank select + Date select -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por usuario o ID de solicitud..."
            class="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-[#023859] placeholder-slate-400 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 font-medium"
          />
        </div>

        <!-- Select Controls -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <!-- Bank Select -->
          <div class="relative">
            <i class="fa-solid fa-building-columns absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            <select
              v-model="selectedBank"
              class="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-600 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer"
            >
              <option>Todos los bancos</option>
              <option>Banco Lafise</option>
              <option>BAC Credomatic</option>
              <option>Banpro</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
          </div>

          <!-- Date Select -->
          <div class="relative">
            <i class="fa-regular fa-calendar-days absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            <select
              v-model="selectedDateRange"
              class="w-full sm:w-auto appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-600 focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer"
            >
              <option>Rango de fechas</option>
              <option>Hoy</option>
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none"></i>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm min-w-[680px]">
          <thead>
            <tr class="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th class="py-3.5 px-3">ID Solicitud</th>
              <th class="py-3.5 px-3">Usuario</th>
              <th class="py-3.5 px-3">Monto</th>
              <th class="py-3.5 px-3">Banco</th>
              <th class="py-3.5 px-3">Fecha</th>
              <th class="py-3.5 px-3">Estado</th>
              <th class="py-3.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="sol in filteredSolicitudes"
              :key="sol.id"
              class="hover:bg-slate-50/60 transition-colors"
            >
              <td class="py-4 px-3 font-mono text-xs font-bold text-[#023859]">
                {{ sol.id }}
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#023859]">
                {{ sol.usuario }}
              </td>
              <td class="py-4 px-3 font-bold text-xs text-[#023859]">
                {{ sol.monto }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-500">
                {{ sol.banco }}
              </td>
              <td class="py-4 px-3 text-xs text-slate-400">
                {{ sol.fecha }}
              </td>
              <td class="py-4 px-3">
                <span :class="['inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold', sol.badgeClass]">
                  {{ sol.estado }}
                </span>
              </td>
              <td class="py-4 px-3 text-right">
                <button
                  @click="goToDetail(sol.id)"
                  class="text-xs font-bold text-[#00a896] hover:underline"
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
