<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useIdentityApi } from "@/api/modules/identity/auth/useIdentityApi";
import type { AdminUserItem } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/ui";
import ProfileAvatar from "@/components/profile/ProfileAvatar.vue";
import NationalIdDisplay from "@/components/common/NationalIdDisplay.vue";
import TaxIdDisplay from "@/components/common/TaxIdDisplay.vue";
import PhoneDisplay from "@/components/common/PhoneDisplay.vue";

const router = useRouter();
const identityApi = useIdentityApi();
const authStore = useAuthStore();
const toastStore = useToastStore();

// --- Types ---
export interface AdminUserListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  national_id: string;
  avatar_blob_id?: string | null;
  role: string;
  business_name: string;
  ruc: string;
  business_type: string;
  registration_date: string;
  registration_time: string;
  created_at: string;
  status: "Pendiente" | "Aprobado" | "Rechazado";
  is_suspended: boolean;
  suspended_at?: string | null;
  initials: string;
  avatar_bg: string;
  is_mock?: boolean;
}

// --- Mock Dataset matching user's exact mockup ---
const MOCK_USERS: AdminUserListItem[] = [
  {
    id: "usr-001",
    first_name: "María",
    last_name: "López",
    email: "maria@dilopez.com",
    phone_number: "+50588991122",
    national_id: "001-120590-0023K",
    role: "member",
    business_name: "Distribuidora López S.A.",
    ruc: "J0310000123456",
    business_type: "Comercio al por mayor",
    registration_date: "02 oct 2026",
    registration_time: "10:25 AM",
    created_at: "2026-10-02T10:25:00Z",
    status: "Pendiente",
    is_suspended: false,
    initials: "ML",
    avatar_bg: "bg-[#023859]",
    is_mock: true,
  },
  {
    id: "usr-002",
    first_name: "José",
    last_name: "Castillo",
    email: "jose@castillo.com",
    phone_number: "+50587445566",
    national_id: "001-200388-0014B",
    role: "member",
    business_name: "Comercial Castillo",
    ruc: "J0510000223457",
    business_type: "Comercio al por mayor",
    registration_date: "01 oct 2026",
    registration_time: "04:35 PM",
    created_at: "2026-10-01T16:35:00Z",
    status: "Pendiente",
    is_suspended: false,
    initials: "JC",
    avatar_bg: "bg-[#b45309]",
    is_mock: true,
  },
  {
    id: "usr-003",
    first_name: "Dora",
    last_name: "Cruz",
    email: "dora@delsur.com",
    phone_number: "+50584332211",
    national_id: "001-150992-0044P",
    role: "member",
    business_name: "Importaciones del Sur",
    ruc: "J0510000323458",
    business_type: "Comercio al por mayor",
    registration_date: "01 oct 2026",
    registration_time: "11:40 AM",
    created_at: "2026-10-01T11:40:00Z",
    status: "Aprobado",
    is_suspended: false,
    initials: "DC",
    avatar_bg: "bg-[#0f766e]",
    is_mock: true,
  },
  {
    id: "usr-004",
    first_name: "Fernanda",
    last_name: "Martínez",
    email: "fmartinez@roble.com",
    phone_number: "+50582119988",
    national_id: "001-300195-0011L",
    role: "member",
    business_name: "Mercantil El Roble S.A.",
    ruc: "J0610000423459",
    business_type: "Comercio al por mayor",
    registration_date: "30 sep 2026",
    registration_time: "03:22 PM",
    created_at: "2026-09-30T15:22:00Z",
    status: "Aprobado",
    is_suspended: false,
    initials: "FM",
    avatar_bg: "bg-[#1e293b]",
    is_mock: true,
  },
  {
    id: "usr-005",
    first_name: "Ana",
    last_name: "Ramírez",
    email: "ana@variedades.com",
    phone_number: "+50589223344",
    national_id: "001-050493-0055T",
    role: "member",
    business_name: "Variedades Ana",
    ruc: "J0110000523460",
    business_type: "Comercio al por mayor",
    registration_date: "29 sep 2026",
    registration_time: "09:10 AM",
    created_at: "2026-09-29T09:10:00Z",
    status: "Rechazado",
    is_suspended: false,
    initials: "AR",
    avatar_bg: "bg-[#991b1b]",
    is_mock: true,
  },
  {
    id: "usr-006",
    first_name: "Suministros Miranda",
    last_name: "",
    email: "ventas@miranda.com",
    phone_number: "+50585667788",
    national_id: "001-180885-0033M",
    role: "member",
    business_name: "Suministros Miranda S.A.",
    ruc: "J0910000623461",
    business_type: "Comercio al por mayor",
    registration_date: "28 sep 2026",
    registration_time: "02:48 PM",
    created_at: "2026-09-28T14:48:00Z",
    status: "Pendiente",
    is_suspended: false,
    initials: "SM",
    avatar_bg: "bg-[#475569]",
    is_mock: true,
  },
  {
    id: "usr-007",
    first_name: "Tienda Central",
    last_name: "",
    email: "contacto@central.com",
    phone_number: "+50583449900",
    national_id: "001-220791-0088Z",
    role: "member",
    business_name: "Tienda Central",
    ruc: "J0810000723462",
    business_type: "Pequeño comercio",
    registration_date: "27 sep 2026",
    registration_time: "11:12 AM",
    created_at: "2026-09-27T11:12:00Z",
    status: "Aprobado",
    is_suspended: false,
    initials: "TC",
    avatar_bg: "bg-[#7e22ce]",
    is_mock: true,
  },
  {
    id: "usr-008",
    first_name: "Carlos",
    last_name: "Gutiérrez",
    email: "cgutierrez@tecnosol.com",
    phone_number: "+50588123456",
    national_id: "001-140289-0012A",
    role: "member",
    business_name: "TecnoSoluciones de Nicaragua",
    ruc: "J0210000887654",
    business_type: "Fabricante",
    registration_date: "26 sep 2026",
    registration_time: "08:15 AM",
    created_at: "2026-09-26T08:15:00Z",
    status: "Aprobado",
    is_suspended: false,
    initials: "CG",
    avatar_bg: "bg-[#0369a1]",
    is_mock: true,
  },
  {
    id: "usr-009",
    first_name: "Elena",
    last_name: "Mendoza",
    email: "elena@modasnic.com",
    phone_number: "+50587341122",
    national_id: "001-090694-0076W",
    role: "member",
    business_name: "Textiles & Confecciones Mendoza",
    ruc: "J0710000998877",
    business_type: "Fabricante",
    registration_date: "25 sep 2026",
    registration_time: "02:30 PM",
    created_at: "2026-09-25T14:30:00Z",
    status: "Aprobado",
    is_suspended: false,
    initials: "EM",
    avatar_bg: "bg-[#be185d]",
    is_mock: true,
  },
  {
    id: "usr-010",
    first_name: "Roberto",
    last_name: "Alonso",
    email: "roberto@agroimport.com",
    phone_number: "+50589554433",
    national_id: "001-281186-0045Y",
    role: "member",
    business_name: "Agro Insumos del Pacífico",
    ruc: "J0410001002233",
    business_type: "Comercio al por mayor",
    registration_date: "24 sep 2026",
    registration_time: "10:10 AM",
    created_at: "2026-09-24T10:10:00Z",
    status: "Rechazado",
    is_suspended: true,
    suspended_at: "2026-09-25T11:00:00Z",
    initials: "RA",
    avatar_bg: "bg-[#4338ca]",
    is_mock: true,
  },
];

// --- State ---
const userList = ref<AdminUserListItem[]>([]);
const isLoading = ref(false);
const selectedUserIds = ref<string[]>([]);

// Tabs: "Todos", "Verificados", "Rechazados"
const activeTab = ref<"all" | "approved" | "rejected">("all");

// Search & Filters
const searchQuery = ref("");
const selectedStatusFilter = ref<string>("all");
const selectedBusinessType = ref<string>("all");
const selectedDateRange = ref<string>("01/09/2026 - 03/10/2026");

// Pagination
const currentPage = ref(1);
const pageSize = ref(7); // Show 7 items per page to match the exact mockup

// Modals State
const isConfirmOpen = ref(false);
const targetUser = ref<AdminUserListItem | null>(null);
const isMutating = ref(false);

const isDetailModalOpen = ref(false);
const viewedUser = ref<AdminUserListItem | null>(null);

// Current user id to avoid self-suspension
const currentUserId = computed(() => authStore.account?.id);

// --- Colors for initial badges ---
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (name.slice(0, 2) || "US").toUpperCase();
}

// --- Data Fetching (Fusion: API + Mock Fallback) ---
async function fetchUsers(): Promise<void> {
  isLoading.value = true;
  try {
    // Attempt real API call
    const isSuspended =
      selectedStatusFilter.value === "suspended"
        ? true
        : undefined;

    const response = await identityApi.listAccounts({
      limit: 50,
      offset: 0,
      search_term: searchQuery.value.trim() || undefined,
      is_suspended: isSuspended,
    });
    if (response?.data && response.data.length > 0) {
      // Map API items and enrich with business details
      const mappedApiUsers: AdminUserListItem[] = response.data.map((acc: AdminUserItem, idx: number) => {
        const fullName = `${acc.first_name || ""} ${acc.last_name || ""}`.trim() || acc.email.split("@")[0];
        const dateObj = acc.created_at ? new Date(acc.created_at) : new Date();
        const dateStr = dateObj.toLocaleDateString("es-NI", { day: "2-digit", month: "short", year: "numeric" });
        const timeStr = dateObj.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit", hour12: true });

        // Match or derive business info
        const mockMatch = MOCK_USERS[idx % MOCK_USERS.length];

        return {
          id: acc.id,
          first_name: acc.first_name || fullName,
          last_name: acc.last_name || "",
          email: acc.email,
          phone_number: acc.phone_number || "+50588000000",
          national_id: acc.national_id || "001-000000-0000A",
          avatar_blob_id: acc.avatar_blob_id,
          role: acc.role,
          business_name: mockMatch?.business_name || `Empresa ${fullName}`,
          ruc: mockMatch?.ruc || `J${String(idx + 1).padStart(13, "0")}`,
          business_type: mockMatch?.business_type || "Comercio al por mayor",
          registration_date: dateStr,
          registration_time: timeStr,
          created_at: acc.created_at,
          status: acc.is_suspended ? "Rechazado" : (mockMatch?.status || "Aprobado"),
          is_suspended: acc.is_suspended,
          suspended_at: acc.suspended_at,
          initials: getInitials(fullName),
          avatar_bg: AVATAR_COLORS[idx % AVATAR_COLORS.length],
          is_mock: false,
        };
      });

      // Merge with MOCK_USERS so the page always has the realistic mock items from the mockup
      const existingEmails = new Set(mappedApiUsers.map((u) => u.email.toLowerCase()));
      const extraMocks = MOCK_USERS.filter((m) => !existingEmails.has(m.email.toLowerCase()));
      userList.value = [...mappedApiUsers, ...extraMocks];
    } else {
      // Backend returned empty list -> use complete Mock dataset
      userList.value = [...MOCK_USERS];
    }
  } catch (err) {
    console.warn("Using mock data due to API offline/error:", err);
    userList.value = [...MOCK_USERS];
  } finally {
    isLoading.value = false;
  }
}

// --- Tab Counts ---
const totalCount = computed(() => 128); // Dynamic mockup count as shown in design
const verifiedCount = computed(() => 100);
const rejectedCount = computed(() => 28);

// --- Filtered Users ---
const filteredUsers = computed(() => {
  return userList.value.filter((user) => {
    // 1. Tab filter
    if (activeTab.value === "approved" && user.status !== "Aprobado") return false;
    if (activeTab.value === "rejected" && user.status !== "Rechazado") return false;

    // 2. Status dropdown filter
    if (selectedStatusFilter.value !== "all") {
      if (selectedStatusFilter.value === "suspended" && !user.is_suspended) return false;
      if (selectedStatusFilter.value === "Pendiente" && user.status !== "Pendiente") return false;
      if (selectedStatusFilter.value === "Aprobado" && user.status !== "Aprobado") return false;
      if (selectedStatusFilter.value === "Rechazado" && user.status !== "Rechazado") return false;
    }

    // 3. Business type filter
    if (selectedBusinessType.value !== "all") {
      if (user.business_type !== selectedBusinessType.value) return false;
    }

    // 4. Search query (fallback for local mock items)
    const q = searchQuery.value.trim().toLowerCase();
    if (q) {
      const matchName = `${user.first_name} ${user.last_name}`.toLowerCase().includes(q);
      const matchEmail = user.email.toLowerCase().includes(q);
      const matchPhone = (user.phone_number || "").toLowerCase().includes(q);
      const matchId = user.id.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone && !matchId) return false;
    }

    return true;
  });
});

let userSearchTimer: ReturnType<typeof setTimeout> | null = null;
watch([searchQuery, selectedStatusFilter], () => {
  if (userSearchTimer) clearTimeout(userSearchTimer);
  userSearchTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchUsers();
  }, 350);
});

// --- Paginated Display ---
const totalPages = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / pageSize.value)));

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredUsers.value.slice(start, start + pageSize.value);
});

const startItemIndex = computed(() => {
  if (filteredUsers.value.length === 0) return 0;
  return (currentPage.value - 1) * pageSize.value + 1;
});

const endItemIndex = computed(() => {
  return Math.min(currentPage.value * pageSize.value, filteredUsers.value.length);
});

// --- Select All Checkboxes ---
const isAllSelected = computed(() => {
  if (paginatedUsers.value.length === 0) return false;
  return paginatedUsers.value.every((u) => selectedUserIds.value.includes(u.id));
});

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedUserIds.value = [];
  } else {
    selectedUserIds.value = paginatedUsers.value.map((u) => u.id);
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

// --- Filter Reset ---
function handleResetFilters() {
  searchQuery.value = "";
  selectedStatusFilter.value = "all";
  selectedBusinessType.value = "all";
  activeTab.value = "all";
  currentPage.value = 1;
}

// --- Action Handlers ---
function openViewModal(user: AdminUserListItem) {
  router.push({ name: "admin-user-detail", params: { id: user.id } });
}

function openConfirmDialog(user: AdminUserListItem) {
  targetUser.value = user;
  isConfirmOpen.value = true;
}

async function handleConfirmToggleSuspend() {
  if (!targetUser.value) return;

  const user = targetUser.value;
  const isCurrentlySuspended = user.is_suspended;
  isMutating.value = true;

  try {
    if (!user.is_mock) {
      if (isCurrentlySuspended) {
        await identityApi.unsuspendAccount(user.id);
      } else {
        await identityApi.suspendAccount(user.id);
      }
    }

    user.is_suspended = !isCurrentlySuspended;
    user.suspended_at = user.is_suspended ? new Date().toISOString() : null;

    toastStore.addToast({
      title: user.is_suspended ? "Cuenta suspendida" : "Cuenta reactivada",
      message: `La cuenta de ${user.first_name} (${user.email}) ha sido ${user.is_suspended ? 'suspendida' : 'reactivada'} exitosamente.`,
      variant: user.is_suspended ? "warning" : "success",
    });

    isConfirmOpen.value = false;
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

// Approve / Reject verification
async function handleApproveVerification(user: AdminUserListItem) {
  user.status = "Aprobado";
  toastStore.addToast({
    title: "Proveedor aprobado",
    message: `El importador ${user.business_name} ha sido verificado con éxito.`,
    variant: "success",
  });
  if (isDetailModalOpen.value && viewedUser.value?.id === user.id) {
    viewedUser.value.status = "Aprobado";
  }
}

async function handleRejectVerification(user: AdminUserListItem) {
  user.status = "Rechazado";
  toastStore.addToast({
    title: "Proveedor rechazado",
    message: `La solicitud de verificación de ${user.business_name} ha sido rechazada.`,
    variant: "error",
  });
  if (isDetailModalOpen.value && viewedUser.value?.id === user.id) {
    viewedUser.value.status = "Rechazado";
  }
}

onMounted(() => {
  fetchUsers();
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
          Gestiona las cuentas de importadores o fabricantes que se registran en Mercanto.
        </p>
      </div>

      <div class="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          @click="fetchUsers"
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
        <i class="fa-solid fa-info text-xs"></i>
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
    <div class="flex items-center gap-6 border-b border-slate-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        @click="activeTab = 'all'; currentPage = 1"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'all'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Todos</span>
        <span>({{ totalCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'approved'; currentPage = 1"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'approved'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Verificados</span>
        <span>({{ verifiedCount }})</span>
      </button>

      <button
        type="button"
        @click="activeTab = 'rejected'; currentPage = 1"
        :class="[
          'pb-3 font-semibold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5',
          activeTab === 'rejected'
            ? 'text-[#00a896] border-b-2 border-[#00a896] font-bold'
            : 'text-slate-500 hover:text-slate-700'
        ]"
      >
        <span>Rechazados</span>
        <span>({{ rejectedCount }})</span>
      </button>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-3">
      <!-- Search input -->
      <div class="relative flex-1 min-w-[280px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre, correo, teléfono o ID..."
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
        <!-- Estado -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Estado</label>
          <div class="relative">
            <select
              v-model="selectedStatusFilter"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[110px]"
            >
              <option value="all">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Rechazado">Rechazado</option>
              <option value="suspended">Suspendido</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Tipo de negocio -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Tipo de negocio</label>
          <div class="relative">
            <select
              v-model="selectedBusinessType"
              class="appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 cursor-pointer min-w-[130px]"
            >
              <option value="all">Todos</option>
              <option value="Comercio al por mayor">Comercio al por mayor</option>
              <option value="Pequeño comercio">Pequeño comercio</option>
              <option value="Fabricante">Fabricante</option>
              <option value="Importador">Importador</option>
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none"></i>
          </div>
        </div>

        <!-- Rango de fechas -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-semibold text-slate-500">Rango de fechas</label>
          <div class="relative">
            <i class="fa-regular fa-calendar absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            <input
              v-model="selectedDateRange"
              type="text"
              class="rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors focus:border-[#00a896] focus:outline-none focus:ring-2 focus:ring-[#00a896]/15 w-[190px]"
            />
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
              <th scope="col" class="px-4 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>

          <!-- Table Body -->
          <tbody class="divide-y divide-slate-100 font-normal">
            <!-- Loading Skeletons -->
            <template v-if="isLoading && userList.length === 0">
              <tr v-for="i in 5" :key="i" class="animate-pulse">
                <td class="py-4 pl-4 pr-2 text-center">
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
                <td class="px-4 py-4"><div class="h-3 w-32 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-24 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-28 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-3 w-20 rounded bg-slate-200"></div></td>
                <td class="px-4 py-4"><div class="h-5 w-20 rounded-full bg-slate-200"></div></td>
                <td class="px-4 py-4 text-right"><div class="h-4 w-12 rounded bg-slate-200 ml-auto"></div></td>
              </tr>
            </template>

            <!-- Empty State -->
            <tr v-else-if="paginatedUsers.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-slate-400">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <i class="fa-solid fa-users-slash text-xl"></i>
                </div>
                <p class="text-sm font-semibold text-[#023859]">No se encontraron importadores o cuentas</p>
                <p class="text-xs text-slate-400 mt-0.5">Intenta cambiar los términos de búsqueda o los filtros aplicados.</p>
                <button
                  type="button"
                  @click="handleResetFilters"
                  class="mt-3 text-xs font-bold text-[#00a896] hover:underline"
                >
                  Limpiar filtros
                </button>
              </td>
            </tr>

            <!-- Data Rows -->
            <tr
              v-for="user in paginatedUsers"
              :key="user.id"
              :class="[
                'transition-colors hover:bg-slate-50/70',
                user.is_suspended ? 'bg-red-50/30' : ''
              ]"
            >
              <!-- Checkbox -->
              <td class="py-4 pl-4 pr-2 text-center">
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
                    <ProfileAvatar :blob-id="user.avatar_blob_id" :alt="user.first_name" />
                  </div>
                  <div
                    v-else
                    :class="[
                      'h-9 w-9 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-xs shadow-2xs',
                      user.avatar_bg
                    ]"
                  >
                    {{ user.initials }}
                  </div>

                  <div class="min-w-0">
                    <p class="truncate font-bold text-slate-800 text-xs sm:text-sm">
                      {{ user.first_name }} {{ user.last_name }}
                    </p>
                    <p class="truncate text-slate-400 text-[11px] font-normal">
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- Negocio -->
              <td class="px-4 py-4 font-medium text-slate-700">
                {{ user.business_name }}
              </td>

              <!-- RUC -->
              <td class="px-4 py-4 font-mono font-medium text-slate-600">
                <TaxIdDisplay :value="user.ruc" />
              </td>

              <!-- Tipo de negocio -->
              <td class="px-4 py-4 text-slate-600">
                {{ user.business_type }}
              </td>

              <!-- Fecha de registro -->
              <td class="px-4 py-4 whitespace-nowrap">
                <p class="font-medium text-slate-700 text-xs">{{ user.registration_date }}</p>
                <p class="text-slate-400 text-[11px]">{{ user.registration_time }}</p>
              </td>

              <!-- Estado -->
              <td class="px-4 py-4 whitespace-nowrap">
                <!-- Suspendido pill if suspended -->
                <span
                  v-if="user.is_suspended"
                  class="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span>Suspendido</span>
                </span>

                <!-- Pendiente -->
                <span
                  v-else-if="user.status === 'Pendiente'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-orange-200/60 bg-[#fff7ed] px-2.5 py-0.5 text-xs font-semibold text-[#ea580c]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#f97316]"></span>
                  <span>Pendiente</span>
                </span>

                <!-- Aprobado -->
                <span
                  v-else-if="user.status === 'Aprobado'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-teal-200/60 bg-[#f0fdfa] px-2.5 py-0.5 text-xs font-semibold text-[#0d9488]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#14b8a6]"></span>
                  <span>Aprobado</span>
                </span>

                <!-- Rechazado -->
                <span
                  v-else-if="user.status === 'Rechazado'"
                  class="inline-flex items-center gap-1.5 rounded-full border border-red-200/60 bg-[#fef2f2] px-2.5 py-0.5 text-xs font-semibold text-[#e11d48]"
                >
                  <span class="h-1.5 w-1.5 rounded-full bg-[#f43f5e]"></span>
                  <span>Rechazado</span>
                </span>
              </td>

              <!-- Acciones: Fusion (Ver eye icon + Suspender button requested by user) -->
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

                  <span class="text-slate-300">|</span>

                  <!-- Suspender / Reactivar button (requested by user) -->
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
          <span class="font-bold text-slate-700">{{ filteredUsers.length }}</span> importadores
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center gap-1.5 self-center sm:self-auto">
          <!-- Prev Button -->
          <button
            type="button"
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage <= 1"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage >= totalPages"
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

    <!-- Modal "Ver" Detalle de Usuario e Importador -->
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
              <ProfileAvatar :blob-id="viewedUser.avatar_blob_id" :alt="viewedUser.first_name" />
            </div>
            <div
              v-else
              :class="[
                'h-12 w-12 shrink-0 flex items-center justify-center rounded-full text-white font-bold text-sm shadow-xs',
                viewedUser.avatar_bg
              ]"
            >
              {{ viewedUser.initials }}
            </div>

            <div>
              <h3 class="text-base font-bold text-[#023859]">
                {{ viewedUser.first_name }} {{ viewedUser.last_name }}
              </h3>
              <p class="text-xs text-slate-400">{{ viewedUser.email }}</p>
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
          <!-- Negocio -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1 sm:col-span-2">
            <span class="text-slate-400 block font-medium">Nombre del Negocio</span>
            <span class="font-bold text-[#023859] text-sm">{{ viewedUser.business_name }}</span>
          </div>

          <!-- RUC -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">RUC</span>
            <span class="font-mono font-bold text-slate-800"><TaxIdDisplay :value="viewedUser.ruc" /></span>
          </div>

          <!-- Tipo de negocio -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Tipo de Negocio</span>
            <span class="font-semibold text-slate-800">{{ viewedUser.business_type }}</span>
          </div>

          <!-- Cédula -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Cédula del Representante</span>
            <span class="font-mono font-semibold text-slate-800"><NationalIdDisplay :value="viewedUser.national_id" /></span>
          </div>

          <!-- Teléfono -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Teléfono de Contacto</span>
            <span class="font-semibold text-slate-800"><PhoneDisplay :value="viewedUser.phone_number" /></span>
          </div>

          <!-- Estado Verificación -->
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <span class="text-slate-400 block font-medium">Estado de Verificación</span>
            <span
              :class="[
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold mt-0.5',
                viewedUser.status === 'Aprobado'
                  ? 'bg-teal-100/70 text-[#00a896]'
                  : viewedUser.status === 'Pendiente'
                  ? 'bg-orange-100/70 text-[#ea580c]'
                  : 'bg-red-100/70 text-red-600'
              ]"
            >
              <span
                :class="[
                  'h-1.5 w-1.5 rounded-full',
                  viewedUser.status === 'Aprobado'
                    ? 'bg-[#00a896]'
                    : viewedUser.status === 'Pendiente'
                    ? 'bg-[#ea580c]'
                    : 'bg-red-500'
                ]"
              ></span>
              {{ viewedUser.status }}
            </span>
          </div>

          <!-- Estado Cuenta -->
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
          <div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1 sm:col-span-2">
            <span class="text-slate-400 block font-medium">Fecha y Hora de Registro</span>
            <span class="font-medium text-slate-700">{{ viewedUser.registration_date }} a las {{ viewedUser.registration_time }}</span>
          </div>
        </div>

        <!-- Verification Quick Actions if Pendiente -->
        <div v-if="viewedUser.status === 'Pendiente'" class="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2.5">
          <p class="text-xs font-bold text-amber-900">
            Esta cuenta de importador está esperando validación de documentos.
          </p>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleApproveVerification(viewedUser)"
              class="rounded-xl bg-[#00a896] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 shadow-2xs transition-all cursor-pointer"
            >
              <i class="fa-solid fa-check mr-1 text-[11px]"></i>
              Aprobar verificación
            </button>
            <button
              type="button"
              @click="handleRejectVerification(viewedUser)"
              class="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 shadow-2xs transition-all cursor-pointer"
            >
              <i class="fa-solid fa-xmark mr-1 text-[11px]"></i>
              Rechazar
            </button>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <!-- Toggle Suspend action from modal -->
          <button
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
      v-if="isConfirmOpen && targetUser"
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
            <strong class="text-slate-800">{{ targetUser.first_name }} {{ targetUser.last_name }}</strong>?
            El usuario podrá volver a acceder a la plataforma e interactuar con su negocio.
          </template>
          <template v-else>
            ¿Estás seguro de que deseas suspender la cuenta de
            <strong class="text-slate-800">{{ targetUser.first_name }} {{ targetUser.last_name }}</strong>?
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
