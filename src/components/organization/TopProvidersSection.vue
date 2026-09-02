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
  <section id="proveedores" class="top-providers container">
    <h2>
      Nuestros proveedores más <span class="highlight-orange">TOP</span>
    </h2>

    <div v-if="isLoading" class="providers-grid">
      <div
        v-for="n in 3"
        :key="n"
        class="provider-card skeleton-card"
        aria-hidden="true"
      >
        <div class="skeleton-avatar skeleton-pulse"></div>
        <div class="skeleton-text skeleton-title skeleton-pulse"></div>
        <div class="skeleton-text skeleton-sub skeleton-pulse"></div>
        <div class="skeleton-text skeleton-rating skeleton-pulse"></div>
        <div class="skeleton-btn skeleton-pulse"></div>
      </div>
    </div>

    <div v-else class="providers-grid">
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

    <div class="view-all-wrapper">
      <router-link :to="{ name: 'category' }" class="btn-outline">
        Ver todos <i class="fa-solid fa-arrow-right"></i>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.top-providers {
  text-align: center;
  margin-bottom: 5rem;
}

.top-providers h2 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 2.5rem;
}

.highlight-orange {
  color: var(--primary-orange);
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.view-all-wrapper {
  text-align: right;
}

.btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--light-teal);
  border: 2px solid var(--light-teal);
  padding: 0.5rem 1.4rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-outline:hover {
  background-color: var(--light-teal);
  color: #ffffff;
}

/* Skeleton Loading */
.skeleton-card {
  background: #ffffff;
  border: 2px solid var(--border-gray);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.skeleton-text {
  border-radius: 6px;
  margin-bottom: 0.6rem;
}

.skeleton-title {
  width: 70%;
  height: 1.2rem;
}

.skeleton-sub {
  width: 50%;
  height: 0.85rem;
}

.skeleton-rating {
  width: 35%;
  height: 1.4rem;
}

.skeleton-btn {
  width: 100%;
  height: 42px;
  border-radius: 24px;
  margin-top: 0.6rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 1024px) {
  .providers-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .providers-grid {
    grid-template-columns: 1fr;
  }

  .view-all-wrapper {
    text-align: center;
  }
}
</style>
