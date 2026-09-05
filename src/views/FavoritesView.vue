<script setup lang="ts">
import { ref, computed } from "vue";

interface FavoriteProduct {
  id: string;
  providerName: string;
  title: string;
  price: number;
  inStock: boolean;
  rating: number;
  reviewsCount: number;
  category: string;
  imageUrl: string;
}

const searchQuery = ref("");
const selectedCategory = ref("all");
const viewMode = ref<"grid" | "list">("grid");

const categories = [
  { id: "all", label: "Todas las cat..." },
  { id: "joyeria", label: "Joyería" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "hogar", label: "Deco Hogar" },
  { id: "calzado", label: "Calzado" },
  { id: "ropa", label: "Ropa" },
  { id: "accesorios", label: "Accesorios" },
];

const favorites = ref<FavoriteProduct[]>([
  {
    id: "1",
    providerName: "Joyería López",
    title: "Aretes de Corazón",
    price: 100,
    inStock: true,
    rating: 4.5,
    reviewsCount: 14,
    category: "joyeria",
    imageUrl: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "2",
    providerName: "TecnoPlus",
    title: "Auriculares sin cable",
    price: 500,
    inStock: true,
    rating: 4.3,
    reviewsCount: 13,
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "3",
    providerName: "Deco Hogar",
    title: "Bolsa Chodini",
    price: 100,
    inStock: true,
    rating: 4.3,
    reviewsCount: 12,
    category: "hogar",
    imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "4",
    providerName: "Papelería Rosales S.A",
    title: "Lentes de Sol Aviador",
    price: 50,
    inStock: true,
    rating: 4.5,
    reviewsCount: 11,
    category: "accesorios",
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "5",
    providerName: "Grupo Río",
    title: "Tenis deportivos",
    price: 600,
    inStock: true,
    rating: 4.3,
    reviewsCount: 16,
    category: "calzado",
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "6",
    providerName: "Grupo Río",
    title: "Tacones",
    price: 500,
    inStock: true,
    rating: 4.3,
    reviewsCount: 15,
    category: "calzado",
    imageUrl: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "7",
    providerName: "Hassan Tex",
    title: "Pantalón de Niño",
    price: 600,
    inStock: true,
    rating: 4.3,
    reviewsCount: 14,
    category: "ropa",
    imageUrl: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "8",
    providerName: "Tecno Plus",
    title: "Mouse Gamer 7",
    price: 150,
    inStock: true,
    rating: 4.5,
    reviewsCount: 17,
    category: "tecnologia",
    imageUrl: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "9",
    providerName: "Proveedor 9",
    title: "Producto 9",
    price: 0,
    inStock: true,
    rating: 4.3,
    reviewsCount: 10,
    category: "ropa",
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "10",
    providerName: "Proveedor 10",
    title: "Producto 10",
    price: 0,
    inStock: true,
    rating: 4.3,
    reviewsCount: 10,
    category: "accesorios",
    imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "11",
    providerName: "Proveedor 11",
    title: "Producto 11",
    price: 0,
    inStock: true,
    rating: 4.3,
    reviewsCount: 10,
    category: "joyeria",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "12",
    providerName: "Proveedor 12",
    title: "Producto 12",
    price: 0,
    inStock: true,
    rating: 4.3,
    reviewsCount: 10,
    category: "joyeria",
    imageUrl: "https://images.unsplash.com/photo-1611591475152-4783113828af?auto=format&fit=crop&w=600&q=80",
  },
]);

const filteredProducts = computed(() => {
  return favorites.value.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.value.trim().toLowerCase()) ||
      p.providerName.toLowerCase().includes(searchQuery.value.trim().toLowerCase());
    const matchesCat = selectedCategory.value === "all" || p.category === selectedCategory.value;
    return matchesSearch && matchesCat;
  });
});

const removeFavorite = (id: string) => {
  favorites.value = favorites.value.filter((p) => p.id !== id);
};

const formatPrice = (val: number) => `C$ ${val.toFixed(2)}`;
</script>

<template>
  <div class="w-full space-y-6">
    <!-- Header -->
    <header class="space-y-1">
      <h1 class="font-serif text-3xl font-bold tracking-tight text-[#023859]">
        Mis Favoritos
      </h1>
      <p class="text-sm font-normal text-slate-500">
        Consulta y monitorea tus productos favoritos
      </p>
    </header>

    <!-- Filter Bar -->
    <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search -->
      <div class="relative w-full max-w-md">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos..."
          class="w-full rounded-lg border border-[#ff6a00] bg-white py-2 pl-9 pr-4 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6a00]/20"
        />
      </div>

      <!-- Controls Right -->
      <div class="flex items-center gap-3">
        <!-- Category Dropdown -->
        <div class="relative">
          <label class="absolute -top-2 left-2 bg-white px-1 text-[10px] font-semibold text-slate-400">
            Categoría
          </label>
          <select
            v-model="selectedCategory"
            class="h-9 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs font-medium text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-[#00a896]"
          >
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">
              {{ cat.label }}
            </option>
          </select>
          <i class="fa-solid fa-chevron-down pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400"></i>
        </div>

        <!-- View Mode Switcher -->
        <div class="flex items-center gap-1">
          <button
            type="button"
            aria-label="Vista en lista"
            :class="[
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              viewMode === 'list'
                ? 'border-[#00a896]/30 bg-[#e0f4f2] text-[#00a896]'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            ]"
            @click="viewMode = 'list'"
          >
            <i class="fa-solid fa-list text-xs"></i>
          </button>
          <button
            type="button"
            aria-label="Vista en cuadrícula"
            :class="[
              'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
              viewMode === 'grid'
                ? 'border-[#00a896]/30 bg-[#e0f4f2] text-[#00a896]'
                : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'
            ]"
            @click="viewMode = 'grid'"
          >
            <i class="fa-solid fa-table-cells-large text-xs"></i>
          </button>
        </div>
      </div>
    </section>

    <!-- Empty State -->
    <div
      v-if="filteredProducts.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center"
    >
      <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <i class="fa-regular fa-heart text-2xl"></i>
      </div>
      <h3 class="text-sm font-bold text-[#023859]">No tienes productos favoritos</h3>
      <p class="mt-1 text-xs text-slate-400">Explora el catálogo y guarda productos para verlos aquí.</p>
    </div>

    <!-- Product Grid (5 Columns) -->
    <section
      v-else
      :class="[
        'grid gap-4',
        viewMode === 'grid'
          ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          : 'grid-cols-1'
      ]"
    >
      <article
        v-for="product in filteredProducts"
        :key="product.id"
        class="group relative flex flex-col justify-between rounded-2xl border border-[#00a896]/30 bg-white p-3.5 shadow-xs transition-all hover:shadow-md"
      >
        <!-- Card Remove/Tag Action -->
        <button
          type="button"
          class="absolute right-3 top-3 z-10 text-slate-400 transition-colors hover:text-red-500"
          title="Eliminar de favoritos"
          @click="removeFavorite(product.id)"
        >
          <i class="fa-solid fa-tag text-xs rotate-90"></i>
        </button>

        <!-- Product Image -->
        <div class="mb-3 flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-1">
          <img
            :src="product.imageUrl"
            :alt="product.title"
            class="h-full w-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <!-- Product Details -->
        <div>
          <p class="truncate text-[11px] text-slate-400">
            {{ product.providerName }}
          </p>

          <h2 class="line-clamp-1 font-serif text-sm font-bold text-[#023859]" :title="product.title">
            {{ product.title }}
          </h2>

          <p class="mt-1 text-sm font-bold text-[#ff6a00]">
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
        <div class="mt-3 flex items-center gap-1.5">
          <router-link
            :to="{ name: 'product-detail', params: { id: product.id } }"
            class="flex flex-1 items-center justify-center rounded-lg bg-[#00a896] py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-[#009688]"
          >
            Ver detalles
          </router-link>

          <button
            type="button"
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#00a896] text-[#00a896] transition-colors hover:bg-[#e0f4f2]"
            aria-label="Agregar al carrito"
          >
            <i class="fa-solid fa-cart-shopping text-xs"></i>
          </button>
        </div>
      </article>
    </section>
  </div>
</template>
