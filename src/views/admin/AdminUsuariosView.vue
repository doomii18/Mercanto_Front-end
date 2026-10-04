<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectPortal,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  AlertDialogRoot,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "reka-ui";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import type { AdminUserItem, AccountRole, AccountFiltersQuery } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/ui";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import { formatCedula } from "@/utils/formatters";

const identityApi = useIdentityApi();
const authStore = useAuthStore();
const toastStore = useToastStore();

// --- State ---
const users = ref<AdminUserItem[]>([]);
const totalUsers = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Pagination
const limit = ref(10);
const offset = ref(0);

// Filters
const searchQuery = ref("");
const selectedRole = ref<string>("all");
const selectedStatus = ref<string>("all");
const selectedSort = ref<string>("created_at_desc");

// Action dialog states
const isConfirmOpen = ref(false);
const targetUser = ref<AdminUserItem | null>(null);
const isMutating = ref(false);

// Mock View modal state
const isViewModalOpen = ref(false);
const viewedUser = ref<AdminUserItem | null>(null);

// Computed pagination helpers
const currentPage = computed(() => Math.floor(offset.value / limit.value) + 1);
const totalPages = computed(() => Math.max(1, Math.ceil(totalUsers.value / limit.value)));
const startRange = computed(() => (totalUsers.value === 0 ? 0 : offset.value + 1));
const endRange = computed(() => Math.min(offset.value + limit.value, totalUsers.value));

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== "" ||
    selectedRole.value !== "all" ||
    selectedStatus.value !== "all" ||
    selectedSort.value !== "created_at_desc"
  );
});

// Current logged in user ID to prevent self-suspension
const currentUserId = computed(() => authStore.account?.id);

// --- Data Fetching ---
async function fetchUsers(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    const params: AccountFiltersQuery = {
      limit: limit.value,
      offset: offset.value,
    };

    const trimmedSearch = searchQuery.value.trim();
    if (trimmedSearch) {
      params.search_term = trimmedSearch;
    }

    if (selectedRole.value !== "all") {
      params.role = selectedRole.value as AccountRole;
    }

    if (selectedStatus.value === "active") {
      params.is_suspended = false;
    } else if (selectedStatus.value === "suspended") {
      params.is_suspended = true;
    }

    if (selectedSort.value === "created_at_desc") {
      params.sort_by = "created_at";
      params.sort_dir = "desc";
    } else if (selectedSort.value === "created_at_asc") {
      params.sort_by = "created_at";
      params.sort_dir = "asc";
    } else if (selectedSort.value === "email_asc") {
      params.sort_by = "email";
      params.sort_dir = "asc";
    } else if (selectedSort.value === "email_desc") {
      params.sort_by = "email";
      params.sort_dir = "desc";
    }

    const response = await identityApi.listAccounts(params);
    users.value = response.data;
    totalUsers.value = response.total;
  } catch (err: unknown) {
    console.error("Failed to load accounts:", err);
    error.value = "No se pudieron cargar los usuarios. Por favor, intenta de nuevo.";
  } finally {
    isLoading.value = false;
  }
}

const debouncedFetch = useDebounceFn(() => {
  offset.value = 0;
  fetchUsers();
}, 300);

function handleSearchInput() {
  debouncedFetch();
}

function handleFilterChange() {
  offset.value = 0;
  fetchUsers();
}

function resetFilters() {
  searchQuery.value = "";
  selectedRole.value = "all";
  selectedStatus.value = "all";
  selectedSort.value = "created_at_desc";
  offset.value = 0;
  fetchUsers();
}

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  offset.value = (page - 1) * limit.value;
  fetchUsers();
}

// Watch filters
watch([selectedRole, selectedStatus, selectedSort], () => {
  handleFilterChange();
});

onMounted(() => {
  fetchUsers();
});

// --- Actions ---
function openConfirmDialog(user: AdminUserItem) {
  targetUser.value = user;
  isConfirmOpen.value = true;
}

function openViewModal(user: AdminUserItem) {
  viewedUser.value = user;
  isViewModalOpen.value = true;
}

async function handleConfirmToggleSuspend() {
  if (!targetUser.value) return;

  const user = targetUser.value;
  const isCurrentlySuspended = user.is_suspended;
  isMutating.value = true;

  try {
    if (isCurrentlySuspended) {
      const updated = await identityApi.unsuspendAccount(user.id);
      user.is_suspended = false;
      user.suspended_at = updated.suspended_at;
      toastStore.addToast({
        title: "Cuenta reactivada",
        message: `La cuenta ${user.email} ha sido reactivada exitosamente.`,
        variant: "success",
      });
    } else {
      const updated = await identityApi.suspendAccount(user.id);
      user.is_suspended = true;
      user.suspended_at = updated.suspended_at;
      toastStore.addToast({
        title: "Cuenta suspendida",
        message: `La cuenta ${user.email} ha sido suspendida exitosamente.`,
        variant: "warning",
      });
    }
    isConfirmOpen.value = false;
  } catch (err: unknown) {
    console.error("Action failed:", err);
    toastStore.addToast({
      title: "Error en la operación",
      message: "No fue posible actualizar el estado de la cuenta.",
      variant: "error",
    });
  } finally {
    isMutating.value = false;
  }
}

// --- Formatters & Helpers ---
function formatUserName(user: AdminUserItem): string {
  if (user.first_name || user.last_name) {
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  }
  return user.email.split("@")[0] ?? "Usuario";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-NI", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatFullDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-NI", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
</script>

<template>
  <div class="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[#062235]">Usuarios</h1>
        <p class="text-sm text-slate-500 mt-1">
          Administra los usuarios registrados en la plataforma, supervisa sus roles y gestiona suspensiones.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="fetchUsers"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
        >
          <i :class="['fa-solid fa-arrows-rotate', isLoading ? 'animate-spin text-[#00a896]' : 'text-slate-400']"></i>
          <span>Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Search Input -->
        <div class="relative">
          <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, correo..."
            @input="handleSearchInput"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-sm text-[#062235] placeholder-slate-400 transition-colors focus:border-[#00a896] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''; handleSearchInput()"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        <!-- Role Filter (Reka UI Select) -->
        <div>
          <SelectRoot v-model="selectedRole">
            <SelectTrigger
              class="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-700 transition-colors hover:bg-white focus:border-[#00a896] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            >
              <div class="flex items-center gap-2 truncate">
                <i class="fa-solid fa-user-tag text-xs text-slate-400"></i>
                <SelectValue placeholder="Rol: Todos" />
              </div>
              <SelectIcon>
                <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </SelectIcon>
            </SelectTrigger>

            <SelectPortal>
              <SelectContent
                position="popper"
                :side-offset="5"
                class="z-50 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl"
              >
                <SelectViewport class="p-1 space-y-0.5">
                  <SelectItem
                    value="all"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Todos los roles</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="member"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Usuario</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="admin"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Administrador</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="auditor"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Auditor</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <!-- Status Filter (Reka UI Select) -->
        <div>
          <SelectRoot v-model="selectedStatus">
            <SelectTrigger
              class="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-700 transition-colors hover:bg-white focus:border-[#00a896] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            >
              <div class="flex items-center gap-2 truncate">
                <i class="fa-solid fa-circle-notch text-xs text-slate-400"></i>
                <SelectValue placeholder="Estado: Todos" />
              </div>
              <SelectIcon>
                <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </SelectIcon>
            </SelectTrigger>

            <SelectPortal>
              <SelectContent
                position="popper"
                :side-offset="5"
                class="z-50 min-w-[180px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl"
              >
                <SelectViewport class="p-1 space-y-0.5">
                  <SelectItem
                    value="all"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Todos los estados</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="active"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Activos</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="suspended"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Suspendidos</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <!-- Sort Filter (Reka UI Select) -->
        <div>
          <SelectRoot v-model="selectedSort">
            <SelectTrigger
              class="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-700 transition-colors hover:bg-white focus:border-[#00a896] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00a896]/15"
            >
              <div class="flex items-center gap-2 truncate">
                <i class="fa-solid fa-arrow-down-wide-short text-xs text-slate-400"></i>
                <SelectValue placeholder="Ordenar por" />
              </div>
              <SelectIcon>
                <i class="fa-solid fa-chevron-down text-[10px] text-slate-400"></i>
              </SelectIcon>
            </SelectTrigger>

            <SelectPortal>
              <SelectContent
                position="popper"
                :side-offset="5"
                class="z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-xl"
              >
                <SelectViewport class="p-1 space-y-0.5">
                  <SelectItem
                    value="created_at_desc"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Más recientes primero</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="created_at_asc"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Más antiguos primero</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="email_asc"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Correo (A - Z)</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>

                  <SelectItem
                    value="email_desc"
                    class="relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none hover:bg-slate-100 data-[highlighted]:bg-[#00a896]/10 data-[highlighted]:text-[#023859]"
                  >
                    <SelectItemText>Correo (Z - A)</SelectItemText>
                    <SelectItemIndicator class="ml-auto text-[#00a896]">
                      <i class="fa-solid fa-check text-xs"></i>
                    </SelectItemIndicator>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>
      </div>

      <!-- Active filters bar -->
      <div v-if="hasActiveFilters" class="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span class="text-slate-500 font-medium">Filtros activos aplicados</span>
        <button
          type="button"
          @click="resetFilters"
          class="font-semibold text-[#00a896] hover:underline inline-flex items-center gap-1"
        >
          <i class="fa-solid fa-filter-circle-xmark text-xs"></i>
          <span>Limpiar filtros</span>
        </button>
      </div>
    </div>

    <!-- Error state -->
    <div
      v-if="error"
      class="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 flex items-center justify-between"
    >
      <div class="flex items-center gap-2">
        <i class="fa-solid fa-circle-exclamation text-base text-red-500"></i>
        <span>{{ error }}</span>
      </div>
      <button
        type="button"
        @click="fetchUsers"
        class="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
      >
        Reintentar
      </button>
    </div>

    <!-- Table Container -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <th scope="col" class="px-6 py-3.5">Usuario</th>
              <th scope="col" class="px-6 py-3.5">Cédula / Teléfono</th>
              <th scope="col" class="px-6 py-3.5">Rol</th>
              <th scope="col" class="px-6 py-3.5">Estado</th>
              <th scope="col" class="px-6 py-3.5">Registro</th>
              <th scope="col" class="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <!-- Loading Skeleton Rows -->
            <template v-if="isLoading && users.length === 0">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="h-9 w-9 rounded-full bg-slate-200 shrink-0"></div>
                    <div class="space-y-1.5">
                      <div class="h-3.5 w-32 rounded-sm bg-slate-200"></div>
                      <div class="h-3 w-40 rounded-sm bg-slate-100"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="space-y-1.5">
                    <div class="h-3 w-24 rounded-sm bg-slate-200"></div>
                    <div class="h-3 w-20 rounded-sm bg-slate-100"></div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-5 w-20 rounded-full bg-slate-200"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-5 w-16 rounded-full bg-slate-200"></div>
                </td>
                <td class="px-6 py-4">
                  <div class="h-3.5 w-20 rounded-sm bg-slate-200"></div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="h-4 w-16 rounded-sm bg-slate-200 ml-auto"></div>
                </td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="!isLoading && users.length === 0">
              <td colspan="6" class="px-6 py-12 text-center">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <i class="fa-solid fa-users-slash text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#062235]">No se encontraron usuarios</p>
                <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No hay cuentas que coincidan con los criterios o filtros de búsqueda ingresados.
                </p>
                <button
                  v-if="hasActiveFilters"
                  type="button"
                  @click="resetFilters"
                  class="mt-3 text-xs font-semibold text-[#00a896] hover:underline"
                >
                  Restablecer todos los filtros
                </button>
              </td>
            </tr>

            <!-- User Data Rows -->
            <tr
              v-for="user in users"
              :key="user.id"
              :class="[
                'transition-colors hover:bg-slate-50/70',
                user.is_suspended ? 'bg-red-50/30' : ''
              ]"
            >
              <!-- Usuario Column -->
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200">
                    <ProfileAvatar :blob-id="user.avatar_blob_id" :alt="formatUserName(user)" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5">
                      <p class="truncate text-sm font-semibold text-[#062235]">
                        {{ formatUserName(user) }}
                      </p>
                      <span
                        v-if="user.id === currentUserId"
                        class="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        Tú
                      </span>
                    </div>
                    <p class="truncate text-xs text-slate-500">{{ user.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Cédula / Teléfono -->
              <td class="px-6 py-4 text-xs">
                <div class="text-slate-700 font-medium font-mono">
                  {{ user.national_id ? formatCedula(user.national_id) : "—" }}
                </div>
                <div class="text-slate-400 mt-0.5">
                  {{ user.phone_number || "—" }}
                </div>
              </td>

              <!-- Rol Column -->
              <td class="px-6 py-4">
                <!-- Admin -->
                <span
                  v-if="user.role === 'admin'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                >
                  <i class="fa-solid fa-shield text-[10px]"></i>
                  Administrador
                </span>

                <!-- Auditor -->
                <span
                  v-else-if="user.role === 'auditor'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                >
                  <i class="fa-solid fa-clipboard-check text-[10px]"></i>
                  Auditor
                </span>

                <!-- Member (Usuario) -->
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
                >
                  <i class="fa-solid fa-user text-[10px]"></i>
                  Usuario
                </span>
              </td>

              <!-- Estado Column -->
              <td class="px-6 py-4">
                <span
                  v-if="user.is_suspended"
                  class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700"
                  :title="user.suspended_at ? `Suspendido el ${formatFullDateTime(user.suspended_at)}` : 'Cuenta suspendida'"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  Suspendido
                </span>

                <span
                  v-else
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
                  Activo
                </span>
              </td>

              <!-- Registro Column -->
              <td class="px-6 py-4 text-xs text-slate-500 whitespace-nowrap" :title="formatFullDateTime(user.created_at)">
                {{ formatDate(user.created_at) }}
              </td>

              <!-- Acciones Column -->
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end gap-2.5">
                  <!-- Ver action (Mock detail view) -->
                  <button
                    type="button"
                    @click="openViewModal(user)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-[#00a896] hover:text-[#023859] hover:underline transition-colors"
                  >
                    <i class="fa-solid fa-eye text-xs"></i>
                    <span>Ver</span>
                  </button>

                  <span class="text-slate-300">|</span>

                  <!-- Suspend / Reactivate action button -->
                  <button
                    v-if="user.id === currentUserId"
                    type="button"
                    disabled
                    title="No puedes suspender tu propia cuenta activa"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 cursor-not-allowed opacity-60"
                  >
                    <i class="fa-solid fa-ban text-xs"></i>
                    <span>Suspender</span>
                  </button>

                  <button
                    v-else-if="user.is_suspended"
                    type="button"
                    @click="openConfirmDialog(user)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                  >
                    <i class="fa-solid fa-user-check text-xs"></i>
                    <span>Reactivar</span>
                  </button>

                  <button
                    v-else
                    type="button"
                    @click="openConfirmDialog(user)"
                    class="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                  >
                    <i class="fa-solid fa-user-slash text-xs"></i>
                    <span>Suspender</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 text-xs text-slate-500">
        <div>
          Mostrando <span class="font-semibold text-slate-700">{{ startRange }}</span> a
          <span class="font-semibold text-slate-700">{{ endRange }}</span> de
          <span class="font-semibold text-slate-700">{{ totalUsers }}</span> usuarios
        </div>

        <div class="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            @click="goToPage(currentPage - 1)"
            :disabled="currentPage <= 1 || isLoading"
            class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <i class="fa-solid fa-chevron-left text-[10px] mr-1"></i>
            Anterior
          </button>

          <span class="px-2 font-medium text-slate-600">
            Página {{ currentPage }} de {{ totalPages }}
          </span>

          <button
            type="button"
            @click="goToPage(currentPage + 1)"
            :disabled="currentPage >= totalPages || isLoading"
            class="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-semibold text-slate-600 shadow-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Siguiente
            <i class="fa-solid fa-chevron-right text-[10px] ml-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Confirm Suspend/Unsuspend AlertDialog (Reka UI) -->
    <AlertDialogRoot v-model:open="isConfirmOpen">
      <AlertDialogPortal>
        <AlertDialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <AlertDialogContent
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-4"
        >
          <div class="flex items-center gap-3">
            <div
              :class="[
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                targetUser?.is_suspended ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              ]"
            >
              <i :class="['text-lg', targetUser?.is_suspended ? 'fa-solid fa-user-check' : 'fa-solid fa-user-slash']"></i>
            </div>
            <div>
              <AlertDialogTitle class="text-base font-bold text-[#062235]">
                {{ targetUser?.is_suspended ? 'Reactivar cuenta de usuario' : 'Suspender cuenta de usuario' }}
              </AlertDialogTitle>
              <p class="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                {{ targetUser?.email }}
              </p>
            </div>
          </div>

          <AlertDialogDescription class="text-sm text-slate-600 leading-relaxed">
            <template v-if="targetUser?.is_suspended">
              ¿Estás seguro de que deseas reactivar la cuenta de
              <strong class="text-slate-800">{{ formatUserName(targetUser) }}</strong>?
              El usuario podrá volver a iniciar sesión y utilizar los servicios de la plataforma.
            </template>
            <template v-else>
              ¿Estás seguro de que deseas suspender la cuenta de
              <strong class="text-slate-800">{{ formatUserName(targetUser!) }}</strong>?
              Se revocarán de inmediato todas sus sesiones activas y no podrá acceder a la plataforma hasta que sea reactivado.
            </template>
          </AlertDialogDescription>

          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <AlertDialogCancel
              :disabled="isMutating"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              as="button"
              :disabled="isMutating"
              @click.prevent="handleConfirmToggleSuspend"
              :class="[
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors disabled:opacity-50',
                targetUser?.is_suspended
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              ]"
            >
              <i v-if="isMutating" class="fa-solid fa-spinner animate-spin text-xs"></i>
              <span>
                {{
                  isMutating
                    ? 'Procesando...'
                    : targetUser?.is_suspended
                    ? 'Sí, reactivar cuenta'
                    : 'Sí, suspender cuenta'
                }}
              </span>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>

    <!-- Mock View Detail Dialog (Reka UI) -->
    <DialogRoot v-model:open="isViewModalOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs transition-opacity" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl space-y-5"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-slate-100">
                <ProfileAvatar
                  v-if="viewedUser"
                  :blob-id="viewedUser.avatar_blob_id"
                  :alt="formatUserName(viewedUser)"
                />
              </div>
              <div>
                <DialogTitle class="text-base font-bold text-[#062235]">
                  {{ viewedUser ? formatUserName(viewedUser) : '' }}
                </DialogTitle>
                <DialogDescription class="text-xs text-slate-500">
                  {{ viewedUser?.email }}
                </DialogDescription>
              </div>
            </div>

            <DialogClose class="text-slate-400 hover:text-slate-600 p-1">
              <i class="fa-solid fa-xmark text-base"></i>
            </DialogClose>
          </div>

          <!-- Mock Badge Notice -->
          <div class="flex items-center gap-2 rounded-xl bg-blue-50/70 border border-blue-100 p-3 text-xs text-blue-700">
            <i class="fa-solid fa-circle-info text-blue-500 text-sm shrink-0"></i>
            <span>Vista de detalle de cuenta en modo de auditoría administrativa.</span>
          </div>

          <!-- Details Grid -->
          <div v-if="viewedUser" class="grid grid-cols-2 gap-3 text-xs">
            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">ID de Cuenta</span>
              <span class="font-mono font-semibold text-slate-800 break-all">{{ viewedUser.id }}</span>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">Rol Asignado</span>
              <span class="font-semibold text-slate-800 capitalize">{{ viewedUser.role }}</span>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">Cédula de Identidad</span>
              <span class="font-mono font-semibold text-slate-800">{{ viewedUser.national_id ? formatCedula(viewedUser.national_id) : "No especificada" }}</span>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">Teléfono de Contacto</span>
              <span class="font-semibold text-slate-800">{{ viewedUser.phone_number || "No registrado" }}</span>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">Estado</span>
              <span :class="['font-semibold inline-flex items-center gap-1', viewedUser.is_suspended ? 'text-red-600' : 'text-teal-600']">
                <i :class="['text-[10px]', viewedUser.is_suspended ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check']"></i>
                {{ viewedUser.is_suspended ? 'Suspendido' : 'Activo' }}
              </span>
            </div>

            <div class="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
              <span class="text-slate-400 block font-medium">Fecha de Registro</span>
              <span class="font-semibold text-slate-800">{{ formatFullDateTime(viewedUser.created_at) }}</span>
            </div>

            <div v-if="viewedUser.suspended_at" class="col-span-2 rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-1">
              <span class="text-red-500 block font-medium">Fecha de Suspensión</span>
              <span class="font-semibold text-red-700">{{ formatFullDateTime(viewedUser.suspended_at) }}</span>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <DialogClose class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cerrar
            </DialogClose>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
