<script setup lang="ts">
import { ref, computed } from "vue";

interface CatalogProduct {
  id: string;
  title: string;
  price: number;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  category: string;
  imageUrl: string;
}

const provider = ref({
  name: "NicaTech S.A",
  isVerified: true,
  rating: 4.5,
  reviewCount: 128,
  location: "Managua, Nicaragua",
  description: "Especialistas en tecnología y accesorios electrónicos de alta calidad para tu negocio.",
});

const searchQuery = ref("");
const selectedCategory = ref("all");
const minPrice = ref<number | "">("");
const maxPrice = ref<number | "">("");
const sortOption = ref("best_sellers");
const viewMode = ref<"grid" | "list">("grid");
const currentPage = ref(1);
const totalPages = 14;

const categories = [
  { id: "all", label: "Todos los productos" },
  { id: "mascotas", label: "Mascotas" },
  { id: "computacion", label: "Computacion" },
  { id: "dispositivos_moviles", label: "Dispositivos moviles" },
  { id: "salud_belleza", label: "Salud y belleza" },
  { id: "calzado", label: "Calzado" },
  { id: "maquillaje", label: "Maquillaje" },
  { id: "ropa", label: "Ropa" },
];

const products = ref<CatalogProduct[]>([
  {
    id: "1",
    title: "Laptop Adventure",
    price: 2350,
    inStock: true,
    rating: 4.5,
    reviewsCount: 11,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    title: "Smartphone X10 Ultra",
    price: 3250,
    inStock: true,
    rating: 4.3,
    reviewsCount: 12,
    category: "dispositivos_moviles",
    imageUrl: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    title: "Tablet Kids Pro 10\"",
    price: 1950,
    inStock: true,
    rating: 4.3,
    reviewsCount: 13,
    category: "dispositivos_moviles",
    imageUrl: "https://images.unsplash.com/photo-1561154464-82e9adf32764?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "4",
    title: "Smart Watch Alpha",
    price: 1350,
    inStock: true,
    rating: 4.5,
    reviewsCount: 14,
    category: "dispositivos_moviles",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "5",
    title: "Audifonos TechSound",
    price: 850,
    inStock: true,
    rating: 4.3,
    reviewsCount: 15,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "6",
    title: "Teclado Mecánico RGB",
    price: 1150,
    inStock: true,
    rating: 4.3,
    reviewsCount: 16,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "7",
    title: "Mouse Inalámbrico Pro",
    price: 650,
    inStock: true,
    rating: 4.5,
    reviewsCount: 17,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "8",
    title: "Cámara de Seguridad HD",
    price: 1250,
    inStock: true,
    rating: 4.3,
    reviewsCount: 18,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "9",
    title: "Disco Duro Externo 1TB",
    price: 1090,
    inStock: true,
    rating: 4.3,
    reviewsCount: 19,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "10",
    title: "Hub USB 4 Puertos",
    price: 420,
    inStock: true,
    rating: 4.5,
    reviewsCount: 20,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "11",
    title: "Cable HDMI 2m",
    price: 280,
    inStock: true,
    rating: 4.3,
    reviewsCount: 21,
    category: "computacion",
    imageUrl: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "12",
    title: "Cargador Rápido 20W",
    price: 550,
    inStock: true,
    rating: 4.3,
    reviewsCount: 22,
    category: "dispositivos_moviles",
    imageUrl: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
  },
]);

const filteredProducts = computed(() => {
  return products.value.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase());
    const matchesCategory = selectedCategory.value === "all" || p.category === selectedCategory.value;
    const matchesMin = minPrice.value === "" || p.price >= Number(minPrice.value);
    const matchesMax = maxPrice.value === "" || p.price <= Number(maxPrice.value);
    return matchesSearch && matchesCategory && matchesMin && matchesMax;
  });
});

const clearFilters = () => {
  searchQuery.value = "";
  selectedCategory.value = "all";
  minPrice.value = "";
  maxPrice.value = "";
};

const formatPrice = (val: number) => `C$ ${val.toLocaleString("es-NI")}`;
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- ── Left Sidebar: Provider Profile & Filters ── -->
      <aside class="space-y-6 lg:col-span-3">
        <!-- Provider Profile Card -->
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#35639f] text-xl font-bold text-white shadow-xs">
              N
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="truncate font-serif text-base font-bold text-[#023859]">
                {{ provider.name }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ provider.isVerified ? "Proveedor verificado" : "Proveedor registrado" }}
              </p>
            </div>
          </div>

          <!-- Rating & Reviews -->
          <div class="mt-4 flex items-center gap-2 text-sm">
            <span class="font-bold text-[#023859]">{{ provider.rating }}</span>
            <div class="flex items-center text-xs text-[#ff6a00]">
              <i class="fa-solid fa-star"></i>
            </div>
            <span class="text-xs text-slate-400">({{ provider.reviewCount }} reseñas)</span>
          </div>

          <!-- Location -->
          <p class="mt-2 text-xs font-medium text-slate-500">
            {{ provider.location }}
          </p>

          <!-- Bio Description -->
          <p class="mt-3 text-xs leading-relaxed text-slate-600">
            {{ provider.description }}
          </p>

          <!-- Action Button -->
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
          <nav class="space-y-1">
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
              {{ cat.label }}
            </button>
          </nav>
        </div>

        <!-- Price Range Filter -->
        <div class="space-y-3">
          <h3 class="text-sm font-bold text-[#023859]">Rango de precio</h3>
          <div class="flex items-center gap-2">
            <input
              v-model="minPrice"
              type="number"
              placeholder="C$ Mínimo"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#00a896]"
            />
            <input
              v-model="maxPrice"
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
              Catálogo de {{ provider.name }}
            </h1>
            <p class="mt-0.5 text-xs text-slate-500">
              Mostrando 1–{{ filteredProducts.length }} de 160 productos
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

        <!-- Product Cards Grid -->
        <div
          :class="[
            'grid gap-5',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'
              : 'grid-cols-1'
          ]"
        >
          <article
            v-for="product in filteredProducts"
            :key="product.id"
            class="group relative flex flex-col justify-between rounded-2xl border border-[#00a896]/40 bg-white p-4 shadow-xs transition-all hover:shadow-md"
          >
            <!-- Card Top Icons -->
            <button
              type="button"
              class="absolute right-3 top-3 z-10 text-slate-400 transition-colors hover:text-slate-600"
              aria-label="Ocultar producto"
            >
              <i class="fa-regular fa-eye-slash text-sm"></i>
            </button>

            <!-- Product Image Frame -->
            <div class="mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-white p-1">
              <img
                :src="product.imageUrl"
                :alt="product.title"
                class="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            <!-- Product Specs -->
            <div>
              <h2 class="line-clamp-1 font-serif text-sm font-bold text-[#023859]" :title="product.title">
                {{ product.title }}
              </h2>

              <p class="mt-1 text-base font-bold text-[#ff6a00]">
                {{ formatPrice(product.price) }}
              </p>

              <div class="mt-1.5 flex items-center justify-between text-[11px]">
                <span class="font-semibold text-[#00a896]">
                  {{ product.inStock ? "En stock" : "Agotado" }}
                </span>
                <span class="text-slate-400">
                  {{ product.rating }} ({{ product.reviewsCount }})
                </span>
              </div>
            </div>

            <!-- Card Actions -->
            <div class="mt-3.5 flex items-center gap-1.5">
              <router-link
                :to="{ name: 'product-detail', params: { id: product.id } }"
                class="flex flex-1 items-center justify-center rounded-lg bg-[#00a896] py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[#009688]"
              >
                Ver detalles
              </router-link>

              <button
                type="button"
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00a896] text-[#00a896] transition-colors hover:bg-[#d8f1ef]"
                aria-label="Agregar al carrito"
              >
                <i class="fa-solid fa-cart-shopping text-xs"></i>
              </button>
            </div>
          </article>
        </div>

        <!-- Pagination -->
        <nav class="mt-10 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-700 select-none">
          <button
            v-for="page in 5"
            :key="page"
            type="button"
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              currentPage === page
                ? 'bg-[#00a896] font-bold text-white'
                : 'hover:bg-slate-100'
            ]"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <span class="px-1 text-slate-400">...</span>

          <button
            type="button"
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
              currentPage === totalPages
                ? 'bg-[#00a896] font-bold text-white'
                : 'hover:bg-slate-100'
            ]"
            @click="currentPage = totalPages"
          >
            {{ totalPages }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100"
            aria-label="Página siguiente"
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
          >
            <i class="fa-solid fa-chevron-right text-[10px]"></i>
          </button>
        </nav>
      </section>
    </div>
  </main>
</template>
