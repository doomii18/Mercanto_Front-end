<script setup lang="ts">
import { ref, onMounted } from "vue";
import { productApi } from "@/api";
import type { ProductResponse } from "@/api/services/product/types";
import ProductImage from "@/components/product/ProductImage.vue";

interface OfferProduct extends ProductResponse {
  discount: number;
  originalPrice: number;
  categoryName: string;
}

const offers = ref<OfferProduct[]>([]);
const isLoading = ref(true);
const carouselRef = ref<HTMLElement | null>(null);

// Deterministic seed based on product ID to generate 15%, 20%, 25%, or 30% discount
const calculateSeedDiscount = (id: string) => {
  const seed = id.charCodeAt(0) + id.charCodeAt(id.length - 1);
  const discounts = [15, 20, 25, 30];
  return discounts[seed % discounts.length];
};

const formatPrice = (val: number) => `C$ ${val.toLocaleString("es-NI", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

onMounted(async () => {
  try {
    const res = await productApi.getProducts({ limit: 8, sort_by: "score", sort_direction: "desc" });

    offers.value = res.data.map(prod => {
      const discount = calculateSeedDiscount(prod.id);
      const originalPrice = prod.base_price / (1 - (discount / 100));
      return {
        ...prod,
        discount,
        originalPrice,
        categoryName: prod.category?.name || "General"
      };
    });
  } catch (err) {
    console.error("Failed to load offers:", err);
  } finally {
    isLoading.value = false;
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
  <section class="relative w-full overflow-hidden bg-[#fff0e6] py-12 md:py-16">
    <!-- Background Decoration -->
    <div class="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[#ffb98a] opacity-50 blur-3xl"></div>
    <div class="pointer-events-none absolute -top-20 right-20 h-96 w-96 rounded-full bg-[#ff6a00] opacity-20 blur-3xl"></div>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-8 items-center">

      <!-- Left Column: Header -->
      <div class="w-full md:w-1/3 z-10 flex flex-col items-start">
        <div class="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff8533] to-[#ff6a00] px-4 py-1.5 text-xs font-bold text-white shadow-md">
          <i class="fa-solid fa-percent"></i>
          <span>Ofertas imperdibles</span>
        </div>

        <h2 class="mb-4 font-serif text-4xl font-bold text-[#023859] leading-tight">
          Productos en <br />
          <span class="text-[#ff6a00]">oferta</span>
        </h2>

        <p class="mb-8 text-[#64748b] text-base leading-relaxed">
          Aprovecha descuentos exclusivos y haz crecer tu negocio pagando menos.
        </p>

        <router-link :to="{ name: 'home' }" class="inline-flex items-center gap-3 rounded-full bg-[#023859] px-6 py-3 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#034d7a]">
          <span>Ver todas las ofertas</span>
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </router-link>
      </div>

      <!-- Right Column: Carousel -->
      <div class="w-full md:w-2/3 relative z-10 flex items-center group">

        <!-- Left Nav -->
        <button @click="scroll('left')" class="absolute -left-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#023859] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <i class="fa-solid fa-chevron-left"></i>
        </button>

        <div ref="carouselRef" class="flex w-full gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none py-4 px-2" style="scrollbar-width: none; -ms-overflow-style: none;">

          <!-- Skeleton Loading -->
          <template v-if="isLoading">
            <div v-for="n in 4" :key="n" class="min-w-[220px] h-[320px] shrink-0 animate-pulse rounded-2xl bg-white p-4 shadow-sm"></div>
          </template>

          <!-- Product Cards -->
          <template v-else>
            <router-link v-for="item in offers" :key="item.id" :to="{ name: 'product-detail', params: { id: item.id } }" class="group/card relative flex min-w-[220px] w-[220px] snap-start flex-col rounded-2xl bg-white p-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl">

              <!-- Discount Badge -->
              <span class="absolute left-3 top-3 z-10 rounded-full bg-[#ff6a00] px-2.5 py-1 text-xs font-bold text-white">
                -{{ item.discount }}%
              </span>

              <!-- Image -->
              <div class="mb-4 h-36 w-full overflow-hidden rounded-xl bg-slate-50 p-2">
                <ProductImage :blob-id="item.image_blob_ids?.[0]" :alt="item.title" class="h-full w-full object-contain transition-transform group-hover/card:scale-105" />
              </div>

              <!-- Content -->
              <h3 class="mb-2 line-clamp-2 text-sm font-bold text-[#023859]">{{ item.title }}</h3>

              <div class="mb-3 flex items-baseline gap-2">
                <span class="text-xs text-slate-400 line-through">{{ formatPrice(item.originalPrice) }}</span>
                <span class="text-lg font-extrabold text-[#ff6a00]">{{ formatPrice(item.base_price) }}</span>
              </div>

              <!-- Category Pill -->
              <span class="mt-auto w-fit rounded-full bg-[#f1f5f9] px-3 py-1 text-[10px] font-bold text-[#64748b]">
                {{ item.categoryName }}
              </span>
            </router-link>
          </template>

        </div>

        <!-- Right Nav -->
        <button @click="scroll('right')" class="absolute -right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#023859] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <i class="fa-solid fa-chevron-right"></i>
        </button>

      </div>
    </div>
  </section>
</template>
