<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useFavoritesStore, useCategoryStore } from "@/stores/commerce";
import { useGeoStore } from "@/stores/geo";
import { useAuthStore } from "@/stores/auth";
import type { ProductResponse, PublicProviderDto, ProductCategoryResponse } from "@/api";
import ProductImageCarousel from "@/components/product/ProductImageCarousel.vue";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useReviewApi } from "@/api/modules/commerce/review/useReviewApi";

const route = useRoute();
const router = useRouter();
const geoStore = useGeoStore();
const authStore = useAuthStore();

const providerId = computed(() => route.params.providerId as string);
const organizationApi = useOrganizationApi();
const productApi = useProductApi();
const categoryStore = useCategoryStore();
const favoritesStore = useFavoritesStore();
const reviewApi = useReviewApi();

const provider = ref<PublicProviderDto | null>(null);
const products = ref<ProductResponse[]>([]);
const categories = ref<ProductCategoryResponse[]>([]);

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

const resolveMinOrder = (spec: ProductResponse["spec"]): number => {
  if ("Physical" in spec && spec.Physical?.min_order_quantity) {
    return spec.Physical.min_order_quantity;
  }
  return 1;
};

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
    const prov = await organizationApi.getPublicProvider(providerId.value);
    try {
      const metric = await reviewApi.getProviderMetrics(providerId.value);
      prov.rating = {
        average_score: metric.rating_score,
        review_count: metric.review_count,
      };
    } catch {
      // fallback
    }
    provider.value = prov;
  } catch (err) {
    console.error("Failed to fetch provider:", err);
  } finally {
    isLoadingProvider.value = false;
  }
};

const fetchCategories = async () => {
  isLoadingCategories.value = true;
  try {
    categories.value = await categoryStore.fetchCategories();
  } catch (err) {
    console.error("Failed to fetch categories:", err);
  } finally {
    isLoadingCategories.value = false;
  }
};

const isFavorite = (productId: string) => favoritesStore.isFavorite(productId);

const handleFavoriteClick = (productId: string) => {
  favoritesStore.toggleFavorite(productId, {
    router,
    redirectPath: route.fullPath,
  });
};

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

    const productIds = res.data.map((p) => p.id);
    let metricsMap: Record<string, { rating_score: number; review_count: number }> = {};
    if (productIds.length > 0) {
      metricsMap = await reviewApi
        .getProductMetricsBatch({ product_ids: productIds })
        .catch(() => ({}));
    }

    products.value = res.data.map((p) => {
      const metric = metricsMap[p.id];
      return {
        ...p,
        rating: metric
          ? { average_score: metric.rating_score, review_count: metric.review_count }
          : p.rating,
      };
    });
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

watch(
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      favoritesStore.fetchFavorites(true);
    }
  }
);

onMounted(async () => {
  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch(console.warn);
  }
  if (!authStore.isInitialized) {
    await authStore.initialize().catch(console.warn);
  }
  fetchProvider();
  fetchCategories();
  fetchProducts();
  if (!favoritesStore.isInitialized) {
    favoritesStore.fetchFavorites().catch(console.warn);
  }
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
              <!-- Favorite Toggle -->
              <button
                type="button"
                :class="[
                  'absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all hover:scale-110',
                  isFavorite(product.id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/90 text-slate-400 backdrop-blur-xs hover:text-red-500 hover:bg-white'
                ]"
                :title="isFavorite(product.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                @click.stop="handleFavoriteClick(product.id)"
              >
                <i :class="[isFavorite(product.id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart', 'text-xs']"></i>
              </button>

              <!-- Image Frame -->
              <router-link
                :to="{ name: 'product-detail', params: { id: product.id } }"
                :class="[
                  'relative shrink-0 overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center cursor-pointer group-hover:opacity-95 transition-opacity',
                  viewMode === 'grid'
                    ? 'h-48 w-full mb-3'
                    : 'h-28 w-full sm:h-28 sm:w-28 mb-3 sm:mb-0'
                ]"
              >
                <ProductImageCarousel
                  :blob-ids="product.image_blob_ids"
                  :product-id="product.id"
                  :alt="product.title"
                  object-fit="cover"
                  variant="card"
                />
              </router-link>

              <!-- Product Details -->
              <div class="min-w-0 flex-1">
                <div v-if="categoryStore.getCategoryName(product.category_id, product.category?.name)" class="mb-1.5 flex items-center justify-between">
                  <span
                    class="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2 py-0.5 text-[0.68rem] font-semibold text-teal-700 shadow-2xs cursor-pointer hover:bg-teal-100 hover:text-teal-800 transition-colors"
                    :title="`Filtrar por ${categoryStore.getCategoryName(product.category_id, product.category?.name)}`"
                    @click.stop="selectedCategory = product.category_id"
                  >
                    <i class="fa-solid fa-tag text-[8px] text-teal-600"></i>
                    <span class="truncate max-w-[120px]">{{ categoryStore.getCategoryName(product.category_id, product.category?.name) }}</span>
                  </span>

                  <span v-if="resolveMinOrder(product.spec) > 1" class="text-[0.68rem] text-slate-400 font-medium whitespace-nowrap">
                    Mín. {{ resolveMinOrder(product.spec) }} und
                  </span>
                </div>

                <router-link
                  :to="{ name: 'product-detail', params: { id: product.id } }"
                  class="block line-clamp-2 min-h-[2.5rem] font-serif text-sm font-bold text-[#023859] hover:text-teal-700 transition-colors leading-snug"
                  :title="product.title"
                >
                  {{ product.title }}
                </router-link>

                <p class="mt-1 text-sm font-bold text-[#ff6a00]">
                  {{ formatPrice(product.base_price) }}
                </p>

                <div class="mt-1.5 flex items-center justify-between text-[11px]">
                  <span
                    :class="[
                      'font-semibold',
                      product.is_active ? 'text-[#00a896]' : 'text-slate-400'
                    ]"
                  >
                    {{ product.is_active ? "En stock" : "Agotado" }}
                  </span>
                  <span class="flex items-center gap-1 text-slate-500">
                    <i class="fa-solid fa-star text-[10px] text-amber-400"></i>
                    <span class="font-bold">{{ product.rating?.average_score?.toFixed(1) || '0.0' }}</span>
                    <span v-if="product.rating?.review_count" class="text-slate-400 font-normal">({{ product.rating.review_count }})</span>
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
