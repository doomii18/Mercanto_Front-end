<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useVerificationRequestApi } from "@/api/modules/organization/verification_request/useVerificationRequestApi";
import type { ProviderKind, OrganizationStatus } from "@/api/modules/organization/organization/types";

export interface AdminProviderListItem {
  id: string; // Organization ID
  verificationRequestId?: string;
  userName: string;
  userEmail: string;
  userInitials: string;
  avatarBg: string;
  businessName: string;
  ruc: string;
  businessType: string;
  kind: ProviderKind;
  registeredAtFormatted: string;
  rawDate: string;
  status: "Pendiente" | "Aprobado" | "Rechazado" | "Borrador" | "Revocado";
  rawStatus: OrganizationStatus;
}

const router = useRouter();
const organizationApi = useOrganizationApi();
const verificationApi = useVerificationRequestApi();

// --- Loading & State ---
const isLoading = ref(true);
const providers = ref<AdminProviderListItem[]>([]);
const totalCount = ref(0);
const verifiedCount = ref(0);
const rejectedCount = ref(0);
const pendingCount = ref(0);

// --- Tabs & Filter State ---
// Tabs: "all" (Todos), "verified" (Verificados), "rejected" (Rechazados)
const activeTab = ref<"all" | "verified" | "rejected">("verified");

const searchQuery = ref("");
const selectedStatusFilter = ref<"all" | OrganizationStatus>("all");
const selectedKindFilter = ref<"all" | ProviderKind>("all");
const startDate = ref<string>("");
const endDate = ref<string>("");

// Selected Checkboxes
const selectedProviderIds = ref<string[]>([]);

// Pagination
const currentPage = ref(1);
const pageSize = ref(20);

const totalPages = computed(() => {
  return Math.ceil(totalCount.value / pageSize.value) || 1;
});

// Kind label mapping for display
const kindLabels: Record<ProviderKind, string> = {
  manufacturer: "Fabricante",
  distributor: "Distribuidor",
  wholesaler: "Mayorista",
  retailer: "Pequeño comercio",
  service: "Servicio",
};

// Status label mapping
const statusLabels: Record<OrganizationStatus, "Pendiente" | "Aprobado" | "Rechazado" | "Borrador" | "Revocado"> = {
  draft: "Borrador",
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
  revoked: "Revocado",
};

// Debounce timer for search input
let searchDebounceTimeout: ReturnType<typeof setTimeout> | null = null;

async function fetchProviders() {
  isLoading.value = true;
  try {
    const offset = (currentPage.value - 1) * pageSize.value;

    // Resolve status filter: tab takes precedence if explicitly on verified or rejected
    let statusFilter: OrganizationStatus | undefined = undefined;
    if (activeTab.value === "verified") {
      statusFilter = "approved";
    } else if (activeTab.value === "rejected") {
      statusFilter = "rejected";
    } else if (selectedStatusFilter.value !== "all") {
      statusFilter = selectedStatusFilter.value;
    }

    const kindFilter = selectedKindFilter.value !== "all" ? selectedKindFilter.value : undefined;
    const searchTerm = searchQuery.value.trim() ? searchQuery.value.trim() : undefined;

    const createdAfter = startDate.value ? new Date(`${startDate.value}T00:00:00Z`).toISOString() : undefined;
    const createdBefore = endDate.value ? new Date(`${endDate.value}T23:59:59Z`).toISOString() : undefined;

    const res = await organizationApi.getAllOrganizations({
      limit: pageSize.value,
      offset,
      status: statusFilter,
      kind: kindFilter,
      search_term: searchTerm,
      created_after: createdAfter,
      created_before: createdBefore,
      sort_by: "created_at",
      sort_dir: "desc",
    });

    if (res && res.data) {
      totalCount.value = res.total ?? res.data.length;

      const orgIds = res.data.map((o) => o.id);

      // Batch-fetch verification requests if any organizations returned
      let verifBatchMap: Record<string, any> = {};
      if (orgIds.length > 0) {
        try {
          verifBatchMap = await verificationApi.getVerificationRequestsBatch({
            provider_ids: orgIds,
          });
        } catch (err) {
          console.warn("Could not batch-fetch verification requests:", err);
        }
      }

      providers.value = res.data.map((org) => {
        const verif = verifBatchMap[org.id];

        // Status priority: active verification request status overrides or fallback to org status
        let finalRawStatus: OrganizationStatus = (org.status as OrganizationStatus) || "draft";
        if (verif?.status) {
          finalRawStatus = verif.status as OrganizationStatus;
        }

        const resolvedStatusLabel = statusLabels[finalRawStatus] || "Pendiente";
        const businessTypeLabel = kindLabels[org.kind] || "Comercio al por mayor";

        const initials = org.company_name
          .split(" ")
          .filter(Boolean)
          .map((w) => w[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "PR";

        const rawDate = verif?.submitted_at || null;
        const formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString("es-NI", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";

        return {
          id: org.id,
          verificationRequestId: verif?.id,
          userName: org.company_name,
          userEmail: `contacto@${org.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
          userInitials: initials,
          avatarBg: "bg-[#023859]",
          businessName: org.company_name,
          ruc: org.tax_id,
          businessType: businessTypeLabel,
          kind: org.kind,
          registeredAtFormatted: formattedDate,
          rawDate,
          status: resolvedStatusLabel,
          rawStatus: finalRawStatus,
        };
      });
    } else {
      providers.value = [];
      totalCount.value = 0;
    }
  } catch (err) {
    console.error("Failed to load providers from backend:", err);
    providers.value = [];
    totalCount.value = 0;
  } finally {
    isLoading.value = false;
  }
}

// Fetch general counts for tabs & banners (independent of current tab)
async function fetchSummaryCounts() {
  try {
    const [allRes, verifiedRes, rejectedRes, pendingRes] = await Promise.allSettled([
      organizationApi.getAllOrganizations({ limit: 1 }),
      organizationApi.getAllOrganizations({ limit: 1, status: "approved" }),
      organizationApi.getAllOrganizations({ limit: 1, status: "rejected" }),
      organizationApi.getAllOrganizations({ limit: 1, status: "pending" }),
    ]);

    if (allRes.status === "fulfilled") totalCount.value = allRes.value.total ?? 0;
    if (verifiedRes.status === "fulfilled") verifiedCount.value = verifiedRes.value.total ?? 0;
    if (rejectedRes.status === "fulfilled") rejectedCount.value = rejectedRes.value.total ?? 0;
    if (pendingRes.status === "fulfilled") pendingCount.value = pendingRes.value.total ?? 0;
  } catch (e) {
    console.warn("Could not fetch summary counts:", e);
  }
}

// Watch filters to trigger reload
watch(
  [activeTab, selectedStatusFilter, selectedKindFilter, startDate, endDate, currentPage],
  () => {
    fetchProviders();
  }
);

watch(searchQuery, () => {
  if (searchDebounceTimeout) clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    currentPage.value = 1;
    fetchProviders();
  }, 350);
});

// Change tab
function handleTabChange(tab: "all" | "verified" | "rejected") {
  activeTab.value = tab;
  currentPage.value = 1;
}

// Banner action: jump to pending
function filterByPending() {
  activeTab.value = "all";
  selectedStatusFilter.value = "pending";
  currentPage.value = 1;
}

// Selection handlers
const isAllSelected = computed(() => {
  if (providers.value.length === 0) return false;
  return providers.value.every((p) => selectedProviderIds.value.includes(p.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedProviderIds.value = [];
  } else {
    selectedProviderIds.value = providers.value.map((p) => p.id);
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
  selectedKindFilter.value = "all";
  startDate.value = "";
  endDate.value = "";
  activeTab.value = "all";
  currentPage.value = 1;
  fetchProviders();
}

function viewProviderDetail(provider: AdminProviderListItem) {
  // If provider has an active verification request ID, route with it or organization ID
  const targetId = provider.verificationRequestId || provider.id;
  router.push({
    name: "admin-provider-detail",
    params: { id: targetId },
  });
}

onMounted(() => {
  fetchProviders();
  fetchSummaryCounts();
});
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
    <div
      v-if="pendingCount > 0"
      class="rounded-2xl border border-sky-100 bg-[#f0f8ff] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-2xs"
    >
      <div class="flex items-start gap-3.5">
        <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0284c7] mt-0.5">
          <i class="fa-solid fa-circle-info text-xs"></i>
        </div>
        <div class="space-y-0.5">
          <p class="text-xs sm:text-sm font-bold text-slate-800">
            Tienes {{ pendingCount }} {{ pendingCount === 1 ? 'solicitud' : 'solicitudes' }} de verificación pendiente{{ pendingCount === 1 ? '' : 's' }}.
          </p>
          <p class="text-xs text-slate-500">
            Los importadores podrán publicar su catálogo una vez sean verificados por administración.
          </p>
        </div>
      </div>
      <button
        type="button"
        @click="filterByPending"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:underline cursor-pointer shrink-0 self-start sm:self-auto"
      >
        <span>Revisar pendientes</span>
        <i class="fa-solid fa-arrow-right text-[10px]"></i>
      </button>
    </div>

    <!-- Tabs Bar -->
    <div class="flex items-center gap-8 border-b border-slate-200">
      <button
        type="button"
        @click="handleTabChange('all')"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'all'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Todos ({{ totalCount }})</span>
      </button>

      <button
        type="button"
        @click="handleTabChange('verified')"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'verified'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Verificados ({{ verifiedCount }})</span>
      </button>

      <button
        type="button"
        @click="handleTabChange('rejected')"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'rejected'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Rechazados ({{ rejectedCount }})</span>
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
          placeholder="Buscar por nombre, RUC, o descripción..."
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
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[130px]"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="approved">Aprobado</option>
              <option value="rejected">Rechazado</option>
              <option value="draft">Borrador</option>
              <option value="revoked">Revocado</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Tipo de negocio -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Tipo de negocio</label>
          <div class="relative">
            <select
              v-model="selectedKindFilter"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[150px]"
            >
              <option value="all">Todos</option>
              <option value="manufacturer">Fabricante</option>
              <option value="distributor">Distribuidor</option>
              <option value="wholesaler">Mayorista</option>
              <option value="retailer">Pequeño comercio</option>
              <option value="service">Servicio</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Rango de fechas: Desde -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Desde</label>
          <input
            v-model="startDate"
            type="date"
            class="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer"
          />
        </div>

        <!-- Rango de fechas: Hasta -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Hasta</label>
          <input
            v-model="endDate"
            type="date"
            class="rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer"
          />
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
            <!-- Loading Skeletons -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 pl-4 pr-2 text-center">
                  <div class="h-4 w-4 rounded bg-slate-200 mx-auto"></div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-slate-200 shrink-0"></div>
                    <div class="space-y-1.5">
                      <div class="h-3 w-32 rounded bg-slate-200"></div>
                      <div class="h-2.5 w-40 rounded bg-slate-100"></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4"><div class="h-3 w-28 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-24 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-28 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-20 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 rounded-full bg-slate-200"></div></td>
                <td class="px-4 py-4 text-center"><div class="h-6 w-16 rounded-lg bg-slate-200 mx-auto"></div></td>
              </tr>
            </template>

            <!-- Real Data Rows -->
            <template v-else-if="providers.length > 0">
              <tr
                v-for="item in providers"
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
                  <p class="font-medium text-slate-700 text-xs">{{ item.registeredAtFormatted }}</p>
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
                    v-else-if="item.status === 'Rechazado'"
                    class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                    <span>Rechazado</span>
                  </span>

                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                    <span>{{ item.status }}</span>
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
            </template>

            <!-- Empty State -->
            <tr v-else>
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <i class="fa-solid fa-store-slash text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#023859]">No se encontraron proveedores</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  No hay proveedores registrados o ningún resultado coincide con los filtros aplicados.
                </p>
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
          Mostrando
          <span class="font-bold text-slate-700">
            {{ totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0 }}–{{ Math.min(currentPage * pageSize, totalCount) }}
          </span>
          de <span class="font-bold text-slate-700">{{ totalCount }}</span> proveedores
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Prev Button -->
          <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          <!-- Number buttons -->
          <button
            v-for="p in totalPages"
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
            :disabled="currentPage === totalPages"
            @click="currentPage++"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-all cursor-pointer"
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
