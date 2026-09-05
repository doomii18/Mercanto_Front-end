<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { organizationApi } from "@/api";
import { useGeoStore } from "@/stores/geo";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";
import type { PublicProviderDto } from "@/api/services/organization/types";

const geoStore = useGeoStore();

const provider = ref<PublicProviderDto | null>(null);
const isLoading = ref(true);

const resolvedLocation = computed(() => {
  if (!provider.value?.municipality_id) return "Nicaragua";
  const hierarchy = geoStore.resolveLocationHierarchy(provider.value.municipality_id);
  if (!hierarchy?.municipality) return "Nicaragua";
  return hierarchy.department
    ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
    : hierarchy.municipality.name;
});

const ratingText = computed(() => {
  if (!provider.value) return "0.0/5 Calificación";
  return `${provider.value.rating.average_score.toFixed(1)}/5 Calificación`;
});

onMounted(async () => {
  try {
    if (!geoStore.isInitialized) {
      await geoStore.initialize().catch(console.warn);
    }
    // Fetch the top 1 provider sorted by score
    const res = await organizationApi.getOrganizations({
      limit: 1,
      offset: 0,
      sort_by: "score",
      sort_dir: "desc",
    });

    if (res.data.length > 0) {
      provider.value = res.data[0];
    }
  } catch (err) {
    console.error("Failed to load featured provider:", err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section class="relative flex h-full w-full flex-col justify-center overflow-hidden bg-orange-50 py-10 select-none lg:py-16">
    <!-- Ambient Geometric Backgrounds -->
    <div class="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-(--light-teal) opacity-90 transition-transform duration-700 md:h-112.5 md:w-112.5" aria-hidden="true" />
    <div class="pointer-events-none absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-(--primary-orange) opacity-90 md:h-100 md:w-100" aria-hidden="true" />
    <div class="pointer-events-none absolute -top-20 -right-24 h-137.5 w-137.5 rounded-full bg-(--primary-blue) lg:h-175 lg:w-175" aria-hidden="true" />
    <div class="pointer-events-none absolute top-10 -right-16 h-80 w-80 rounded-full bg-(--light-teal) opacity-80 md:h-105 md:w-105" aria-hidden="true" />
    <div class="pointer-events-none absolute -top-10 -right-20 h-96 w-96 rounded-full bg-white opacity-95" aria-hidden="true" />

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center min-h-[400px]">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-(--primary-orange)"></i>
      </div>

      <!-- Content -->
      <div v-else-if="provider" class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <!-- Left Column: Provider Overview & Metrics -->
        <div class="z-10 flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-(--light-teal)/30 bg-teal-50 px-4 py-1.5 text-xs font-bold tracking-wide text-(--primary-blue) uppercase shadow-xs backdrop-blur-xs">
            <i class="fa-regular fa-star text-(--light-teal)"></i>
            <span>Proveedor Destacado del Mes</span>
          </div>

          <h1 class="mb-3 font-serif text-4xl font-bold tracking-tight text-(--primary-blue) sm:text-5xl lg:text-6xl">
            {{ provider.company_name }}
          </h1>

          <p class="mb-8 max-w-xl text-base text-slate-600 sm:text-lg">
            {{ provider.company_description || 'Calidad, confianza y los mejores precios para impulsar tu negocio.' }}
          </p>

          <!-- 4 Pillars Feature Grid -->
          <div class="mb-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-2">
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-(--light-teal) shadow-inner">
                <i class="fa-regular fa-circle-check text-xl"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-(--primary-blue)">
                Proveedor Verificado
              </span>
            </div>
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-(--light-teal) shadow-inner">
                <i class="fa-solid fa-box-open text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-(--primary-blue)">
                {{ provider.rating.review_count }}+ Reseñas
              </span>
            </div>
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-(--light-teal) shadow-inner">
                <i class="fa-regular fa-star text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-(--primary-blue)">
                {{ ratingText }}
              </span>
            </div>
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-(--light-teal) shadow-inner">
                <i class="fa-solid fa-truck-fast text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-(--primary-blue)">
                Envíos a todo el país
              </span>
            </div>
          </div>

          <span class="mb-4 font-serif text-lg font-medium text-(--primary-blue)">
            {{ resolvedLocation }}
          </span>

          <!-- Connected to the real provider catalog route -->
          <RouterLink
            :to="{ name: 'provider-catalog', params: { providerId: provider.id } }"
            class="group inline-flex items-center gap-3 rounded-full bg-(--primary-blue) px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg active:translate-y-0"
          >
            <span>Ver catálogo</span>
            <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
          </RouterLink>
        </div>

        <!-- Right Column: Visual Stage with Portrait & Badges -->
        <div class="relative z-10 flex flex-col items-center justify-center lg:col-span-6">
          <div class="relative flex w-full max-w-lg items-center justify-center">
            <!-- 1. Floating Profile Card (Left) -->
            <div class="relative z-20 -mr-12 w-44 rounded-2xl border-2 border-(--primary-orange) bg-white p-3.5 shadow-xl transition-transform duration-300 hover:scale-105 sm:-mr-14 sm:w-48">
              <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-(--primary-blue) text-xs font-bold tracking-wider text-white overflow-hidden">
                <ProviderLogo :blob-id="provider.logo_blob_id" :alt="provider.company_name" class="w-full h-full rounded-lg" />
              </div>
              <h2 class="line-clamp-1 text-xs font-bold text-(--primary-blue)">
                {{ provider.company_name }}
              </h2>
              <div class="mb-2 flex items-center gap-1 text-[0.625rem] font-semibold text-sky-600">
                <i class="fa-solid fa-circle-check text-[0.5625rem]"></i>
                <span>Proveedor verificado</span>
              </div>
              <div class="mb-1 flex items-center gap-0.5 text-xs text-(--primary-orange)">
                <i v-for="n in 5" :key="n" :class="n <= Math.round(provider.rating.average_score) ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
              </div>
              <p class="mb-2 text-[0.625rem] text-slate-500">
                <span class="font-bold text-slate-800">{{ provider.rating.average_score.toFixed(1) }}</span>
                ({{ provider.rating.review_count }} calificaciones)
              </p>
              <p class="text-[0.625rem] leading-tight text-slate-600 line-clamp-2">
                {{ provider.company_description || 'Excelente proveedor' }}
              </p>
            </div>

            <!-- 2. Circular Main Hero Portrait (Center-Right) -->
            <div class="relative z-10 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
              <div class="absolute inset-0 rounded-full border-4 border-(--primary-orange) p-2 shadow-2xl">
                <div class="h-full w-full overflow-hidden rounded-full bg-slate-200 flex items-center justify-center">
                  <!-- Replaced static image with dynamic ProviderLogo -->
                  <ProviderLogo :blob-id="provider.logo_blob_id" :alt="provider.company_name" class="w-full h-full rounded-full object-cover" />
                </div>
              </div>
              <div class="absolute bottom-6 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 shadow-md backdrop-blur-xs">
                <div class="flex items-center gap-0.5 text-[0.625rem] text-(--light-teal)">
                  <i v-for="n in 5" :key="n" :class="n <= Math.round(provider.rating.average_score) ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                </div>
                <span class="text-xs font-bold text-(--primary-blue)">{{ provider.rating.average_score.toFixed(1) }}</span>
                <span class="text-[0.625rem] text-slate-500">({{ provider.rating.review_count }})</span>
              </div>
            </div>
          </div>

          <!-- 3. Bottom Ribbon Plaque -->
          <div class="relative z-20 mt-4 w-full max-w-sm rounded-lg border-2 border-(--primary-orange) bg-white px-5 py-2.5 text-center shadow-lg sm:max-w-md">
            <span class="block text-[0.625rem] font-bold uppercase tracking-widest text-(--light-teal)">
              ★ MERCANTO RECONOCE ★
            </span>
            <h3 class="font-serif text-lg font-extrabold uppercase tracking-wide text-(--primary-orange) sm:text-xl">
              PROVEEDOR DEL MES
            </h3>
            <span class="block text-[0.5625rem] font-bold uppercase tracking-[0.3em] text-(--light-teal)">
              DESTACADO
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex justify-center items-center min-h-[400px] text-slate-500">
        No hay proveedores destacados disponibles en este momento.
      </div>
    </div>
  </section>
</template>
