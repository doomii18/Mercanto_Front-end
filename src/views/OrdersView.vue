<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { authManager } from "../modules/auth";
import { quoteApi } from "../api";
import type { QuoteAggregateResponse } from "../api/services/quote/types";

// Asset imports for fallback / static display
import echLogo from "../assets/ech-logo.png";
import florLogo from "../assets/flor-de-cana-logo.png";
import dicegsaLogo from "../assets/dicegsa-logo.png";
import product1 from "../assets/product1.png";
import product2 from "../assets/product2.png";
import product3 from "../assets/product3.png";
import product4 from "../assets/product4.png";
import producto5 from "../assets/producto5.png";
import producto6 from "../assets/producto6.png";

const router = useRouter();

// ── Types ──
type OrderTab = "all" | "pending" | "processing" | "received";

interface OrderItemDisplay {
    id: string;
    orderNumber: string;
    createdAt: string;
    totalAmountFormatted: string;
    productCount: number;
    providerName: string;
    providerLogo: string;
    status: "received" | "processing" | "shipped" | "pending";
    statusLabel: string;
    statusDate: string;
    thumbnails: string[];
    extraCount?: number;
}

// ── State ──
const activeTab = ref<OrderTab>("all");
const searchQuery = ref("");
const isLoading = ref(false);
const orders = ref<OrderItemDisplay[]>([
    {
        id: "mc-2026-5",
        orderNumber: "Pedido #MC-2026-5",
        createdAt: "26 de junio de 2026",
        totalAmountFormatted: "C$ 10,400.00",
        productCount: 100,
        providerName: "E. Chamorro S.A",
        providerLogo: echLogo,
        status: "received",
        statusLabel: "Recibido",
        statusDate: "Recibido el 26 de julio de 2026",
        thumbnails: [product1, product2],
        extraCount: 1,
    },
    {
        id: "mc-2026-4",
        orderNumber: "Pedido #MC-2026-4",
        createdAt: "20 de junio de 2026",
        totalAmountFormatted: "C$ 7,000.00",
        productCount: 50,
        providerName: "Ron Flor de Caña",
        providerLogo: florLogo,
        status: "processing",
        statusLabel: "En proceso",
        statusDate: "Estimado el 20 de julio de 2026",
        thumbnails: [product3, product4],
    },
    {
        id: "mc-2026-3",
        orderNumber: "Pedido #MC-2026-3",
        createdAt: "15 de junio de 2026",
        totalAmountFormatted: "C$ 16,950.00",
        productCount: 30,
        providerName: "Dicegsa",
        providerLogo: dicegsaLogo,
        status: "shipped",
        statusLabel: "Enviado",
        statusDate: "Enviado el 15 de julio de 2026",
        thumbnails: [producto5, producto6],
    },
]);

// ── Lifecycle ──
onMounted(async () => {
    try {
        await authManager.requireAuth();
        await loadRemoteQuotes();
    } catch (err) {
        console.error("Orders view authentication or load failure:", err);
    }
});

// ── API Hydration ──
const loadRemoteQuotes = async () => {
    isLoading.value = true;
    try {
        const response = await quoteApi.getMyQuotes({ limit: 50, offset: 0 });
        if (response.data && response.data.length > 0) {
            orders.value = response.data.map(transformQuoteToDisplay);
        }
    } catch {
        // Retains mock demonstration payload when backend returns empty
    } finally {
        isLoading.value = false;
    }
};

const transformQuoteToDisplay = (quoteAgg: QuoteAggregateResponse): OrderItemDisplay => {
    const quote = quoteAgg.quote;
    const items = quoteAgg.items || [];
    const total = items.reduce((acc, it) => acc + (it.unit_price_snapshot * it.quantity), 0);
    const totalQty = items.reduce((acc, it) => acc + it.quantity, 0);

    const statusMapping: Record<string, { status: OrderItemDisplay["status"]; label: string }> = {
        accepted: { status: "received", label: "Recibido" },
        paid: { status: "processing", label: "En proceso" },
        fulfilled: { status: "shipped", label: "Enviado" },
        pending_provider: { status: "pending", label: "Pendiente" },
        draft: { status: "pending", label: "Borrador" },
    };

    const mapped = statusMapping[quote.status] || { status: "pending", label: quote.status };

    return {
        id: quote.id,
        orderNumber: `Pedido #${quote.id.substring(0, 8).toUpperCase()}`,
        createdAt: new Date(quote.updated_at).toLocaleDateString("es-NI", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        totalAmountFormatted: `C$ ${total.toLocaleString("es-NI", { minimumFractionDigits: 2 })}`,
        productCount: totalQty,
        providerName: "Proveedor Mercanto",
        providerLogo: echLogo,
        status: mapped.status,
        statusLabel: mapped.label,
        statusDate: `Actualizado: ${new Date(quote.updated_at).toLocaleDateString("es-NI")}`,
        thumbnails: [product1],
    };
};

// ── Filtering Logic ──
const filteredOrders = computed(() => {
    return orders.value.filter((order) => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            order.providerName.toLowerCase().includes(searchQuery.value.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab.value === "all") return true;
        if (activeTab.value === "pending") return order.status === "pending";
        if (activeTab.value === "processing") return order.status === "processing" || order.status === "shipped";
        if (activeTab.value === "received") return order.status === "received";

        return true;
    });
});

const handleLogout = async () => {
    await authManager.logout();
    router.push({ name: "login" });
};
</script>

<template>
    <div class="orders-layout">
        <!-- Persistent Header -->
        <header class="header">
            <div class="logo">
                <router-link :to="{ name: 'home' }">
                    <img src="../assets/logo.png" alt="Mercanto" class="logo-img" />
                </router-link>
            </div>
        </header>

        <div class="dashboard-container">
            <!-- Sidebar Navigation -->
            <aside class="sidebar">
                <nav class="sidebar-menu">
                    <router-link :to="{ name: 'profile' }" class="menu-item">
                        <i class="fa-regular fa-user"></i> Mi Perfil
                    </router-link>
                    <router-link :to="{ name: 'orders' }" class="menu-item active">
                        <i class="fa-solid fa-bag-shopping"></i> Pedidos
                    </router-link>
                    <a href="#" class="menu-item">
                        <i class="fa-solid fa-cart-shopping"></i> Favoritos
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fa-regular fa-comment-dots"></i> Mensajes
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fa-solid fa-magnifying-glass"></i> Búsqueda Inteligente
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fa-solid fa-gear"></i> Configuración
                    </a>
                    <a href="#" class="menu-item">
                        <i class="fa-regular fa-circle-question"></i> Ayuda
                    </a>
                </nav>
                <button class="logout-btn" @click="handleLogout">
                    <i class="fa-solid fa-arrow-right-from-bracket"></i> Cerrar sesión
                </button>
            </aside>

            <!-- Main Content -->
            <main class="content">
                <div class="pedidos-header">
                    <div>
                        <h2 class="pedidos-title">Mis Pedidos</h2>
                        <p class="pedidos-subtitle">Consulta y monitorea tus pedidos realizados</p>
                    </div>

                    <div class="search-bar">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Busca tu pedido o proveedor"
                        />
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </div>
                </div>

                <!-- Tabs Filter -->
                <div class="tabs">
                    <button
                        :class="['tab-btn', { active: activeTab === 'all' }]"
                        @click="activeTab = 'all'"
                    >
                        Todos
                    </button>
                    <button
                        :class="['tab-btn', { active: activeTab === 'pending' }]"
                        @click="activeTab = 'pending'"
                    >
                        Pendientes
                    </button>
                    <button
                        :class="['tab-btn', { active: activeTab === 'processing' }]"
                        @click="activeTab = 'processing'"
                    >
                        En proceso
                    </button>
                    <button
                        :class="['tab-btn', { active: activeTab === 'received' }]"
                        @click="activeTab = 'received'"
                    >
                        Recibidos
                    </button>
                </div>

                <!-- Empty State -->
                <div v-if="filteredOrders.length === 0" class="empty-orders">
                    <i class="fa-solid fa-box-open"></i>
                    <p>No se encontraron pedidos correspondientes a este criterio.</p>
                </div>

                <!-- Orders List -->
                <div v-else class="orders-list">
                    <div
                        v-for="order in filteredOrders"
                        :key="order.id"
                        class="order-card"
                    >
                        <!-- Order Primary Details -->
                        <div class="order-details">
                            <h4>{{ order.orderNumber }}</h4>
                            <p class="order-date">{{ order.createdAt }}</p>
                            <p class="order-total-label">Total</p>
                            <h3 class="order-amount">{{ order.totalAmountFormatted }}</h3>
                            <p class="order-count">{{ order.productCount }} productos</p>
                        </div>

                        <!-- Provider Info & Thumbnails -->
                        <div class="order-provider">
                            <div class="provider-info-left">
                                <div class="provider-logo">
                                    <img :src="order.providerLogo" :alt="order.providerName" />
                                </div>
                                <div class="provider-name-container">
                                    <p class="provider-name">{{ order.providerName }}</p>
                                    <a href="#" class="provider-link">ver proveedor</a>
                                </div>
                            </div>
                            <div class="provider-products">
                                <div
                                    v-for="(thumb, idx) in order.thumbnails"
                                    :key="idx"
                                    class="product-thumb"
                                >
                                    <img :src="thumb" alt="Miniatura de producto" />
                                </div>
                                <div v-if="order.extraCount" class="product-thumb more-thumb">
                                    +{{ order.extraCount }}
                                </div>
                            </div>
                        </div>

                        <!-- Status & Quick Action -->
                        <div class="order-status-action">
                            <div :class="['status-badge', order.status]">
                                <i
                                    :class="
                                        order.status === 'received'
                                            ? 'fa-solid fa-check'
                                            : order.status === 'processing'
                                            ? 'fa-regular fa-clock'
                                            : order.status === 'shipped'
                                            ? 'fa-solid fa-truck'
                                            : 'fa-solid fa-hourglass-start'
                                    "
                                ></i>
                                <span>{{ order.statusLabel }}</span>
                            </div>
                            <p class="status-date">{{ order.statusDate }}</p>
                            <button type="button" class="btn-outline-teal">
                                Ver detalles
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>

<style scoped>
.orders-layout {
    min-height: 100vh;
    background-color: #ffffff;
    color: var(--primary-blue);
}

.header {
    background-color: var(--bg-gray);
    padding: 1rem 2.5rem;
    border-bottom: 1px solid var(--border-gray);
    display: flex;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 70px;
    z-index: 100;
}

.logo-img {
    height: 40px;
    display: block;
}

.dashboard-container {
    display: flex;
    min-height: calc(100vh - 70px);
    margin-top: 70px;
}

/* ── Sidebar ── */
.sidebar {
    width: 260px;
    background-color: var(--bg-gray);
    padding: 1.5rem 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-right: 1px solid var(--border-gray);
    position: fixed;
    top: 70px;
    bottom: 0;
    left: 0;
    z-index: 90;
}

.sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 1rem;
}

.menu-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 1.25rem;
    text-decoration: none;
    color: var(--primary-blue);
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: 12px;
    transition: background-color 0.2s ease;
}

.menu-item i {
    font-size: 1.15rem;
    width: 22px;
    text-align: center;
}

.menu-item:hover,
.menu-item.active {
    background-color: #e2e8f0;
}

.logout-btn {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem 2rem;
    color: var(--primary-blue);
    font-weight: 600;
    font-size: 0.95rem;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    margin-top: auto;
}

/* ── Main Content Area ── */
.content {
    flex: 1;
    padding: 2.5rem 3rem;
    margin-left: 260px;
    display: flex;
    flex-direction: column;
}

/* ── Header Bar ── */
.pedidos-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1.5rem;
}

.pedidos-title {
    font-size: 1.75rem;
    color: var(--primary-blue);
    margin-bottom: 0.25rem;
}

.pedidos-subtitle {
    color: #64748b;
    font-size: 0.95rem;
}

.search-bar {
    display: flex;
    align-items: center;
    background: #ffffff;
    border: 1.5px solid var(--border-gray);
    border-radius: 30px;
    padding: 0.5rem 1.25rem;
    width: 340px;
    transition: border-color 0.2s ease;
}

.search-bar:focus-within {
    border-color: var(--light-teal);
}

.search-bar input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.92rem;
    color: var(--text-dark);
}

.search-bar i {
    color: #94a3b8;
    font-size: 1rem;
}

/* ── Tabs Navigation ── */
.tabs {
    display: flex;
    border-bottom: 1px solid var(--border-gray);
    margin-bottom: 2rem;
    gap: 2rem;
}

.tab-btn {
    background: none;
    border: none;
    font-size: 0.95rem;
    color: #64748b;
    padding: 0.6rem 0.2rem;
    cursor: pointer;
    font-weight: 500;
    position: relative;
    transition: color 0.2s ease;
}

.tab-btn.active {
    color: var(--light-teal);
    font-weight: 700;
}

.tab-btn.active::after {
    content: "";
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: var(--light-teal);
    border-radius: 3px 3px 0 0;
}

/* ── Empty State ── */
.empty-orders {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #94a3b8;
    gap: 1rem;
}

.empty-orders i {
    font-size: 3rem;
}

.empty-orders p {
    font-size: 0.95rem;
}

/* ── Orders List ── */
.orders-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.order-card {
    background-color: #ffffff;
    border: 1.5px solid var(--border-gray);
    border-radius: 16px;
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.order-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

/* ── Order Left Metadata ── */
.order-details {
    flex: 1;
}

.order-details h4 {
    color: var(--primary-blue);
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.order-date {
    color: #94a3b8;
    font-size: 0.85rem;
    margin-bottom: 0.85rem;
}

.order-total-label {
    color: #64748b;
    font-size: 0.85rem;
    margin-bottom: 0.1rem;
}

.order-amount {
    color: var(--primary-blue);
    font-size: 1.25rem;
    font-family: "Inter", sans-serif;
    font-weight: 700;
    margin-bottom: 0.35rem;
}

.order-count {
    color: #94a3b8;
    font-size: 0.82rem;
}

/* ── Order Provider Middle Segment ── */
.order-provider {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    border-left: 1px solid var(--border-gray);
    border-right: 1px solid var(--border-gray);
    height: 110px;
}

.provider-info-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.provider-logo {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 1px solid var(--border-gray);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 4px;
    background: #ffffff;
}

.provider-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.provider-name {
    font-weight: 700;
    color: var(--primary-blue);
    margin-bottom: 0.2rem;
    font-size: 0.95rem;
}

.provider-link {
    color: var(--light-teal);
    text-decoration: none;
    font-size: 0.85rem;
    font-weight: 600;
}

.provider-products {
    display: flex;
    gap: 0.5rem;
}

.product-thumb {
    width: 44px;
    height: 44px;
    border: 1px solid var(--border-gray);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 3px;
    background: #ffffff;
}

.product-thumb img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.more-thumb {
    border-radius: 50%;
    color: var(--light-teal);
    font-weight: 700;
    font-size: 0.85rem;
    background: #e6f7f5;
    border-color: #c4ece7;
}

/* ── Status and Action Right Segment ── */
.order-status-action {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.status-badge {
    padding: 0.4rem 1.25rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.88rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}

.status-badge.received {
    background-color: #d8f1ef;
    color: var(--light-teal);
}

.status-badge.processing {
    background-color: #ffe8d6;
    color: var(--primary-orange);
}

.status-badge.shipped {
    background-color: #e0e7ff;
    color: #4338ca;
}

.status-badge.pending {
    background-color: #f1f5f9;
    color: #64748b;
}

.status-date {
    color: #94a3b8;
    font-size: 0.8rem;
    margin-bottom: 1rem;
    text-align: center;
}

.btn-outline-teal {
    background-color: #ffffff;
    color: var(--light-teal);
    border: 1.5px solid var(--light-teal);
    padding: 0.45rem 1.4rem;
    border-radius: 20px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-outline-teal:hover {
    background-color: var(--light-teal);
    color: #ffffff;
}

/* ── Responsive Queries ── */
@media (max-width: 1024px) {
    .sidebar {
        width: 220px;
    }
    .content {
        margin-left: 220px;
        padding: 2rem 1.5rem;
    }
    .order-card {
        padding: 1.25rem 1.5rem;
        gap: 1rem;
    }
    .order-provider {
        padding: 0 1rem;
    }
    .search-bar {
        width: 260px;
    }
}

@media (max-width: 768px) {
    .sidebar {
        display: none;
    }
    .content {
        margin-left: 0;
        padding: 1.5rem 1rem;
    }
    .pedidos-header {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
    .search-bar {
        width: 100%;
    }
    .order-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 1.25rem;
    }
    .order-provider {
        flex-direction: column;
        border-left: none;
        border-right: none;
        border-top: 1px solid var(--border-gray);
        border-bottom: 1px solid var(--border-gray);
        padding: 1rem 0;
        height: auto;
        width: 100%;
        align-items: flex-start;
        gap: 1rem;
    }
    .order-status-action {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    .status-date {
        margin-bottom: 0;
    }
    .tabs {
        gap: 1.25rem;
        overflow-x: auto;
        white-space: nowrap;
    }
}

@media (max-width: 480px) {
    .order-status-action {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
    }
}
</style>
