<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { productApi, organizationApi, categoryApi, cartApi } from "@/api";
import { useGeoStore } from "@/stores/geo";
import type { ProductResponse } from "@/api/services/product/types";
import type { PublicProviderDto } from "@/api/services/organization/types";
import type { ProductCategoryResponse } from "@/api/services/category/types";
import ProductImage from "@/components/product/ProductImage.vue";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";

const route = useRoute();
const geoStore = useGeoStore();

const providerId = computed(() => route.params.providerId as string);

const provider = ref<PublicProviderDto | null>(null);
const products = ref<ProductResponse[]>([]);
const categories = ref<ProductCategoryResponse[]>([]);
const favoriteProductIds = ref<Set<string>>(new Set());

const isLoadingProvider = ref(true);
const isLoadingProducts = ref(true);
const isLoadingCategories = ref(true);

const searchQuery = ref("");
const selectedCategory = ref("all");
const minPrice = ref<number | "">("");
const maxPrice = ref<number | "">("");
const sortOption = ref("best_sellers");
const viewMode = ref<"grid" | "list">("grid");

const currentPage = ref(1);
const totalPages = ref(1);
const totalProducts = ref(0);
const pageSize = 12;

const resolvedLocation = computed(() => {
  if (!provider.value?.municipality_id) return "Nicaragua";
  const hierarchy = geoStore.resolveLocationHierarchy(provider.value.municipality_id);
  if (!hierarchy?.municipality) return "Nicaragua";
  return hierarchy.department
    ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
    : hierarchy.municipality.name;
});

const getSortParams = () => {
  switch (sortOption.value) {
    case "price_asc": return { sort_by: "price" as const, sort_direction: "asc" as const };
    case "price_desc": return { sort_by: "price" as const, sort_direction: "desc" as const };
    case "rating": return { sort_by: "score" as const, sort_direction: "desc" as const };
    case "best_sellers":
    default: return { sort_by: "score" as const, sort_direction: "desc" as const };
  }
};

const displayedPages = computed(() => {
  const pages: (number | string)[] = [];
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
});

const fetchProvider = async () => {
  if (!providerId.value) return;
  isLoadingProvider.value = true;
  try {
    provider.value = await organizationApi.getPublicProvider(providerId.value);
  } catch (err) {
    console.error("Failed to fetch provider:", err);
  } finally {
    isLoadingProvider.value = false;
  }
};

const fetchCategories = async () => {
  isLoadingCategories.value = true;
  try {
    const res = await categoryApi.getCategories({ limit: 100 });
    categories.value = res.data;
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  } finally {
    isLoadingCategories.value = false;
  }
};

const fetchFavorites = async () => {
  try {
    const items = await cartApi.getMyCartProducts();
    favoriteProductIds.value = new Set(items.map((item) => item.product_id));
  } catch (err) {
    console.warn("Failed to load favorites:", err);
  }
};

const handleFavoriteClick = async (productId: string) => {
  const isInCart = favoriteProductIds.value.has(productId);
  try {
    if (isInCart) {
      await cartApi.deleteMyCartProduct(productId);
    } else {
      await cartApi.updateMyCartProductQuantity(productId, { quantity_delta: 1 });
    }
    const newSet = new Set(favoriteProductIds.value);
    if (isInCart) {
      newSet.delete(productId);
    } else {
      newSet.add(productId);
    }
    favoriteProductIds.value = newSet;
  } catch (err) {
    console.error("Failed to update cart:", err);
  }
};

const isFavorite = (productId: string) => favoriteProductIds.value.has(productId);

const fetchProducts = async () => {
  if (!providerId.value) return;
  isLoadingProducts.value = true;
  try {
    const sortParams = getSortParams();
    const res = await productApi.getProducts({
      provider_id: providerId.value,
      limit: pageSize,
      offset: (currentPage.value - 1) * pageSize,
      search_term: searchQuery.value.trim() || undefined,
      category_id: selectedCategory.value !== "all" ? selectedCategory.value : undefined,
      min_price: minPrice.value !== "" && minPrice.value !== null ? Number(minPrice.value) : undefined,
      max_price: maxPrice.value !== "" && maxPrice.value !== null ? Number(maxPrice.value) : undefined,
      ...sortParams,
    });
    products.value = res.data;
    totalProducts.value = res.total;
    totalPages.value = Math.max(1, Math.ceil(res.total / pageSize));
  } catch (err) {
    console.error("Failed to fetch products:", err);
    products.value = [];
    totalProducts.value = 0;
  } finally {
    isLoadingProducts.value = false;
  }
};

const clearFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "all";
  minPrice.value = "";
  maxPrice.value = "";
  currentPage.value = 1;
};

watch([searchQuery, selectedCategory, minPrice, maxPrice, sortOption], () => {
  currentPage.value = 1;
  fetchProducts();
});

watch(currentPage, () => {
  fetchProducts();
});

watch(providerId, () => {
  currentPage.value = 1;
  fetchProvider();
  fetchProducts();
});

const formatPrice = (val: number) => `C$ ${val.toLocaleString("es-NI")}`;

onMounted(async () => {
  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch(console.warn);
  }
  fetchProvider();
  fetchCategories();
  fetchProducts();
  fetchFavorites();
});
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- ── Left Sidebar: Provider Profile & Filters ── -->
      <aside class="space-y-6 lg:col-span-3">
        <!-- Provider Profile Card -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#35639f] text-xl font-bold text-white shadow-xs overflow-hidden">
              <ProviderLogo :blob-id="provider?.logo_blob_id" :alt="provider?.company_name" />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-serif text-base font-bold text-[#023859]">
                {{ provider?.company_name || 'Cargando...' }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ (provider?.rating?.review_count ?? 0) > 0 ? "Proveedor verificado" : "Proveedor registrado" }}
              </p>
            </div>
          </div>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="font-bold text-[#023859]">{{ provider?.rating?.average_score?.toFixed(1) || '0.0' }}</span>
            <div class="flex items-center text-xs text-[#ff6a00]">
              <i class="fa-solid fa-star"></i>
            </div>
            <span class="text-xs text-slate-400">({{ provider?.rating?.review_count || 0 }} reseñas)</span>
          </div>
          <p class="mt-2 text-xs font-medium text-slate-500">
            {{ resolvedLocation }}
          </p>
          <p class="mt-3 text-xs leading-relaxed text-slate-600">
            {{ provider?.company_description || 'Sin descripción disponible.' }}
          </p>
          <button
            type="button"
            class="mt-4 w-full rounded-full bg-[#00a896] py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#009688]"
          >
            Ver información del proveedor
          </button>
        </section>

        <!-- Product Search Filter -->
        <div class="space-y-2">
          <label class="block text-sm font-bold text-[#023859]">
            Filtrar productos
          </label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar en el catálogo..."
            class="w-full rounded-xl border-2 border-[#ff6a00] bg-white px-3.5 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6a00]/30"
          />
        </div>

        <!-- Categories List -->
        <div class="space-y-2">
          <h3 class="text-sm font-bold text-[#023859]">Categorías</h3>
          <nav class="max-h-60 space-y-1 overflow-y-auto pr-1">
            <button
              type="button"
              :class="[
                'w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                selectedCategory === 'all'
                  ? 'bg-[#d8f1ef] text-[#023859] font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
              @click="selectedCategory = 'all'"
            >
              Todos los productos
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              :class="[
                'w-full text-left rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                selectedCategory === cat.id
                  ? 'bg-[#d8f1ef] text-[#023859] font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              ]"
              @click="selectedCategory = cat.id"
            >
              {{ cat.name }}
            </button>
          </nav>
        </div>

        <!-- Price Range Filter -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-[#023859]">Rango de precio</h3>
          <div class="flex items-center gap-2">
            <input
              v-model.number="minPrice"
              type="number"
              placeholder="C$ Mínimo"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#00a896]"
            />
            <input
              v-model.number="maxPrice"
              type="number"
              placeholder="C$ Máximo"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#00a896]"
            />
          </div>
          <button
            type="button"
            class="w-full rounded-full border-2 border-[#00a896] bg-white py-1.5 text-xs font-semibold text-[#00a896] transition-colors hover:bg-[#d8f1ef]"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </aside>

      <!-- ── Right Column: Catalog Results ── -->
      <section class="lg:col-span-9">
        <!-- Header Controls -->
        <header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="font-serif text-3xl font-bold tracking-tight text-[#023859]">
              Catálogo de {{ provider?.company_name || 'Proveedor' }}
            </h1>
            <p class="mt-0.5 text-xs text-slate-500">
              Mostrando {{ products.length }} de {{ totalProducts }} productos
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative">
              <select
                v-model="sortOption"
                class="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-[#00a896]"
              >
                <option value="best_sellers">Ordenar por: Más vendidos</option>
                <option value="price_asc">Ordenar por: Menor precio</option>
                <option value="price_desc">Ordenar por: Mayor precio</option>
                <option value="rating">Ordenar por: Calificación</option>
              </select>
              <i class="fa-solid fa-chevron-down pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
            </div>
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Vista en cuadrícula"
                :class="[
                  'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                  viewMode === 'grid'
                    ? 'border-[#00a896]/30 bg-[#d8f1ef] text-[#00a896]'
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                ]"
                @click="viewMode = 'grid'"
              >
                <i class="fa-solid fa-table-cells-large text-xs"></i>
              </button>
              <button
                type="button"
                aria-label="Vista en lista"
                :class="[
                  'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                  viewMode === 'list'
                    ? 'border-[#00a896]/30 bg-[#d8f1ef] text-[#00a896]'
                    : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
                ]"
                @click="viewMode = 'list'"
              >
                <i class="fa-solid fa-list text-xs"></i>
              </button>
            </div>
          </div>
        </header>

        <!-- Product Cards Container -->
        <div
          :class="[
            'grid gap-4',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
              : 'grid-cols-1'
          ]"
        >
          <div v-if="isLoadingProducts" class="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <i class="fa-solid fa-spinner fa-spin text-3xl text-[#00a896] mb-4"></i>
            <p class="text-sm text-slate-500">Cargando productos...</p>
          </div>
          <template v-else-if="products.length > 0">
            <article
              v-for="product in products"
              :key="product.id"
              :class="[
                'group relative rounded-2xl border border-[#00a896]/30 bg-white p-3.5 shadow-xs transition-all hover:shadow-md',
                viewMode === 'grid'
                  ? 'flex flex-col justify-between'
                  : 'flex flex-col sm:flex-row sm:items-center sm:gap-4'
              ]"
            >
              <!-- Favorite / Cart Toggle -->
              <button
                type="button"
                :class="[
                  'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all hover:scale-110',
                  isFavorite(product.id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/90 text-slate-400 backdrop-blur-xs hover:text-red-500 hover:bg-white'
                ]"
                :title="isFavorite(product.id) ? 'Quitar del carrito' : 'Agregar al carrito'"
                @click.stop="handleFavoriteClick(product.id)"
              >
                <i :class="[isFavorite(product.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart', 'text-xs']"></i>
              </button>

              <!-- Image Frame -->
              <div
                :class="[
                  'relative shrink-0 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center',
                  viewMode === 'grid'
                    ? 'h-48 w-full mb-3'
                    : 'h-28 w-full sm:h-28 sm:w-28 mb-3 sm:mb-0'
                ]"
              >
                <ProductImage
                  :blob-id="product.image_blob_ids?.[0]"
                  :alt="product.title"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <!-- Product Details -->
              <div class="min-w-0 flex-1">
                <h2 class="line-clamp-1 font-serif text-sm font-bold text-[#023859]" :title="product.title">
                  {{ product.title }}
                </h2>
                <p class="mt-1 text-sm font-bold text-[#ff6a00]">
                  {{ formatPrice(product.base_price) }}
                </p>
                <div class="mt-1.5 flex items-center justify-between text-[11px]">
                  <span class="font-semibold text-[#00a896]">
                    {{ product.is_active ? "En stock" : "Agotado" }}
                  </span>
                  <span class="flex items-center gap-1 text-slate-500">
                    <i class="fa-solid fa-star text-[10px] text-amber-400"></i>
                    <span>{{ product.rating?.average_score?.toFixed(1) || '0.0' }}</span>
                    <span class="text-slate-400">({{ product.rating?.review_count || 0 }})</span>
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div
                :class="[
                  'flex items-center gap-1.5',
                  viewMode === 'grid' ? 'mt-3.5' : 'mt-3 sm:mt-0 sm:w-48 shrink-0'
                ]"
              >
                <router-link
                  :to="{ name: 'product-detail', params: { id: product.id } }"
                  class="flex flex-1 items-center justify-center rounded-lg bg-[#00a896] py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#009688]"
                >
                  Ver detalles
                </router-link>
              </div>
            </article>
          </template>
          <div v-else class="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <i class="fa-solid fa-box-open text-3xl text-slate-300 mb-4"></i>
            <p class="text-sm text-slate-500">No se encontraron productos con los filtros actuales.</p>
          </div>
        </div>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="mt-10 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 select-none">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <i class="fa-solid fa-chevron-left text-[10px]"></i>
          </button>

          <template v-for="page in displayedPages" :key="page">
            <span v-if="page === '...'" class="px-1 text-slate-400">...</span>
            <button
              v-else
              type="button"
              :class="[
                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                currentPage === page
                  ? 'bg-[#00a896] font-bold text-white'
                  : 'hover:bg-slate-100'
              ]"
              @click="currentPage = page as number"
            >
              {{ page }}
            </button>
          </template>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </nav>
      </section>
    </div>
  </main>
</template>
