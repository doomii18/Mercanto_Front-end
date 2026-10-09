<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import { useVerificationRequestApi } from "@/api/modules/organization/verification_request/useVerificationRequestApi";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import type { AdminUserItem } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useUserContextStore } from "@/stores/auth/userContextStore";
import { useToastStore } from "@/stores/ui";
import { useGeoStore } from "@/stores/geo";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import NationalIdDisplay from "@/components/common/NationalIdDisplay.vue";
import PhoneDisplay from "@/components/common/PhoneDisplay.vue";

const router = useRouter();
const identityApi = useIdentityApi();
const verificationApi = useVerificationRequestApi();
const organizationApi = useOrganizationApi();
const authStore = useAuthStore();
const contextStore = useUserContextStore();
const toastStore = useToastStore();
const geoStore = useGeoStore();

const isAdmin = computed(() => contextStore.isAdmin);

// --- State ---
const userList = ref<AdminUserItem[]>([]);
const isLoading = ref(false);
const selectedUserIds = ref<string[]>([]);

// Tabs: "Todos", "Activos", "Suspendidos", "Verificaciones"
const activeTab = ref<"all" | "active" | "suspended" | "verifications">("all");

// Counters for tabs
const totalCount = ref<number | null>(null);
const activeCount = ref<number | null>(null);
const suspendedCount = ref<number | null>(null);
const pendingVerificationsCount = ref<number | null>(null);

// Verification requests state
export interface PendingVerificationItem {
  id: string;
  organizationId: string;
  companyName: string;
  taxId: string;
  kind: string;
  submittedAt: string;
  status: string;
}
const pendingVerifications = ref<PendingVerificationItem[]>([]);
const isLoadingVerifications = ref(false);

// Search & Filters
const searchQuery = ref("");
const selectedRoleFilter = ref<"all" | "member" | "admin" | "auditor">("all");
const sortSelection = ref<"created_at_desc" | "created_at_asc" | "email_asc" | "email_desc">("created_at_desc");

// Pagination (Server-Side)
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = ref(0);

// Modals State
const isConfirmOpen = ref(false);
const targetUser = ref<AdminUserItem | null>(null);
const isMutating = ref(false);

const isDetailModalOpen = ref(false);
const viewedUser = ref<AdminUserItem | null>(null);

// Current user id to avoid self-suspension
const currentUserId = computed(() => authStore.account?.id);

// --- Avatar Helpers ---
const AVATAR_COLORS = [
  "bg-[#023859]",
  "bg-[#b45309]",
  "bg-[#0f766e]",
  "bg-[#1e293b]",
  "bg-[#991b1b]",
  "bg-[#475569]",
  "bg-[#7e22ce]",
  "bg-[#0369a1]",
  "bg-[#be185d]",
];

function getAvatarBg(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getUserFullName(user: AdminUserItem): string | null {
  const first = user.first_name?.trim() || "";
  const last = user.last_name?.trim() || "";
  if (first || last) {
    return `${first} ${last}`.trim();
  }
  return null;
}

function getUserInitials(user: AdminUserItem): string {
  const first = user.first_name?.trim() || "";
  const last = user.last_name?.trim() || "";
  if (first && last) {
    return `${first[0]}${last[0]}`.toUpperCase();
  }
  if (first) {
    return first.slice(0, 2).toUpperCase();
  }
  if (user.email) {
    return (user.email.slice(0, 2) || "US").toUpperCase();
  }
  return "N/A";
}

function getLocationLabel(municipalityId?: string | null): string {
  if (!municipalityId) return "N/A";
  const loc = geoStore.resolveLocationHierarchy(municipalityId);
  if (!loc?.municipality) return "N/A";
  return loc.department ? `${loc.municipality.name}, ${loc.department.name}` : loc.municipality.name;
}

function formatDate(isoDate?: string | null): string {
  if (!isoDate) return "N/A";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(isoDate?: string | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getRoleBadge(role: string) {
  switch (role) {
    case "admin":
      return {
        label: "Administrador",
        badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
        dotClass: "bg-purple-500",
      };
    case "auditor":
      return {
        label: "Auditor",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-500",
      };
    case "member":
    default:
      return {
        label: "Miembro",
        badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
        dotClass: "bg-slate-400",
      };
  }
}

// --- Tab Counts in Parallel ---
async function fetchTabCounts(): Promise<void> {
  try {
    const [allRes, activeRes, suspendedRes, verifRes] = await Promise.allSettled([
      identityApi.listAccounts({ limit: 1 }),
      identityApi.listAccounts({ limit: 1, is_suspended: false }),
      identityApi.listAccounts({ limit: 1, is_suspended: true }),
      verificationApi.getPendingVerificationRequests({ limit: 1 }),
    ]);

    if (allRes.status === "fulfilled") totalCount.value = allRes.value.total;
    if (activeRes.status === "fulfilled") activeCount.value = activeRes.value.total;
    if (suspendedRes.status === "fulfilled") suspendedCount.value = suspendedRes.value.total;
    if (verifRes.status === "fulfilled") pendingVerificationsCount.value = verifRes.value.total;
  } catch (err) {
    console.warn("Failed to fetch user tab counts:", err);
  }
}

// --- Fetch Pending Provider Verifications ---
async function fetchPendingVerifications(): Promise<void> {
  isLoadingVerifications.value = true;
  try {
    const res = await verificationApi.getPendingVerificationRequests({ limit: 50 });
    pendingVerificationsCount.value = res.total;

    const enriched = await Promise.all(
      res.data.map(async (req) => {
        let companyName = "Organización " + req.organization_id.slice(0, 8);
        let taxId = "N/A";
        let kind = "Proveedor";
        try {
          const org = await organizationApi.getOrganizationDetails(req.organization_id);
          companyName = org.company_name;
          taxId = org.tax_id;
          kind = org.kind === "wholesaler" ? "Mayorista" : org.kind === "manufacturer" ? "Fabricante" : "Proveedor";
        } catch {}
        return {
          id: req.id,
          organizationId: req.organization_id,
          companyName,
          taxId,
          kind,
          submittedAt: req.submitted_at,
          status: req.status,
        };
      })
    );
    pendingVerifications.value = enriched;
  } catch (err) {
    console.warn("Failed to fetch pending verifications:", err);
  } finally {
    isLoadingVerifications.value = false;
  }
}

// --- Fetch User Accounts with Server-Side Filters & Pagination ---
async function fetchUsers(): Promise<void> {
  isLoading.value = true;
  try {
    const offset = (currentPage.value - 1) * pageSize.value;

    let isSuspended: boolean | undefined = undefined;
    if (activeTab.value === "active") isSuspended = false;
    else if (activeTab.value === "suspended") isSuspended = true;

    const role = selectedRoleFilter.value === "all" ? undefined : selectedRoleFilter.value;

    let sortBy: "created_at" | "email" = "created_at";
    let sortDir: "asc" | "desc" = "desc";

    if (sortSelection.value === "created_at_asc") {
      sortBy = "created_at";
      sortDir = "asc";
    } else if (sortSelection.value === "email_asc") {
      sortBy = "email";
      sortDir = "asc";
    } else if (sortSelection.value === "email_desc") {
      sortBy = "email";
      sortDir = "desc";
    }

    const response = await identityApi.listAccounts({
      limit: pageSize.value,
      offset,
      search_term: searchQuery.value.trim() || undefined,
      role,
      is_suspended: isSuspended,
      sort_by: sortBy,
      sort_dir: sortDir,
    });

    userList.value = response.data;
    totalItems.value = response.total;

    // Update active tab counter with current query result if matching
    if (activeTab.value === "all" && !searchQuery.value && selectedRoleFilter.value === "all") {
      totalCount.value = response.total;
    }
  } catch (err) {
    console.error("Error fetching accounts:", err);
    userList.value = [];
    totalItems.value = 0;
    toastStore.addToast({
      title: "Error al cargar usuarios",
      message: "No fue posible comunicarse con el servicio de identidad.",
      variant: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

// --- Pagination Computed ---
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize.value)));

const startItemIndex = computed(() => {
  if (totalItems.value === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const endItemIndex = computed(() => {
  return Math.min(currentPage.value * pageSize.value, totalItems.value);
});

// --- Debounced Search & Watchers ---
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch([searchQuery, selectedRoleFilter, sortSelection], () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 350);
});

watch(activeTab, (tab) => {
  if (tab === "verifications") {
    fetchPendingVerifications();
  } else {
    currentPage.value = 1;
    selectedUserIds.value = [];
    fetchUsers();
  }
});

// --- Selection Handlers ---
const isAllSelected = computed(() => {
  if (userList.value.length === 0) return false;
  return userList.value.every((u) => selectedUserIds.value.includes(u.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedUserIds.value = [];
  } else {
    selectedUserIds.value = userList.value.map((u) => u.id);
  }
}

function toggleSelectUser(id: string) {
  const idx = selectedUserIds.value.indexOf(id);
  if (idx > -1) {
    selectedUserIds.value.splice(idx, 1);
  } else {
    selectedUserIds.value.push(id);
  }
}

// --- Reset Filters ---
function handleResetFilters() {
  searchQuery.value = "";
  selectedRoleFilter.value = "all";
  sortSelection.value = "created_at_desc";
  activeTab.value = "all";
  currentPage.value = 1;
  fetchUsers();
  fetchTabCounts();
}

// --- Action Handlers ---
function openViewModal(user: AdminUserItem) {
  viewedUser.value = user;
  isDetailModalOpen.value = true;
}

function openConfirmDialog(user: AdminUserItem) {
  targetUser.value = user;
  isConfirmOpen.value = true;
}

async function handleConfirmToggleSuspend() {
  if (!targetUser.value) return;

  const user = targetUser.value;
  const isCurrentlySuspended = user.is_suspended;
  isMutating.value = true;

  try {
    if (isCurrentlySuspended) {
      await identityApi.unsuspendAccount(user.id);
      user.is_suspended = false;
      user.suspended_at = null;
    } else {
      await identityApi.suspendAccount(user.id);
      user.is_suspended = true;
      user.suspended_at = new Date().toISOString();
    }

    if (viewedUser.value?.id === user.id) {
      viewedUser.value.is_suspended = user.is_suspended;
      viewedUser.value.suspended_at = user.suspended_at;
    }

    toastStore.addToast({
      title: user.is_suspended ? "Cuenta suspendida" : "Cuenta reactivada",
      message: `La cuenta de ${getUserFullName(user)} (${user.email}) ha sido ${user.is_suspended ? "suspendida" : "reactivada"} exitosamente.`,
      variant: user.is_suspended ? "warning" : "success",
    });

    isConfirmOpen.value = false;
    // Refresh list and counts in background
    fetchUsers();
    fetchTabCounts();
  } catch (err) {
    console.error("Failed to toggle account suspension:", err);
    toastStore.addToast({
      title: "Error en la operación",
      message: "No fue posible actualizar el estado de la cuenta.",
      variant: "error",
    });
  } finally {
    isMutating.value = false;
  }
}

onMounted(async () => {
  // Initialize geography store to resolve municipalities
  geoStore.initialize().catch((err) => {
    console.warn("GeoStore initialization warning:", err);
  });
  fetchUsers();
  fetchTabCounts();
  fetchPendingVerifications();
});
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#023859]">
          Usuarios
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-1">
          Directorio de cuentas registradas en Mercanto. Consulta perfiles, roles y administra el estado de acceso.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          @click="fetchUsers(); fetchTabCounts();"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <i :class="['fa-solid fa-arrows-rotate', isLoading ? 'animate-spin text-[#00a896]' : 'text-slate-400']"></i>
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Notice Banner -->
    <div class="rounded-2xl border border-sky-100 bg-[#f0f8ff] p-4 flex items-start gap-3.5 shadow-2xs">
      <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[#0284c7] mt-0.5">
        <i class="fa-solid fa-users text-xs"></i>
      </div>
      <div class="space-y-0.5">
        <p class="text-xs sm:text-sm font-bold text-slate-800">
          Cuentas y Usuarios del Sistema
        </p>
        <p class="text-xs text-slate-500">
          Cada cuenta registrada cuenta con un perfil personal y permisos asociados. Puedes suspender o reactivar el acceso de cualquier usuario en tiempo real.
        </p>
      </div>
    </div>

    <!-- Tabs Bar -->
    <div class="flex items-center gap-6 border-b border-slate-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        @click="activeTab = 'all'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'all'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Todos</span>
        <span v-if="totalCount !== null">({{ totalCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'active'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'active'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Activos</span>
        <span v-if="activeCount !== null">({{ activeCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'suspended'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'suspended'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Suspendidos</span>
        <span v-if="suspendedCount !== null">({{ suspendedCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'verifications'"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'verifications'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Verificación de Proveedores</span>
        <span
          v-if="pendingVerificationsCount !== null && pendingVerificationsCount > 0"
          class="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-bold text-[#ea580c]"
        >
          {{ pendingVerificationsCount }}
        </span>
        <span v-else-if="pendingVerificationsCount !== null" class="text-slate-400">
          (0)
        </span>
      </button>
    </div>

    <!-- Section 1: User Accounts (when activeTab !== 'verifications') -->
    <div v-if="activeTab !== 'verifications'" class="space-y-6">
      <!-- Filters & Search Toolbar -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3">
      <!-- Search input -->
      <div class="relative flex-1 min-w-[280px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, correo o término..."
          class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-8 text-xs sm:text-sm text-[#023859] placeholder-slate-400 transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 font-medium shadow-2xs"
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
        >
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap items-end gap-3">
        <!-- Rol -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Rol</label>
          <div class="relative">
            <select
              v-model="selectedRoleFilter"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[130px]"
            >
              <option value="all">Todos los roles</option>
              <option value="member">Miembros</option>
              <option value="admin">Administradores</option>
              <option value="auditor">Auditores</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Ordenar -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Ordenar por</label>
          <div class="relative">
            <select
              v-model="sortSelection"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[140px]"
            >
              <option value="created_at_desc">Más recientes</option>
              <option value="created_at_asc">Más antiguos</option>
              <option value="email_asc">Correo (A-Z)</option>
              <option value="email_desc">Correo (Z-A)</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
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

    <!-- Table Container -->
    <div class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="min-w-[950px] w-full text-left text-xs">
          <!-- Table Header -->
          <thead class="bg-[#f0f6fa] border-b border-slate-100 text-slate-500 font-semibold">
            <tr>
              <th v-if="isAdmin" scope="col" class="py-3.5 pl-4 pr-2 w-10 text-center">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                  class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                />
              </th>
              <th scope="col" class="px-4 py-3.5">Usuario</th>
              <th scope="col" class="px-4 py-3.5">Cédula</th>
              <th scope="col" class="px-4 py-3.5">Teléfono</th>
              <th scope="col" class="px-4 py-3.5">Ubicación</th>
              <th scope="col" class="px-4 py-3.5">Rol</th>
              <th scope="col" class="px-4 py-3.5">Fecha de registro</th>
              <th scope="col" class="px-4 py-3.5">Estado</th>
              <th scope="col" class="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-100 font-normal">
            <!-- Loading Skeletons -->
            <template v-if="isLoading">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td v-if="isAdmin" class="py-4 pl-4 pr-2 text-center">
                  <div class="h-4 w-4 rounded bg-slate-200 mx-auto"></div>
                </td>
                <td class="px-4 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-slate-200 shrink-0"></div>
                    <div class="space-y-1.5">
                      <div class="h-3 w-28 rounded bg-slate-200"></div>
                      <div class="h-2.5 w-36 rounded bg-slate-100"></div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4"><div class="h-3 w-28 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-24 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-28 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 rounded-full bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-20 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-16 rounded-full bg-slate-200"></div></td>
                <td class="px-4 py-4 text-right"><div class="h-4 w-12 rounded bg-slate-200 ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="userList.length === 0">
              <td :colspan="isAdmin ? 9 : 8" class="px-6 py-12 text-center text-slate-400">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <i class="fa-solid fa-users-slash text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#023859]">No se encontraron usuarios</p>
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

            <!-- Data Rows -->
            <tr
              v-else
              v-for="user in userList"
              :key="user.id"
              :class="[
                'transition-colors hover:bg-slate-50/70',
                user.is_suspended ? 'bg-red-50/20' : ''
              ]"
            >
              <!-- Checkbox -->
              <td v-if="isAdmin" class="py-4 pl-4 pr-2 text-center">
                <input
                  type="checkbox"
                  :checked="selectedUserIds.includes(user.id)"
                  @change="toggleSelectUser(user.id)"
                  class="rounded border-slate-300 text-[#00a896] focus:ring-[#00a896] cursor-pointer"
                />
              </td>

              <!-- Usuario (Avatar + Nombre + Correo) -->
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <!-- Circular avatar with initials or blob -->
                  <div
                    v-if="user.avatar_blob_id"
                    class="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200"
                  >
                    <ProfileAvatar :blob-id="user.avatar_blob_id" :alt="getUserFullName(user) || undefined" />
                  </div>
                  <div
                    v-else
                    :class="[
                      'h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs',
                      getAvatarBg(user.id)
                    ]"
                  >
                    {{ getUserInitials(user) }}
                  </div>

                  <div class="min-w-0">
                    <p class="truncate font-bold text-slate-800 text-xs sm:text-sm">
                      <span v-if="getUserFullName(user)">{{ getUserFullName(user) }}</span>
                      <span v-else class="text-slate-400 font-medium">N/A</span>
                    </p>
                    <p class="truncate text-slate-400 text-[11px] font-normal">
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Cédula -->
              <td class="px-4 py-4 font-mono font-medium text-slate-600">
                <NationalIdDisplay v-if="user.national_id" :value="user.national_id" />
                <span v-else class="text-slate-400 font-medium text-xs">N/A</span>
              </td>

              <!-- Teléfono -->
              <td class="px-4 py-4 text-slate-600 font-medium">
                <PhoneDisplay v-if="user.phone_number" :value="user.phone_number" />
                <span v-else class="text-slate-400 font-medium text-xs">N/A</span>
              </td>

              <!-- Ubicación / Municipio -->
              <td class="px-4 py-4 text-slate-600">
                <span v-if="getLocationLabel(user.municipality_id) !== 'N/A'">{{ getLocationLabel(user.municipality_id) }}</span>
                <span v-else class="text-slate-400 font-medium text-xs">N/A</span>
              </td>

              <!-- Rol -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                    getRoleBadge(user.role).badgeClass
                  ]"
                >
                  <span :class="['h-1.5 w-1.5 rounded-full', getRoleBadge(user.role).dotClass]"></span>
                  <span>{{ getRoleBadge(user.role).label }}</span>
                </span>
              </td>

              <!-- Fecha de registro -->
              <td class="px-4 py-4 whitespace-nowrap">
                <template v-if="formatDate(user.created_at) !== 'N/A'">
                  <p class="font-medium text-slate-700 text-xs">{{ formatDate(user.created_at) }}</p>
                  <p v-if="formatTime(user.created_at)" class="text-slate-400 text-[11px]">{{ formatTime(user.created_at) }}</p>
                </template>
                <span v-else class="text-slate-400 font-medium text-xs">N/A</span>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4 whitespace-nowrap">
                <span
                  v-if="user.is_suspended"
                  class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                  :title="user.suspended_at ? `Suspendido el ${formatDate(user.suspended_at)}` : 'Cuenta suspendida'"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span>Suspendido</span>
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-[#f0fdfa] px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#14b8a6]"></span>
                  <span>Activo</span>
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-4 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2.5">
                  <!-- Ver button (Eye icon + text) -->
                  <button
                    type="button"
                    @click="openViewModal(user)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:text-[#023859] hover:underline transition-colors cursor-pointer"
                  >
                    <i class="fa-regular fa-eye text-xs"></i>
                    <span>Ver</span>
                  </button>

                  <template v-if="isAdmin">
                    <span class="text-slate-300">|</span>

                    <!-- Suspender / Reactivar button -->
                    <button
                      v-if="user.id === currentUserId"
                      type="button"
                      disabled
                      title="No puedes suspender tu propia cuenta activa"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-slate-300 cursor-not-allowed opacity-60"
                    >
                      <i class="fa-solid fa-ban text-xs"></i>
                      <span>Suspender</span>
                    </button>

                    <button
                      v-else-if="user.is_suspended"
                      type="button"
                      @click="openConfirmDialog(user)"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors cursor-pointer"
                    >
                      <i class="fa-solid fa-user-check text-xs"></i>
                      <span>Reactivar</span>
                    </button>

                    <button
                      v-else
                      type="button"
                      @click="openConfirmDialog(user)"
                      class="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                    >
                      <i class="fa-solid fa-user-slash text-xs"></i>
                      <span>Suspender</span>
                    </button>
                  </template>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4 text-xs text-slate-500">
        <div>
          Mostrando <span class="font-bold text-slate-700">{{ startItemIndex }}-{{ endItemIndex }}</span> de
          <span class="font-bold text-slate-700">{{ totalItems }}</span> usuarios
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Prev Button -->
          <button
            type="button"
            @click="currentPage = Math.max(1, currentPage - 1); fetchUsers();"
            :disabled="currentPage <= 1 || isLoading"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          <!-- Number buttons -->
          <button
            v-for="p in totalPages"
            :key="p"
            type="button"
            @click="currentPage = p; fetchUsers();"
            :disabled="isLoading"
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
            @click="currentPage = Math.min(totalPages, currentPage + 1); fetchUsers();"
            :disabled="currentPage >= totalPages || isLoading"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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

    <!-- Section 2: Verification Requests Table (when activeTab === 'verifications') -->
    <div v-else class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
      <div v-if="isLoadingVerifications" class="p-12 text-center text-slate-500">
        <i class="fa-solid fa-spinner fa-spin text-2xl text-[#00a896] mb-2"></i>
        <p class="text-xs font-semibold">Cargando solicitudes de verificación...</p>
      </div>

      <div v-else-if="pendingVerifications.length === 0" class="p-12 text-center text-slate-500">
        <div class="w-12 h-12 rounded-full bg-teal-50 text-[#00a896] flex items-center justify-center mx-auto mb-3">
          <i class="fa-solid fa-circle-check text-xl"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">No hay solicitudes pendientes</h4>
        <p class="text-xs text-slate-400 mt-1">Todas las solicitudes de verificación de proveedores han sido procesadas.</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-[850px] w-full text-left text-xs">
          <thead class="bg-[#f0f6fa] border-b border-slate-100 text-slate-500 font-semibold">
            <tr>
              <th scope="col" class="px-5 py-3.5">Organización / Empresa</th>
              <th scope="col" class="px-4 py-3.5">RUC / Cédula</th>
              <th scope="col" class="px-4 py-3.5">Tipo</th>
              <th scope="col" class="px-4 py-3.5">Fecha de Envío</th>
              <th scope="col" class="px-4 py-3.5">Estado</th>
              <th scope="col" class="px-5 py-3.5 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="req in pendingVerifications"
              :key="req.id"
              class="hover:bg-slate-50/70 transition-colors"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-teal-50 text-[#00a896] font-bold text-xs border border-teal-100">
                    <i class="fa-solid fa-building text-sm"></i>
                  </div>
                  <div>
                    <p class="font-bold text-slate-800 text-xs sm:text-sm">{{ req.companyName }}</p>
                    <p class="font-mono text-[10px] text-slate-400">ID: {{ req.id.slice(0, 8) }}...</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 font-mono font-medium text-slate-600">
                {{ req.taxId }}
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {{ req.kind }}
                </span>
              </td>
              <td class="px-4 py-4 text-slate-600">
                {{ formatDate(req.submittedAt) }}
              </td>
              <td class="px-4 py-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#ea580c]">
                  <span class="h-1.5 w-1.5 rounded-full bg-[#ea580c]"></span>
                  <span>Pendiente</span>
                </span>
              </td>
              <td class="px-5 py-4 text-right whitespace-nowrap">
                <button
                  type="button"
                  @click="router.push({ name: 'admin-user-detail', params: { id: req.id } })"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-[#00a896] hover:bg-[#008f80] text-white px-3.5 py-2 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <i class="fa-solid fa-file-circle-check text-xs"></i>
                  <span>Auditar Documentos</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal "Ver" Detalle de Usuario -->
    <div
      v-if="isDetailModalOpen && viewedUser"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <!-- Modal Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              v-if="viewedUser.avatar_blob_id"
              class="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100"
            >
              <ProfileAvatar :blob-id="viewedUser.avatar_blob_id" :alt="getUserFullName(viewedUser) || undefined" />
            </div>
            <div
              v-else
              :class="[
                'h-12 w-12 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-xs',
                getAvatarBg(viewedUser.id)
              ]"
            >
              {{ getUserInitials(viewedUser) }}
            </div>

            <div>
              <h3 class="text-base font-bold text-[#023859]">
                {{ getUserFullName(viewedUser) || 'N/A' }}
              </h3>
              <p class="text-xs text-slate-400">{{ viewedUser.email || 'N/A' }}</p>
            </div>
          </div>

          <button
            type="button"
            @click="isDetailModalOpen = false"
            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        <!-- Details Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <!-- Cédula -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Cédula de Identidad</span>
            <span class="font-mono font-bold text-slate-800">
              <NationalIdDisplay v-if="viewedUser.national_id" :value="viewedUser.national_id" />
              <span v-else class="text-slate-400 font-medium font-sans">N/A</span>
            </span>
          </div>

          <!-- Teléfono -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Teléfono</span>
            <span class="font-semibold text-slate-800">
              <PhoneDisplay v-if="viewedUser.phone_number" :value="viewedUser.phone_number" />
              <span v-else class="text-slate-400 font-medium">N/A</span>
            </span>
          </div>

          <!-- Rol -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Rol en el Sistema</span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-0.5',
                getRoleBadge(viewedUser.role).badgeClass
              ]"
            >
              <span :class="['h-1.5 w-1.5 rounded-full', getRoleBadge(viewedUser.role).dotClass]"></span>
              <span>{{ getRoleBadge(viewedUser.role).label }}</span>
            </span>
          </div>

          <!-- Ubicación -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Ubicación / Municipio</span>
            <span class="font-semibold text-slate-800">
              <span v-if="getLocationLabel(viewedUser.municipality_id) !== 'N/A'">{{ getLocationLabel(viewedUser.municipality_id) }}</span>
              <span v-else class="text-slate-400 font-medium">N/A</span>
            </span>
          </div>

          <!-- Estado Acceso -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Estado de Acceso</span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold mt-0.5',
                viewedUser.is_suspended ? 'bg-red-100/70 text-red-600' : 'bg-teal-100/70 text-[#00a896]'
              ]"
            >
              <i :class="['text-[10px]', viewedUser.is_suspended ? 'fa-solid fa-ban' : 'fa-solid fa-check']"></i>
              {{ viewedUser.is_suspended ? 'Cuenta Suspendida' : 'Cuenta Activa' }}
            </span>
          </div>

          <!-- Fecha registro -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Fecha de Registro</span>
            <span class="font-medium text-slate-700">
              <template v-if="formatDate(viewedUser.created_at) !== 'N/A'">
                {{ formatDate(viewedUser.created_at) }} <span class="text-slate-400 text-[11px]">{{ formatTime(viewedUser.created_at) }}</span>
              </template>
              <span v-else class="text-slate-400 font-medium">N/A</span>
            </span>
          </div>

          <!-- Fecha de suspensión (si aplica) -->
          <div v-if="viewedUser.is_suspended && viewedUser.suspended_at" class="rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-1 sm:col-span-2">
            <span class="text-red-500 block font-medium">Fecha de Suspensión</span>
            <span class="font-medium text-red-700">
              <template v-if="formatDate(viewedUser.suspended_at) !== 'N/A'">
                {{ formatDate(viewedUser.suspended_at) }} <template v-if="formatTime(viewedUser.suspended_at)">a las {{ formatTime(viewedUser.suspended_at) }}</template>
              </template>
              <span v-else class="text-slate-400 font-medium">N/A</span>
            </span>
          </div>

          <!-- ID de cuenta -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1 sm:col-span-2">
            <span class="text-slate-400 block font-medium">ID de Cuenta (UUID)</span>
            <span class="font-mono text-[11px] text-slate-600 select-all">{{ viewedUser.id || 'N/A' }}</span>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <template v-if="isAdmin">
            <button
              v-if="viewedUser.id !== currentUserId"
              type="button"
              @click="isDetailModalOpen = false; openConfirmDialog(viewedUser)"
              :class="[
                'inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors',
                viewedUser.is_suspended
                  ? 'text-emerald-600 hover:text-emerald-700'
                  : 'text-red-500 hover:text-red-700'
              ]"
            >
              <i :class="['text-xs', viewedUser.is_suspended ? 'fa-solid fa-user-check' : 'fa-solid fa-user-slash']"></i>
              <span>{{ viewedUser.is_suspended ? 'Reactivar cuenta' : 'Suspender cuenta' }}</span>
            </button>
            <span v-else class="text-xs text-slate-400 italic">Tu cuenta activa</span>
          </template>
          <div v-else></div>

          <button
            type="button"
            @click="isDetailModalOpen = false"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Suspend/Unsuspend Modal -->
    <div
      v-if="isAdmin && isConfirmOpen && targetUser"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div class="flex items-center gap-3">
          <div
            :class="[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              targetUser.is_suspended ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            ]"
          >
            <i :class="['text-lg', targetUser.is_suspended ? 'fa-solid fa-user-check' : 'fa-solid fa-user-slash']"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-[#023859]">
              {{ targetUser.is_suspended ? 'Reactivar cuenta' : 'Suspender cuenta' }}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
              {{ targetUser.email }}
            </p>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">
          <template v-if="targetUser.is_suspended">
            ¿Estás seguro de que deseas reactivar la cuenta de
            <strong class="text-slate-800">{{ getUserFullName(targetUser) }}</strong>?
            El usuario podrá volver a iniciar sesión y utilizar la plataforma con normalidad.
          </template>
          <template v-else>
            ¿Estás seguro de que deseas suspender la cuenta de
            <strong class="text-slate-800">{{ getUserFullName(targetUser) }}</strong>?
            Se revocarán sus sesiones activas de inmediato y no podrá acceder a Mercanto hasta que sea reactivado.
          </template>
        </p>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            :disabled="isMutating"
            @click="isConfirmOpen = false"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            :disabled="isMutating"
            @click="handleConfirmToggleSuspend"
            :class="[
              'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors disabled:opacity-50 cursor-pointer',
              targetUser.is_suspended
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            ]"
          >
            <i v-if="isMutating" class="fa-solid fa-spinner animate-spin text-xs"></i>
            <span>
              {{
                isMutating
                  ? 'Procesando...'
                  : targetUser.is_suspended
                  ? 'Sí, reactivar cuenta'
                  : 'Sí, suspender cuenta'
              }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
