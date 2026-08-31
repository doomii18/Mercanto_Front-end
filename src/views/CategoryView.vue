<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { categoryApi, productApi } from "../api";
import type { ProductCategoryResponse } from "../api/services/category/types";
import type { ProductResponse } from "../api/services/product/types";
import CategoryHeroCard from "../components/category/CategoryHeroCard.vue";
import CategoryPicker from "../components/category/CategoryPicker.vue";
import AppFooter from "../components/common/AppFooter.vue";

import logoImg from "../assets/logo.png";
import mochilaImg from "../assets/mochila.png";
import tabletaImg from "../assets/tableta.png";
import utensiliosImg from "../assets/utensilios.png";
import paletaImg from "../assets/paleta.png";
import audifonosImg from "../assets/audifonos.png";
import joyeriaImg from "../assets/joyeria.png";

interface RawProduct {
  id: string;
  title: string;
  categoryName: string;
  categoryId?: string;
  price: number;
  minOrder: number;
  imageBlobId?: string | null;
  staticImage?: string;
  providerName: string;
  rating: number;
}

interface ProductCardItem {
  id: string;
  title: string;
  category: string;
  categoryId?: string;
  price: string;
  minOrder: string;
  image: string;
  provider: string;
  rating: number;
  rank: number;
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

const route = useRoute();
const router = useRouter();

const searchFilter = ref<string>("");
const wishlistSet = ref<Set<string>>(new Set());

// Mock Products Catalog
const mockProducts = ref<RawProduct[]>([
  {
    id: "prod-1",
    title: "Audífonos Bluetooth Sony WH-CH520",
    categoryName: "Artículos Tecnológicos",
    categoryId: "cat-tech",
    price: 1850,
    minOrder: 6,
    staticImage: audifonosImg,
    providerName: "NicaTech S.A",
    rating: 4.8,
  },
  {
    id: "prod-2",
    title: "Tablet para niños 10 Pulgadas",
    categoryName: "Artículos Tecnológicos",
    categoryId: "cat-tech",
    price: 950,
    minOrder: 5,
    staticImage: tabletaImg,
    providerName: "Managua Labs S.A",
    rating: 4.5,
  },
  {
    id: "prod-3",
    title: "Mochila Adventure Resistente",
    categoryName: "Bolsos & Maletas",
    categoryId: "cat-bags",
    price: 350,
    minOrder: 12,
    staticImage: mochilaImg,
    providerName: "Megaboutique S.A",
    rating: 4.7,
  },
  {
    id: "prod-4",
    title: "Set de ollas 9 piezas acero",
    categoryName: "Hogar y Cocina",
    categoryId: "cat-home",
    price: 1200,
    minOrder: 3,
    staticImage: utensiliosImg,
    providerName: "Distribuidora Central",
    rating: 4.9,
  },
  {
    id: "prod-5",
    title: "Paleta de Sombras Profesional",
    categoryName: "Belleza & Cuidado",
    categoryId: "cat-beauty",
    price: 420,
    minOrder: 10,
    staticImage: paletaImg,
    providerName: "Cosméticos de Nicaragua",
    rating: 4.6,
  },
  {
    id: "prod-6",
    title: "Set de Joyería Fina en Acero",
    categoryName: "Joyería y Accesorios",
    categoryId: "cat-jewelry",
    price: 280,
    minOrder: 24,
    staticImage: joyeriaImg,
    providerName: "Accesorios Express",
    rating: 4.4,
  },
]);

// Mock Providers Catalog
const mockProviders = ref<ProviderItem[]>([
  {
    id: "prov-1",
    name: "NicaTech S.A",
    rating: 4.9,
    location: "Managua, Nicaragua",
    categoryId: "cat-tech",
    categoryName: "Artículos Tecnológicos",
  },
  {
    id: "prov-2",
    name: "Managua Labs S.A",
    rating: 4.8,
    location: "Carretera Norte, Managua",
    categoryId: "cat-tech",
    categoryName: "Artículos Tecnológicos",
  },
  {
    id: "prov-3",
    name: "Distribuidora Central",
    rating: 4.7,
    location: "Mercado Oriental, Managua",
    categoryId: "cat-home",
    categoryName: "Hogar y Cocina",
  },
  {
    id: "prov-4",
    name: "Megaboutique S.A",
    rating: 4.8,
    location: "Altamira, Managua",
    categoryId: "cat-bags",
    categoryName: "Bolsos & Maletas",
  },
  {
    id: "prov-5",
    name: "Cosméticos de Nicaragua",
    rating: 4.6,
    location: "Los Robles, Managua",
    categoryId: "cat-beauty",
    categoryName: "Belleza & Cuidado",
  },
]);

const categories = ref<ProductCategoryResponse[]>([]);
const apiProducts = ref<ProductResponse[]>([]);
const isLoadingCategories = ref<boolean>(false);
const isLoadingProducts = ref<boolean>(false);

const selectedCategoryId = ref<string | null>(
  (route.query.category_id as string) || null
);

const currentCategory = computed<ProductCategoryResponse | null>(() => {
  if (!selectedCategoryId.value) return null;
  return categories.value.find((c) => c.id === selectedCategoryId.value) ?? null;
});

const heroTitle = computed<string>(() => {
  return currentCategory.value?.name ?? "Artículos Tecnológicos";
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

// Normalized & Filtered Products matching template schema
const products = computed<ProductCardItem[]>(() => {
  let sourceList: RawProduct[] = [];

  if (apiProducts.value.length > 0) {
    sourceList = apiProducts.value.map((p) => ({
      id: p.id,
      title: p.title,
      categoryName: p.category?.name || "General",
      categoryId: p.category_id,
      price: p.base_price,
      minOrder: "Physical" in p.spec ? p.spec.Physical.min_order_quantity : 1,
      imageBlobId: p.image_blob_ids?.[0] ?? null,
      providerName: "Proveedor aliado",
      rating: p.rating?.average_score ?? 4.5,
    }));
  } else {
    sourceList = mockProducts.value;
  }

  // Filter by Category
  if (selectedCategoryId.value) {
    const catName = currentCategory.value?.name.toLowerCase() || "";
    const filtered = sourceList.filter(
      (p) =>
        p.categoryId === selectedCategoryId.value ||
        p.categoryName.toLowerCase().includes(catName)
    );
    if (filtered.length > 0) {
      sourceList = filtered;
    }
  }

  // Filter by Search Input
  if (searchFilter.value.trim() !== "") {
    const query = searchFilter.value.toLowerCase().trim();
    sourceList = sourceList.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.categoryName.toLowerCase().includes(query) ||
        p.providerName.toLowerCase().includes(query)
    );
  }

  return sourceList.map((p, index) => ({
    id: p.id,
    title: p.title,
    category: p.categoryName,
    categoryId: p.categoryId,
    price: `C$ ${p.price.toLocaleString()}`,
    minOrder: `Min. ${p.minOrder} uds`,
    image: p.staticImage || audifonosImg,
    provider: p.providerName,
    rating: p.rating,
    rank: (index % 4) + 1,
    isWishlist: wishlistSet.value.has(p.id),
  }));
});

const totalProducts = computed<number>(() => products.value.length);

// Featured Providers matching selected category or fallback
const featuredProviders = computed<ProviderItem[]>(() => {
  if (selectedCategoryId.value) {
    const catName = currentCategory.value?.name.toLowerCase() || "";
    const matched = mockProviders.value.filter(
      (prov) =>
        prov.categoryId === selectedCategoryId.value ||
        prov.categoryName?.toLowerCase().includes(catName)
    );
    if (matched.length > 0) return matched;
  }
  return mockProviders.value.slice(0, 3);
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

async function loadProducts(): Promise<void> {
  isLoadingProducts.value = true;
  try {
    const res = await productApi.getProducts({
      limit: 50,
      offset: 0,
      category_id: selectedCategoryId.value || undefined,
      provider_id: (route.query.provider_id as string) || undefined,
    });
    apiProducts.value = res.data;
  } catch (err) {
    console.warn("Using fallback mock products:", err);
    apiProducts.value = [];
  } finally {
    isLoadingProducts.value = false;
  }
}

function handleCategorySelect(category: ProductCategoryResponse): void {
  if (selectedCategoryId.value === category.id) return;
  selectedCategoryId.value = category.id;
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
    loadProducts();
  }
);

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts()]);
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
          <span>Mostrando 1-{{ products.length }} de {{ totalProducts }} productos</span>
        </div>

        <div class="products-grid">
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
              <img :src="prod.image" :alt="prod.title" />
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
            <div :class="['rank-badge', `rank-${prod.rank}`]">{{ prod.rank }}</div>
          </div>
        </div>

        <div class="load-more-wrapper">
          <button type="button" class="btn-load-more">
            Cargar más productos <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </section>

      <section class="featured-providers">
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

.product-img-wrapper img {
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

.btn-load-more:hover {
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
