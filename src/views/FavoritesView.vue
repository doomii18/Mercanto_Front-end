<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { cartApi, productApi, organizationApi } from "@/api";
import type { CartItemResponse } from "@/api/services/cart/types";
import type { ProductResponse } from "@/api/services/product/types";
import ProductImage from "@/components/product/ProductImage.vue";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";

interface CartProductDisplay {
  cartItem: CartItemResponse;
  product: ProductResponse;
  providerName: string;
  providerLogoBlobId: string | null;
}

const cartProducts = ref<CartProductDisplay[]>([]);
const isLoading = ref(true);
const searchQuery = ref("");
const viewMode = ref<"grid" | "list">("grid");

const fetchCartProducts = async () => {
  isLoading.value = true;
  try {
    const items = await cartApi.getMyCartProducts();

    const promises = items.map(async (item) => {
      try {
        const product = await productApi.getProduct(item.product_id);
        let providerName = "Proveedor";
        let providerLogoBlobId: string | null = null;

        try {
          const org = await organizationApi.getPublicProvider(product.provider_id);
          providerName = org.company_name;
          providerLogoBlobId = org.logo_blob_id ?? null;
        } catch (e) {
          console.warn("Failed to fetch provider for product", product.id);
        }

        return {
          cartItem: item,
          product,
          providerName,
          providerLogoBlobId,
        };
      } catch (e) {
        console.warn("Failed to fetch product", item.product_id);
        return null;
      }
    });

    const results = await Promise.all(promises);
    cartProducts.value = results.filter((r): r is CartProductDisplay => r !== null);
  } catch (err) {
    console.error("Failed to load cart:", err);
  } finally {
    isLoading.value = false;
  }
};

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) return cartProducts.value;
  const query = searchQuery.value.toLowerCase().trim();
  return cartProducts.value.filter((p) => {
    return (
      p.product.title.toLowerCase().includes(query) ||
      p.providerName.toLowerCase().includes(query)
    );
  });
});

const removeFromCart = async (productId: string) => {
  try {
    await cartApi.deleteMyCartProduct(productId);
    cartProducts.value = cartProducts.value.filter(
      (p) => p.product.id !== productId
    );
  } catch (err) {
    console.error("Failed to remove from cart:", err);
  }
};

const formatPrice = (val: number) => `C$ ${val.toLocaleString("es-NI")}`;

onMounted(() => {
  fetchCartProducts();
});
</script>

<template>
  <div class="w-full space-y-6">
    <header class="space-y-1">
      <h1 class="font-serif text-3xl font-bold tracking-tight text-[#023859]">
        Mis Favoritos
      </h1>
      <p class="text-sm font-normal text-slate-500">
        Consulta y monitorea los productos en tu carrito de compras
      </p>
    </header>

    <section class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative w-full max-w-md">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar productos..."
          class="w-full rounded-lg border border-[#ff6a00] bg-white py-2 pl-9 pr-4 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#ff6a00]/20"
        />
      </div>

      <div class="flex items-center gap-3">
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

    <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 text-center">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-[#00a896] mb-4"></i>
      <p class="text-sm text-slate-500">Cargando tu carrito...</p>
    </div>

    <div
      v-else-if="filteredProducts.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center"
    >
      <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <i class="fa-solid fa-cart-shopping text-2xl"></i>
      </div>
      <h3 class="text-sm font-bold text-[#023859]">Tu carrito está vacío</h3>
      <p class="mt-1 text-xs text-slate-400">Explora el catálogo y agrega productos para verlos aquí.</p>
    </div>

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
        v-for="item in filteredProducts"
        :key="item.product.id"
        :class="[
          'group relative rounded-2xl border border-[#00a896]/30 bg-white p-3.5 shadow-xs transition-all hover:shadow-md',
          viewMode === 'grid'
            ? 'flex flex-col justify-between'
            : 'flex flex-col sm:flex-row sm:items-center sm:gap-4'
        ]"
      >
        <button
          type="button"
          class="absolute left-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-md transition-all hover:scale-110 hover:bg-red-600"
          title="Eliminar de favoritos"
          @click="removeFromCart(item.product.id)"
        >
          <i class="fa-solid fa-heart-crack text-xs"></i>
        </button>

        <div
          :class="[
            'relative overflow-hidden rounded-xl bg-slate-50 flex-shrink-0',
            viewMode === 'grid'
              ? 'h-48 w-full mb-3'
              : 'h-28 w-full sm:h-28 sm:w-28 mb-3 sm:mb-0'
          ]"
        >
          <ProductImage
            :blob-id="item.product.image_blob_ids?.[0]"
            :alt="item.product.title"
            class="h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 mb-1">
            <div class="h-4 w-4 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
              <ProviderLogo :blob-id="item.providerLogoBlobId" :alt="item.providerName" />
            </div>
            <p class="truncate text-[11px] text-slate-400">
              {{ item.providerName }}
            </p>
          </div>
          <h2 class="line-clamp-1 font-serif text-sm font-bold text-[#023859]" :title="item.product.title">
            {{ item.product.title }}
          </h2>
          <p class="mt-1 text-sm font-bold text-[#ff6a00]">
            {{ formatPrice(item.product.base_price) }}
          </p>
          <div class="mt-1.5 flex items-center justify-between text-[11px]">
            <span class="font-semibold text-[#00a896]">
              Cantidad: {{ item.cartItem.quantity }}
            </span>
            <span class="flex items-center gap-1 text-slate-500">
              <i class="fa-solid fa-star text-[10px] text-amber-400"></i>
              <span>{{ item.product.rating?.average_score?.toFixed(1) || '0.0' }}</span>
              <span class="text-slate-400">({{ item.product.rating?.review_count || 0 }})</span>
            </span>
          </div>
        </div>

        <div
          :class="[
            'flex items-center',
            viewMode === 'grid' ? 'mt-3' : 'mt-3 sm:mt-0 sm:w-40 flex-shrink-0'
          ]"
        >
          <router-link
            :to="{ name: 'product-detail', params: { id: item.product.id } }"
            class="flex w-full items-center justify-center rounded-lg bg-[#00a896] py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-[#009688]"
          >
            Ver detalles
          </router-link>
        </div>
      </article>
    </section>
  </div>
</template>
