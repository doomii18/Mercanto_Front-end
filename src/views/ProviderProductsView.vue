<script setup lang="ts">
import { ref, computed } from "vue";
import ProviderEditProductModal from "../components/ProviderEditProductModal.vue";

interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  status: "Publicado" | "Sin stock" | "Inactivo";
  selected: boolean;
}

const products = ref<Product[]>([
  { id: 1, name: 'Laptop HP 15.6"',           brand: "HP",       category: "Computación",  price: 18500, stock: 65, status: "Publicado", selected: false },
  { id: 2, name: "Audífonos Bluetooth Sony",   brand: "Sony",     category: "Audio",         price: 1850,  stock: 30, status: "Publicado", selected: false },
  { id: 3, name: "Smartphone Samsung A54",     brand: "Samsung",  category: "Celulares",     price: 9750,  stock: 15, status: "Publicado", selected: false },
  { id: 4, name: "Smartwatch Xiaomi Watch S1", brand: "Xiaomi",   category: "Relojes",       price: 3200,  stock: 20, status: "Publicado", selected: false },
  { id: 5, name: "Impresora HP Ink Tank 315",  brand: "HP",       category: "Impresoras",    price: 3900,  stock: 0,  status: "Sin stock", selected: false },
  { id: 6, name: "Teclado Mecánico RGB",       brand: "Genérico", category: "Accesorios",    price: 1200,  stock: 25, status: "Publicado", selected: false },
  { id: 7, name: "Mouse Inalámbrico Logitech", brand: "Logitech", category: "Accesorios",    price: 450,   stock: 40, status: "Publicado", selected: false },
]);

const editingProductId = ref<number | null>(null);
const searchQuery   = ref("");
const filterTab     = ref<"todos" | "publicados" | "sin-stock">("todos");
const filterCat     = ref("todas");
const filterStatus  = ref("todos");
const filterDisp    = ref("todos");
const viewMode      = ref<"list" | "grid">("list");
const selectAll     = ref(false);
const currentPage   = ref(1);
const perPage       = 7;

const totalPublished = computed(() => products.value.filter(p => p.status === "Publicado").length);
const totalPending   = computed(() => 4);
const totalSinStock  = computed(() => products.value.filter(p => p.status === "Sin stock").length);
const totalCats      = computed(() => new Set(products.value.map(p => p.category)).size);

const categories = computed(() => ["todas", ...new Set(products.value.map(p => p.category))]);

const filtered = computed(() => {
  return products.value.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                        p.brand.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchTab = filterTab.value === "todos" ||
                     (filterTab.value === "publicados" && p.status === "Publicado") ||
                     (filterTab.value === "sin-stock" && p.status === "Sin stock");
    const matchCat = filterCat.value === "todas" || p.category === filterCat.value;
    return matchSearch && matchTab && matchCat;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage)));

const paginated = computed(() => {
  const start = (currentPage.value - 1) * perPage;
  return filtered.value.slice(start, start + perPage);
});

const pageNumbers = computed(() => {
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages.value; i++) pages.push(i);
  return pages;
});

function toggleAll() {
  products.value.forEach(p => (p.selected = selectAll.value));
}

function deleteProduct(id: number) {
  if (confirm("¿Eliminar este producto?")) {
    products.value = products.value.filter(p => p.id !== id);
  }
}

function editProduct(id: number) {
  editingProductId.value = id;
}

function formatPrice(n: number) {
  return "C$ " + n.toLocaleString("es-NI");
}
</script>

<template>
  <div class="flex flex-col gap-4 w-full max-w-7xl mx-auto px-2 sm:px-4">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-[#023859] tracking-tight">Mis Productos</h1>
        <p class="text-xs sm:text-sm text-slate-600 mt-0.5">
          Gestiona y organiza todos los productos que tienes publicados en
          <a href="#" class="text-[#00a896] font-semibold hover:underline">Mercanto</a>.
        </p>
      </div>
      <div class="flex items-center gap-2.5 w-full sm:w-auto">
        <button
          type="button"
          class="flex-1 sm:flex-none justify-center px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <i class="fa-solid fa-download text-slate-500"></i>
          <span>Exportar catálogo</span>
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

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f5] text-[#00a896]">
          <i class="fa-solid fa-box text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Productos publicados</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalPublished }}</span>
          <span class="text-[11px] font-medium text-[#00a896]">Activos</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0e6] text-[#ff6a00]">
          <i class="fa-solid fa-clock text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Pedidos</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalPending }}</span>
          <span class="text-[11px] font-medium text-[#ff6a00]">Pendientes</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <i class="fa-solid fa-inbox text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Sin stock</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalSinStock }}</span>
          <span class="text-[11px] font-medium text-slate-500">Inactivos</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 border border-slate-200 shadow-xs">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <i class="fa-solid fa-hashtag text-lg"></i>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-slate-500 truncate">Categorías</span>
          <span class="text-xl sm:text-2xl font-bold text-[#023859] leading-tight">{{ totalCats }}</span>
          <span class="text-[11px] font-medium text-slate-500">En uso</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs">
      <div class="relative flex-1 min-w-[200px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        <input
          v-model="searchQuery"
          class="w-full py-2 pr-3.5 pl-9 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-slate-50 outline-none transition-colors focus:border-[#00a896] focus:bg-white"
          placeholder="Buscar productos..."
          type="text"
        />
      </div>

      <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
        <select v-model="filterCat" class="py-2 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white cursor-pointer outline-none transition-colors focus:border-[#00a896]">
          <option value="todas">Todas las categorías</option>
          <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <select v-model="filterStatus" class="py-2 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white cursor-pointer outline-none transition-colors focus:border-[#00a896]">
          <option value="todos">Todos los estados</option>
          <option value="Publicado">Publicado</option>
          <option value="Sin stock">Sin stock</option>
        </select>

        <select v-model="filterDisp" class="py-2 px-3 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 bg-white cursor-pointer outline-none transition-colors focus:border-[#00a896]">
          <option value="todos">Disponibilidad</option>
          <option value="disponible">Disponible</option>
          <option value="agotado">Agotado</option>
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

    <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
      <span class="text-slate-700 font-semibold shrink-0">Filtrado rápido:</span>
      <button
        type="button"
        class="py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shrink-0"
        :class="filterTab === 'todos'
          ? 'bg-[#00a896] border-[#00a896] text-white shadow-xs'
          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900'"
        @click="filterTab = 'todos'"
      >
        Todos ({{ products.length }})
      </button>
      <button
        type="button"
        class="py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shrink-0"
        :class="filterTab === 'publicados'
          ? 'bg-[#00a896] border-[#00a896] text-white shadow-xs'
          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900'"
        @click="filterTab = 'publicados'"
      >
        Publicados ({{ totalPublished }})
      </button>
      <button
        type="button"
        class="py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shrink-0"
        :class="filterTab === 'sin-stock'
          ? 'bg-[#00a896] border-[#00a896] text-white shadow-xs'
          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900'"
        @click="filterTab = 'sin-stock'"
      >
        Sin stock ({{ totalSinStock }})
      </button>
    </div>

    <div v-if="viewMode === 'list'" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-xs sm:text-sm">
          <thead class="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th class="py-3 px-3.5 w-10 text-center">
                <input type="checkbox" v-model="selectAll" @change="toggleAll" class="rounded text-[#00a896] cursor-pointer" />
              </th>
              <th class="py-3 px-3.5">Producto</th>
              <th class="py-3 px-3.5">Categoría</th>
              <th class="py-3 px-3.5">Precio</th>
              <th class="py-3 px-3.5">Stock disponible</th>
              <th class="py-3 px-3.5">Estado</th>
              <th class="py-3 px-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="product in paginated" :key="product.id" class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3 px-3.5 text-center">
                <input type="checkbox" v-model="product.selected" class="rounded text-[#00a896] cursor-pointer" />
              </td>
              <td class="py-3 px-3.5">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm shrink-0 border border-slate-200">
                    <i class="fa-solid fa-box"></i>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="font-bold text-[#023859] truncate">{{ product.name }}</span>
                    <span class="text-[11px] text-slate-500 font-medium">Marca: {{ product.brand }}</span>
                  </div>
                </div>
              </td>
              <td class="py-3 px-3.5">
                <span class="py-0.5 px-2.5 rounded-full bg-[#e6f7f5] text-[#00a896] text-xs font-semibold whitespace-nowrap border border-[#00a896]/20">
                  {{ product.category }}
                </span>
              </td>
              <td class="py-3 px-3.5 font-bold text-slate-900 whitespace-nowrap">
                {{ formatPrice(product.price) }}
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span :class="product.stock === 0 ? 'text-red-600 font-bold' : 'text-slate-800 font-medium'">
                  {{ product.stock }} unidades
                </span>
              </td>
              <td class="py-3 px-3.5 whitespace-nowrap">
                <span
                  class="py-0.5 px-2.5 rounded-full text-xs font-semibold whitespace-nowrap border"
                  :class="product.status === 'Publicado' ? 'bg-[#e6f7f5] text-[#00a896] border-[#00a896]/30' : 'bg-red-50 text-red-600 border-red-200'"
                >
                  {{ product.status }}
                </span>
              </td>
              <td class="py-3 px-3.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-slate-500 hover:text-[#00a896] hover:bg-[#e6f7f5] transition-colors cursor-pointer mr-1"
                  @click="editProduct(product.id)"
                  title="Editar"
                >
                  <i class="fa-solid fa-pen text-xs"></i>
                </button>
                <button
                  type="button"
                  class="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  @click="deleteProduct(product.id)"
                  title="Eliminar"
                >
                  <i class="fa-solid fa-trash text-xs"></i>
                </button>
              </td>
            </tr>
            <tr v-if="paginated.length === 0">
              <td colspan="7" class="py-8 text-center text-slate-500 text-sm font-medium">
                No se encontraron productos que coincidan con los filtros aplicados.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
      <div
        v-for="product in paginated"
        :key="product.id"
        class="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md transition-all"
      >
        <div class="flex items-start justify-between gap-2">
          <span
            class="py-0.5 px-2 rounded-full text-[11px] font-semibold border"
            :class="product.status === 'Publicado' ? 'bg-[#e6f7f5] text-[#00a896] border-[#00a896]/30' : 'bg-red-50 text-red-600 border-red-200'"
          >
            {{ product.status }}
          </span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              class="p-1 rounded text-slate-500 hover:text-[#00a896] cursor-pointer"
              @click="editProduct(product.id)"
            >
              <i class="fa-solid fa-pen text-xs"></i>
            </button>
            <button
              type="button"
              class="p-1 rounded text-red-500 hover:text-red-700 cursor-pointer"
              @click="deleteProduct(product.id)"
            >
              <i class="fa-solid fa-trash text-xs"></i>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 text-base shrink-0">
            <i class="fa-solid fa-box"></i>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="font-bold text-[#023859] text-sm truncate" :title="product.name">{{ product.name }}</span>
            <span class="text-xs text-slate-500">{{ product.brand }} · {{ product.category }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
          <span class="text-xs text-slate-600">
            Stock: <strong :class="product.stock === 0 ? 'text-red-600 font-bold' : 'text-slate-900 font-bold'">{{ product.stock }}</strong>
          </span>
          <span class="text-sm font-bold text-[#ff6a00]">{{ formatPrice(product.price) }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs text-xs sm:text-sm text-slate-600">
      <span>
        Mostrando <strong class="text-slate-900">{{ (currentPage - 1) * perPage + 1 }}</strong>-
        <strong class="text-slate-900">{{ Math.min(currentPage * perPage, filtered.length) }}</strong>
        de <strong class="text-slate-900">{{ filtered.length }}</strong> productos
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
          @click="typeof p === 'number' && (currentPage = p)"
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

    <ProviderEditProductModal
      v-if="editingProductId !== null"
      :product-id="editingProductId"
      @close="editingProductId = null"
    />
  </div>
</template>
