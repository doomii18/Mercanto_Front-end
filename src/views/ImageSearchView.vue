<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from "vue";
import { useProductApi } from "@/composables/api/useProductApi";
import type { ProductImageSearchHit } from "@/api/services/product/types";
import ProductCard from "@/components/product/ProductCard.vue";

const productApi = useProductApi();
const fileInput = ref<HTMLInputElement | null>(null);
const currentFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const isSearching = ref(false);
const isDragging = ref(false);
const errorMessage = ref("");
const searchPerformed = ref(false);
const results = ref<ProductImageSearchHit[]>([]);

const sortedResults = computed(() => {
  return [...results.value].sort((a, b) => a.distance - b.distance);
});

const handleFile = (file: File) => {
  if (!file.type.startsWith("image/")) {
    errorMessage.value = "Por favor selecciona un formato de imagen válido (PNG, JPG, WEBP).";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    errorMessage.value = "El tamaño de la imagen no debe superar los 10 MB.";
    return;
  }

  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  currentFile.value = file;
  previewUrl.value = URL.createObjectURL(file);
  errorMessage.value = "";
  executeSearch();
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (!target.files?.length) return;
  handleFile(target.files[0]);
};

const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (e.dataTransfer?.files?.length) {
    handleFile(e.dataTransfer.files[0]);
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const clearSelection = () => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  currentFile.value = null;
  previewUrl.value = null;
  results.value = [];
  errorMessage.value = "";
  searchPerformed.value = false;
  if (fileInput.value) fileInput.value.value = "";
};

const executeSearch = async () => {
  if (!currentFile.value) return;
  isSearching.value = true;
  errorMessage.value = "";
  searchPerformed.value = true;

  try {
    const res = await productApi.searchProductsByImage(currentFile.value);
    results.value = res.data ?? [];
  } catch (err: any) {
    console.error("Image search error:", err);
    errorMessage.value = "No fue posible completar la búsqueda visual. Intenta nuevamente con otra imagen.";
    results.value = [];
  } finally {
    isSearching.value = false;
  }
};

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="min-h-screen bg-neutral-warm text-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <!-- Breadcrumb & Back Navigation -->
      <div class="mb-6 flex items-center gap-2 text-xs text-neutral-500 font-medium">
        <router-link :to="{ name: 'home' }" class="hover:text-primary-orange transition-colors">
          Inicio
        </router-link>
        <span class="text-neutral-300">/</span>
        <span class="text-neutral-800">Búsqueda Visual de Productos</span>
      </div>

      <!-- Header Section -->
      <div class="mb-8 text-center max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <i class="fa-solid fa-camera"></i>
          Reconocimiento Visual de Productos
        </div>
        <h1 class="font-serif text-3xl sm:text-4xl font-bold text-[#083c5a] mb-3">
          Búsqueda por Imagen
        </h1>
        <p class="text-neutral-600 text-sm sm:text-base leading-relaxed">
          Sube o arrastra una fotografía de cualquier artículo para encontrar productos idénticos o similares disponibles en los catálogos de nuestros proveedores mayoristas.
        </p>
      </div>

      <!-- Uploader & Dropzone Area -->
      <div class="max-w-2xl mx-auto mb-10">
        <input
          ref="fileInput"
          type="file"
          accept="image/png, image/jpeg, image/webp"
          class="hidden"
          @change="handleFileSelect"
        />

        <div
          class="relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer bg-white"
          :class="[
            isDragging
              ? 'border-teal-500 bg-teal-50/50 scale-[1.01]'
              : 'border-neutral-300 hover:border-teal-400 hover:bg-neutral-50/70',
            currentFile ? 'shadow-sm' : 'shadow-xs'
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <!-- When no file is selected -->
          <template v-if="!previewUrl">
            <div class="w-16 h-16 mb-4 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center text-2xl shadow-xs">
              <i class="fa-solid fa-cloud-arrow-up"></i>
            </div>
            <p class="text-base font-semibold text-neutral-800 mb-1 text-center">
              Haz clic para seleccionar o arrastra una foto aquí
            </p>
            <p class="text-xs text-neutral-500 text-center mb-4">
              Formatos soportados: PNG, JPG o WEBP (máx. 10 MB)
            </p>
            <button
              type="button"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              @click.stop="triggerFileInput"
            >
              <i class="fa-solid fa-camera"></i>
              <span>Seleccionar foto</span>
            </button>
          </template>

          <!-- When a preview image is loaded -->
          <template v-else>
            <div class="flex flex-col sm:flex-row items-center gap-5 w-full">
              <div class="relative w-36 h-36 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 shadow-sm">
                <img :src="previewUrl" alt="Vista previa de búsqueda" class="w-full h-full object-cover" />
                <div
                  v-if="isSearching"
                  class="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                >
                  <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
                </div>
              </div>

              <div class="flex-1 text-center sm:text-left min-w-0">
                <div class="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <span class="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                    Imagen seleccionada
                  </span>
                  <span v-if="isSearching" class="text-xs text-neutral-500 flex items-center gap-1">
                    <i class="fa-solid fa-circle-notch fa-spin text-teal-600 text-[10px]"></i> Analizando...
                  </span>
                </div>
                <p class="text-sm font-semibold text-neutral-800 truncate mb-1" :title="currentFile?.name">
                  {{ currentFile?.name }}
                </p>
                <p class="text-xs text-neutral-500 mb-4">
                  {{ (Number(currentFile?.size || 0) / 1024).toFixed(1) }} KB
                </p>

                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                    :disabled="isSearching"
                    @click.stop="executeSearch"
                  >
                    <i :class="isSearching ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrows-rotate'"></i>
                    <span>{{ isSearching ? 'Buscando...' : 'Volver a buscar' }}</span>
                  </button>

                  <button
                    type="button"
                    class="px-4 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    :disabled="isSearching"
                    @click.stop="triggerFileInput"
                  >
                    <i class="fa-solid fa-image"></i>
                    <span>Cambiar imagen</span>
                  </button>

                  <button
                    type="button"
                    class="px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                    :disabled="isSearching"
                    @click.stop="clearSelection"
                  >
                    <i class="fa-solid fa-trash-can mr-1"></i> Quitar
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Error Message Alert -->
        <div
          v-if="errorMessage"
          class="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5"
        >
          <i class="fa-solid fa-circle-exclamation shrink-0 text-rose-500 text-sm"></i>
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- Search Results Area -->
      <div v-if="searchPerformed" class="mt-8 border-t border-neutral-200 pt-8">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 class="font-serif text-xl sm:text-2xl font-bold text-[#083c5a] flex items-center gap-2">
              <i class="fa-solid fa-boxes-stacked text-primary-orange"></i>
              Resultados coincidentes
            </h2>
            <p class="text-xs sm:text-sm text-neutral-500">
              {{ isSearching ? 'Buscando coincidencias visuales en el catálogo...' : `Se encontraron ${sortedResults.length} producto(s) similar(es)` }}
            </p>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isSearching" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            v-for="i in 4"
            :key="i"
            class="flex flex-col rounded-[20px] border border-neutral-200 bg-white p-4 animate-pulse shadow-xs"
          >
            <div class="aspect-square w-full rounded-[14px] bg-neutral-200 mb-3"></div>
            <div class="mx-auto h-3 w-2/5 rounded bg-neutral-200 mb-2"></div>
            <div class="h-4 w-4/5 rounded bg-neutral-200 mb-2"></div>
            <div class="ml-auto h-3 w-1/3 rounded bg-neutral-200 mb-4"></div>
            <div class="mt-auto h-6 w-full rounded bg-neutral-200"></div>
          </div>
        </div>

        <!-- No Results Empty State -->
        <div
          v-else-if="sortedResults.length === 0"
          class="bg-white border border-neutral-200 rounded-2xl p-10 text-center max-w-md mx-auto my-6"
        >
          <div class="w-14 h-14 mx-auto mb-3 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-2xl">
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>
          <h3 class="text-base font-bold text-neutral-800 mb-1">Sin coincidencias visuales</h3>
          <p class="text-xs text-neutral-500 mb-4 leading-relaxed">
            No encontramos productos con suficiente similitud visual para esta foto. Prueba con una imagen mejor iluminada o centrada en el producto.
          </p>
          <button
            type="button"
            class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            @click="triggerFileInput"
          >
            Probar con otra imagen
          </button>
        </div>

        <!-- Results Grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div
            v-for="hit in sortedResults"
            :key="hit.product.id"
            class="relative flex flex-col group"
          >
            <ProductCard
              :id="hit.product.id"
              :title="hit.product.title"
              :price="hit.product.base_price"
              :provider-id="hit.product.provider_id"
              :category-name="hit.product.category?.name ?? null"
              :image-blob-id="hit.product.image_blob_ids?.[0] ?? null"
              :badge-text="hit.distance < 0.35 ? 'Alta coincidencia' : 'Similitud visual'"
              :badge-icon="hit.distance < 0.35 ? 'fa-solid fa-bullseye' : 'fa-solid fa-wand-magic-sparkles'"
              badge-variant="teal"
              border-color="teal"
              bubble-class="teal"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
