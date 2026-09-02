<script setup lang="ts">
import { ref, onMounted } from "vue";
import { productApi } from "../../api";
import type { ProductResponse } from "../../api/services/product/types";
import ProductCard from "./ProductCard.vue";
import topSellersHeroImg from "../../assets/top-sellers-hero.png";

interface TopProductItem {
  id: string;
  title: string;
  categoryName: string;
  price: number;
  minOrder: number;
  imageBlobId: string | null;
  providerId: string;
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

    topProducts.value = res.data.map((prod, index) => ({
      id: prod.id,
      title: prod.title,
      categoryName: prod.category?.name || "General",
      price: prod.base_price,
      minOrder: resolveMinOrder(prod.spec),
      imageBlobId: prod.image_blob_ids?.[0] ?? null,
      providerId: prod.provider_id,
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
      <div v-for="n in 4" :key="n" class="skeleton-card" aria-hidden="true">
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
      <ProductCard
        v-for="product in topProducts"
        :key="product.id"
        :id="product.id"
        :title="product.title"
        :category-name="product.categoryName"
        :price="product.price"
        :min-order="product.minOrder"
        :image-blob-id="product.imageBlobId"
        :provider-id="product.providerId"
        :rating="product.rating"
        :review-count="product.reviewCount"
        :rank="product.rank"
        :bubble-class="product.bubbleClass"
        badge-text="Los más vendidos"
        badge-icon="fa-solid fa-fire"
      />
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

.skeleton-card {
  background: #ffffff;
  border: 2px solid var(--border-gray, #e2e8f0);
  border-radius: 18px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  pointer-events: none;
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
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
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
