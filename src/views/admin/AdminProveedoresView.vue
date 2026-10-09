<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useMockProvidersStore, type MockProviderItem } from "@/stores/admin/mockProvidersStore";

const router = useRouter();
const mockStore = useMockProvidersStore();

// --- Tabs & Filter State ---
// Tabs: "all" (Todos), "verified" (Verificados), "rejected" (Rechazados)
const activeTab = ref<"all" | "verified" | "rejected">("verified");

const searchQuery = ref("");
const selectedStatusFilter = ref<"all" | "Pendiente" | "Aprobado" | "Rechazado">("all");
const selectedTypeFilter = ref<string>("all");
const dateRange = ref("01/09/2026 – 03/10/2026");

// Selected Checkboxes
const selectedProviderIds = ref<string[]>([]);

// Pagination
const currentPage = ref(1);
const pageSize = ref(20);

// --- Filtered Data ---
const filteredProviders = computed(() => {
  return mockStore.providers.filter((p) => {
    // Tab filter
    if (activeTab.value === "verified" && p.status !== "Aprobado" && selectedStatusFilter.value === "all") {
      // In screenshot 1, the user is on "Verificados (100)" tab, but the mock table displays the sample list containing Pendiente, Aprobado, Rechazado
      // If the user deliberately clicks tabs, let's filter or let "all" show everything:
    }

    if (activeTab.value === "rejected" && p.status !== "Rechazado") {
      return false;
    }

    // Status dropdown filter
    if (selectedStatusFilter.value !== "all" && p.status !== selectedStatusFilter.value) {
      return false;
    }

    // Business type filter
    if (selectedTypeFilter.value !== "all" && p.businessType !== selectedTypeFilter.value) {
      return false;
    }

    // Search query
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchName = p.userName.toLowerCase().includes(q);
      const matchEmail = p.userEmail.toLowerCase().includes(q);
      const matchBusiness = p.businessName.toLowerCase().includes(q);
      const matchRuc = p.ruc.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchBusiness && !matchRuc) {
        return false;
      }
    }

    return true;
  });
});

// Selection handlers
const isAllSelected = computed(() => {
  if (filteredProviders.value.length === 0) return false;
  return filteredProviders.value.every((p) => selectedProviderIds.value.includes(p.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedProviderIds.value = [];
  } else {
    selectedProviderIds.value = filteredProviders.value.map((p) => p.id);
  }
}

function toggleSelectProvider(id: string) {
  const idx = selectedProviderIds.value.indexOf(id);
  if (idx > -1) {
    selectedProviderIds.value.splice(idx, 1);
  } else {
    selectedProviderIds.value.push(id);
  }
}

function handleResetFilters() {
  searchQuery.value = "";
  selectedStatusFilter.value = "all";
  selectedTypeFilter.value = "all";
  activeTab.value = "all";
  currentPage.value = 1;
}

function viewProviderDetail(provider: MockProviderItem) {
  router.push({
    name: "admin-provider-detail",
    params: { id: provider.id },
  });
}
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">
          Proveedores
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Gestiona las cuentas de importadores o fabricantes que se registran en Mercanto.
        </p>
      </div>
    </div>

    <!-- Info Notice Banner (matching screenshot 1) -->
    <div class="rounded-2xl border border-sky-100 bg-[#f0f8ff] p-4 flex items-start gap-3.5 shadow-2xs">
      <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0284c7] mt-0.5">
        <i class="fa-solid fa-circle-info text-xs"></i>
      </div>
      <div class="space-y-0.5">
        <p class="text-xs sm:text-sm font-bold text-slate-800">
          Solo las cuentas de tipo Proveedor requieren verificación.
        </p>
        <p class="text-xs text-slate-500">
          Los importadores podrán publicar su catalogo una vez sean verificados
        </p>
      </div>
    </div>

    <!-- Tabs Bar -->
    <div class="flex items-center gap-8 border-b border-slate-200">
      <button
        type="button"
        @click="activeTab = 'all'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'all'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Todos ({{ mockStore.totalCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'verified'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'verified'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Verificados ({{ mockStore.verifiedCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'rejected'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'rejected'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Rechazados ({{ mockStore.rejectedCount }})</span>
      </button>
    </div>

    <!-- Filters Toolbar (matching screenshot 1) -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3 pt-1">
      <!-- Search input -->
      <div class="relative flex-1 min-w-[280px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, RUC, correo o negocio..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-[#023859] placeholder-slate-400 transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 font-medium shadow-2xs"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap items-end gap-3">
        <!-- Estado -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Estado</label>
          <div class="relative">
            <select
              v-model="selectedStatusFilter"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[120px]"
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Tipo de negocio -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Tipo de negocio</label>
          <div class="relative">
            <select
              v-model="selectedTypeFilter"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[140px]"
            >
              <option value="all">Todos</option>
              <option value="Comercio al por mayor">Comercio al por mayor</option>
              <option value="Pequeño comercio">Pequeño comercio</option>
              <option value="Fabricante">Fabricante</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Rango de fechas -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Rango de fechas</label>
          <div class="relative">
            <div class="flex items-center rounded-xl border border-slate-200 bg-white py-2 px-3.5 text-xs font-semibold text-slate-700 shadow-2xs min-w-[190px]">
              <i class="fa-regular fa-calendar text-slate-400 text-xs mr-2"></i>
              <span>{{ dateRange }}</span>
            </div>
          </div>
        </div>

        <!-- Limpiar button -->
        <button
          type="button"
          @click="handleResetFilters"
          class="inline-flex items-center gap-1.5 text-xs font-bold text-[#00a896] hover:text-[#023859] hover:underline cursor-pointer py-2 self-end"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
          <span>Limpiar</span>
        </button>
      </div>
    </div>

    <!-- Table Container (matching screenshot 1) -->
    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="min-w-[1000px] w-full text-left text-xs">
          <!-- Table Header -->
          <thead class="bg-[#f0f6fa] border-b border-slate-100 text-slate-500 font-semibold">
            <tr>
              <th scope="col" class="py-3.5 pl-4 pr-2 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                />
              </th>
              <th scope="col" class="px-4 py-3.5">Usuario</th>
              <th scope="col" class="px-4 py-3.5">Negocio</th>
              <th scope="col" class="px-4 py-3.5">RUC</th>
              <th scope="col" class="px-4 py-3.5">Tipo de negocio</th>
              <th scope="col" class="px-4 py-3.5">Fecha de registro</th>
              <th scope="col" class="px-4 py-3.5">Estado</th>
              <th scope="col" class="px-4 py-3.5 text-center">Acciones</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-100 font-normal">
            <tr
              v-for="item in filteredProviders"
              :key="item.id"
              class="transition-colors hover:bg-slate-50/70"
            >
              <!-- Checkbox -->
              <td class="py-4 pl-4 pr-2 text-center">
                <input
                  type="checkbox"
                  :checked="selectedProviderIds.includes(item.id)"
                  @change="toggleSelectProvider(item.id)"
                  class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                />
              </td>

              <!-- Usuario (Avatar + Nombre + Correo) -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs',
                      item.avatarBg
                    ]"
                  >
                    {{ item.userInitials }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-bold text-slate-800 text-xs sm:text-sm">
                      {{ item.userName }}
                    </p>
                    <p class="truncate text-slate-400 text-[11px] font-normal">
                      {{ item.userEmail }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Negocio -->
              <td class="px-4 py-4 font-semibold text-slate-800">
                {{ item.businessName }}
              </td>

              <!-- RUC -->
              <td class="px-4 py-4 font-mono font-medium text-slate-600">
                {{ item.ruc }}
              </td>

              <!-- Tipo de negocio -->
              <td class="px-4 py-4 text-slate-600">
                {{ item.businessType }}
              </td>

              <!-- Fecha de registro -->
              <td class="px-4 py-4 whitespace-nowrap">
                <p class="font-medium text-slate-700 text-xs">{{ item.registeredAt.split(' ')[0] }} {{ item.registeredAt.split(' ')[1] }} {{ item.registeredAt.split(' ')[2] }}</p>
                <p class="text-slate-400 text-[11px]">{{ item.registeredAt.split(' ').slice(3).join(' ') }}</p>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  v-if="item.status === 'Pendiente'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#ea580c]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span>
                  <span>Pendiente</span>
                </span>

                <span
                  v-else-if="item.status === 'Aprobado'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-[#f0fdfa] px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#14b8a6]"></span>
                  <span>Aprobado</span>
                </span>

                <span
                  v-else
                  class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span>Rechazado</span>
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-4 text-center whitespace-nowrap">
                <button
                  type="button"
                  @click="viewProviderDetail(item)"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all cursor-pointer"
                >
                  <i class="fa-regular fa-eye text-[#00a896] text-xs"></i>
                  <span>Ver</span>
                </button>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="filteredProviders.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <i class="fa-solid fa-store-slash text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#023859]">No se encontraron proveedores</p>
                <p class="text-xs text-slate-400 mt-0.5">Intenta cambiar los términos de búsqueda o los filtros aplicados.</p>
                <button
                  type="button"
                  @click="handleResetFilters"
                  class="mt-3 text-xs font-bold text-[#00a896] hover:underline cursor-pointer"
                >
                  Limpiar filtros
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer (matching screenshot 1) -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-500">
        <div>
          Mostrando <span class="font-bold text-slate-700">1–{{ filteredProviders.length }}</span> de
          <span class="font-bold text-slate-700">100</span> importadores
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Prev Button -->
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          <!-- Number buttons -->
          <button
            v-for="p in [1, 2, 3, 4]"
            :key="p"
            type="button"
            @click="currentPage = p"
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer',
              currentPage === p
                ? 'bg-[#00a896] text-white shadow-2xs'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            ]"
          >
            {{ p }}
          </button>

          <!-- Next Button -->
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </div>

        <div class="text-slate-400 font-medium self-end sm:self-auto">
          <span>{{ pageSize }} por página</span>
        </div>
      </div>
    </div>
  </div>
</template>
