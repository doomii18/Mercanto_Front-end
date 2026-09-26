<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOrganizationApi } from "@/api/modules/organization/useOrganizationApi";
import { useGeoStore } from "@/stores/geo";
import ProviderCard from "@/components/organization/ProviderCard.vue";
import type { PublicProviderDto, OrganizationSortField } from "@/api/modules/organization/types";

const route = useRoute();
const router = useRouter();
const organizationApi = useOrganizationApi();
const geoStore = useGeoStore();

// Providers State
const providers = ref<PublicProviderDto[]>([]);
const totalProviders = ref(0);
const isLoading = ref(true);

// Filters State
const searchTerm = ref<string>((route.query.q as string) || "");
const selectedDepartmentId = ref<string>("");
const selectedMunicipalityId = ref<string>((route.query.municipality_id as string) || "");
const minRating = ref<number | null>(route.query.min_rating ? Number(route.query.min_rating) : null);
const sortBy = ref<OrganizationSortField>((route.query.sort_by as OrganizationSortField) || "score");
const sortDir = ref<"asc" | "desc">((route.query.sort_dir as "asc" | "desc") || "desc");

// Pagination State
const currentPage = ref(Number(route.query.page) || 1);
const pageSize = 12;

// Geo selectors
const departmentList = computed(() => geoStore.departmentList);

const availableMunicipalities = computed(() => {
  if (!selectedDepartmentId.value) return geoStore.municipalityList;
  const dept = geoStore.departmentList.find((d) => d.id === selectedDepartmentId.value);
  return dept ? dept.municipalities : [];
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(totalProviders.value / pageSize));
});

// Watch department selection to reset municipality if needed
watch(selectedDepartmentId, (newDeptId) => {
  if (newDeptId && selectedMunicipalityId.value) {
    const isMunInDept = availableMunicipalities.value.some((m) => m.id === selectedMunicipalityId.value);
    if (!isMunInDept) {
      selectedMunicipalityId.value = "";
    }
  }
});

async function loadProviders() {
  isLoading.value = true;
  try {
    const offset = (currentPage.value - 1) * pageSize;
    const res = await organizationApi.getOrganizations({
      limit: pageSize,
      offset,
      search_term: searchTerm.value.trim() || undefined,
      municipality_id: selectedMunicipalityId.value || undefined,
      min_rating: minRating.value !== null ? minRating.value : undefined,
      sort_by: sortBy.value,
      sort_dir: sortDir.value,
    });

    providers.value = res.data;
    totalProviders.value = res.total;
  } catch (err) {
    console.error("Failed to load providers:", err);
    providers.value = [];
    totalProviders.value = 0;
  } finally {
    isLoading.value = false;
  }
}

function handleSearchSubmit() {
  currentPage.value = 1;
  syncQueryAndLoad();
}

function handleFilterChange() {
  currentPage.value = 1;
  syncQueryAndLoad();
}

function resetFilters() {
  searchTerm.value = "";
  selectedDepartmentId.value = "";
  selectedMunicipalityId.value = "";
  minRating.value = null;
  sortBy.value = "score";
  sortDir.value = "desc";
  currentPage.value = 1;
  syncQueryAndLoad();
}

function changePage(page: number) {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return;
  currentPage.value = page;
  syncQueryAndLoad();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function syncQueryAndLoad() {
  const query: Record<string, string> = {};
  if (searchTerm.value.trim()) query.q = searchTerm.value.trim();
  if (selectedMunicipalityId.value) query.municipality_id = selectedMunicipalityId.value;
  if (minRating.value !== null) query.min_rating = minRating.value.toString();
  if (sortBy.value !== "score") query.sort_by = sortBy.value;
  if (sortDir.value !== "desc") query.sort_dir = sortDir.value;
  if (currentPage.value > 1) query.page = currentPage.value.toString();

  router.replace({ query });
  loadProviders();
}

onMounted(async () => {
  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch(console.warn);
  }

  // Pre-select department if municipality was passed in query
  if (selectedMunicipalityId.value) {
    const hierarchy = geoStore.resolveLocationHierarchy(selectedMunicipalityId.value);
    if (hierarchy?.department) {
      selectedDepartmentId.value = hierarchy.department.id;
    }
  }

  await loadProviders();
});
</script>

<template>
  <main class="min-h-screen bg-neutral-warm py-8 px-4 sm:px-6 lg:px-8 text-neutral-900">
    <div class="mx-auto max-w-7xl">
      <!-- Breadcrumb -->
      <nav class="mb-6 flex items-center gap-2 text-xs text-neutral-500 font-medium">
        <router-link :to="{ name: 'home' }" class="hover:text-primary-orange transition-colors">
          Inicio
        </router-link>
        <span class="text-neutral-300">/</span>
        <span class="text-neutral-800">Proveedores Aliados</span>
      </nav>

      <!-- Header Section -->
      <div class="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#ff6a00] text-xs font-semibold uppercase tracking-wider mb-2">
            <i class="fa-solid fa-handshake"></i> Red de Proveedores
          </div>
          <h1 class="font-serif text-3xl sm:text-4xl font-bold text-[#083c5a]">
            Todos los Proveedores
          </h1>
          <p class="text-neutral-600 text-sm sm:text-base mt-1">
            Conoce a los fabricantes, importadores y distribuidores verificados que venden al por mayor en Mercanto.
          </p>
        </div>

        <div class="text-xs sm:text-sm font-semibold text-neutral-500 shrink-0">
          <span v-if="!isLoading">{{ totalProviders }} proveedor{{ totalProviders === 1 ? '' : 'es' }} encontrado{{ totalProviders === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <!-- Search & Filters Toolbar -->
      <div class="mb-8 rounded-2xl bg-white border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 sm:gap-4 items-center">
          <!-- Search input -->
          <div class="lg:col-span-4 relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar por nombre o empresa..."
              class="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-neutral-800 placeholder:text-slate-400 focus:outline-none focus:border-[#ff6a00] focus:ring-1 focus:ring-[#ff6a00] transition-colors"
              @keydown.enter="handleSearchSubmit"
            />
          </div>

          <!-- Department Selector -->
          <div class="lg:col-span-2">
            <select
              v-model="selectedDepartmentId"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-neutral-800 bg-white focus:outline-none focus:border-[#ff6a00] transition-colors cursor-pointer"
              @change="handleFilterChange"
            >
              <option value="">Todos los departamentos</option>
              <option v-for="dept in departmentList" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </option>
            </select>
          </div>

          <!-- Municipality Selector -->
          <div class="lg:col-span-2">
            <select
              v-model="selectedMunicipalityId"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-neutral-800 bg-white focus:outline-none focus:border-[#ff6a00] transition-colors cursor-pointer"
              @change="handleFilterChange"
            >
              <option value="">Todos los municipios</option>
              <option v-for="mun in availableMunicipalities" :key="mun.id" :value="mun.id">
                {{ mun.name }}
              </option>
            </select>
          </div>

          <!-- Rating Filter -->
          <div class="lg:col-span-2">
            <select
              v-model="minRating"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-neutral-800 bg-white focus:outline-none focus:border-[#ff6a00] transition-colors cursor-pointer"
              @change="handleFilterChange"
            >
              <option :value="null">Cualquier calificación</option>
              <option :value="4.5">★ 4.5 o más</option>
              <option :value="4.0">★ 4.0 o más</option>
              <option :value="3.5">★ 3.5 o más</option>
            </select>
          </div>

          <!-- Sort Selector -->
          <div class="lg:col-span-2">
            <select
              v-model="sortBy"
              class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-neutral-800 bg-white focus:outline-none focus:border-[#ff6a00] transition-colors cursor-pointer"
              @change="handleFilterChange"
            >
              <option value="score">Relevancia / TOP</option>
              <option value="rating">Mejor calificación</option>
              <option value="id">Más recientes</option>
            </select>
          </div>
        </div>

        <!-- Filter Action Bar (Reset / Quick actions) -->
        <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div class="flex items-center gap-2 text-slate-500">
            <i class="fa-solid fa-filter text-slate-400"></i>
            <span>Filtra por ubicación o reputación para encontrar el mejor proveedor para tu negocio.</span>
          </div>
          <button
            v-if="searchTerm || selectedDepartmentId || selectedMunicipalityId || minRating !== null"
            type="button"
            class="text-[#ff6a00] hover:text-[#e05e00] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            @click="resetFilters"
          >
            <i class="fa-solid fa-rotate-left text-[11px]"></i>
            <span>Limpiar filtros</span>
          </button>
        </div>
      </div>

      <!-- Loading Skeletons -->
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="n in 6"
          :key="n"
          class="pointer-events-none flex flex-col items-center rounded-3xl border-2 border-slate-200 bg-white px-6 py-8 animate-pulse"
          aria-hidden="true"
        >
          <div class="mb-4 h-18 w-18 rounded-full bg-slate-200"></div>
          <div class="mb-2.5 h-5 w-[70%] rounded-md bg-slate-200"></div>
          <div class="mb-2.5 h-3.5 w-1/2 rounded-md bg-slate-200"></div>
          <div class="mb-2.5 h-5.5 w-[35%] rounded-md bg-slate-200"></div>
          <div class="mt-2.5 h-10 w-full rounded-full bg-slate-200"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="providers.length === 0"
        class="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 shadow-xs"
      >
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 text-[#ff6a00] flex items-center justify-center text-3xl">
          <i class="fa-solid fa-users-slash"></i>
        </div>
        <h3 class="text-lg font-bold text-neutral-800 mb-2">No se encontraron proveedores</h3>
        <p class="text-xs sm:text-sm text-neutral-500 mb-6 leading-relaxed">
          No hay proveedores que coincidan con los criterios de búsqueda o filtros seleccionados.
        </p>
        <button
          type="button"
          class="px-6 py-2.5 rounded-full bg-[#00a896] hover:bg-[#009688] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          @click="resetFilters"
        >
          Ver todos los proveedores
        </button>
      </div>

      <!-- Providers Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ProviderCard
          v-for="provider in providers"
          :key="provider.id"
          :id="provider.id"
          :name="provider.company_name"
          :logo-blob-id="provider.logo_blob_id ?? null"
          :rating="provider.rating?.average_score ?? 0"
          :review-count="provider.rating?.review_count ?? 0"
          :municipality-id="provider.municipality_id"
          :is-verified="(provider as any).is_verified ?? (provider.rating?.review_count > 0)"
        />
      </div>

      <!-- Pagination Navigation -->
      <div v-if="totalPages > 1 && !isLoading" class="mt-12 flex items-center justify-center gap-2">
        <button
          type="button"
          :disabled="currentPage === 1"
          class="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Página anterior"
          @click="changePage(currentPage - 1)"
        >
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>

        <template v-for="page in totalPages" :key="page">
          <button
            type="button"
            :class="[
              'h-10 min-w-10 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer',
              page === currentPage
                ? 'bg-[#ff6a00] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            ]"
            @click="changePage(page)"
          >
            {{ page }}
          </button>
        </template>

        <button
          type="button"
          :disabled="currentPage === totalPages"
          class="h-10 w-10 rounded-xl border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          aria-label="Página siguiente"
          @click="changePage(currentPage + 1)"
        >
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>
  </main>
</template>
