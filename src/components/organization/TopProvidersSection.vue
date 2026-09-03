<script setup lang="ts">
import { ref, onMounted } from "vue";
import { organizationApi } from "../../api";
import { useGeoStore } from "../../stores/geo";
import ProviderCard from "./ProviderCard.vue";

interface TopProviderItem {
  id: string;
  name: string;
  logoBlobId: string | null;
  rating: number;
  reviewCount: number;
  locationText: string;
  isVerified: boolean;
}

const geoStore = useGeoStore();
const providers = ref<TopProviderItem[]>([]);
const isLoading = ref(true);

function resolveLocationText(municipalityId?: string): string {
  if (!municipalityId) return "Nicaragua";

  const hierarchy = geoStore.resolveLocationHierarchy(municipalityId);
  if (!hierarchy?.municipality) return "Nicaragua";

  return hierarchy.department
    ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
    : hierarchy.municipality.name;
}

async function loadTopProviders() {
  isLoading.value = true;
  try {
    const res = await organizationApi.getOrganizations({
      limit: 3,
      offset: 0,
      sort_by: "score",
      sort_dir: "desc",
    });
    providers.value = res.data.map((prov) => ({
      id: prov.id,
      name: prov.company_name,
      logoBlobId: prov.logo_blob_id ?? null,
      rating: prov.rating?.average_score ?? 0,
      reviewCount: prov.rating?.review_count ?? 0,
      locationText: resolveLocationText(prov.municipality_id),
      isVerified:
        (prov as any).is_verified ?? prov.rating?.review_count > 0,
    }));
  } catch (err) {
    console.error("Failed to load top providers:", err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(async () => {
  try {
    if (!geoStore.isInitialized) {
      await geoStore.initialize();
    }
  } catch (err) {
    console.error("Failed to initialize geo store:", err);
  }

  await loadTopProviders();
});
</script>

<template>
  <section id="proveedores" class="mx-auto w-full max-w-7xl px-4 text-center sm:px-6 lg:px-8">
    <h2 class="mb-10 text-[2.2rem] font-bold text-[#023859]">
      Nuestros proveedores más <span class="text-[#ff6a00]">TOP</span>
    </h2>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="n in 3"
        :key="n"
        class="pointer-events-none flex flex-col items-center rounded-[24px] border-2 border-slate-200 bg-white px-6 py-8"
        aria-hidden="true"
      >
        <div class="mb-4 h-18 w-18 animate-pulse rounded-full bg-slate-200"></div>
        <div class="mb-2.5 h-5 w-[70%] animate-pulse rounded-md bg-slate-200"></div>
        <div class="mb-2.5 h-3.5 w-1/2 animate-pulse rounded-md bg-slate-200"></div>
        <div class="mb-2.5 h-[22px] w-[35%] animate-pulse rounded-md bg-slate-200"></div>
        <div class="mt-2.5 h-[42px] w-full animate-pulse rounded-full bg-slate-200"></div>
      </div>
    </div>

    <!-- Providers Grid -->
    <div v-else class="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      <ProviderCard
        v-for="provider in providers"
        :key="provider.id"
        :id="provider.id"
        :name="provider.name"
        :logo-blob-id="provider.logoBlobId"
        :rating="provider.rating"
        :review-count="provider.reviewCount"
        :location-text="provider.locationText"
        :is-verified="provider.isVerified"
      />
    </div>

    <div class="text-center md:text-right">
      <router-link
        :to="{ name: 'category' }"
        class="inline-flex items-center gap-2 rounded-full border-2 border-[#00a896] px-[1.4rem] py-2 font-semibold text-[#00a896] transition-all duration-200 hover:bg-[#00a896] hover:text-white"
      >
        Ver todos <i class="fa-solid fa-arrow-right"></i>
      </router-link>
    </div>
  </section>
</template>
