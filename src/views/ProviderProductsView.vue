<script setup lang="ts">
import { ref, computed } from "vue";
import ProviderEditProductModal from "../components/ProviderEditProductModal.vue";

/* ─── Types ───────────────────────────────────────────── */
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

/* ─── Data ────────────────────────────────────────────── */
const products = ref<Product[]>([
  { id: 1, name: "Laptop HP 15.6\"",           brand: "HP",       category: "Computación",  price: 18500, stock: 65, status: "Publicado", selected: false },
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
                     (filterTab.value === "sin-stock"  && p.status === "Sin stock");
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
  <div class="mp-page">
    <!-- ── Page header ─────────────────────────────── -->
    <div class="mp-header">
      <div class="mp-title-block">
        <h1 class="mp-title">Mis Productos</h1>
        <p class="mp-subtitle">
          Gestiona y organiza todos los productos que tienes publicados en
          <a href="#" class="mp-link">Mercanto</a>.
        </p>
      </div>
      <div class="mp-actions">
        <button class="btn-export">
          <i class="fa-solid fa-download"></i> Exportar catálogo
        </button>
        <router-link to="/dashboard/provider-products/add" class="btn-add">
          <i class="fa-solid fa-plus"></i> Agregar nuevo producto
        </router-link>
      </div>
    </div>

    <!-- ── Stats cards ─────────────────────────────── -->
    <div class="stats-grid">
      <div class="stat-card">
        <i class="fa-solid fa-box stat-icon teal"></i>
        <div class="stat-body">
          <span class="stat-label">Productos publicados</span>
          <span class="stat-value">{{ totalPublished }}</span>
          <span class="stat-sub">Activos</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-clock stat-icon orange"></i>
        <div class="stat-body">
          <span class="stat-label">Pedidos</span>
          <span class="stat-value">{{ totalPending }}</span>
          <span class="stat-sub">Pendientes</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-inbox stat-icon gray"></i>
        <div class="stat-body">
          <span class="stat-label">Sin stock</span>
          <span class="stat-value">{{ totalSinStock }}</span>
          <span class="stat-sub">Inactivos</span>
        </div>
      </div>
      <div class="stat-card">
        <i class="fa-solid fa-hashtag stat-icon purple"></i>
        <div class="stat-body">
          <span class="stat-label">Categorías</span>
          <span class="stat-value">{{ totalCats }}</span>
          <span class="stat-sub">En uso</span>
        </div>
      </div>
    </div>

    <!-- ── Filters & search ────────────────────────── -->
    <div class="filter-bar">
      <div class="search-wrap">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Buscar productos..."
          type="text"
        />
      </div>

      <select v-model="filterCat" class="filter-select">
        <option value="todas">Todas las cat...</option>
        <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <select v-model="filterStatus" class="filter-select">
        <option value="todos">Todos los est...</option>
        <option value="Publicado">Publicado</option>
        <option value="Sin stock">Sin stock</option>
      </select>

      <select v-model="filterDisp" class="filter-select">
        <option value="todos">Todos</option>
        <option value="disponible">Disponible</option>
        <option value="agotado">Agotado</option>
      </select>

      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          @click="viewMode = 'list'"
          title="Vista lista"
        >
          <i class="fa-solid fa-list"></i>
        </button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
          title="Vista cuadrícula"
        >
          <i class="fa-solid fa-grip"></i>
        </button>
      </div>
    </div>

    <!-- ── Quick filters ────────────────────────────── -->
    <div class="quick-filters">
      <span class="qf-label">Filtrado rápido:</span>
      <button
        class="qf-btn"
        :class="{ active: filterTab === 'todos' }"
        @click="filterTab = 'todos'"
      >Todos</button>
      <button
        class="qf-btn"
        :class="{ active: filterTab === 'publicados' }"
        @click="filterTab = 'publicados'"
      >Publicados</button>
      <button
        class="qf-btn"
        :class="{ active: filterTab === 'sin-stock' }"
        @click="filterTab = 'sin-stock'"
      >Sin stock</button>
    </div>

    <!-- ── Product table ───────────────────────────── -->
    <div class="table-wrap">
      <table class="product-table">
        <thead>
          <tr>
            <th class="col-check">
              <input type="checkbox" v-model="selectAll" @change="toggleAll" />
            </th>
            <th class="col-product">Producto</th>
            <th class="col-cat">Categoría</th>
            <th class="col-price">Precio</th>
            <th class="col-stock">Stock disponible</th>
            <th class="col-status">Estado</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in paginated" :key="product.id" class="product-row">
            <td class="col-check">
              <input type="checkbox" v-model="product.selected" />
            </td>
            <td class="col-product">
              <div class="product-cell">
                <div class="product-img-placeholder">
                  <i class="fa-solid fa-box"></i>
                </div>
                <div class="product-info">
                  <span class="product-name">{{ product.name }}</span>
                  <span class="product-brand">Marca: {{ product.brand }}</span>
                </div>
              </div>
            </td>
            <td class="col-cat">
              <span class="cat-badge">{{ product.category }}</span>
            </td>
            <td class="col-price">{{ formatPrice(product.price) }}</td>
            <td class="col-stock">
              <span :class="{ 'stock-zero': product.stock === 0 }">
                {{ product.stock }} unidades
              </span>
            </td>
            <td class="col-status">
              <span
                class="status-badge"
                :class="product.status === 'Publicado' ? 'badge-pub' : 'badge-stock'"
              >
                {{ product.status }}
              </span>
            </td>
            <td class="col-actions">
              <button class="action-btn edit" @click="editProduct(product.id)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="action-btn delete" @click="deleteProduct(product.id)" title="Eliminar">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ──────────────────────────────── -->
    <div class="pagination">
      <span class="pag-info">
        Mostrando {{ (currentPage - 1) * perPage + 1 }}-{{
          Math.min(currentPage * perPage, filtered.length)
        }}
        de {{ filtered.length }} productos
      </span>
      <div class="pag-controls">
        <button
          class="pag-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <button
          v-for="p in pageNumbers"
          :key="p"
          class="pag-btn pag-num"
          :class="{ active: p === currentPage }"
          @click="typeof p === 'number' && (currentPage = p)"
        >
          {{ p }}
        </button>
        <button
          class="pag-btn"
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

<style scoped>
/* ── Page ───────────────────────────────────────────── */
.mp-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 1100px;
}

/* ── Header ─────────────────────────────────────────── */
.mp-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.mp-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #083c5a;
  margin: 0 0 0.25rem;
}

.mp-subtitle {
  font-size: 0.88rem;
  color: #777;
  margin: 0;
}

.mp-link {
  color: #189c94;
  font-weight: 600;
  text-decoration: none;
}

.mp-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-export {
  padding: 0.6rem 1.1rem;
  border: 1.5px solid #d0d0d0;
  background: #fff;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s, border-color 0.2s;
}

.btn-export:hover {
  background: #f5f5f5;
  border-color: #bbb;
}

.btn-add {
  padding: 0.6rem 1.2rem;
  background: #ff6a00;
  border: none;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}

.btn-add:hover {
  background: #e05e00;
  transform: translateY(-1px);
}

/* ── Stats cards ────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 1.1rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  font-size: 1.4rem;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.teal   { background: #e0f5f4; color: #189c94; }
.stat-icon.orange { background: #fff0e0; color: #ff6a00; }
.stat-icon.gray   { background: #f0f0f0; color: #888;    }
.stat-icon.purple { background: #ede8fd; color: #7c3aed; }

.stat-body {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.78rem;
  color: #888;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #083c5a;
  line-height: 1.2;
}

.stat-sub {
  font-size: 0.75rem;
  color: #aaa;
}

/* ── Filter bar ─────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: #fff;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 180px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #aaa;
  font-size: 0.85rem;
}

.search-input {
  width: 100%;
  padding: 0.55rem 1rem 0.55rem 2.2rem;
  border: 1.5px solid #e8e8e8;
  border-radius: 30px;
  font-size: 0.88rem;
  color: #333;
  background: #f9f9f9;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #189c94;
}

.filter-select {
  padding: 0.55rem 1rem;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #444;
  background: #fff;
  cursor: pointer;
  outline: none;
  transition: border-color 0.2s;
}

.filter-select:focus {
  border-color: #189c94;
}

.view-toggle {
  display: flex;
  gap: 0.3rem;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  overflow: hidden;
}

.view-btn {
  background: none;
  border: none;
  padding: 0.5rem 0.65rem;
  color: #aaa;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
}

.view-btn.active {
  background: #fde8e4;
  color: #ff6a00;
}

/* ── Quick filters ──────────────────────────────────── */
.quick-filters {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.qf-label {
  font-size: 0.85rem;
  color: #888;
  font-weight: 500;
}

.qf-btn {
  padding: 0.35rem 1rem;
  border-radius: 30px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  font-size: 0.83rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.qf-btn.active {
  background: #189c94;
  border-color: #189c94;
  color: #fff;
  font-weight: 700;
}

/* ── Table ──────────────────────────────────────────── */
.table-wrap {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.product-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.product-table thead {
  background: #f8f8f8;
}

.product-table th {
  padding: 0.85rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #555;
  font-size: 0.82rem;
  border-bottom: 1px solid #eee;
}

.product-row {
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.15s;
}

.product-row:hover {
  background: #fafafa;
}

.product-row td {
  padding: 0.85rem 1rem;
  vertical-align: middle;
  color: #333;
}

/* Product cell */
.product-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.product-img-placeholder {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 1rem;
  flex-shrink: 0;
}

.product-info {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 0.88rem;
}

.product-brand {
  font-size: 0.78rem;
  color: #888;
  margin-top: 0.1rem;
}

/* Category badge */
.cat-badge {
  padding: 0.28rem 0.75rem;
  border-radius: 30px;
  background: #eef8f7;
  color: #189c94;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Stock */
.stock-zero {
  color: #ef4444;
  font-weight: 600;
}

/* Status badge */
.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 30px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-pub {
  background: #e0f5f4;
  color: #189c94;
}

.badge-stock {
  background: #fee2e2;
  color: #ef4444;
}

/* Action buttons */
.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.35rem 0.4rem;
  border-radius: 8px;
  font-size: 0.88rem;
  transition: background 0.2s, color 0.2s;
}

.action-btn.edit {
  color: #9ca3af;
}

.action-btn.edit:hover {
  background: #eef8f7;
  color: #189c94;
}

.action-btn.delete {
  color: #f87171;
}

.action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

/* ── Pagination ─────────────────────────────────────── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.85rem;
  color: #888;
}

.pag-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.pag-btn {
  min-width: 34px;
  height: 34px;
  border: 1.5px solid #e0e0e0;
  background: #fff;
  border-radius: 8px;
  font-size: 0.85rem;
  color: #555;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pag-btn:hover:not(:disabled) {
  border-color: #189c94;
  color: #189c94;
}

.pag-btn.active {
  background: #ff6a00;
  border-color: #ff6a00;
  color: #fff;
  font-weight: 700;
}

.pag-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ── Responsive ─────────────────────────────────────── */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .mp-header {
    flex-direction: column;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .table-wrap {
    overflow-x: auto;
  }

  .product-table {
    min-width: 650px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }

  .mp-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
