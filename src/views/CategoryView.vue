<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { categoryApi, productApi, organizationApi } from "../api";
import type { ProductCategoryResponse } from "../api/services/category/types";
import type { ProductResponse } from "../api/services/product/types";
import CategoryHeroCard from "../components/category/CategoryHeroCard.vue";
import CategoryPicker from "../components/category/CategoryPicker.vue";
import ProviderCard from "../components/organization/ProviderCard.vue";
import ProductCard from "../components/product/ProductCard.vue";

interface ProviderMeta {
  name: string;
  logoBlobId: string | null;
  municipalityId: string | null;
}

interface FeaturedProviderItem {
  id: string;
  name: string;
  logoBlobId: string | null;
  rating: number;
  municipalityId: string | null;
  count?: number;
}

const PAGE_SIZE = 12;
const BUBBLE_CLASSES = ["orange", "teal", "blue", "grey"] as const;

const route = useRoute();
const router = useRouter();

const searchFilter = ref<string>("");

const categories = ref<ProductCategoryResponse[]>([]);
const apiProducts = ref<ProductResponse[]>([]);
const isLoadingCategories = ref<boolean>(false);
const isLoadingProducts = ref<boolean>(false);
const isLoadingMore = ref<boolean>(false);

const offset = ref(0);
const totalApiProducts = ref(0);

const providersMap = ref<Map<string, ProviderMeta>>(new Map());

const selectedCategoryId = ref<string | null>(
  (route.query.category_id as string) || null
);

const currentCategory = computed<ProductCategoryResponse | null>(() => {
  if (!selectedCategoryId.value) return null;
  return categories.value.find((c) => c.id === selectedCategoryId.value) ?? null;
});

const heroTitle = computed<string>(() => {
  return currentCategory.value?.name ?? "Catálogo General";
});

const heroDescription = computed<string | null>(() => {
  return (
    currentCategory.value?.description ??
    "Explora los mejores productos mayoristas al mejor precio."
  );
});

const heroImageBlobId = computed<string | null>(() => {
  return currentCategory.value?.image_blob_id ?? null;
});

const hasMore = computed<boolean>(() => {
  return apiProducts.value.length < totalApiProducts.value;
});

const totalProducts = computed<number>(() => {
  return totalApiProducts.value;
});

function resolveMinOrder(spec: ProductResponse["spec"]): number {
  if ("Physical" in spec && spec.Physical?.min_order_quantity) {
    return spec.Physical.min_order_quantity;
  }
  return 1;
}

const filteredProducts = computed<ProductResponse[]>(() => {
  if (!searchFilter.value.trim()) return apiProducts.value;
  const query = searchFilter.value.toLowerCase().trim();

  return apiProducts.value.filter((p) => {
    const matchTitle = p.title.toLowerCase().includes(query);
    const matchCategory = p.category?.name?.toLowerCase().includes(query);
    return matchTitle || matchCategory;
  });
});

const featuredProviders = computed<FeaturedProviderItem[]>(() => {
  const reviewedProducts = apiProducts.value.filter(
    (p) => (p.rating?.review_count ?? 0) > 0
  );

  if (reviewedProducts.length === 0) return [];

  const providerStats = new Map<string, { scoreSum: number; count: number }>();

  reviewedProducts.forEach((p) => {
    const score = p.rating?.average_score ?? 0;
    const stats = providerStats.get(p.provider_id) || { scoreSum: 0, count: 0 };
    stats.scoreSum += score;
    stats.count += 1;
    providerStats.set(p.provider_id, stats);
  });

  return Array.from(providerStats.entries())
    .map(([id, stats]) => {
      const avgRating = stats.count > 0 ? stats.scoreSum / stats.count : 0;
      const meta = providersMap.value.get(id);
      return {
        id,
        name: meta?.name || "Proveedor aliado",
        logoBlobId: meta?.logoBlobId ?? null,
        municipalityId: meta?.municipalityId ?? null,
        rating: Number(avgRating.toFixed(1)),
        count: stats.count,
      };
    })
    .sort((a, b) => b.rating - a.rating || (b.count ?? 0) - (a.count ?? 0))
    .slice(0, 3);
});

async function resolveFeaturedProviderMeta(items: ProductResponse[]): Promise<void> {
  const missingIds = [...new Set(items.map((p) => p.provider_id).filter((id) => !providersMap.value.has(id)))];
  if (missingIds.length === 0) return;

  await Promise.allSettled(
    missingIds.map(async (id) => {
      try {
        const org = await organizationApi.getPublicProvider(id);
        providersMap.value.set(id, {
          name: org.company_name,
          logoBlobId: org.logo_blob_id ?? null,
          municipalityId: org.municipality_id ?? null,
        });
      } catch {
        providersMap.value.set(id, {
          name: "Proveedor aliado",
          logoBlobId: null,
          municipalityId: null,
        });
      }
    })
  );
}

async function loadCategories(): Promise<void> {
  isLoadingCategories.value = true;
  try {
    const res = await categoryApi.getCategories({ limit: 100 });
    categories.value = res.data;
  } catch (err) {
    console.warn("Error loading categories:", err);
  } finally {
    isLoadingCategories.value = false;
  }
}

async function loadProducts(isAppend = false): Promise<void> {
  if (isAppend) {
    isLoadingMore.value = true;
  } else {
    isLoadingProducts.value = true;
    offset.value = 0;
  }

  try {
    const res = await productApi.getProducts({
      limit: PAGE_SIZE,
      offset: offset.value,
      category_id: selectedCategoryId.value || undefined,
      provider_id: (route.query.provider_id as string) || undefined,
      sort_by: "created_at",
      sort_direction: "desc",
    });

    totalApiProducts.value = res.total;

    if (isAppend) {
      apiProducts.value.push(...res.data);
    } else {
      apiProducts.value = res.data;
    }

    await resolveFeaturedProviderMeta(res.data);
  } catch (err) {
    console.error("Error loading products:", err);
    if (!isAppend) {
      apiProducts.value = [];
    }
  } finally {
    isLoadingProducts.value = false;
    isLoadingMore.value = false;
  }
}

function loadMore(): void {
  if (isLoadingMore.value || !hasMore.value) return;
  offset.value += PAGE_SIZE;
  loadProducts(true);
}

function handleCategorySelect(category: ProductCategoryResponse): void {
  router.push({
    name: "category",
    query: {
      ...route.query,
      category_id: category.id,
    },
  });
}

watch(
  () => route.query.category_id,
  (newCatId) => {
    selectedCategoryId.value = (newCatId as string) || null;
    loadProducts(false);
  }
);

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts(false)]);
});
</script>

<template>
  <div class="category-view">
    <main class="category-page-container">
      <CategoryHeroCard
        :name="heroTitle"
        :description="heroDescription"
        :image-blob-id="heroImageBlobId"
        :product-count="totalProducts"
      />

      <CategoryPicker
        v-model="selectedCategoryId"
        :categories="categories"
        title="Explora otras categorías"
        @select="handleCategorySelect"
      />

      <section class="search-sort-bar">
        <div class="search-box-wrapper">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input v-model="searchFilter" type="text" :placeholder="`Buscar en ${heroTitle}`" />
          <button type="button" class="btn-orange">Buscar productos</button>
        </div>
        <div class="sort-filter-wrapper">
          <div class="sort-select">
            <span>Ordenar por: <strong>Más Relevantes</strong></span>
          </div>
          <button type="button" class="btn-filter" aria-label="Filtros">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </section>

      <section class="products-catalog">
        <div class="catalog-header">
          <span>Mostrando {{ filteredProducts.length > 0 ? 1 : 0 }}-{{ filteredProducts.length }} de {{ totalProducts }} productos</span>
        </div>

        <div v-if="isLoadingProducts" class="products-grid">
          <div v-for="n in 8" :key="n" class="skeleton-card" aria-hidden="true">
            <div class="skeleton-badge skeleton-pulse"></div>
            <div class="skeleton-image skeleton-pulse"></div>
            <div class="skeleton-text skeleton-category skeleton-pulse"></div>
            <div class="skeleton-text skeleton-title skeleton-pulse"></div>
            <div class="skeleton-text skeleton-sub skeleton-pulse"></div>
            <div class="skeleton-footer skeleton-pulse"></div>
          </div>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="empty-products-msg">
          <i class="fa-solid fa-box-open"></i>
          <h3>No hay productos disponibles en esta categoría.</h3>
        </div>

        <div v-else class="products-grid">
          <ProductCard
            v-for="(prod, index) in filteredProducts"
            :key="prod.id"
            :id="prod.id"
            :title="prod.title"
            :price="prod.base_price"
            :provider-id="prod.provider_id"
            :category-name="prod.category?.name || 'General'"
            :min-order="resolveMinOrder(prod.spec)"
            :image-blob-id="prod.image_blob_ids?.[0] ?? null"
            :rating="prod.rating?.average_score ?? 0"
            :review-count="prod.rating?.review_count ?? 0"
            :rank="index + 1"
            :bubble-class="BUBBLE_CLASSES[index % BUBBLE_CLASSES.length]"
          />
        </div>

        <div v-if="hasMore && filteredProducts.length > 0" class="load-more-wrapper">
          <button type="button" class="btn-load-more" :disabled="isLoadingMore" @click="loadMore">
            {{ isLoadingMore ? 'Cargando...' : 'Cargar más productos' }}
            <i :class="isLoadingMore ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chevron-down'"></i>
          </button>
        </div>
      </section>

      <section v-if="filteredProducts.length > 0 && featuredProviders.length > 0" class="featured-providers">
        <h2>Proveedores destacados de {{ heroTitle }}</h2>
        <div class="featured-providers-grid">
          <ProviderCard
            v-for="prov in featuredProviders"
            :key="prov.id"
            :id="prov.id"
            :name="prov.name"
            :logo-blob-id="prov.logoBlobId"
            :rating="prov.rating"
            :municipality-id="prov.municipalityId"
            :is-verified="true"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.category-view {
  min-height: 100vh;
  background-color: #ffffff;
  color: var(--primary-blue, #023859);
}

.category-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.search-sort-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.search-box-wrapper {
  flex: 2;
  display: flex;
  align-items: center;
  border: 1px solid var(--border-gray, #e2e8f0);
  border-radius: 30px;
  padding: 0.3rem 0.3rem 0.3rem 1.5rem;
  background-color: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.search-icon {
  color: #888;
  margin-right: 0.8rem;
  font-size: 1.1rem;
}

.search-box-wrapper input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
}

.search-box-wrapper .btn-orange {
  background-color: var(--primary-orange, #ff6a00);
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

.sort-filter-wrapper {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1rem;
}

.sort-select {
  border: 1px solid var(--border-gray, #e2e8f0);
  border-radius: 20px;
  padding: 0.7rem 1.5rem;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
  color: #555;
}

.sort-select strong {
  color: var(--primary-orange, #ff6a00);
}

.btn-filter {
  background: #ffffff;
  border: 1px solid var(--border-gray, #e2e8f0);
  border-radius: 12px;
  width: 45px;
  height: 45px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.products-catalog {
  background-color: #f5f7f9;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 3rem;
}

.catalog-header {
  margin-bottom: 1.5rem;
  font-weight: 600;
  color: var(--primary-blue, #023859);
}

.empty-products-msg {
  text-align: center;
  padding: 4rem 2rem;
  color: #888;
}

.empty-products-msg i {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.empty-products-msg h3 {
  font-size: 1.2rem;
  color: var(--primary-blue, #023859);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1.5rem;
}

.skeleton-card {
  background: #ffffff;
  border: 2px solid var(--border-gray, #e2e8f0);
  border-radius: 20px;
  padding: 1.1rem;
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
  width: 80px;
  height: 18px;
  border-radius: 10px;
  margin-bottom: 0.5rem;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  margin-bottom: 0.75rem;
}

.skeleton-text {
  border-radius: 6px;
  margin-bottom: 0.4rem;
}

.skeleton-category {
  width: 40%;
  height: 0.75rem;
  margin: 0 auto 0.35rem;
}

.skeleton-title {
  width: 80%;
  height: 1rem;
}

.skeleton-sub {
  width: 45%;
  height: 0.75rem;
  margin-left: auto;
  margin-bottom: 0.75rem;
}

.skeleton-footer {
  width: 100%;
  height: 1.5rem;
  margin-top: auto;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.load-more-wrapper {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  background-color: #ffffff;
  border: 2px solid var(--light-teal, #00a896);
  padding: 0.65rem 2rem;
  border-radius: 25px;
  color: var(--light-teal, #00a896);
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s, color 0.2s;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-load-more:hover:not(:disabled) {
  background-color: #e6f6f5;
}

.featured-providers {
  margin-bottom: 4rem;
}

.featured-providers h2 {
  font-size: 1.8rem;
  color: var(--primary-blue, #023859);
  text-align: center;
  margin-bottom: 2.5rem;
}

.featured-providers-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
}

@media (max-width: 1024px) {
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .featured-providers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .products-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .search-sort-bar {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
