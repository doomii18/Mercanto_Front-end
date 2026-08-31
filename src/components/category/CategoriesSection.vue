<script setup lang="ts">
import { onMounted, ref } from "vue";
import { categoryApi } from "../../api";
import type { ProductCategoryResponse } from "../../api/services/category/types";
import CategoryImage from "./CategoryImage.vue";

interface CategoryViewItem extends ProductCategoryResponse {
  productCount: number;
}

const carousel = ref<HTMLElement | null>(null);
const categories = ref<CategoryViewItem[]>([]);
const isLoading = ref(true);

const scrollCarousel = (direction: "left" | "right") => {
  if (!carousel.value) return;
  const scrollAmount = 280;
  carousel.value.scrollBy({
    left: direction === "left" ? -scrollAmount : scrollAmount,
    behavior: "smooth",
  });
};

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
  <section id="categorias" class="categories container">
    <div class="categories-header">
      <h2>Categorías</h2>
      <p>Explora todas nuestras categorías de productos para ti</p>
    </div>

    <div class="carousel-wrapper">
      <button
        class="carousel-nav-btn prev"
        @click="scrollCarousel('left')"
        aria-label="Anterior"
        :disabled="isLoading"
      >
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div ref="carousel" class="categories-box">
        <template v-if="isLoading">
          <div
            v-for="n in 6"
            :key="n"
            class="category-card skeleton-card"
            aria-hidden="true"
          >
            <div class="skeleton-image skeleton-pulse"></div>
            <div class="skeleton-text skeleton-title skeleton-pulse"></div>
            <div class="skeleton-text skeleton-sub skeleton-pulse"></div>
          </div>
        </template>

        <template v-else>
          <router-link
            v-for="cat in categories"
            :key="cat.id"
            :to="{ name: 'category' }"
            class="category-card"
            style="text-decoration: none;"
          >
              <div class="h-24 w-24 mb-4">
                <CategoryImage :blob-id="cat.image_blob_id" :alt="cat.name" />
              </div>
            <p class="category-name">{{ cat.name }}</p>
            <span class="product-count">{{ cat.productCount }} Productos</span>
          </router-link>
        </template>
      </div>

      <button
        class="carousel-nav-btn next"
        @click="scrollCarousel('right')"
        aria-label="Siguiente"
        :disabled="isLoading"
      >
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.categories {
  margin-bottom: 5rem;
}

.categories-header {
  text-align: center;
  margin-bottom: 2rem;
}

.categories-header h2 {
  font-size: 2.2rem;
  color: var(--primary-blue);
  margin-bottom: 0.4rem;
}

.categories-header p {
  color: #718096;
}

.carousel-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.categories-box {
  background-color: var(--light-teal);
  padding: 1.8rem;
  border-radius: 24px;
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  width: 100%;
  scrollbar-width: none;
}

.categories-box::-webkit-scrollbar {
  display: none;
}

.category-card {
  flex: 0 0 220px;
  background-color: #ffffff;
  border-radius: 18px;
  padding: 1.5rem 1rem;
  text-align: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 3 / 4;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.category-name {
  font-weight: 600;
  color: var(--primary-blue);
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.product-count {
  color: #a0aec0;
  font-size: 0.8rem;
}

.carousel-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid var(--border-gray);
  color: var(--primary-blue);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.2s ease;
}

.carousel-nav-btn:hover:not(:disabled) {
  transform: translateY(-50%) scale(1.08);
}

.carousel-nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.carousel-nav-btn.prev {
  left: -20px;
}

.carousel-nav-btn.next {
  right: -20px;
}

.skeleton-card {
  pointer-events: none;
  cursor: default;
}

.skeleton-pulse {
  background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

.skeleton-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 1rem;
}

.skeleton-text {
  border-radius: 6px;
}

.skeleton-title {
  width: 65%;
  height: 1rem;
  margin-bottom: 0.5rem;
}

.skeleton-sub {
  width: 45%;
  height: 0.8rem;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 480px) {
  .carousel-nav-btn {
    display: none;
  }
}
</style>
