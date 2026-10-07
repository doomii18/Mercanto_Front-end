<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useCategoryStore } from "@/stores/commerce";
import { useProductOffers } from "@/composables/useProductOffers";
import ProductCard from "@/components/product/ProductCard.vue";
import type { ProductResponse } from "@/api/modules/catalog/product/types";

interface Props {
  categoryId?: string | null;
  currentProductId?: string;
  categoryName?: string;
  providerId?: string | null;
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  categoryId: null,
  currentProductId: "",
  categoryName: "",
  providerId: null,
  limit: 4,
});

const productApi = useProductApi();
const categoryStore = useCategoryStore();

const relatedProducts = ref<ProductResponse[]>([]);
const isLoading = ref<boolean>(false);

const relatedProductIds = computed(() => relatedProducts.value.map((p) => p.id));
const { discountFor } = useProductOffers(relatedProductIds);

const displayCategoryName = computed(() => {
  if (props.categoryId) {
    return categoryStore.getCategoryName(props.categoryId, props.categoryName || "General");
  }
  return props.categoryName || "General";
});

function resolveMinOrder(spec: any): number {
  if (spec && "Physical" in spec && spec.Physical?.min_order_quantity) {
    return spec.Physical.min_order_quantity;
  }
  return 1;
}

function resolveUnitOfMeasure(spec: any): string | null {
  if (spec && "Physical" in spec && spec.Physical?.unit_of_measure) {
    return spec.Physical.unit_of_measure;
  }
  return null;
}

async function loadRelatedProducts() {
  if (!props.categoryId && !props.providerId) {
    relatedProducts.value = [];
    return;
  }

  isLoading.value = true;
  try {
    const promises: Promise<any>[] = [];
    if (props.categoryId) {
      promises.push(productApi.getProducts({ category_id: props.categoryId, limit: 8 }));
    }
    if (props.providerId) {
      promises.push(productApi.getProducts({ provider_id: props.providerId, limit: 8 }));
    }

    const results = await Promise.allSettled(promises);
    const pool: ProductResponse[] = [];

    for (const res of results) {
      if (res.status === "fulfilled" && res.value?.data) {
        for (const item of res.value.data) {
          if (item.id !== props.currentProductId && !pool.some((p) => p.id === item.id)) {
            pool.push(item);
          }
        }
      }
    }

    if (pool.length < props.limit) {
      try {
        const fallbackRes = await productApi.getProducts({ limit: 8 });
        if (fallbackRes?.data) {
          for (const item of fallbackRes.data) {
            if (item.id !== props.currentProductId && !pool.some((p) => p.id === item.id)) {
              pool.push(item);
            }
          }
        }
      } catch (fallbackErr) {
        console.warn("Could not fetch fallback related products:", fallbackErr);
      }
    }

    relatedProducts.value = pool.slice(0, props.limit);
  } catch (err) {
    console.warn("Could not fetch related products:", err);
    relatedProducts.value = [];
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [props.categoryId, props.providerId, props.currentProductId],
  () => {
    loadRelatedProducts();
  },
  { immediate: true }
);
</script>

<template>
  <section v-if="isLoading || relatedProducts.length > 0" class="mt-14 mb-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <span class="h-5 w-1.5 rounded-full bg-orange-500"></span>
          <h2 class="text-xl sm:text-2xl font-black text-[#083c5a] tracking-tight">
            Productos Relacionados
          </h2>
        </div>
        <p class="text-xs sm:text-sm text-neutral-500 mt-1">
          Artículos similares que también podrían interesarte
        </p>
      </div>
      <router-link
        v-if="categoryId"
        :to="{ path: '/products', query: { category_id: categoryId } }"
        class="text-xs sm:text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors group self-start sm:self-auto"
      >
        Ver más en {{ displayCategoryName }}
        <i class="fa-solid fa-arrow-right text-[10px] transition-transform duration-200 group-hover:translate-x-1"></i>
      </router-link>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="n in limit"
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

    <!-- Product Cards Grid with Batch Discount Percentage -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <ProductCard
        v-for="relProd in relatedProducts"
        :key="relProd.id"
        :id="relProd.id"
        :title="relProd.title"
        :price="Number(relProd.base_price)"
        :provider-id="relProd.provider_id"
        :category-id="relProd.category_id"
        :image-blob-id="relProd.image_blob_ids?.[0] ?? null"
        :image-blob-ids="relProd.image_blob_ids ?? []"
        :min-order="resolveMinOrder(relProd.spec)"
        :unit-of-measure="resolveUnitOfMeasure(relProd.spec)"
        :rating="relProd.rating?.average_score ?? 0"
        :review-count="relProd.rating?.review_count ?? 0"
        :is-active="relProd.is_active"
        :discount-percentage="discountFor(relProd.id)"
      />
    </div>
  </section>
</template>
