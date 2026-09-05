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
  <div class="provider-card">
    <div class="provider-avatar">
      <ProviderLogo :blob-id="logoBlobId" :alt="name" />
    </div>

    <h4 :title="name">{{ name }}</h4>

    <div v-if="isVerified" class="verified-icon">
      <i class="fa-solid fa-certificate"></i>
    </div>
    <p class="provider-status">
      {{ isVerified ? "Proveedor verificado" : "Proveedor registrado" }}
    </p>

    <div class="provider-rating" :title="`${reviewCount} valoraciones`">
      <span class="score">{{ rating > 0 ? rating.toFixed(1) : "0.0" }}</span>
      <i class="fa-solid fa-star"></i>
    </div>

    <p class="provider-location" :title="resolvedLocation">
      {{ resolvedLocation }}
    </p>

    <router-link
    :to="{
         name: 'provider-catalog',
         params: { providerId: id },
       }"
      class="btn-orange"
    >
      Ver catálogo
    </router-link>
  </div>
</template>

<style scoped>
.provider-card {
  background: #ffffff;
  border: 2px solid var(--primary-orange);
  border-radius: 24px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  min-width: 0;
  box-sizing: border-box;
}

.provider-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(255, 106, 0, 0.12);
}

.provider-avatar {
  width: 72px;
  height: 72px;
  background-color: #f1f5f9;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  color: #64748b;
  margin-bottom: 1rem;
  overflow: hidden;
  border: 1px solid var(--border-gray);
  flex-shrink: 0;
}

.provider-card h4 {
  font-size: 1.15rem;
  color: var(--primary-blue);
  margin: 0 0 0.4rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.verified-icon {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  font-size: 1.5rem;
  color: #0284c7;
}

.provider-status {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 0.6rem 0;
  text-align: center;
}

.provider-rating {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-blue);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}

.provider-rating i {
  color: var(--primary-orange);
  font-size: 1.2rem;
}

.provider-location {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0 0 1.2rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

.btn-orange {
  background-color: var(--primary-orange);
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  text-decoration: none;
  display: inline-block;
  box-sizing: border-box;
  text-align: center;
  transition: background-color 0.2s ease;
}

.btn-orange:hover {
  background-color: var(--primary-orange-hover);
}
</style>
