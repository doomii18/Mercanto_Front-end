<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

export interface FeaturedProviderData {
  id: string;
  name: string;
  tagline: string;
  monthYear: string;
  catalogRoute?: { name: string; query?: Record<string, string> } | string;
  metrics: {
    isVerified: boolean;
    ordersCountText: string;
    ratingText: string;
    shippingText: string;
  };
  card: {
    initials: string;
    name: string;
    isVerified: boolean;
    rating: number;
    reviewCount: number;
    specialty: string;
  };
  heroImageUrl: string;
}

const DEFAULT_MOCK_DATA: FeaturedProviderData = {
  id: "electroglobal-sa",
  name: "ElectroGlobal S.A.",
  tagline: "Calidad, confianza y los mejores precios para impulsar tu negocio.",
  monthYear: "Enero 2026",
  catalogRoute: { name: "category", query: { provider_id: "electroglobal-sa" } },
  metrics: {
    isVerified: true,
    ordersCountText: "Más de 1,200 pedidos exitosos",
    ratingText: "4.8/5 Calificación",
    shippingText: "Envíos a todo el país",
  },
  card: {
    initials: "EG",
    name: "ElectroGlobal S.A.",
    isVerified: true,
    rating: 4.8,
    reviewCount: 352,
    specialty: "Especialistas en productos tecnológicos y electrónicos.",
  },
  heroImageUrl:
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600&auto=format&fit=crop",
};

interface Props {
  provider?: FeaturedProviderData;
}

const props = defineProps<Props>();

const data = computed(() => props.provider ?? DEFAULT_MOCK_DATA);
</script>

<template>
  <section class="relative flex h-full w-full flex-col justify-center overflow-hidden bg-[#fffaf5] py-10 select-none lg:py-16">
    <!-- ── Ambient Geometric Backgrounds ── -->
    <div
      class="pointer-events-none absolute -top-28 -left-28 h-96 w-96 rounded-full bg-[#00a896] opacity-90 transition-transform duration-700 md:h-[450px] md:w-[450px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -bottom-36 left-1/3 h-80 w-80 rounded-full bg-[#ff6a00] opacity-90 md:h-[400px] md:w-[400px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -top-20 -right-24 h-[550px] w-[550px] rounded-full bg-[#023859] lg:h-[700px] lg:w-[700px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute top-10 -right-16 h-80 w-80 rounded-full bg-[#00a896] opacity-80 md:h-[420px] md:w-[420px]"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute -top-10 -right-20 h-96 w-96 rounded-full bg-white opacity-95"
      aria-hidden="true"
    />

    <div class="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">

        <!-- ── Left Column: Provider Overview & Metrics ── -->
        <div class="z-10 flex flex-col items-center text-center lg:col-span-6 lg:items-start lg:text-left">

          <!-- Section Badge -->
          <div
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00a896]/30 bg-[#e0f4f2] px-4 py-1.5 text-xs font-bold tracking-wide text-[#023859] uppercase shadow-xs backdrop-blur-xs"
          >
            <i class="fa-regular fa-star text-[#00a896]"></i>
            <span>Proveedor Destacado del Mes</span>
          </div>

          <!-- Provider Heading -->
          <h1 class="mb-3 font-serif text-4xl font-bold tracking-tight text-[#023859] sm:text-5xl lg:text-6xl">
            {{ data.name }}
          </h1>

          <!-- Tagline -->
          <p class="mb-8 max-w-xl text-base text-slate-600 sm:text-lg">
            {{ data.tagline }}
          </p>

          <!-- 4 Pillars Feature Grid -->
          <div class="mb-8 grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-2">
            <!-- Metric 1 -->
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9ece7] text-[#00a896] shadow-inner">
                <i class="fa-regular fa-circle-check text-xl"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-[#023859]">
                {{ data.metrics.isVerified ? "Proveedor Verificado" : "Proveedor Registrado" }}
              </span>
            </div>

            <!-- Metric 2 -->
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9ece7] text-[#00a896] shadow-inner">
                <i class="fa-solid fa-box-open text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-[#023859]">
                {{ data.metrics.ordersCountText }}
              </span>
            </div>

            <!-- Metric 3 -->
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9ece7] text-[#00a896] shadow-inner">
                <i class="fa-regular fa-star text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-[#023859]">
                {{ data.metrics.ratingText }}
              </span>
            </div>

            <!-- Metric 4 -->
            <div class="flex flex-col items-center text-center">
              <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#c9ece7] text-[#00a896] shadow-inner">
                <i class="fa-solid fa-truck-fast text-lg"></i>
              </div>
              <span class="text-xs font-semibold leading-tight text-[#023859]">
                {{ data.metrics.shippingText }}
              </span>
            </div>
          </div>

          <!-- Month & Year Subtext -->
          <span class="mb-4 font-serif text-lg font-medium text-[#023859]">
            {{ data.monthYear }}
          </span>

          <!-- Catalog CTA Button -->
          <RouterLink
            :to="data.catalogRoute || '#'"
            class="inline-flex items-center gap-3 rounded-full bg-[#023859] px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#034d7a] hover:shadow-lg active:translate-y-0"
          >
            <span>Ver catálogo</span>
            <i class="fa-solid fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
          </RouterLink>
        </div>

        <!-- ── Right Column: Visual Stage with Portrait & Badges ── -->
        <div class="relative z-10 flex flex-col items-center justify-center lg:col-span-6">
          <div class="relative flex w-full max-w-lg items-center justify-center">

            <!-- 1. Floating Profile Card (Left) -->
            <div
              class="relative z-20 -mr-12 w-44 rounded-2xl border-2 border-[#ff6a00] bg-white p-3.5 shadow-xl transition-transform duration-300 hover:scale-105 sm:-mr-14 sm:w-48"
            >
              <!-- Card Logo Initials -->
              <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-[#023859] text-xs font-bold tracking-wider text-white">
                {{ data.card.initials }}
              </div>

              <h2 class="line-clamp-1 text-xs font-bold text-[#023859]">
                {{ data.card.name }}
              </h2>

              <div class="mb-2 flex items-center gap-1 text-[10px] font-semibold text-[#0284c7]">
                <i class="fa-solid fa-circle-check text-[9px]"></i>
                <span>Proveedor verificado</span>
              </div>

              <!-- Star Rating -->
              <div class="mb-1 flex items-center gap-0.5 text-xs text-[#ff6a00]">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star-half-stroke"></i>
              </div>

              <p class="mb-2 text-[10px] text-slate-500">
                <span class="font-bold text-slate-800">{{ data.card.rating }}</span>
                ({{ data.card.reviewCount }} calificaciones)
              </p>

              <p class="text-[10px] leading-tight text-slate-600">
                {{ data.card.specialty }}
              </p>
            </div>

            <!-- 2. Circular Main Hero Portrait (Center-Right) -->
            <div class="relative z-10 flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
              <!-- Outer Orange Ring -->
              <div class="absolute inset-0 rounded-full border-4 border-[#ff6a00] p-2 shadow-2xl">
                <!-- Inner Image Frame -->
                <div class="h-full w-full overflow-hidden rounded-full bg-slate-200">
                  <img
                    :src="data.heroImageUrl"
                    :alt="data.name"
                    class="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                </div>
              </div>

              <!-- Rating Overlay Pill -->
              <div
                class="absolute bottom-6 z-20 flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-3 py-1 shadow-md backdrop-blur-xs"
              >
                <div class="flex items-center gap-0.5 text-[10px] text-[#00a896]">
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-solid fa-star"></i>
                  <i class="fa-regular fa-star"></i>
                </div>
                <span class="text-xs font-bold text-[#023859]">{{ data.card.rating }}</span>
                <span class="text-[10px] text-slate-500">({{ data.card.reviewCount }})</span>
              </div>
            </div>
          </div>

          <!-- 3. Bottom Ribbon Plaque -->
          <div
            class="relative z-20 mt-4 w-full max-w-sm rounded-lg border-2 border-[#ff6a00] bg-white px-5 py-2.5 text-center shadow-lg sm:max-w-md"
          >
            <span class="block text-[10px] font-bold uppercase tracking-widest text-[#00a896]">
              ★ MERCANTO RECONOCE ★
            </span>
            <h3 class="font-serif text-lg font-extrabold uppercase tracking-wide text-[#ff6a00] sm:text-xl">
              PROVEEDOR DEL MES
            </h3>
            <span class="block text-[9px] font-bold uppercase tracking-[0.3em] text-[#00a896]">
              DESTACADO
            </span>
          </div>


        </div>

      </div>
    </div>
  </section>
</template>
