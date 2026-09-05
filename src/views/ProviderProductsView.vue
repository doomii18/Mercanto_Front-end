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

// Derived stats
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
  <div class="flex flex-col gap-6 max-w-[1100px]">
    <!-- ── Page header ─────────────────────────────── -->
    <div class="flex items-start justify-between flex-wrap gap-4 max-md:flex-col">
      <div>
        <h1 class="text-[1.6rem] font-bold text-(--primary-blue) mb-1">Mis Productos</h1>
        <p class="text-[0.88rem] text-neutral-500">
          Gestiona y organiza todos los productos que tienes publicados en
          <a href="#" class="text-(--light-teal) font-semibold no-underline">Mercanto</a>.
        </p>
      </div>
      <div class="flex gap-3 flex-wrap">
        <button class="px-[1.1rem] py-[0.6rem] border-[1.5px] border-neutral-300 bg-white rounded-[10px] text-[0.88rem] font-semibold text-neutral-700 cursor-pointer flex items-center gap-2 transition-all hover:bg-neutral-50 hover:border-neutral-400">
          <i class="fa-solid fa-download"></i> Exportar catálogo
        </button>
        <router-link to="/dashboard/provider-products/add" class="px-[1.2rem] py-[0.6rem] bg-(--primary-orange) border-none rounded-[10px] text-[0.88rem] font-bold text-white cursor-pointer flex items-center gap-2 no-underline transition-all hover:bg-[#e05e00] hover:-translate-y-0.5">
          <i class="fa-solid fa-plus"></i> Agregar nuevo producto
        </router-link>
      </div>
    </div>

    <!-- ── Stats cards ─────────────────────────────── -->
    <div class="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
      <div class="bg-white rounded-[14px] p-[1.1rem_1.25rem] flex items-center gap-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <i class="fa-solid fa-box text-[1.4rem] w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-teal-50 text-(--light-teal)"></i>
        <div class="flex flex-col">
          <span class="text-[0.78rem] text-neutral-500 font-medium">Productos publicados</span>
          <span class="text-[1.5rem] font-bold text-(--primary-blue) leading-tight">{{ totalPublished }}</span>
          <span class="text-[0.75rem] text-neutral-400">Activos</span>
        </div>
      </div>
      <div class="bg-white rounded-[14px] p-[1.1rem_1.25rem] flex items-center gap-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <i class="fa-solid fa-clock text-[1.4rem] w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-orange-50 text-(--primary-orange)"></i>
        <div class="flex flex-col">
          <span class="text-[0.78rem] text-neutral-500 font-medium">Pedidos</span>
          <span class="text-[1.5rem] font-bold text-(--primary-blue) leading-tight">{{ totalPending }}</span>
          <span class="text-[0.75rem] text-neutral-400">Pendientes</span>
        </div>
      </div>
      <div class="bg-white rounded-[14px] p-[1.1rem_1.25rem] flex items-center gap-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <i class="fa-solid fa-inbox text-[1.4rem] w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-neutral-100 text-neutral-500"></i>
        <div class="flex flex-col">
          <span class="text-[0.78rem] text-neutral-500 font-medium">Sin stock</span>
          <span class="text-[1.5rem] font-bold text-(--primary-blue) leading-tight">{{ totalSinStock }}</span>
          <span class="text-[0.75rem] text-neutral-400">Inactivos</span>
        </div>
      </div>
      <div class="bg-white rounded-[14px] p-[1.1rem_1.25rem] flex items-center gap-4 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
        <i class="fa-solid fa-hashtag text-[1.4rem] w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-[#ede8fd] text-[#7c3aed]"></i>
        <div class="flex flex-col">
          <span class="text-[0.78rem] text-neutral-500 font-medium">Categorías</span>
          <span class="text-[1.5rem] font-bold text-(--primary-blue) leading-tight">{{ totalCats }}</span>
          <span class="text-[0.75rem] text-neutral-400">En uso</span>
        </div>
      </div>
    </div>

    <!-- ── Filters & search ────────────────────────── -->
    <div class="flex items-center gap-3 flex-wrap bg-white rounded-[14px] p-[0.85rem_1rem] shadow-[0_1px_6px_rgba(0,0,0,0.05)] max-md:flex-col max-md:items-stretch">
      <div class="relative flex-1 min-w-[180px]">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[0.85rem]"></i>
        <input
          v-model="searchQuery"
          class="w-full py-[0.55rem] pr-4 pl-[2.2rem] border-[1.5px] border-neutral-200 rounded-full text-[0.88rem] text-neutral-800 bg-neutral-50 outline-none box-border transition-colors focus:border-(--light-teal)"
          placeholder="Buscar productos..."
          type="text"
        />
      </div>
      <select v-model="filterCat" class="py-[0.55rem] px-4 border-[1.5px] border-neutral-200 rounded-[10px] text-[0.85rem] text-neutral-700 bg-white cursor-pointer outline-none transition-colors focus:border-(--light-teal)">
        <option value="todas">Todas las cat...</option>
        <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="filterStatus" class="py-[0.55rem] px-4 border-[1.5px] border-neutral-200 rounded-[10px] text-[0.85rem] text-neutral-700 bg-white cursor-pointer outline-none transition-colors focus:border-(--light-teal)">
        <option value="todos">Todos los est...</option>
        <option value="Publicado">Publicado</option>
        <option value="Sin stock">Sin stock</option>
      </select>
      <select v-model="filterDisp" class="py-[0.55rem] px-4 border-[1.5px] border-neutral-200 rounded-[10px] text-[0.85rem] text-neutral-700 bg-white cursor-pointer outline-none transition-colors focus:border-(--light-teal)">
        <option value="todos">Todos</option>
        <option value="disponible">Disponible</option>
        <option value="agotado">Agotado</option>
      </select>
      <div class="flex gap-[0.3rem] border-[1.5px] border-neutral-200 rounded-[10px] overflow-hidden">
        <button
          class="bg-none border-none py-2 px-[0.65rem] text-neutral-400 cursor-pointer text-[0.9rem] transition-colors"
          :class="{ 'bg-[#fde8e4] text-(--primary-orange)': viewMode === 'list' }"
          @click="viewMode = 'list'"
          title="Vista lista"
        >
          <i class="fa-solid fa-list"></i>
        </button>
        <button
          class="bg-none border-none py-2 px-[0.65rem] text-neutral-400 cursor-pointer text-[0.9rem] transition-colors"
          :class="{ 'bg-[#fde8e4] text-(--primary-orange)': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
          title="Vista cuadrícula"
        >
          <i class="fa-solid fa-grip"></i>
        </button>
      </div>
    </div>

    <!-- ── Quick filters ────────────────────────────── -->
    <div class="flex items-center gap-[0.6rem] flex-wrap">
      <span class="text-[0.85rem] text-neutral-500 font-medium">Filtrado rápido:</span>
      <button
        class="py-[0.35rem] px-4 rounded-full border-[1.5px] border-neutral-200 bg-white text-[0.83rem] font-medium text-neutral-500 cursor-pointer transition-all"
        :class="{ 'bg-(--light-teal) border-(--light-teal) text-white font-bold': filterTab === 'todos' }"
        @click="filterTab = 'todos'"
      >Todos</button>
      <button
        class="py-[0.35rem] px-4 rounded-full border-[1.5px] border-neutral-200 bg-white text-[0.83rem] font-medium text-neutral-500 cursor-pointer transition-all"
        :class="{ 'bg-(--light-teal) border-(--light-teal) text-white font-bold': filterTab === 'publicados' }"
        @click="filterTab = 'publicados'"
      >Publicados</button>
      <button
        class="py-[0.35rem] px-4 rounded-full border-[1.5px] border-neutral-200 bg-white text-[0.83rem] font-medium text-neutral-500 cursor-pointer transition-all"
        :class="{ 'bg-(--light-teal) border-(--light-teal) text-white font-bold': filterTab === 'sin-stock' }"
        @click="filterTab = 'sin-stock'"
      >Sin stock</button>
    </div>

    <!-- ── Product table ───────────────────────────── -->
    <div class="bg-white rounded-[16px] overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.06)] max-md:overflow-x-auto">
      <table class="w-full border-collapse text-[0.88rem] max-md:min-w-[650px]">
        <thead class="bg-neutral-50">
          <tr>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100 w-10">
              <input type="checkbox" v-model="selectAll" @change="toggleAll" />
            </th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Producto</th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Categoría</th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Precio</th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Stock disponible</th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Estado</th>
            <th class="py-[0.85rem] px-4 text-left font-semibold text-neutral-600 text-[0.82rem] border-b border-neutral-100">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in paginated" :key="product.id" class="border-b border-neutral-50 transition-colors hover:bg-neutral-50">
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <input type="checkbox" v-model="product.selected" />
            </td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <div class="flex items-center gap-3">
                <div class="w-[42px] h-[42px] rounded-[10px] bg-neutral-100 flex items-center justify-center text-neutral-400 text-[1rem] shrink-0">
                  <i class="fa-solid fa-box"></i>
                </div>
                <div class="flex flex-col">
                  <span class="font-semibold text-[#1a1a1a] text-[0.88rem]">{{ product.name }}</span>
                  <span class="text-[0.78rem] text-neutral-500 mt-0.5">Marca: {{ product.brand }}</span>
                </div>
              </div>
            </td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <span class="py-[0.28rem] px-3 rounded-full bg-[#eef8f7] text-(--light-teal) text-[0.8rem] font-semibold whitespace-nowrap">{{ product.category }}</span>
            </td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">{{ formatPrice(product.price) }}</td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <span :class="{ 'text-red-500 font-semibold': product.stock === 0 }">
                {{ product.stock }} unidades
              </span>
            </td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <span
                class="py-[0.3rem] px-[0.8rem] rounded-full text-[0.8rem] font-semibold whitespace-nowrap"
                :class="product.status === 'Publicado' ? 'bg-[#e0f5f4] text-(--light-teal)' : 'bg-red-100 text-red-500'"
              >
                {{ product.status }}
              </span>
            </td>
            <td class="py-[0.85rem] px-4 align-middle text-neutral-800">
              <button class="bg-none border-none cursor-pointer p-[0.35rem_0.4rem] rounded-lg text-[0.88rem] text-neutral-400 transition-colors hover:bg-[#eef8f7] hover:text-(--light-teal)" @click="editProduct(product.id)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="bg-none border-none cursor-pointer p-[0.35rem_0.4rem] rounded-lg text-[0.88rem] text-red-400 transition-colors hover:bg-red-100 hover:text-red-500" @click="deleteProduct(product.id)" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ──────────────────────────────── -->
    <div class="flex items-center justify-between flex-wrap gap-3 text-[0.85rem] text-neutral-500">
      <span>
        Mostrando {{ (currentPage - 1) * perPage + 1 }}-{{
          Math.min(currentPage * perPage, filtered.length)
        }}
        de {{ filtered.length }} productos
      </span>
      <div class="flex items-center gap-[0.35rem]">
        <button
          class="min-w-[34px] h-[34px] border-[1.5px] border-neutral-200 bg-white rounded-lg text-[0.85rem] text-neutral-600 cursor-pointer flex items-center justify-center transition-all hover:border-(--light-teal) hover:text-(--light-teal) disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="min-w-[34px] h-[34px] border-[1.5px] border-neutral-200 bg-white rounded-lg text-[0.85rem] text-neutral-600 cursor-pointer flex items-center justify-center transition-all hover:border-(--light-teal) hover:text-(--light-teal)"
          :class="{ 'bg-(--primary-orange) border-(--primary-orange) text-white font-bold': p === currentPage }"
          @click="typeof p === 'number' && (currentPage = p)"
        >
          {{ p }}
        </button>
        <button
          class="min-w-[34px] h-[34px] border-[1.5px] border-neutral-200 bg-white rounded-lg text-[0.85rem] text-neutral-600 cursor-pointer flex items-center justify-center transition-all hover:border-(--light-teal) hover:text-(--light-teal) disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <i class="fa-solid fa-chevron-right"></i>
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
