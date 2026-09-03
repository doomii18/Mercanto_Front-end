<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { categoryApi } from "../../api";
import type { ProductCategoryResponse } from "../../api/services/category/types";
import CategoryImage from "./CategoryImage.vue";

interface CategoryViewItem extends ProductCategoryResponse {
  productCount: number;
}

const categories = ref<CategoryViewItem[]>([]);
const isLoading = ref(true);

const animationDuration = computed(() => {
  const count = categories.value.length || 6;
  return `${Math.max(count * 3.5, 20)}s`;
});

onMounted(async () => {
  try {
    const response = await categoryApi.getCategories({ limit: 50 });
    categories.value = response.data.map((cat) => ({
      ...cat,
      productCount: Math.floor(Math.random() * 600) + 50,
    }));
  } catch (err) {
    console.error("Failed to load categories:", err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <section id="categorias" class="mx-auto w-full max-w-7xl px-4 sm:px-6">
    <div class="mb-8 text-center">
      <h2 class="mb-2 text-3xl font-bold text-[#023859] sm:text-4xl">Categorías</h2>
      <p class="text-base text-[#718096]">Explora todas nuestras categorías de productos para ti</p>
    </div>

    <div class="relative w-full">
      <div class="w-full rounded-2xl bg-[#00a896] px-4 py-6 sm:px-8">
        <!-- Internal Scroll Viewport -->
        <div class="w-full overflow-hidden rounded-2xl">
          <!-- Skeleton Loading State -->
          <div v-if="isLoading" class="carousel-track flex w-max gap-4 sm:gap-6 will-change-transform">
            <div
              v-for="n in 6"
              :key="n"
              class="pointer-events-none flex h-72 w-52 shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center shadow-md"
              aria-hidden="true"
            >
              <div class="mb-4 h-20 w-20 animate-pulse rounded-full bg-slate-200"></div>
              <div class="mb-2 h-4 w-2/3 animate-pulse rounded-md bg-slate-200"></div>
              <div class="h-3 w-1/2 animate-pulse rounded-md bg-slate-200"></div>
            </div>
          </div>

          <!-- Continuous Infinite Track -->
          <div
            v-else
            class="carousel-track flex w-max gap-4 sm:gap-6 will-change-transform"
            :style="{ animationDuration: animationDuration }"
          >
            <template v-for="loop in 2" :key="loop">
              <router-link
                v-for="(cat, idx) in categories"
                :key="`${loop}-${cat.id}-${idx}`"
                :to="{ name: 'category', query: { category_id: cat.id } }"
                class="flex h-72 w-52 shrink-0 flex-col items-center justify-center rounded-2xl bg-white px-4 py-6 text-center shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                :aria-hidden="loop === 2"
                :tabindex="loop === 2 ? -1 : 0"
              >
                <div class="mb-4 h-24 w-24">
                  <CategoryImage :blob-id="cat.image_blob_id" :alt="cat.name" />
                </div>
                <p class="mb-1 text-base font-semibold text-[#023859]">{{ cat.name }}</p>
                <span class="text-sm text-slate-400">{{ cat.productCount }} Productos</span>
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── Track & Animation ── */
.carousel-track {
  animation: desplazarInfinito 25s linear infinite;
}

/* Detener la animación estrictamente al hacer hover sobre un router-link (ítem) */
.carousel-track:has(a:hover) {
  animation-play-state: paused;
}

@keyframes desplazarInfinito {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}
</style>
