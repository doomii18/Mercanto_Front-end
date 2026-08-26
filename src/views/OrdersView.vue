<script setup lang="ts">
import { ref, computed } from "vue";
import echLogo from "../assets/ech-logo.png";
import florLogo from "../assets/flor-de-cana-logo.png";
import dicegsaLogo from "../assets/dicegsa-logo.png";
import product1 from "../assets/product1.png";
import product2 from "../assets/product2.png";
import product3 from "../assets/product3.png";
import product4 from "../assets/product4.png";
import producto5 from "../assets/producto5.png";
import producto6 from "../assets/producto6.png";

type OrderTab = "all" | "pending" | "processing" | "received";

interface OrderProductItem {
  name: string;
  image: string;
  price: string;
  qty: string;
  subtotal: string;
}

interface OrderRecord {
  code: string;
  createdDate: string;
  purchaseDate: string;
  total: string;
  paymentMethod: string;
  productCount: string;
  status: "received" | "processing" | "shipped" | "pending";
  statusLabel: string;
  statusIcon: string;
  statusDate: string;
  provider: {
    name: string;
    logo: string;
    stars: number;
  };
  address: {
    name: string;
    street: string;
    city: string;
    phone: string;
  };
  products: OrderProductItem[];
  thumbnails: string[];
  extraCount?: number;
}

const currentView = ref<"list" | "details">("list");
const selectedOrder = ref<OrderRecord | null>(null);
const activeTab = ref<OrderTab>("all");
const searchQuery = ref("");
const isSearchDropdownOpen = ref(false);

const ordersData = ref<Record<string, OrderRecord>>({
  "MC-2026-5": {
    code: "MC-2026-5",
    createdDate: "Realizado el 10 de junio de 2026",
    purchaseDate: "26 de junio de 2026",
    total: "C$ 10, 400.00",
    paymentMethod: "Transferencia bancaria",
    productCount: "100 productos",
    status: "received",
    statusLabel: "Recibido",
    statusIcon: "fa-solid fa-circle-check",
    statusDate: "Recibido el 26 de julio de 2026",
    provider: {
      name: "E. Chamorro S.A",
      logo: echLogo,
      stars: 4,
    },
    address: {
      name: "Héctor Raúl Hernández L.",
      street: "Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.",
      city: "Granada - Granada",
      phone: "Tel. 8730 9208",
    },
    products: [
      {
        name: "Jabón Marfil Explosion Frescur 3U - 960 g",
        image: product1,
        price: "C$ 109.00",
        qty: "Ud. 34",
        subtotal: "C$3,706.00",
      },
      {
        name: "Lavaplatos Marfil Toronja Taza - 850 g",
        image: product2,
        price: "C$ 49.25",
        qty: "Ud. 33",
        subtotal: "C$1,625.25",
      },
      {
        name: "Jabon Marfil Nat Explosion Fresc 320gr",
        image: product1,
        price: "C$ 40.00",
        qty: "Ud. 33",
        subtotal: "C$1,320.00",
      },
    ],
    thumbnails: [product1, product2],
    extraCount: 1,
  },
  "MC-2026-4": {
    code: "MC-2026-4",
    createdDate: "Realizado el 20 de junio de 2026",
    purchaseDate: "20 de junio de 2026",
    total: "C$ 7, 000.00",
    paymentMethod: "Tarjeta de crédito",
    productCount: "50 productos",
    status: "processing",
    statusLabel: "En proceso",
    statusIcon: "fa-regular fa-clock",
    statusDate: "Recibido el 20 de julio de 2026",
    provider: {
      name: "Ron Flor de Caña",
      logo: florLogo,
      stars: 5,
    },
    address: {
      name: "Héctor Raúl Hernández L.",
      street: "Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.",
      city: "Granada - Granada",
      phone: "Tel. 8730 9208",
    },
    products: [
      {
        name: "Ron Flor de Caña 12 Años 750ml",
        image: product3,
        price: "C$ 140.00",
        qty: "Ud. 25",
        subtotal: "C$3,500.00",
      },
      {
        name: "Ron Flor de Caña 7 Años Gran Reserva 750ml",
        image: product4,
        price: "C$ 140.00",
        qty: "Ud. 25",
        subtotal: "C$3,500.00",
      },
    ],
    thumbnails: [product3, product4],
  },
  "MC-2026-3": {
    code: "MC-2026-3",
    createdDate: "Realizado el 15 de junio de 2026",
    purchaseDate: "15 de junio de 2026",
    total: "C$ 16, 950.00",
    paymentMethod: "Transferencia bancaria",
    productCount: "30 productos",
    status: "shipped",
    statusLabel: "Enviado",
    statusIcon: "fa-solid fa-truck",
    statusDate: "Recibido el 15 de julio de 2026",
    provider: {
      name: "Dicegsa",
      logo: dicegsaLogo,
      stars: 4,
    },
    address: {
      name: "Héctor Raúl Hernández L.",
      street: "Barrio El Recreo, de la rotonda 1c al lago, 2c al sur, 1 al oeste.",
      city: "Granada - Granada",
      phone: "Tel. 8730 9208",
    },
    products: [
      {
        name: "Cereales CerealMix Fresa 500g",
        image: producto5,
        price: "C$ 565.00",
        qty: "Ud. 15",
        subtotal: "C$8,475.00",
      },
      {
        name: "Detergente Multiuso Lavanda 1kg",
        image: producto6,
        price: "C$ 565.00",
        qty: "Ud. 15",
        subtotal: "C$8,475.00",
      },
    ],
    thumbnails: [producto5, producto6],
  },
});

const filteredOrders = computed(() => {
  return Object.values(ordersData.value).filter((order) => {
    const q = searchQuery.value.trim().toLowerCase();
    const matchSearch =
      !q ||
      order.code.toLowerCase().includes(q) ||
      order.provider.name.toLowerCase().includes(q);

    if (!matchSearch) return false;
    if (activeTab.value === "all") return true;
    if (activeTab.value === "pending") return order.status === "pending";
    if (activeTab.value === "processing") return order.status === "processing";
    if (activeTab.value === "received") return order.status === "received" || order.status === "shipped";
    return true;
  });
});

const liveSearchMatches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return Object.values(ordersData.value).filter((order) => {
    return (
      order.code.toLowerCase().includes(q) ||
      order.provider.name.toLowerCase().includes(q) ||
      order.products.some((p) => p.name.toLowerCase().includes(q))
    );
  });
});

const openOrderDetails = (orderId: string) => {
  selectedOrder.value = ordersData.value[orderId] || ordersData.value["MC-2026-5"];
  currentView.value = "details";
  isSearchDropdownOpen.value = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const backToList = () => {
  currentView.value = "list";
};
</script>

<template>
  <div class="orders-shell">
    <!-- VISTA 1: Lista de Pedidos -->
    <div v-if="currentView === 'list'" class="orders-list-view">
      <div class="pedidos-header">
        <div>
          <h2 class="pedidos-title">Mis Pedidos</h2>
          <p class="pedidos-subtitle">Consulta y monitorea tus pedidos realizados</p>
        </div>

        <div class="search-wrapper-container">
          <div class="search-bar">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Busca tu pedido o proveedor"
              @focus="isSearchDropdownOpen = true"
            />
            <i class="fa-solid fa-magnifying-glass"></i>
          </div>

          <!-- Search Dropdown -->
          <div v-if="isSearchDropdownOpen" class="search-dropdown-menu">
            <div class="dropdown-top-header">
              <input
                v-model="searchQuery"
                type="text"
                class="dropdown-search-input"
                placeholder="Busca tu pedido o proveedor"
              />
              <button type="button" class="btn-clear-search" @click="isSearchDropdownOpen = false; searchQuery = ''">
                ✕
              </button>
            </div>

            <div v-if="!searchQuery.trim()" class="search-recent-block">
              <div class="search-group-block">
                <span class="group-period-title">Recientes</span>
                <div
                  v-for="order in Object.values(ordersData)"
                  :key="order.code"
                  class="dropdown-item-row"
                  @click="openOrderDetails(order.code)"
                >
                  <div class="item-left-info">
                    <i class="fa-solid fa-bag-shopping bag-icon"></i>
                    <strong class="item-code">{{ order.code }}</strong>
                  </div>
                  <span class="item-count-text">{{ order.productCount }}</span>
                </div>
              </div>
            </div>

            <div v-else class="search-live-results">
              <div class="results-subheading">Resultados para "{{ searchQuery }}"</div>
              <div v-if="liveSearchMatches.length === 0" class="no-results-msg">
                No se encontraron pedidos correspondientes.
              </div>
              <div
                v-for="match in liveSearchMatches"
                :key="match.code"
                class="live-result-row"
                @click="openOrderDetails(match.code)"
              >
                <div class="item-left-info">
                  <i class="fa-solid fa-bag-shopping bag-icon"></i>
                  <div class="result-main-text">
                    <strong>{{ match.code }}</strong>
                    <span>{{ match.provider.name }}</span>
                  </div>
                </div>
                <span class="result-date-text">{{ match.purchaseDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="tabs">
        <button :class="['tab-btn', { active: activeTab === 'all' }]" @click="activeTab = 'all'">Todos</button>
        <button :class="['tab-btn', { active: activeTab === 'pending' }]" @click="activeTab = 'pending'">Pendientes</button>
        <button :class="['tab-btn', { active: activeTab === 'processing' }]" @click="activeTab = 'processing'">En proceso</button>
        <button :class="['tab-btn', { active: activeTab === 'received' }]" @click="activeTab = 'received'">Recibidos</button>
      </div>

      <!-- Orders List Cards -->
      <div class="orders-list">
        <div v-for="order in filteredOrders" :key="order.code" class="order-card">
          <div class="order-details">
            <h4>Pedido #{{ order.code }}</h4>
            <p class="order-date">{{ order.purchaseDate }}</p>
            <p class="order-total-label">Total</p>
            <h3 class="order-amount">{{ order.total }}</h3>
            <p class="order-count">{{ order.productCount }}</p>
          </div>

          <div class="order-provider">
            <div class="provider-info-left">
              <div class="provider-logo">
                <img :src="order.provider.logo" :alt="order.provider.name" />
              </div>
              <div class="provider-name-container">
                <p class="provider-name">{{ order.provider.name }}</p>
                <a href="#" class="provider-link">ver proveedor</a>
              </div>
            </div>
            <div class="provider-products">
              <div v-for="(thumb, idx) in order.thumbnails" :key="idx" class="product-thumb">
                <img :src="thumb" alt="Product" />
              </div>
              <div v-if="order.extraCount" class="product-thumb more-thumb">
                +{{ order.extraCount }}
              </div>
            </div>
          </div>

          <div class="order-status-action">
            <div :class="['status-badge', order.status]">
              <i :class="order.statusIcon"></i>
              <span>{{ order.statusLabel }}</span>
            </div>
            <p class="status-date">{{ order.statusDate }}</p>
            <button type="button" class="btn-outline-teal" @click="openOrderDetails(order.code)">
              ver detalles
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- VISTA 2: Detalles del Pedido -->
    <div v-else-if="selectedOrder" class="order-details-view">
      <div class="details-top-header">
        <div class="details-title-group">
          <button type="button" class="btn-back-arrow" aria-label="Regresar" @click="backToList">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h2 class="details-order-heading">Detalles del Pedido #{{ selectedOrder.code }}</h2>
            <p class="details-order-subdate">{{ selectedOrder.createdDate }}</p>
          </div>
        </div>
        <div :class="['status-badge', selectedOrder.status]">
          <i :class="selectedOrder.statusIcon"></i>
          <span>{{ selectedOrder.statusLabel }}</span>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="order-summary-card">
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-calendar-days summary-icon"></i>
            <span>Fecha de Compra</span>
          </div>
          <strong class="summary-val">{{ selectedOrder.purchaseDate }}</strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-money-bill-1 summary-icon"></i>
            <span>Total Pagado</span>
          </div>
          <strong class="summary-val">{{ selectedOrder.total }}</strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-regular fa-credit-card summary-icon"></i>
            <span>Método de Pago</span>
          </div>
          <strong class="summary-val">{{ selectedOrder.paymentMethod }}</strong>
        </div>
        <div class="summary-col">
          <div class="summary-col-header">
            <i class="fa-solid fa-bag-shopping summary-icon"></i>
            <span>Cantidad de Productos</span>
          </div>
          <strong class="summary-val">{{ selectedOrder.productCount }}</strong>
        </div>
      </div>

      <!-- Details Split Grid -->
      <div class="details-split-grid">
        <div class="details-products-box">
          <h3 class="box-inner-title">Productos ({{ selectedOrder.products.length }})</h3>
          <div class="products-table-wrapper">
            <table class="order-products-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio U.</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(prod, i) in selectedOrder.products" :key="i">
                  <td class="td-product">
                    <div class="product-item-cell">
                      <img :src="prod.image" :alt="prod.name" class="table-prod-img" />
                      <span>{{ prod.name }}</span>
                    </div>
                  </td>
                  <td class="td-price">{{ prod.price }}</td>
                  <td class="td-qty">{{ prod.qty }}</td>
                  <td class="td-subtotal">{{ prod.subtotal }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="table-bottom-total-row">
            <span>Total</span>
            <strong>{{ selectedOrder.total }}</strong>
          </div>
        </div>

        <div class="details-sidebar-boxes">
          <div class="side-detail-card">
            <h4>Proveedor</h4>
            <div class="side-provider-avatar">
              <img :src="selectedOrder.provider.logo" :alt="selectedOrder.provider.name" />
            </div>
            <h5>{{ selectedOrder.provider.name }}</h5>
            <div class="provider-stars-rating">
              <i
                v-for="st in 5"
                :key="st"
                :class="st <= selectedOrder.provider.stars ? 'fa-solid fa-star star-filled' : 'fa-regular fa-star star-empty'"
              ></i>
            </div>
            <button type="button" class="btn-outline-teal btn-side-provider">ver proveedor</button>
          </div>

          <div class="side-detail-card address-box">
            <h4>Dirección de Entrega</h4>
            <div class="address-user-line">
              <i class="fa-solid fa-location-dot map-pin-icon"></i>
              <strong>{{ selectedOrder.address.name }}</strong>
            </div>
            <p class="address-line-text">{{ selectedOrder.address.street }}</p>
            <p class="address-city-text">{{ selectedOrder.address.city }}</p>
            <p class="address-phone-text">{{ selectedOrder.address.phone }}</p>
          </div>
        </div>
      </div>

      <div class="details-footer-actions">
        <button type="button" class="btn-outline-teal footer-action-btn">
          <i class="fa-solid fa-arrow-down-to-bracket"></i> Descargar factura
        </button>
        <button type="button" class="btn-outline-teal footer-action-btn">
          <i class="fa-regular fa-comment-dots"></i> Enviar mensaje al proveedor
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.orders-shell {
  display: flex;
  flex-direction: column;
}

.pedidos-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.pedidos-title {
  font-size: 1.8rem;
  color: #083c5a;
  margin-bottom: 0.5rem;
}

.pedidos-subtitle {
  color: #666;
  font-size: 1rem;
}

.search-wrapper-container {
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid #78c8c4;
  border-radius: 30px;
  padding: 0.55rem 1.2rem;
  width: 350px;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #333;
}

.search-dropdown-menu {
  position: absolute;
  top: -2px;
  right: 0;
  width: 370px;
  background: #ffffff;
  border: 1.5px solid #8e9ca8;
  border-radius: 16px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.2rem;
  border-bottom: 1px solid #edf0f2;
}

.dropdown-search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.95rem;
  color: #083c5a;
}

.btn-clear-search {
  background: none;
  border: none;
  color: #ff6a00;
  font-weight: 700;
  cursor: pointer;
}

.search-recent-block,
.search-live-results {
  padding: 0.8rem 1.2rem 1.2rem;
  max-height: 380px;
  overflow-y: auto;
}

.group-period-title,
.results-subheading {
  display: block;
  color: #00a896;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.dropdown-item-row,
.live-result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

.dropdown-item-row:hover,
.live-result-row:hover {
  background-color: #f0f2f5;
}

.item-left-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.bag-icon {
  color: #083c5a;
}

.item-code {
  color: #083c5a;
  font-weight: 700;
}

.item-count-text,
.result-date-text {
  color: #888;
  font-size: 0.85rem;
}

.result-main-text {
  display: flex;
  flex-direction: column;
}

.result-main-text strong {
  color: #083c5a;
  font-size: 0.95rem;
}

.result-main-text span {
  color: #666;
  font-size: 0.8rem;
}

.no-results-msg {
  color: #888;
  font-size: 0.9rem;
  text-align: center;
  padding: 1.5rem 0;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
  gap: 2rem;
}

.tab-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: #888;
  padding: 0.5rem 0;
  cursor: pointer;
  position: relative;
}

.tab-btn.active {
  color: #00a896;
  font-weight: 600;
}

.tab-btn.active::after {
  content: "";
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #00a896;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.order-card {
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-details h4 {
  color: #083c5a;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.order-date {
  color: #999;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.order-total-label {
  color: #666;
  font-size: 0.9rem;
}

.order-amount {
  color: #083c5a;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
}

.order-count {
  color: #999;
  font-size: 0.85rem;
}

.order-provider {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  height: 120px;
}

.provider-info-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.provider-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 5px;
}

.provider-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.provider-name {
  font-weight: 700;
  color: #083c5a;
  margin-bottom: 0.3rem;
}

.provider-link {
  color: #00a896;
  text-decoration: none;
  font-size: 0.9rem;
}

.provider-products {
  display: flex;
  gap: 0.5rem;
}

.product-thumb {
  width: 45px;
  height: 45px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
}

.product-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.more-thumb {
  border-radius: 50%;
  color: #00a896;
  font-weight: 600;
}

.order-status-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-badge {
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.status-badge.received {
  background-color: #d8f1ef;
  color: #20a095;
}

.status-badge.processing {
  background-color: #ffe8d6;
  color: #f39c12;
}

.status-badge.shipped {
  background-color: #92a8d1;
  color: #2c3e50;
}

.status-badge.pending {
  background-color: #eff0f2;
  color: #666;
}

.status-date {
  color: #999;
  font-size: 0.8rem;
  margin-bottom: 1.5rem;
}

.btn-outline-teal {
  background-color: white;
  color: #00a896;
  border: 2px solid #00a896;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
}

/* Order Details View */
.order-details-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-title-group {
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.btn-back-arrow {
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #083c5a;
  cursor: pointer;
}

.details-order-heading {
  font-size: 1.6rem;
  color: #083c5a;
  font-weight: 700;
}

.details-order-subdate {
  color: #666;
  font-size: 0.9rem;
}

.order-summary-card {
  background-color: #f2faf9;
  border: 1.5px solid #a3ded8;
  border-radius: 14px;
  padding: 1.4rem 2rem;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.summary-col {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.summary-col-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #083c5a;
  font-size: 0.85rem;
  font-weight: 600;
}

.summary-val {
  color: #083c5a;
  font-size: 0.95rem;
  font-weight: 700;
}

.details-split-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}

.details-products-box {
  background: #ffffff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  padding: 1.5rem;
}

.box-inner-title {
  font-size: 1.05rem;
  color: #083c5a;
  font-weight: 700;
  margin-bottom: 1rem;
}

.products-table-wrapper {
  overflow-x: auto;
}

.order-products-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.order-products-table th,
.order-products-table td {
  padding: 0.8rem 0.5rem;
  border-bottom: 1px solid #f2f2f2;
}

.order-products-table thead th {
  color: #777;
  font-weight: 500;
  text-align: left;
}

.product-item-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.table-prod-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
}

.table-bottom-total-row {
  background: #e5f5f3;
  border-radius: 8px;
  padding: 0.75rem 1.2rem;
  display: flex;
  justify-content: space-between;
  margin-top: 1.2rem;
  color: #083c5a;
  font-weight: 700;
}

.details-sidebar-boxes {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.side-detail-card {
  background: #ffffff;
  border: 1.5px solid #e0e0e0;
  border-radius: 14px;
  padding: 1.5rem;
  text-align: center;
}

.side-detail-card h4 {
  text-align: left;
  margin-bottom: 1rem;
  color: #083c5a;
}

.side-provider-avatar {
  width: 65px;
  height: 65px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  margin: 0 auto 0.6rem auto;
  overflow: hidden;
  padding: 5px;
}

.side-provider-avatar img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.provider-stars-rating {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-bottom: 1rem;
}

.star-filled {
  color: #ffb400;
}

.star-empty {
  color: #e0e0e0;
}

.btn-side-provider {
  width: 100%;
  padding: 0.5rem;
}

.address-box {
  text-align: left;
}

.address-user-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #083c5a;
  margin-bottom: 0.5rem;
}

.address-line-text,
.address-city-text,
.address-phone-text {
  color: #00a896;
  font-size: 0.85rem;
  margin-bottom: 0.3rem;
}

.details-footer-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
}

.footer-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 1024px) {
  .order-summary-card {
    grid-template-columns: repeat(2, 1fr);
  }
  .details-split-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .pedidos-header {
    flex-direction: column;
    gap: 1rem;
  }
  .search-bar,
  .search-dropdown-menu {
    width: 100%;
  }
  .order-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .order-provider {
    flex-direction: column;
    border-left: none;
    border-right: none;
    border-top: 1px solid #e0e0e0;
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem 0;
    height: auto;
    width: 100%;
    align-items: flex-start;
  }
  .details-footer-actions {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
