<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useProductApi } from '@/api/modules/product/useProductApi';
import type { ProductResponse } from '@/api/modules/product/types';
import ProductImage from '@/components/product/ProductImage.vue';

const searchQuery = ref('');
const productApi = useProductApi();
const searchResults = ref<ProductResponse[]>([]);
const isDropdownOpen = ref(false);
const isSearching = ref(false);
const searchContainerRef = ref<HTMLElement | null>(null);

// Dynamic positioning for the teleported dropdown
const dropdownStyle = ref<Record<string, string>>({
  top: '0px',
  left: '0px',
  width: '0px'
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const updateDropdownPosition = () => {
  if (searchContainerRef.value) {
    const rect = searchContainerRef.value.getBoundingClientRect();
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`
    };
  }
};

// Update position when dropdown state or results change
watch([isDropdownOpen, searchResults, isSearching], () => {
  nextTick(updateDropdownPosition);
}, { deep: true });

const executeSearch = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    searchResults.value = [];
    isDropdownOpen.value = false;
    return;
  }

  isSearching.value = true;
  isDropdownOpen.value = true;

  try {
    const res = await productApi.getProducts({ search_term: query, limit: 5 });
    searchResults.value = res.data;
  } catch (err) {
    console.error('Search failed:', err);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
};

const handleInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    executeSearch();
  }, 300); // 300ms debounce
};

const handleFocus = () => {
  if (searchQuery.value.trim()) {
    isDropdownOpen.value = true;
  }
};

const handleClickOutside = (event: MouseEvent) => {
  if (searchContainerRef.value && !searchContainerRef.value.contains(event.target as Node)) {
    // Check if click is inside the teleported dropdown
    const dropdownEl = document.querySelector('.hero-search-dropdown');
    if (dropdownEl && dropdownEl.contains(event.target as Node)) {
      return;
    }
    isDropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', updateDropdownPosition, true);
  window.addEventListener('resize', updateDropdownPosition);
  nextTick(updateDropdownPosition);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', updateDropdownPosition, true);
  window.removeEventListener('resize', updateDropdownPosition);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <section id="inicio" class="mx-auto relative flex h-full w-full max-w-300 flex-col-reverse items-center justify-between gap-8 px-4 py-16 text-center md:flex-row md:text-left md:p-8 lg:px-6">
    <div class="relative flex-[1.1] max-w-150">
      <h1 class="mb-5 font-serif text-[1.8rem] font-bold leading-tight text-(--primary-blue) md:text-[2.6rem] lg:text-[3.2rem]">
        Encuentra los <br />mejores <br />
        <span class="text-(--primary-orange)">distribuidores <br />mayoristas</span> <br />
        para tu negocio
      </h1>
      <p class="mb-8 text-[1.05rem] leading-relaxed text-neutral-600">
        Compra al por mayor de manera fácil, segura y confiable.<br />
        Conecta con proveedores verificados y haz crecer tu negocio hoy.
      </p>

      <!-- Search Container -->
      <div ref="searchContainerRef" class="relative w-full">
        <div class="flex flex-col items-center gap-2 rounded-2xl border border-(--border-gray) bg-white p-3 shadow-[0_4px_15px_rgba(0,0,0,0.05)] md:flex-row md:rounded-full md:p-1.5 md:pl-5">
          <div class="flex w-full flex-1 items-center px-2 md:px-0">
            <i class="fa-solid fa-magnifying-glass mr-3 text-neutral-400"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="¿Qué producto estás buscando?"
              class="w-full flex-1 border-none bg-transparent text-[0.95rem] text-(--text-dark) outline-none"
              @input="handleInput"
              @focus="handleFocus"
            />
            <router-link
              :to="{ name: 'image-search' }"
              class="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-teal-600 hover:bg-neutral-100 transition-colors shrink-0"
              title="Buscar por imagen"
              aria-label="Buscar por imagen"
            >
              <i class="fa-solid fa-camera text-sm"></i>
            </router-link>
          </div>
          <button class="flex w-full items-center justify-center rounded-xl bg-(--primary-orange) px-5.5 py-2.5 text-[0.95rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-(--primary-orange-hover) md:w-auto md:rounded-full cursor-pointer">
            Buscar productos
          </button>
        </div>
      </div>

      <!-- Teleported Floating Dropdown -->
      <Teleport to="body">
        <Transition name="dropdown-fade">
          <div
            v-if="isDropdownOpen && (searchResults.length > 0 || isSearching || searchQuery.trim())"
            class="hero-search-dropdown fixed z-[9999] bg-white rounded-2xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto"
            :style="dropdownStyle"
          >
            <!-- Loading State -->
            <div v-if="isSearching" class="p-4 text-center text-slate-500 text-sm">
              <i class="fa-solid fa-spinner fa-spin mr-2"></i> Buscando productos...
            </div>

            <!-- Empty State -->
            <div v-else-if="searchResults.length === 0 && searchQuery.trim()" class="p-4 text-center text-slate-500 text-sm">
              No se encontraron productos para "{{ searchQuery }}".
            </div>

            <!-- Results List -->
            <ul v-else class="py-2">
              <li v-for="product in searchResults" :key="product.id">
                <router-link
                  :to="{ name: 'product-detail', params: { id: product.id } }"
                  class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
                  @click="isDropdownOpen = false"
                >
                  <div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200">
                    <ProductImage :blob-id="product.image_blob_ids?.[0]" :alt="product.title" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-semibold text-(--primary-blue) truncate">{{ product.title }}</h4>
                    <p class="text-xs text-slate-500 truncate">{{ product.category?.name || 'General' }}</p>
                  </div>
                  <span class="text-sm font-bold text-(--primary-orange) shrink-0">
                    C$ {{ product.base_price.toLocaleString('es-NI') }}
                  </span>
                </router-link>
              </li>
            </ul>
          </div>
        </Transition>
      </Teleport>
    </div>

    <div class="relative flex flex-[0.9] justify-center">
      <div class="absolute -top-4 right-2.5 z-10 flex items-center gap-1.5 rounded-full bg-(--light-teal) px-4 py-2 text-[0.82rem] font-bold text-(--primary-blue)">
        <i class="fa-solid fa-bag-shopping"></i> Plataforma de comercio #1 en Nicaragua
      </div>
      <img
        src="@/assets/hero.png"
        alt="Distribución mayorista"
        class="h-auto max-w-full rounded-3xl object-cover"
      />
    </div>
  </section>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
