<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useOfferApi } from "@/api/modules/catalog/offer/useOfferApi";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useProductImageApi } from "@/api/modules/catalog/product_image/useProductImageApi";
import { useFavoritesStore, useCategoryStore } from "@/stores/commerce";
import type { ProductOfferResponse, ProductResponse } from "@/api";
import ProductImageCarousel from "@/components/product/ProductImageCarousel.vue";

interface OfferCard {
  offer: ProductOfferResponse;
  product: ProductResponse;
  discountedPrice: number;
}

const router = useRouter();
const route = useRoute();
const favoritesStore = useFavoritesStore();
const categoryStore = useCategoryStore();
const offers = ref<OfferCard[]>([]);
const offerApi = useOfferApi();
const productApi = useProductApi();
const productImageApi = useProductImageApi();
const isLoading = ref(true);
const carouselRef = ref<HTMLElement | null>(null);

const hasOffers = computed(() => offers.value.length > 0);

const formatPrice = (val: number) =>
  `C$ ${val.toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const applyDiscount = (base: number, percentage: number) =>
  Math.round(base * (100 - percentage)) / 100;

onMounted(async () => {
  categoryStore.fetchCategories().catch(console.warn);
  try {
    const res = await offerApi.getOffers({
      limit: 8,
      sort_by: "discount_percentage",
      sort_direction: "desc",
    });

    if (res.data.length === 0) {
      offers.value = [];
      return;
    }

    const productIds = res.data.map((offer) => offer.product_id);
    const emptyProducts: Record<string, ProductResponse> = {};
    const emptyImages: Record<string, string[]> = {};

    const [productsMap, imagesMap] = await Promise.all([
      productApi
        .getProductsBatch({ product_ids: productIds })
        .catch(() => emptyProducts),
      productImageApi
        .getProductImagesBatch({ product_ids: productIds })
        .catch(() => emptyImages),
    ]);

    offers.value = res.data
      .map((offer) => {
        const product = productsMap[offer.product_id];
        if (!product) return null;
        product.image_blob_ids = imagesMap[offer.product_id] ?? [];
        return {
          offer,
          product,
          discountedPrice: applyDiscount(product.base_price, offer.discount_percentage),
        };
      })
      .filter((card): card is OfferCard => card !== null);
  } catch (err) {
    console.error("Failed to load offers:", err);
  } finally {
    isLoading.value = false;
  }

  if (!favoritesStore.isInitialized) {
    favoritesStore.fetchFavorites().catch(console.warn);
  }
});

const scroll = (direction: "left" | "right") => {
  if (!carouselRef.value) return;
  const scrollAmount = 300;
  carouselRef.value.scrollBy({
    left: direction === "left" ? -scrollAmount : scrollAmount,
    behavior: "smooth",
  });
};
</script>

<template>
  <section class="relative flex h-full w-full flex-col justify-center overflow-hidden bg-orange-50 py-12 md:py-16">
    <!-- Background Decoration -->
    <div class="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-orange-200 opacity-50 blur-3xl"></div>
    <div class="pointer-events-none absolute -top-20 right-20 h-96 w-96 rounded-full bg-(--primary-orange) opacity-20 blur-3xl"></div>

    <div class="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 sm:px-6 md:flex-row lg:px-8">

      <!-- Left Column: Header -->
      <div class="z-10 flex w-full flex-col items-start md:w-1/3">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-linear-to-r from-orange-400 to-(--primary-orange) px-4 py-1.5 text-xs font-bold text-white shadow-md">
          <i class="fa-solid fa-percent"></i>
          <span>Ofertas imperdibles</span>
        </div>

        <h2 class="mb-4 font-serif text-4xl font-bold leading-tight text-(--primary-blue)">
          Productos en <br />
          <span class="text-(--primary-orange)">oferta</span>
        </h2>

        <p class="mb-8 text-base leading-relaxed text-neutral-500">
          Aprovecha descuentos exclusivos y haz crecer tu negocio pagando menos.
        </p>

        <router-link :to="{ name: 'products' }" class="inline-flex items-center gap-3 rounded-full bg-(--primary-blue) px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-blue-600">
          <span>Ver todos los productos</span>
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </router-link>
      </div>

      <!-- Right Column: Carousel / Empty state -->
      <div class="group relative z-10 flex w-full items-center md:w-2/3">

        <!-- Left Nav -->
        <button
          v-if="hasOffers"
          @click="scroll('left')"
          class="absolute -left-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-(--primary-blue) opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <div ref="carouselRef" class="scrollbar-none flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-2 py-4" style="scrollbar-width: none; -ms-overflow-style: none;">

          <!-- Skeleton Loading -->
          <template v-if="isLoading">
            <div v-for="n in 4" :key="n" class="h-80 min-w-55 shrink-0 animate-pulse rounded-2xl bg-white p-4 shadow-sm"></div>
          </template>

          <!-- Empty State -->
          <div
            v-else-if="!hasOffers"
            class="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-200 bg-white/70 px-6 py-12 text-center"
          >
            <i class="fa-solid fa-tags text-3xl text-(--primary-orange)"></i>
            <h3 class="font-serif text-lg font-bold text-(--primary-blue)">No hay ofertas disponibles</h3>
            <p class="max-w-sm text-sm text-neutral-500">
              En este momento ningún proveedor tiene descuentos activos. Vuelve pronto para encontrar nuevas promociones.
            </p>
          </div>

          <!-- Product Cards -->
          <template v-else>
            <router-link v-for="item in offers" :key="item.offer.product_id" :to="{ name: 'product-detail', params: { id: item.offer.product_id } }" class="group/card relative flex w-55 min-w-55 snap-start flex-col rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl">

              <!-- Discount Badge -->
              <span class="absolute left-3 top-3 z-10 rounded-full bg-(--primary-orange) px-2.5 py-1 text-xs font-bold text-white">
                -{{ item.offer.discount_percentage }}%
              </span>

              <!-- Favorite / Like Button -->
              <button
                type="button"
                :class="[
                  'absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer',
                  favoritesStore.isFavorite(item.offer.product_id)
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/90 text-slate-400 backdrop-blur-xs hover:text-red-500 hover:bg-white'
                ]"
                :title="favoritesStore.isFavorite(item.offer.product_id) ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                :aria-label="favoritesStore.isFavorite(item.offer.product_id) ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                @click.stop.prevent="favoritesStore.toggleFavorite(item.offer.product_id, { router, redirectPath: route.fullPath })"
              >
                <i :class="[favoritesStore.isFavorite(item.offer.product_id) ? 'fa-solid fa-heart' : 'fa-regular fa-heart', 'text-xs']"></i>
              </button>

              <!-- Image -->
              <div class="mb-4 h-36 w-full overflow-hidden rounded-xl bg-slate-50 p-2">
                <ProductImageCarousel
                  :blob-ids="item.product.image_blob_ids"
                  :product-id="item.product.id"
                  :alt="item.product.title"
                  object-fit="contain"
                  variant="card"
                />
              </div>

              <!-- Content -->
              <h3 class="mb-2 line-clamp-2 text-sm font-bold text-(--primary-blue)">{{ item.product.title }}</h3>

              <div class="mb-3 flex items-baseline gap-2">
                <span class="text-xs text-slate-400 line-through">{{ formatPrice(item.product.base_price) }}</span>
                <span class="text-lg font-extrabold text-(--primary-orange)">{{ formatPrice(item.discountedPrice) }}</span>
              </div>

              <!-- Category Tag -->
              <span
                class="mt-auto inline-flex w-fit items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-[0.68rem] font-semibold text-teal-700 shadow-2xs"
                :title="`Categoría: ${categoryStore.getCategoryName(item.product.category_id, item.product.category?.name)}`"
              >
                <i class="fa-solid fa-tag text-[8px] text-teal-600"></i>
                {{ categoryStore.getCategoryName(item.product.category_id, item.product.category?.name) }}
              </span>
            </router-link>
          </template>

        </div>

        <!-- Right Nav -->
        <button
          v-if="hasOffers"
          @click="scroll('right')"
          class="absolute -right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-(--primary-blue) opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>

      </div>
    </div>
  </section>
</template>