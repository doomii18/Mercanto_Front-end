<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { categoryApi, productApi, organizationApi } from "../api";
import type { ProductCategoryResponse } from "../api/services/category/types";
import type { ProductResponse } from "../api/services/product/types";
import CategoryHeroCard from "../components/category/CategoryHeroCard.vue";
import CategoryPicker from "../components/category/CategoryPicker.vue";
import ProductImage from "../components/product/ProductImage.vue";
import AppFooter from "../components/common/AppFooter.vue";

import logoImg from "../assets/logo.png";

interface ProductCardItem {
  id: string;
  title: string;
  category: string;
  categoryId?: string;
  price: string;
  minOrder: string;
  imageBlobId: string | null;
  provider: string;
  rating: number | string;
  rank: number;
  rankTheme: string;
  isWishlist: boolean;
}

interface ProviderItem {
  id: string;
  name: string;
  rating: number;
  location: string;
  categoryId?: string;
  categoryName?: string;
}

const PAGE_SIZE = 12;

const route = useRoute();
const router = useRouter();

const searchFilter = ref<string>("");
const wishlistSet = ref<Set<string>>(new Set());

const categories = ref<ProductCategoryResponse[]>([]);
const apiProducts = ref<ProductResponse[]>([]);
const isLoadingCategories = ref<boolean>(false);
const isLoadingProducts = ref<boolean>(false);
const isLoadingMore = ref<boolean>(false);

const offset = ref(0);
const totalApiProducts = ref(0);

const providersMap = ref<Map<string, string>>(new Map());

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

const products = computed<ProductCardItem[]>(() => {
  let items = apiProducts.value.map((p, index) => {
    const categoryName = p.category?.name || "General";
    const priceValue = p.base_price;
    const minOrderValue = "Physical" in p.spec ? p.spec.Physical.min_order_quantity : 1;
    const providerName = providersMap.value.get(p.provider_id) || "Proveedor aliado";
    const averageScore = p.rating?.average_score ?? 0;

    return {
      id: p.id,
      title: p.title,
      category: categoryName,
      categoryId: p.category_id,
      price: `C$ ${priceValue.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
      minOrder: `Min. ${minOrderValue} uds`,
      imageBlobId: p.image_blob_ids?.[0] ?? null,
      provider: providerName,
      rating: averageScore > 0 ? averageScore.toFixed(1) : "0.0",
      rank: index + 1,
      rankTheme: `rank-${(index % 4) + 1}`,
      isWishlist: wishlistSet.value.has(p.id),
    };
  });

  if (searchFilter.value.trim() !== "") {
    const query = searchFilter.value.toLowerCase().trim();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.provider.toLowerCase().includes(query)
    );
  }

  return items;
});

const featuredProviders = computed<ProviderItem[]>(() => {
  if (apiProducts.value.length === 0) return [];

  const providerStats = new Map<string, { scoreSum: number; count: number }>();

  apiProducts.value.forEach((p) => {
    const score = p.rating?.average_score ?? 0;
    const stats = providerStats.get(p.provider_id) || { scoreSum: 0, count: 0 };
    stats.scoreSum += score;
    stats.count += 1;
    providerStats.set(p.provider_id, stats);
  });

  return Array.from(providerStats.entries())
    .map(([id, stats]) => {
      const avgRating = stats.count > 0 ? stats.scoreSum / stats.count : 0;
      return {
        id,
        name: providersMap.value.get(id) || "Proveedor aliado",
        rating: Number(avgRating.toFixed(1)),
        location: "Nicaragua",
        count: stats.count
      };
    })
    .sort((a, b) => b.rating - a.rating || b.count - a.count)
    .slice(0, 3)
    .map(({ id, name, rating, location }) => ({
      id,
      name,
      rating,
      location
    }));
});

function toggleWishlist(prod: ProductCardItem): void {
  if (wishlistSet.value.has(prod.id)) {
    wishlistSet.value.delete(prod.id);
  } else {
    wishlistSet.value.add(prod.id);
  }
}

function goToProduct(prod: ProductCardItem): void {
  router.push({ name: "product-detail", params: { id: prod.id } });
}

async function resolveProviderNames(items: ProductResponse[]): Promise<void> {
  const missingIds = [...new Set(items.map((p) => p.provider_id).filter((id) => !providersMap.value.has(id)))];
  if (missingIds.length === 0) return;

  await Promise.allSettled(
    missingIds.map(async (id) => {
      try {
        const org = await organizationApi.getPublicProvider(id);
        providersMap.value.set(id, org.company_name);
      } catch {
        providersMap.value.set(id, "Proveedor aliado");
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
    console.warn("Using default category definitions:", err);
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

    await resolveProviderNames(res.data);

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
    <header class="top-header">
      <div class="logo">
        <router-link :to="{ name: 'home' }">
          <img :src="logoImg" alt="Mercanto" class="logo-icon" />
        </router-link>
      </div>
      <nav class="nav-links">
        <router-link :to="{ name: 'home' }">Inicio</router-link>
        <router-link :to="{ name: 'category' }">Categorías</router-link>
        <router-link :to="{ name: 'home', hash: '#proveedores' }">Proveedores</router-link>
        <router-link :to="{ name: 'home', hash: '#como-funciona' }">Cómo funciona</router-link>
        <router-link :to="{ name: 'orders' }">Pedidos</router-link>
      </nav>
      <div class="auth-buttons">
        <router-link :to="{ name: 'login' }" class="login-btn">Iniciar sesión</router-link>
        <router-link :to="{ name: 'register' }" class="register-btn">Registrarse</router-link>
      </div>
    </header>

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
          <button type="button" class="btn-filter"><i class="fa-solid fa-bars"></i></button>
        </div>
      </section>

      <section class="products-catalog">
        <div class="catalog-header">
          <span>Mostrando {{ products.length > 0 ? 1 : 0 }}-{{ products.length }} de {{ totalProducts }} productos</span>
        </div>

        <div v-if="products.length === 0" class="empty-products-msg">
          <i class="fa-solid fa-box-open"></i>
          <h3>No hay productos disponibles en esta categoría.</h3>
        </div>

        <div v-else class="products-grid">
          <div
            v-for="prod in products"
            :key="prod.id"
            class="product-card"
            style="cursor: pointer;"
            @click="goToProduct(prod)"
          >
            <button
              type="button"
              :class="['btn-wishlist', { active: prod.isWishlist }]"
              @click.stop="toggleWishlist(prod)"
            >
              <i :class="prod.isWishlist ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"></i>
            </button>
            <div class="product-img-wrapper">
              <ProductImage :blob-id="prod.imageBlobId" :alt="prod.title" />
            </div>
            <div class="card-info">
              <span class="category-label">{{ prod.category }}</span>
              <h4 class="product-title">{{ prod.title }}</h4>
              <div class="price-min-order">
                <span class="price">{{ prod.price }}</span>
                <span class="min-order">{{ prod.minOrder }}</span>
              </div>
              <div class="provider-info">
                <div class="provider-details">
                  <i class="fa-solid fa-circle-check verified-icon"></i>
                  <span class="provider-name">{{ prod.provider }}</span>
                </div>
                <div class="rating-info">
                  <i class="fa-regular fa-user"></i>
                  <span class="rating">{{ prod.rating }} <i class="fa-solid fa-star star-filled"></i></span>
                </div>
              </div>
            </div>
            <div :class="['rank-badge', prod.rankTheme]">{{ prod.rank }}</div>
          </div>
        </div>

        <div v-if="hasMore && products.length > 0" class="load-more-wrapper">
          <button type="button" class="btn-load-more" :disabled="isLoadingMore" @click="loadMore">
            {{ isLoadingMore ? 'Cargando...' : 'Cargar más productos' }}
            <i :class="isLoadingMore ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chevron-down'"></i>
          </button>
        </div>
      </section>

      <section v-if="products.length > 0 && featuredProviders.length > 0" class="featured-providers">
        <h2>Proveedores destacados de {{ heroTitle }}</h2>
        <div class="providers-grid">
          <div v-for="(prov, idx) in featuredProviders" :key="idx" class="provider-card">
            <div class="provider-avatar">
              <i class="fa-regular fa-user"></i>
            </div>
            <h4>{{ prov.name }}</h4>
            <div class="verified-badge">
              <i class="fa-solid fa-certificate"></i>
              <span>Proveedor verificado</span>
            </div>
            <div class="provider-rating">
              <strong>{{ prov.rating }}</strong>
              <i class="fa-solid fa-star star-filled"></i>
            </div>
            <p class="provider-location">{{ prov.location }}</p>
            <button type="button" class="btn-catalog">Ver catálogo</button>
          </div>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<style scoped>
.category-view {
  min-height: 100vh;
  background-color: #ffffff;
  color: #023859;
}

.top-header {
  background-color: #fdf5f4;
  padding: 1.25rem 3rem;
  border-bottom: 2px solid #dcdcdc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-icon {
  height: 48px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.nav-links a {
  text-decoration: none;
  color: #023859;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.5rem 1.1rem;
  border-radius: 12px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.nav-links a:hover {
  background-color: #ffebd9;
  color: #ff6a00;
  box-shadow: 0 3px 10px rgba(255, 106, 0, 0.15);
  transform: translateY(-1px);
}

.nav-links a.router-link-active,
.nav-links a.router-link-exact-active {
  background-color: #ffd8bd;
  color: #ff6a00;
  font-weight: 700;
  box-shadow: 0 3px 12px rgba(255, 106, 0, 0.2);
}

.auth-buttons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.login-btn {
  text-decoration: none;
  color: #023859;
  font-weight: 600;
}

.register-btn {
  text-decoration: none;
  background-color: #ff6a00;
  color: white;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
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
  border: 1px solid #dcdcdc;
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
  background-color: #ff6a00;
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
  border: 1px solid #dcdcdc;
  border-radius: 20px;
  padding: 0.7rem 1.5rem;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  font-size: 0.9rem;
  color: #555;
}

.sort-select strong {
  color: #ff6a00;
}

.btn-filter {
  background: #ffffff;
  border: 1px solid #dcdcdc;
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
  color: #023859;
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
  color: #023859;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.product-card {
  background-color: #ffffff;
  border: 2px solid #00a896;
  border-radius: 15px;
  padding: 1rem;
  position: relative;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.btn-wishlist {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #ff4d4d;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.btn-wishlist:hover {
  transform: scale(1.15);
}

.product-img-wrapper {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.product-img-wrapper :deep(img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.category-label {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 0.3rem;
}

.product-title {
  font-size: 0.95rem;
  color: #023859;
  margin-bottom: 0.6rem;
  font-weight: 600;
}

.price-min-order {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.8rem;
}

.price {
  font-weight: 700;
  color: #ff6a00;
  font-size: 1.05rem;
}

.min-order {
  font-size: 0.75rem;
  color: #888;
}

.provider-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f0f0f0;
  padding-top: 0.6rem;
  margin-top: auto;
}

.provider-details {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #555;
}

.verified-icon {
  color: #00a896;
  font-size: 0.85rem;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8rem;
  color: #888;
}

.rating {
  font-weight: 600;
  color: #333;
}

.star-filled {
  color: #ffaa00;
}

.rank-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 700;
  font-size: 0.75rem;
}

.rank-1 { background-color: #ff6a00; }
.rank-2 { background-color: #00a896; }
.rank-3 { background-color: #023859; }
.rank-4 { background-color: #718096; }

.load-more-wrapper {
  text-align: center;
  margin-top: 2rem;
}

.btn-load-more {
  background-color: #ffffff;
  border: 2px solid #00a896;
  padding: 0.65rem 2rem;
  border-radius: 25px;
  color: #00a896;
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
  color: #023859;
  text-align: center;
  margin-bottom: 2.5rem;
}

.providers-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.provider-card {
  background: #ffffff;
  border: 2px solid #ff6a00;
  border-radius: 20px;
  padding: 2.2rem 1.8rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.provider-avatar {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #f5f7f9;
  border: 2px solid #023859;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  color: #023859;
  margin-bottom: 1rem;
}

.provider-card h4 {
  font-size: 1.15rem;
  color: #023859;
  margin-bottom: 0.4rem;
  font-weight: 700;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #00a896;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
}

.provider-rating {
  font-size: 1.2rem;
  color: #023859;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.provider-location {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
}

.btn-catalog {
  background-color: #ff6a00;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: opacity 0.2s ease;
}

.btn-catalog:hover {
  opacity: 0.92;
}

@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .providers-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  .top-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
  .search-sort-bar {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
