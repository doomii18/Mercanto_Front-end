<script setup lang="ts">
import { ref, onMounted } from "vue";
import { productApi, organizationApi } from "../../api";
import type { ProductResponse } from "../../api/services/product/types";
import ProductImage from "./ProductImage.vue";
import topSellersHeroImg from "../../assets/top-sellers-hero.png";

interface TopProductItem {
  id: string;
  title: string;
  categoryName: string;
  price: number;
  minOrder: number;
  imageBlobId: string | null;
  providerName: string;
  rating: number;
  reviewCount: number;
  rank: number;
  bubbleClass: "orange" | "teal" | "blue" | "grey";
}

const topProducts = ref<TopProductItem[]>([]);
const isLoading = ref(true);

const BUBBLE_CLASSES: TopProductItem["bubbleClass"][] = [
  "orange",
  "teal",
  "blue",
  "grey",
];

function resolveMinOrder(spec: ProductResponse["spec"]): number {
  if ("Physical" in spec && spec.Physical?.min_order_quantity) {
    return spec.Physical.min_order_quantity;
  }
  return 1;
}

async function loadTopProducts() {
  isLoading.value = true;
  try {
    const res = await productApi.getProducts({
      limit: 4,
      offset: 0,
      sort_by: "score",
      sort_direction: "desc",
    });
    const rawItems = res.data;

    const providerMap = new Map<string, string>();
    const providerIds = [...new Set(rawItems.map((p) => p.provider_id))];

    await Promise.allSettled(
      providerIds.map(async (id) => {
        try {
          const org = await organizationApi.getPublicProvider(id);
          providerMap.set(id, org.company_name);
        } catch {
          providerMap.set(id, "Proveedor aliado");
        }
      })
    );

    topProducts.value = rawItems.map((prod, index) => ({
      id: prod.id,
      title: prod.title,
      categoryName: prod.category?.name || "General",
      price: prod.base_price,
      minOrder: resolveMinOrder(prod.spec),
      imageBlobId: prod.image_blob_ids?.[0] ?? null,
      providerName: providerMap.get(prod.provider_id) || "Proveedor aliado",
      rating: prod.rating?.average_score ?? 0,
      reviewCount: prod.rating?.review_count ?? 0,
      rank: index + 1,
      bubbleClass: BUBBLE_CLASSES[index % BUBBLE_CLASSES.length],
    }));
  } catch (err) {
    console.error("Failed to load top products:", err);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadTopProducts();
});
</script>

<template>
  <section class="top-sellers container">
    <div class="top-sellers-header">
      <div class="top-sellers-title">
        <span class="badge-orange">
          <i class="fa-solid fa-fire"></i> Los más vendidos
        </span>
        <h2>
          Los productos<br />
          <span class="highlight-orange">más exitosos</span><br />
          del momento
        </h2>
        <p>Invierte en los productos más solicitados</p>
        <div class="benefits-badges">
          <div class="benefit-badge teal">
            <i class="fa-solid fa-store"></i>
            <span>Productos con excelente rotación y aceptación</span>
          </div>
          <div class="benefit-badge orange">
            <i class="fa-solid fa-chart-simple"></i>
            <span>Productos con mayor volumen de ventas</span>
          </div>
        </div>
      </div>
      <div class="top-sellers-image">
        <img :src="topSellersHeroImg" alt="Productos destacados" />
      </div>
    </div>

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="products-grid">
      <div v-for="n in 4" :key="n" class="product-card skeleton-card" aria-hidden="true">
        <div class="skeleton-badge skeleton-pulse"></div>
        <div class="skeleton-image skeleton-pulse"></div>
        <div class="skeleton-text skeleton-category skeleton-pulse"></div>
        <div class="skeleton-text skeleton-title skeleton-pulse"></div>
        <div class="skeleton-text skeleton-sub skeleton-pulse"></div>
        <div class="skeleton-footer skeleton-pulse"></div>
      </div>
    </div>

    <!-- Product Grid -->
    <div v-else class="products-grid">
      <router-link
        v-for="product in topProducts"
        :key="product.id"
        :to="{ name: 'product-detail', params: { id: product.id } }"
        class="product-card"
      >
        <span class="badge-orange small">
          <i class="fa-solid fa-fire"></i> Los más vendidos
        </span>

        <div class="product-img-frame">
          <ProductImage
            :blob-id="product.imageBlobId"
            :alt="product.title"
            object-fit="contain"
          />
        </div>

        <p class="product-category">{{ product.categoryName }}</p>

        <div class="product-info">
          <h4 :title="product.title">{{ product.title }}</h4>
          <span class="price">C$ {{ product.price.toLocaleString("es-NI") }}</span>
        </div>

        <p class="min-order">Pedido mín. {{ product.minOrder }} und</p>

        <div class="provider-info">
          <div class="provider-name-wrap" :title="product.providerName">
            <i class="fa-solid fa-certificate badge-verified"></i>
            <span class="provider-name">{{ product.providerName }}</span>
          </div>
          <span class="rating" :title="`${product.reviewCount} valoraciones`">
            {{ product.rating > 0 ? product.rating.toFixed(1) : "0.0" }}
            <i class="fa-solid fa-star"></i>
          </span>
        </div>

        <div :class="['ranking-bubble', product.bubbleClass]">
          {{ product.rank }}
        </div>
      </router-link>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  width: 100%;
  box-sizing: border-box;
}

.top-sellers {
  margin-bottom: 5rem;
}

.top-sellers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  gap: 2rem;
}

.top-sellers-title {
  flex: 1.2;
  min-width: 0;
}

.badge-orange {
  background-color: #ffe8d6;
  color: var(--primary-orange, #ff6a00);
  padding: 0.35rem 0.85rem;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.badge-orange.small {
  font-size: 0.72rem;
  padding: 0.2rem 0.6rem;
  margin-bottom: 0.5rem;
  width: fit-content;
}

.top-sellers-title h2 {
  font-size: 2.5rem;
  color: var(--primary-blue, #023859);
  line-height: 1.15;
  margin-bottom: 0.75rem;
}

.highlight-orange {
  color: var(--primary-orange, #ff6a00);
}

.top-sellers-title p {
  color: #718096;
  margin-bottom: 1.5rem;
}

.benefits-badges {
  display: flex;
  gap: 1rem;
}

.benefit-badge {
  padding: 0.85rem 1.1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.82rem;
  font-weight: 600;
  max-width: 220px;
  line-height: 1.35;
}

.benefit-badge i {
  font-size: 1.4rem;
}

.benefit-badge.teal {
  background-color: #d8f1ef;
  color: var(--primary-blue, #023859);
  border: 1.5px solid var(--light-teal, #00a896);
}

.benefit-badge.orange {
  background-color: #ffe8d6;
  color: var(--primary-orange, #ff6a00);
  border: 1.5px solid #ffcca3;
}

.top-sellers-image {
  flex: 0.8;
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.top-sellers-image img {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.5rem;
  width: 100%;
}

.product-card {
  background: #ffffff;
  border: 2px solid var(--primary-orange, #ff6a00);
  border-radius: 18px;
  padding: 1.25rem;
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
  box-shadow: 0 10px 25px rgba(255, 106, 0, 0.15);
}

.product-img-frame {
  width: 100%;
  height: 160px;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.product-img-frame :deep(.product-image-wrapper) {
  width: 100%;
  height: 100%;
  background-color: transparent;
}

.product-category {
  font-size: 0.72rem;
  color: #718096;
  text-align: center;
  margin-bottom: 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
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
}

.product-info .price {
  color: var(--primary-orange, #ff6a00);
  font-weight: 700;
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
  padding-top: 0.75rem;
  margin-top: auto;
  min-width: 0;
}

.provider-name-wrap {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  overflow: hidden;
}

.badge-verified {
  color: #0284c7;
  flex-shrink: 0;
}

.provider-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

.ranking-bubble.orange {
  background-color: var(--primary-orange, #ff6a00);
}
.ranking-bubble.teal {
  background-color: #0d9488;
}
.ranking-bubble.blue {
  background-color: var(--primary-blue, #023859);
}
.ranking-bubble.grey {
  background-color: #64748b;
}

/* Skeleton Loading */
.skeleton-card {
  pointer-events: none;
  border-color: var(--border-gray, #e2e8f0);
}

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-badge {
  width: 90px;
  height: 18px;
  border-radius: 10px;
  margin-bottom: 0.75rem;
}

.skeleton-image {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  margin-bottom: 0.75rem;
}

.skeleton-text {
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.skeleton-category {
  width: 40%;
  height: 0.75rem;
  margin: 0 auto 0.4rem;
}

.skeleton-title {
  width: 80%;
  height: 1rem;
}

.skeleton-sub {
  width: 50%;
  height: 0.75rem;
  margin-left: auto;
}

.skeleton-footer {
  width: 100%;
  height: 1.25rem;
  margin-top: auto;
  border-radius: 6px;
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
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .top-sellers-header {
    flex-direction: column;
    text-align: center;
  }
  .benefits-badges {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
