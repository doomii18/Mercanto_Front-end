<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { RouterLink } from "vue-router";
import { useGeoStore } from "@/stores/geo";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";
import type { PublicProviderDto } from "@/api/modules/organization/types";
import { useOrganizationApi } from "@/api/modules/organization/useOrganizationApi";

const geoStore = useGeoStore();

const provider = ref<PublicProviderDto | null>(null);
const isLoading = ref(true);
const organizationApi = useOrganizationApi();

const resolvedLocation = computed(() => {
  if (!provider.value?.municipality_id) return "Nicaragua";
  const hierarchy = geoStore.resolveLocationHierarchy(provider.value.municipality_id);
  if (!hierarchy?.municipality) return "Nicaragua";
  return hierarchy.department
    ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
    : hierarchy.municipality.name;
});

const ratingScore = computed(() => provider.value?.rating.average_score.toFixed(1) ?? "0.0");

onMounted(async () => {
  try {
    if (!geoStore.isInitialized) {
      await geoStore.initialize().catch(console.warn);
    }
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
  <section class="relative flex h-full w-full flex-col justify-center overflow-hidden bg-orange-50/60 py-12 select-none lg:py-20">
    <!-- Ambient Geometric Backgrounds -->
    <div class="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-(--light-teal) opacity-80 blur-2xl transition-transform duration-700 md:h-112.5 md:w-112.5" aria-hidden="true" />
    <div class="pointer-events-none absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-(--primary-orange) opacity-70 blur-3xl md:h-100 md:w-100" aria-hidden="true" />
    <div class="pointer-events-none absolute -top-20 -right-24 h-137.5 w-137.5 rounded-full bg-(--primary-blue) lg:h-175 lg:w-175" aria-hidden="true" />
    <div class="pointer-events-none absolute top-10 -right-16 h-80 w-80 rounded-full bg-(--light-teal) opacity-80 md:h-105 md:w-105" aria-hidden="true" />
    <div class="pointer-events-none absolute -top-10 -right-20 h-96 w-96 rounded-full bg-white opacity-95" aria-hidden="true" />

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex min-h-105 items-center justify-center">
        <i class="fa-solid fa-spinner fa-spin text-3xl text-(--primary-orange)"></i>
      </div>

      <!-- Content -->
      <div v-else-if="provider" class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <!-- Left Column: Provider Overview & Metrics -->
        <div class="z-10 flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">

          <!-- Category Badge -->
          <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-white/80 px-3.5 py-1 text-xs font-semibold tracking-wide text-(--primary-blue) shadow-xs backdrop-blur-md">
            <span class="flex h-2 w-2 rounded-full bg-(--light-teal) animate-pulse" />
            <i class="fa-solid fa-award text-xs text-(--light-teal)"></i>
            <span class="uppercase tracking-wider">Proveedor Destacado del Mes</span>
          </div>

          <!-- Main Title -->
          <h1 class="mb-3 font-serif text-3xl font-extrabold tracking-tight text-(--primary-blue) sm:text-4xl lg:text-5xl leading-tight">
            {{ provider.company_name }}
          </h1>

          <!-- Location Indicator -->
          <div class="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
            <i class="fa-solid fa-location-dot text-sm text-(--primary-orange)"></i>
            <span>{{ resolvedLocation }}</span>
          </div>

          <!-- Description -->
          <p class="mb-6 max-w-xl text-sm sm:text-base leading-relaxed text-slate-600">
            {{ provider.company_description || 'Calidad, confianza y los mejores precios para abastecer e impulsar tu negocio.' }}
          </p>

          <!-- 4 Pillars Feature Grid -->
          <div class="mb-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-2.5">
            <div class="group flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 p-3 text-center shadow-xs backdrop-blur-xs transition-all hover:border-teal-300 hover:bg-white hover:shadow-sm">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-(--light-teal) group-hover:scale-110 transition-transform">
                <i class="fa-regular fa-circle-check text-base"></i>
              </div>
              <span class="text-[0.6875rem] font-bold tracking-tight text-(--primary-blue)">Verificado</span>
              <span class="text-[0.625rem] text-slate-500">Garantía 100%</span>
            </div>

            <div class="group flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 p-3 text-center shadow-xs backdrop-blur-xs transition-all hover:border-teal-300 hover:bg-white hover:shadow-sm">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-(--light-teal) group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-box-open text-sm"></i>
              </div>
              <span class="text-[0.6875rem] font-bold tracking-tight text-(--primary-blue)">{{ provider.rating.review_count }}+ Pedidos</span>
              <span class="text-[0.625rem] text-slate-500">Historial activo</span>
            </div>

            <div class="group flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 p-3 text-center shadow-xs backdrop-blur-xs transition-all hover:border-teal-300 hover:bg-white hover:shadow-sm">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-(--light-teal) group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-star text-sm"></i>
              </div>
              <span class="text-[0.6875rem] font-bold tracking-tight text-(--primary-blue)">{{ ratingScore }} / 5.0</span>
              <span class="text-[0.625rem] text-slate-500">Calificación</span>
            </div>

            <div class="group flex flex-col items-center justify-center rounded-xl border border-slate-200/70 bg-white/70 p-3 text-center shadow-xs backdrop-blur-xs transition-all hover:border-teal-300 hover:bg-white hover:shadow-sm">
              <div class="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-(--light-teal) group-hover:scale-110 transition-transform">
                <i class="fa-solid fa-truck-fast text-sm"></i>
              </div>
              <span class="text-[0.6875rem] font-bold tracking-tight text-(--primary-blue)">Envíos</span>
              <span class="text-[0.625rem] text-slate-500">Nivel nacional</span>
            </div>
          </div>

          <!-- Action Button -->
          <div class="flex items-center gap-4">
            <RouterLink
              :to="{ name: 'provider-catalog', params: { providerId: provider.id } }"
              class="group inline-flex items-center gap-2.5 rounded-full bg-(--primary-blue) px-7 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-(--primary-blue) focus:ring-offset-2 active:translate-y-0"
            >
              <span>Ver catálogo completo</span>
              <i class="fa-solid fa-arrow-right text-xs transition-transform duration-200 group-hover:translate-x-1"></i>
            </RouterLink>
          </div>
        </div>

        <!-- Right Column: Visual Stage with Portrait & Badges -->
        <div class="relative z-10 flex flex-col items-center justify-center lg:col-span-6">
          <div class="relative flex w-full max-w-lg items-center justify-center">

            <!-- 1. Floating Profile Card (Left) -->
            <div class="relative z-20 -mr-12 w-48 rounded-2xl border-2 border-(--primary-orange) bg-white p-4 shadow-xl transition-all duration-300 hover:scale-105 sm:-mr-14 sm:w-52">
              <div class="mb-3 flex items-center gap-3">
                <div class="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-50 shadow-xs">
                  <ProviderLogo
                    :blob-id="provider.logo_blob_id"
                    :alt="provider.company_name"
                    class="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <h2 class="truncate text-xs font-bold text-(--primary-blue)">
                    {{ provider.company_name }}
                  </h2>
                  <div class="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
                    <i class="fa-solid fa-circle-check text-[0.5625rem]"></i>
                    <span>Verificado</span>
                  </div>
                </div>
              </div>

              <div class="mb-1 flex items-center gap-1 text-xs text-(--primary-orange)">
                <i v-for="n in 5" :key="n" :class="n <= Math.round(provider.rating.average_score) ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                <span class="ml-1 text-[0.6875rem] font-bold text-slate-700">{{ provider.rating.average_score.toFixed(1) }}</span>
              </div>
              <p class="mb-2 text-[0.625rem] text-slate-400">
                ({{ provider.rating.review_count }} calificaciones recibidas)
              </p>
              <p class="text-[0.625rem] leading-relaxed text-slate-600 line-clamp-2">
                {{ provider.company_description || 'Proveedor confiable con entregas garantizadas en todo el territorio.' }}
              </p>
            </div>

            <!-- 2. Circular Main Hero Portrait (Center-Right) -->
            <div class="relative z-10 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
              <div class="absolute inset-0 rounded-full border-4 border-(--primary-orange) p-2 shadow-2xl bg-white/30 backdrop-blur-xs">
                <div class="h-full w-full overflow-hidden rounded-full bg-slate-100 flex items-center justify-center shadow-inner">
                  <ProviderLogo
                    :blob-id="provider.logo_blob_id"
                    :alt="provider.company_name"
                    class="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>

              <!-- Floating Rating Pill -->
              <div class="absolute bottom-4 z-20 flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur-md">
                <div class="flex items-center gap-0.5 text-[0.625rem] text-(--primary-orange)">
                  <i v-for="n in 5" :key="n" :class="n <= Math.round(provider.rating.average_score) ? 'fa-solid fa-star' : 'fa-regular fa-star'"></i>
                </div>
                <span class="text-xs font-bold text-(--primary-blue)">{{ provider.rating.average_score.toFixed(1) }}</span>
                <span class="text-[0.625rem] text-slate-400">({{ provider.rating.review_count }})</span>
              </div>
            </div>
          </div>

          <!-- 3. Bottom Ribbon Plaque -->
          <div class="relative z-20 mt-5 w-full max-w-sm rounded-xl border-2 border-(--primary-orange) bg-white px-5 py-2.5 text-center shadow-lg sm:max-w-md">
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
      <div v-else class="flex min-h-105 items-center justify-center text-sm text-slate-500">
        No hay proveedores destacados disponibles en este momento.
      </div>
    </div>
  </section>
</template>
