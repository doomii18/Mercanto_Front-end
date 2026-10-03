import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { StoreCache } from "@/utils/cache";
import { useCategoryApi } from "@/api/modules/catalog/category/useCategoryApi";
import type { ProductCategoryResponse } from "@/api";

export const useCategoryStore = defineStore("category", () => {
  const categoryApi = useCategoryApi();
  const categories = ref<ProductCategoryResponse[]>([]);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref<Error | null>(null);

  // Persistent L1/L2 cache (IndexedDB + memory, 2 hours TTL)
  const categoryCache = new StoreCache<ProductCategoryResponse[]>({
    persistent: true,
    dbName: "mercanto_catalog_db",
    storeName: "categories_cache",
    ttlMs: 1000 * 60 * 60 * 2,
    maxMemoryEntries: 5,
  });

  const categoriesMap = computed(() => {
    const map = new Map<string, ProductCategoryResponse>();
    for (const cat of categories.value) {
      map.set(cat.id, cat);
    }
    return map;
  });

  async function fetchCategories(forceRefresh = false): Promise<ProductCategoryResponse[]> {
    if (isLoaded.value && !forceRefresh && categories.value.length > 0) {
      return categories.value;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const data = await categoryCache.getOrFetch(
        "all_categories",
        async () => {
          const res = await categoryApi.getCategories({ limit: 100 });
          return res?.data || (res as any)?.items || [];
        },
        { forceRefresh },
      );
      categories.value = data || [];
      isLoaded.value = true;
      return categories.value;
    } catch (err: any) {
      error.value = err;
      console.warn("Failed to fetch categories in categoryStore:", err);
      return categories.value;
    } finally {
      isLoading.value = false;
    }
  }

  function getCategoryName(categoryId?: string | null, fallback = "General"): string {
    if (!categoryId) return fallback;
    const cat = categoriesMap.value.get(categoryId);
    return cat ? cat.name : fallback;
  }

  function getCategory(categoryId?: string | null): ProductCategoryResponse | null {
    if (!categoryId) return null;
    return categoriesMap.value.get(categoryId) || null;
  }

  return {
    categories,
    categoriesMap,
    isLoading,
    isLoaded,
    error,
    fetchCategories,
    getCategoryName,
    getCategory,
  };
});
