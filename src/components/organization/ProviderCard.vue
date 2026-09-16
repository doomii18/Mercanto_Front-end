<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useGeoStore } from "../../stores/geo";
import ProviderLogo from "./ProviderLogo.vue";

interface Props {
  id: string;
  name: string;
  logoBlobId?: string | null;
  rating?: number;
  reviewCount?: number;
  municipalityId?: string | null;
  locationText?: string;
  isVerified?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  logoBlobId: null,
  rating: 0,
  reviewCount: 0,
  municipalityId: null,
  locationText: undefined,
  isVerified: false,
});

const geoStore = useGeoStore();

const resolvedLocation = computed<string>(() => {
  if (props.locationText) return props.locationText;
  if (!props.municipalityId) return "Nicaragua";

  const hierarchy = geoStore.resolveLocationHierarchy(props.municipalityId);
  if (!hierarchy?.municipality) return "Nicaragua";

  return hierarchy.department
    ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
    : hierarchy.municipality.name;
});

onMounted(async () => {
  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch(console.warn);
  }
});
</script>

<template>
  <div class="relative flex flex-col items-center text-center bg-white border-2 border-[#ff6a00] rounded-3xl p-6 sm:p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_10px_25px_rgba(255,106,0,0.12)] min-w-0 box-border">
    <!-- Top Verified Badge -->
    <div
      v-if="isVerified"
      class="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold shadow-xs select-none"
      title="Este proveedor ha sido verificado formalmente por el equipo de Mercanto"
    >
      <i class="fa-solid fa-circle-check text-xs text-teal-600"></i>
      <span>Verificado</span>
    </div>

    <!-- Provider Avatar -->
    <div class="w-18 h-18 rounded-full bg-slate-100 flex items-center justify-center text-2xl text-slate-500 mb-4 overflow-hidden border border-slate-200 shrink-0">
      <ProviderLogo :blob-id="logoBlobId" :alt="name" />
    </div>

    <!-- Provider Name -->
    <h4 :title="name" class="text-lg font-bold text-[#083c5a] mb-1.5 w-full truncate text-center">
      {{ name }}
    </h4>

    <!-- Rating -->
    <div class="text-2xl font-bold text-[#083c5a] flex items-center justify-center gap-1.5 mb-2" :title="`${reviewCount} valoraciones`">
      <span class="leading-none">{{ rating > 0 ? rating.toFixed(1) : "0.0" }}</span>
      <i class="fa-solid fa-star text-lg text-[#ff6a00]"></i>
    </div>

    <!-- Location -->
    <p class="text-xs sm:text-sm text-slate-500 mb-5 w-full truncate text-center" :title="resolvedLocation">
      {{ resolvedLocation }}
    </p>

    <!-- Catalog Button -->
    <router-link
      :to="{
        name: 'provider-catalog',
        params: { providerId: id },
      }"
      class="w-full inline-block text-center rounded-full bg-[#ff6a00] hover:bg-[#e05e00] text-white py-3 px-6 text-sm font-semibold transition-colors duration-200 no-underline box-border shadow-xs cursor-pointer"
    >
      Ver catálogo
    </router-link>
  </div>
</template>
