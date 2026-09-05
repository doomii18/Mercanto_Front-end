<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { productApi, categoryApi, quoteApi } from "@/api";
import { useUserContextStore } from "@/stores/userContextStore";
import { useAlertStore } from "@/stores/alertStore";
import type { ProductResponse } from "@/api/services/product/types";
import type { ProductCategoryResponse } from "@/api/services/category/types";
import ProductImage from "@/components/product/ProductImage.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";

const userContext = useUserContextStore();
const alertStore = useAlertStore();

// Core Data State
const products = ref<ProductResponse[]>([]);
const categories = ref<ProductCategoryResponse[]>([]);
const totalProducts = ref(0);
const pendingOrdersCount = ref(0);
const isLoading = ref(false);
const isExporting = ref(false);

// Filters and Pagination
const searchQuery = ref("");
const selectedCategory = ref("todas");
const statusFilter = ref<"todos" | "activos" | "inactivos">("todos");
const viewMode = ref<"list" | "grid">("list");
const selectedIds = ref<Set<string>>(new Set());
const selectAll = ref(false);

const currentPage = ref(1);
const perPage = 8;

// Product Deletion State
const productToDelete = ref<ProductResponse | null>(null);
const isDeleting = ref(false);

const activeOrgId = computed(() => userContext.activeOrganizationId);

const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / perPage)));
const totalActive = computed(() => products.value.filter((p) => p.is_active).length);
const totalInactive = computed(() => products.value.filter((p) => !p.is_active).length);

const pageNumbers = computed(() => {
  const pages: number[] = [];
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i);
  }
  return pages;
});

async function loadCategories() {
  try {
    const res = await categoryApi.getCategories({ limit: 100 });
    categories.value = res.data;
  } catch (err) {
    console.warn("Error cargando categorías:", err);
  }
}

async function loadStats() {
  if (!activeOrgId.value) return;
  try {
    const res = await quoteApi.getProviderQuotes(activeOrgId.value, {
      statuses: ["pending_provider"],
      limit: 0,
    });
    pendingOrdersCount.value = res.total;
  } catch (err) {
    console.warn("Error cargando conteo de pedidos pendientes:", err);
  }
}

async function fetchProducts() {
  if (!activeOrgId.value) return;

  isLoading.value = true;
  try {
    const offset = (currentPage.value - 1) * perPage;
    const res = await productApi.getProducts({
      provider_id: activeOrgId.value,
      limit: perPage,
      offset,
      search_term: searchQuery.value.trim() || undefined,
      category_id: selectedCategory.value !== "todas" ? selectedCategory.value : undefined,
      sort_by: "created_at",
      sort_direction: "desc",
    });

    let data = res.data;
    if (statusFilter.value === "activos") {
      data = data.filter((p) => p.is_active);
    } else if (statusFilter.value === "inactivos") {
      data = data.filter((p) => !p.is_active);
    }

    products.value = data;
    totalProducts.value = res.total;
    selectedIds.value.clear();
    selectAll.value = false;
  } catch (err: any) {
    alertStore.showError(err.message || "Error al obtener los productos.");
  } finally {
    isLoading.value = false;
  }
}

function toggleAll() {
  if (selectAll.value) {
    products.value.forEach((p) => selectedIds.value.add(p.id));
  } else {
    selectedIds.value.clear();
  }
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  selectAll.value = selectedIds.value.size === products.value.length && products.value.length > 0;
}

function promptDelete(product: ProductResponse) {
  productToDelete.value = product;
}

async function confirmDelete() {
  if (!productToDelete.value) return;

  isDeleting.value = true;
  try {
    await productApi.deleteProduct(productToDelete.value.id);
    alertStore.spawnAlert({
      title: "Producto eliminado",
      message: `El producto "${productToDelete.value.title}" fue eliminado exitosamente.`,
      iconVariant: "teal",
      icon: "fa-solid fa-circle-check",
      confirmText: "Aceptar",
    });
    productToDelete.value = null;
    await fetchProducts();
  } catch (err: any) {
    alertStore.showError(err.message || "No se pudo eliminar el producto.");
  } finally {
    isDeleting.value = false;
  }
}

async function exportCatalogCsv() {
  if (!activeOrgId.value) return;

  isExporting.value = true;
  try {
    const res = await productApi.getProducts({
      provider_id: activeOrgId.value,
      limit: 1000,
      offset: 0,
    });

    const headers = [
      "ID",
      "Título",
      "Categoría",
      "Precio Base (NIO)",
      "Unidad de Medida",
      "Pedido Mínimo",
      "Disponibilidad",
      "Estado",
      "Fecha de Actualización",
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const clean = (val ?? "").toString().replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = res.data.map((p) => {
      const minQty = "Physical" in p.spec ? p.spec.Physical.min_order_quantity : 1;
      return [
        escapeCsv(p.id),
        escapeCsv(p.title),
        escapeCsv(p.category.name),
        escapeCsv(p.base_price),
        escapeCsv(p.unit_of_measure),
        escapeCsv(minQty),
        escapeCsv("En stock"),
        escapeCsv(p.is_active ? "Activo" : "Inactivo"),
        escapeCsv(p.updated_at),
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `catalogo_mercanto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    alertStore.showError(err.message || "Error al exportar el catálogo.");
  } finally {
    isExporting.value = false;
  }
}

function formatPrice(n: number): string {
  return "C$ " + n.toLocaleString("es-NI", { minimumFractionDigits: 2 });
}

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchQuery, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    currentPage.value = 1;
    fetchProducts();
  }, 350);
});

watch([selectedCategory, statusFilter], () => {
  currentPage.value = 1;
  fetchProducts();
});

watch(currentPage, () => {
  fetchProducts();
});

watch(activeOrgId, (newId) => {
  if (newId) {
    fetchProducts();
    loadStats();
  }
});

onMounted(async () => {
  if (!userContext.isInitialized) {
    await userContext.initialize().catch(console.warn);
  }
  await Promise.all([loadCategories(), loadStats(), fetchProducts()]);
});
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-7xl mx-auto px-2 sm:px-4">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#023859] tracking-tight">Mis Productos</h1>
        <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
          Gestiona los productos disponibles para cotización y venta mayorista en
          <span class="text-[#00a896] font-semibold">Mercanto</span>.
        </p>
      </div>
      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <button
          type="button"
          :disabled="isExporting"
          class="flex-1 sm:flex-none justify-center px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          @click="exportCatalogCsv"
        >
          <i :class="isExporting ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-download'" class="text-slate-500"></i>
          <span>{{ isExporting ? "Exportando..." : "Exportar catálogo" }}</span>
        </button>
        <router-link
          to="/dashboard/provider-products/add"
          class="flex-1 sm:flex-none justify-center px-4 py-2 bg-[#ff6a00] hover:bg-[#e05e00] rounded-xl text-xs sm:text-sm font-bold text-white transition-all hover:-translate-y-0.5 flex items-center gap-2 no-underline shadow-xs cursor-pointer"
        >
          <i class="fa-solid fa-plus text-xs"></i>
          <span>Agregar nuevo producto</span>
        </router-link>
      </div>
    </div>

    <!-- Summary Metric Counters -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f5] text-[#00a896]">
          <i class="fa-solid fa-box text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Total Productos</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalProducts }}</span>
          <span class="text-[11px] font-medium text-[#00a896]">{{ totalActive }} activos listados</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0e6] text-[#ff6a00]">
          <i class="fa-solid fa-clock text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Pedidos</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ pendingOrdersCount }}</span>
          <span class="text-[11px] font-medium text-[#ff6a00]">Pendientes</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <i class="fa-solid fa-pause text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Pausados</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalInactive }}</span>
          <span class="text-[11px] font-medium text-slate-500">Inactivos</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <i class="fa-solid fa-tags text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Categorías</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ categories.length }}</span>
          <span class="text-[11px] font-medium text-slate-500">Disponibles</span>
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs">
      <div class="relative flex-1 min-w-[200px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchQuery"
          class="w-full py-2 pr-3.5 pl-9 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 outline-none transition-colors focus:border-[#00a896] focus:bg-white"
          placeholder="Buscar por título o descripción..."
          type="text"
        />
      </div>

      <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        <select v-model="selectedCategory" class="py-2 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white cursor-pointer outline-none transition-colors focus:border-[#00a896]">
          <option value="todas">Todas las categorías</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
        </select>

        <select v-model="statusFilter" class="py-2 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white cursor-pointer outline-none transition-colors focus:border-[#00a896]">
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>

        <div class="col-span-2 sm:col-span-1 flex justify-end">
          <div class="inline-flex border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
            <button
              type="button"
              class="p-1.5 px-2.5 rounded-lg border-none text-xs transition-colors cursor-pointer"
              :class="viewMode === 'list' ? 'bg-[#ff6a00] text-white font-semibold' : 'text-slate-600 hover:text-slate-900 bg-transparent'"
              @click="viewMode = 'list'"
              title="Vista lista"
            >
              <i class="fa-solid fa-list"></i>
            </button>
            <button
              type="button"
              class="p-1.5 px-2.5 rounded-lg border-none text-xs transition-colors cursor-pointer"
              :class="viewMode === 'grid' ? 'bg-[#ff6a00] text-white font-semibold' : 'text-slate-600 hover:text-slate-900 bg-transparent'"
              @click="viewMode = 'grid'"
              title="Vista cuadrícula"
            >
              <i class="fa-solid fa-grip"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Skeletons -->
    <div v-if="isLoading" class="flex flex-col gap-3 py-6">
      <div v-for="n in 4" :key="n" class="h-16 w-full animate-pulse rounded-2xl bg-slate-100"></div>
    </div>

    <!-- Table Mode -->
    <div v-else-if="viewMode === 'list'" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="py-3 px-3.5 w-10 text-center">
                <input type="checkbox" v-model="selectAll" @change="toggleAll" class="rounded text-[#00a896] cursor-pointer" />
              </th>
              <th class="py-3 px-3.5">Producto</th>
              <th class="py-3 px-3.5">Categoría</th>
              <th class="py-3 px-3.5">Precio Base</th>
              <th class="py-3 px-3.5">Mín. Pedido</th>
              <th class="py-3 px-3.5">Stock</th>
              <th class="py-3 px-3.5">Estado</th>
              <th class="py-3 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3 px-3.5 text-center">
                <input
                  type="checkbox"
                  :checked="selectedIds.has(product.id)"
                  @change="toggleSelect(product.id)"
                  class="rounded text-[#00a896] cursor-pointer"
                />
              </td>
              <td class="py-3 px-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                    <ProductImage :blob-id="product.image_blob_ids[0]" :alt="product.title" />
                  </div>
                  <div class="flex flex-col min-w-0">
                    <router-link
                      :to="{ name: 'product-detail', params: { id: product.id } }"
                      class="font-bold text-[#023859] truncate hover:text-[#00a896] transition-colors"
                    >
                      {{ product.title }}
                    </router-link>
                    <span class="text-[11px] text-slate-400 truncate">{{ product.description || 'Sin descripción' }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-3.5">
                <span class="py-0.5 px-2.5 rounded-full bg-[#e6f7f5] text-[#00a896] text-xs font-semibold whitespace-nowrap border border-[#00a896]/20">
                  {{ product.category.name }}
                </span>
              </td>
              <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                {{ formatPrice(product.base_price) }}
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap text-slate-700">
                <span v-if="'Physical' in product.spec">
                  {{ product.spec.Physical.min_order_quantity }} unds
                </span>
                <span v-else class="text-slate-400">Servicio</span>
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span class="py-0.5 px-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                  En stock
                </span>
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span
                  class="py-0.5 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap border"
                  :class="product.is_active ? 'bg-[#e6f7f5] text-[#00a896] border-[#00a896]/30' : 'bg-slate-100 text-slate-500 border-slate-200'"
                >
                  {{ product.is_active ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="py-3 px-3.5 text-right whitespace-nowrap">
                <router-link
                  :to="{ name: 'product-detail', params: { id: product.id } }"
                  class="p-1.5 rounded-lg text-slate-500 hover:text-[#00a896] hover:bg-[#e6f7f5] transition-colors inline-block mr-1"
                  title="Ver detalle"
                >
                  <i class="fa-regular fa-eye text-xs"></i>
                </router-link>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  @click="promptDelete(product)"
                  title="Eliminar"
                >
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="8" class="py-8 text-center text-slate-500 text-sm font-medium">
                No se encontraron productos registrados en este proveedor.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Grid Mode -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
      <div
        v-for="product in products"
        :key="product.id"
        class="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5">
            <span
              class="py-0.5 px-2 rounded-full text-[11px] font-semibold border"
              :class="product.is_active ? 'bg-[#e6f7f5] text-[#00a896] border-[#00a896]/30' : 'bg-slate-100 text-slate-500 border-slate-200'"
            >
              {{ product.is_active ? 'Activo' : 'Inactivo' }}
            </span>
            <span class="py-0.5 px-1.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
              En stock
            </span>
          </div>

          <div class="flex items-center gap-1">
            <router-link
              :to="{ name: 'product-detail', params: { id: product.id } }"
              class="p-1 rounded text-slate-500 hover:text-[#00a896]"
            >
              <i class="fa-regular fa-eye text-xs"></i>
            </router-link>
            <button
              type="button"
              class="p-1 rounded text-red-500 hover:text-red-700 cursor-pointer"
              @click="promptDelete(product)"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <div class="h-36 w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
          <ProductImage :blob-id="product.image_blob_ids[0]" :alt="product.title" />
        </div>

        <div class="flex flex-col min-w-0">
          <span class="font-bold text-[#023859] text-sm truncate" :title="product.title">{{ product.title }}</span>
          <span class="text-xs text-slate-500">{{ product.category.name }}</span>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
          <span class="text-xs text-slate-500">
            Mín: <strong class="text-slate-800">{{ 'Physical' in product.spec ? product.spec.Physical.min_order_quantity : 1 }}</strong>
          </span>
          <span class="text-sm font-bold text-[#ff6a00]">{{ formatPrice(product.base_price) }}</span>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs text-xs sm:text-sm text-slate-600">
      <span>
        Mostrando <strong class="text-slate-900">{{ (currentPage - 1) * perPage + (products.length > 0 ? 1 : 0) }}</strong>-
        <strong class="text-slate-900">{{ (currentPage - 1) * perPage + products.length }}</strong>
        de <strong class="text-slate-900">{{ totalProducts }}</strong> productos
      </span>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="w-8 h-8 border border-slate-200 bg-white rounded-lg text-slate-700 hover:border-[#00a896] hover:text-[#00a896] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fa-solid fa-chevron-left text-xs"></i>
        </button>

        <button
          v-for="p in pageNumbers"
          :key="p"
          type="button"
          class="w-8 h-8 border rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
          :class="p === currentPage ? 'bg-[#ff6a00] border-[#ff6a00] text-white shadow-xs' : 'border-slate-200 bg-white text-slate-700 hover:border-[#00a896] hover:text-[#00a896]'"
          @click="currentPage = p"
        >
          {{ p }}
        </button>

        <button
          type="button"
          class="w-8 h-8 border border-slate-200 bg-white rounded-lg text-slate-700 hover:border-[#00a896] hover:text-[#00a896] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="fa-solid fa-chevron-right text-xs"></i>
        </button>
      </div>
    </div>

    <!-- Confirm Delete Modal -->
    <ConfirmModal
      :model-value="productToDelete !== null"
      title="¿Eliminar producto?"
      :description="`Esta acción eliminará definitivamente el producto '${productToDelete?.title}'. ¿Deseas continuar?`"
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      icon="fa-regular fa-trash-can"
      icon-variant="orange"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="productToDelete = null"
      @update:model-value="(val) => !val && (productToDelete = null)"
    />
  </div>
</template>
