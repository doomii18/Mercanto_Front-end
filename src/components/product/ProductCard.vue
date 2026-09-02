<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import ProductImage from "./ProductImage.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";
import { useOrganizationStore } from "@/stores/organizationStore";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  providerId: string;
  categoryName?: string | null;
  minOrder?: number;
  imageBlobId?: string | null;
  rating?: number;
  reviewCount?: number;
  badgeText?: string | null;
  badgeIcon?: string;
  rank?: number | null;
  bubbleClass?: "orange" | "teal" | "blue" | "grey" | string;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  categoryName: null,
  minOrder: 1,
  imageBlobId: null,
  rating: 0,
  reviewCount: 0,
  badgeText: null,
  badgeIcon: "fa-solid fa-fire",
  rank: null,
  bubbleClass: "orange",
});

const orgStore = useOrganizationStore();

const providerName = ref<string>("Proveedor aliado");
const providerLogoBlobId = ref<string | null>(null);
const isProviderLoading = ref<boolean>(true);

const formattedPrice = computed(() => {
  return `C$ ${props.price.toLocaleString("es-NI")}`;
});

async function loadProviderInfo() {
  if (!props.providerId) {
    providerName.value = "Proveedor aliado";
    providerLogoBlobId.value = null;
    isProviderLoading.value = false;
    return;
  }

  isProviderLoading.value = true;
  try {
    const org = await orgStore.getPublicProvider(props.providerId);
    providerName.value = org.company_name || "Proveedor aliado";
    providerLogoBlobId.value = org.logo_blob_id ?? null;
  } catch (err) {
    console.warn(`Failed to fetch provider ${props.providerId}`, err);
    providerName.value = "Proveedor aliado";
    providerLogoBlobId.value = null;
  } finally {
    isProviderLoading.value = false;
  }
}

watch(
  () => props.providerId,
  () => {
    loadProviderInfo();
  }
);

onMounted(() => {
  loadProviderInfo();
});
</script>

<template>
  <router-link
    :to="{ name: 'product-detail', params: { id } }"
    class="product-card group"
  >
    <div class="product-img-frame">
      <span v-if="badgeText" class="badge-overlay">
        <i v-if="badgeIcon" :class="badgeIcon"></i>
        {{ badgeText }}
      </span>

      <ProductImage
        :blob-id="imageBlobId"
        :alt="title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>

    <p v-if="categoryName" class="product-category">{{ categoryName }}</p>

    <div class="product-info">
      <h4 :title="title">{{ title }}</h4>
      <span class="price">{{ formattedPrice }}</span>
    </div>

    <p v-if="minOrder" class="min-order">Pedido mín. {{ minOrder }} und</p>

    <div class="provider-info">
      <div v-if="isProviderLoading" class="provider-skeleton-wrap">
        <div class="skeleton-pulse provider-logo-skeleton"></div>
        <div class="skeleton-pulse provider-text-skeleton"></div>
      </div>

      <div v-else class="provider-name-wrap" :title="providerName">
        <div class="provider-logo-frame">
          <ProviderLogo :blob-id="providerLogoBlobId" :alt="providerName" />
        </div>
        <span class="provider-name">{{ providerName }}</span>
      </div>

      <span class="rating" :title="`${reviewCount} valoraciones`">
        {{ rating > 0 ? rating.toFixed(1) : "0.0" }}
        <i class="fa-solid fa-star"></i>
      </span>
    </div>

    <div
      v-if="rank !== null && rank !== undefined"
      :class="['ranking-bubble', bubbleClass]"
    >
      {{ rank }}
    </div>
  </router-link>
</template>

<style scoped>
.product-card {
  background: #ffffff;
  border: 2px solid var(--primary-orange, #ff6a00);
  border-radius: 20px;
  padding: 1.1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  min-width: 0;
  box-sizing: border-box;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(255, 106, 0, 0.14);
}

.product-img-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  background-color: #f8fafc;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.product-img-frame :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badge-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  background-color: rgba(255, 240, 230, 0.95);
  color: var(--primary-orange, #ff6a00);
  padding: 0.2rem 0.65rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(4px);
}

.product-category {
  font-size: 0.72rem;
  color: #718096;
  text-align: center;
  margin-bottom: 0.35rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
  gap: 0.5rem;
  min-width: 0;
}

.product-info h4 {
  font-size: 0.9rem;
  color: var(--primary-blue, #023859);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
  margin: 0;
}

.product-info .price {
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.min-order {
  font-size: 0.72rem;
  color: #718096;
  text-align: right;
  margin-bottom: 0.75rem;
}

.provider-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #4a5568;
  border-top: 1px solid var(--border-gray, #e2e8f0);
  padding-top: 0.7rem;
  margin-top: auto;
  min-width: 0;
  min-height: 28px;
}

.provider-skeleton-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
}

.provider-logo-skeleton {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.provider-text-skeleton {
  height: 12px;
  width: 90px;
  border-radius: 4px;
}

.provider-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  overflow: hidden;
}

.provider-logo-frame {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid var(--border-gray, #e2e8f0);
  background-color: #f1f5f9;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.provider-info .rating {
  font-weight: 700;
  color: var(--text-dark, #1e293b);
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  flex-shrink: 0;
}

.provider-info .rating i {
  color: var(--primary-orange, #ff6a00);
}

.ranking-bubble {
  position: absolute;
  bottom: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
}

.ranking-bubble.orange { background-color: var(--primary-orange, #ff6a00); }
.ranking-bubble.teal   { background-color: #0d9488; }
.ranking-bubble.blue   { background-color: var(--primary-blue, #023859); }
.ranking-bubble.grey   { background-color: #64748b; }

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
```[cite: 1]
