<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCategoryApi } from "@/composables/api/useCategoryApi";
import { useProductApi } from "@/composables/api/useProductApi";
import type { ProductCategoryResponse } from "../api/services/category/types";
import type { ProductResponse } from "../api/services/product/types";
import CategoryHeroCard from "../components/category/CategoryHeroCard.vue";
import CategoryPicker from "../components/category/CategoryPicker.vue";
import ProviderCard from "../components/organization/ProviderCard.vue";
import ProductCard from "../components/product/ProductCard.vue";
import { useOrganizationApi } from "@/composables/api/useOrganizationApi";

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

const organizationApi = useOrganizationApi();
const categoryApi = useCategoryApi();
const productApi = useProductApi();

const searchFilter = ref<string>("");
const categories = ref<ProductCategoryResponse[]>([]);
const apiProducts = ref<ProductResponse[]>([]);
const isLoadingCategories = ref<boolean>(false);
const isLoadingProducts = ref<boolean>(false);
const isLoadingMore = ref<boolean>(false);
const offset = ref(0);
const totalApiProducts = ref(0);
const providersMap = ref<Map<string, ProviderMeta>>(new Map());

const sortBy = ref<string>("created_at");
const sortDirection = ref<string>("desc");

const selectedCategoryId = computed<string | null>(() => {
  return (route.params.categoryId as string) || null;
});

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
  if (!selectedCategoryId.value) {
    router.push({ name: "home" });
    return;
  }

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
      category_id: selectedCategoryId.value,
      sort_by: sortBy.value as any,
      sort_direction: sortDirection.value as any,
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
    params: { categoryId: category.id },
  });
}

function handleSortChange(): void {
  loadProducts(false);
}

onMounted(() => {
  if (!selectedCategoryId.value) {
    router.push({ name: "home" });
  }
});

watch(
  () => route.params.categoryId,
  (newCatId) => {
    if (newCatId) {
      loadProducts(false);
    }
  }
);

watch([sortBy, sortDirection], () => {
  loadProducts(false);
});

onMounted(async () => {
  await Promise.all([loadCategories(), loadProducts(false)]);
});
</script>
<template>
  <div class="min-h-screen bg-white text-neutral-900">
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      <!-- Search & Sort Bar -->
      <section class="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <!-- Search Input Wrapper -->
        <div class="flex flex-1 items-center rounded-full border border-neutral-200 bg-white p-1.5 shadow-sm transition-shadow focus-within:shadow-md">
          <i class="fa-solid fa-magnifying-glass pl-4 pr-3 text-neutral-400"></i>
          <input
            v-model="searchFilter"
            type="text"
            :placeholder="`Buscar en ${heroTitle}`"
            class="w-full border-none bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
          />
          <router-link
            :to="{ name: 'image-search' }"
            class="mr-2 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-teal-600 hover:bg-neutral-100 transition-colors shrink-0"
            title="Buscar por imagen"
            aria-label="Buscar por imagen"
          >
            <i class="fa-solid fa-camera text-sm"></i>
          </router-link>
          <button
            type="button"
            class="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 shrink-0 cursor-pointer"
          >
            Buscar productos
          </button>
        </div>

        <!-- Sort Select Wrapper -->
        <div class="flex flex-wrap items-center gap-2 rounded-2xl sm:rounded-full border border-neutral-200 bg-white px-4 py-2 shadow-sm">
          <span class="text-xs font-semibold uppercase tracking-wider text-neutral-900 whitespace-nowrap">
            Ordenar por:
          </span>
          <div class="flex flex-1 items-center gap-2">
            <select
              id="sort-by"
              v-model="sortBy"
              @change="handleSortChange"
              class="w-full sm:w-auto bg-transparent text-sm font-semibold text-orange-500 outline-none cursor-pointer hover:text-orange-600"
            >
              <option value="created_at" class="text-neutral-900">Más recientes</option>
              <option value="updated_at" class="text-neutral-900">Última actualización</option>
              <option value="title" class="text-neutral-900">Nombre (A-Z)</option>
              <option value="price" class="text-neutral-900">Precio</option>
              <option value="score" class="text-neutral-900">Calificación</option>
            </select>
            <span class="text-neutral-300">|</span>
            <select
              v-model="sortDirection"
              @change="handleSortChange"
              class="bg-transparent text-sm font-semibold text-orange-500 outline-none cursor-pointer hover:text-orange-600"
            >
              <option value="desc" class="text-neutral-900">Descendente</option>
              <option value="asc" class="text-neutral-900">Ascendente</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Products Grid & Catalog -->
      <section class="mb-12 rounded-3xl bg-neutral-100 p-6 sm:p-8">
        <div class="mb-6 font-semibold text-blue-500">
          <span>Mostrando {{ filteredProducts.length > 0 ? 1 : 0 }}-{{ filteredProducts.length }} de {{ totalProducts }} productos</span>
        </div>

        <div v-if="isLoadingProducts" class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="n in 8"
            :key="n"
            class="flex flex-col rounded-2xl border-2 border-neutral-200 bg-white p-4"
            aria-hidden="true"
          >
            <div class="h-4 w-20 animate-pulse rounded-full bg-neutral-200 mb-2"></div>
            <div class="aspect-square w-full animate-pulse rounded-xl bg-neutral-200 mb-3"></div>
            <div class="mx-auto h-3 w-2/5 animate-pulse rounded bg-neutral-200 mb-1.5"></div>
            <div class="h-4 w-4/5 animate-pulse rounded bg-neutral-200 mb-1"></div>
            <div class="ml-auto h-3 w-1/2 animate-pulse rounded bg-neutral-200 mb-3"></div>
            <div class="mt-auto h-6 w-full animate-pulse rounded bg-neutral-200"></div>
          </div>
        </div>

        <div v-else-if="filteredProducts.length === 0" class="py-16 text-center text-neutral-400">
          <i class="fa-solid fa-box-open text-6xl text-neutral-300 mb-4 block"></i>
          <h3 class="text-xl font-semibold text-blue-500">No hay productos disponibles en esta categoría.</h3>
        </div>

        <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

        <div v-if="hasMore && filteredProducts.length > 0" class="mt-8 text-center">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border-2 border-teal-500 bg-white px-8 py-2.5 text-sm font-semibold text-teal-500 transition-colors hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            :disabled="isLoadingMore"
            @click="loadMore"
          >
            {{ isLoadingMore ? 'Cargando...' : 'Cargar más productos' }}
            <i :class="isLoadingMore ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-chevron-down'"></i>
          </button>
        </div>
      </section>

      <!-- Featured Providers -->
      <section v-if="filteredProducts.length > 0 && featuredProviders.length > 0" class="mb-16">
        <h2 class="mb-10 text-center text-2xl font-bold text-blue-500 sm:text-3xl">
          Proveedores destacados de {{ heroTitle }}
        </h2>
        <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
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
