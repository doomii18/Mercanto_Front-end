<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { productApi, organizationApi, cartApi } from "../api";
import { useAuthStore } from "../modules/auth";
import { useGeoStore } from "../stores/geo";
import ProductImage from "../components/product/ProductImage.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";
import ProductReviewsSection from "@/components/product/ProductReviewsSection.vue";


interface ShippingMethodOption {
    id: string;
    name: string;
    icon: string;
    cost: number;
}

interface ProductDetailData {
    id: string;
    title: string;
    category: string;
    price: number;
    minOrder: number;
    rating: number;
    reviewCount: number;
    providerRating: number;
    provider: {
        id?: string;
        name: string;
        initial: string;
        location: string;
        verified: boolean;
        logoBlobId?: string | null;
    };
    imageBlobId?: string | null;
    description: string;
    shippingMethods: ShippingMethodOption[];
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const geoStore = useGeoStore();

const showAddedToast = ref(false);
const isLoading = ref(true);

const selectedShippingMethod = ref("bus");
const quantity = ref(1);

const product = ref<ProductDetailData>({
    id: "",
    title: "",
    category: "",
    price: 0,
    minOrder: 1,
    rating: 0,
    reviewCount: 0,
    providerRating: 0,
    provider: {
        name: "",
        initial: "-",
        location: "",
        verified: false,
    },
    imageBlobId: null,
    description: "",
    shippingMethods: [],
});

function resolveLocationText(municipalityId?: string): string {
    if (!municipalityId) return "Managua, Nicaragua";
    const hierarchy = geoStore.resolveLocationHierarchy(municipalityId);
    if (!hierarchy) return "Managua, Nicaragua";
    return hierarchy.department
        ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
        : hierarchy.municipality.name;
}

function resolveShippingMethods(
    methods?: string[],
): ShippingMethodOption[] {
    const result: ShippingMethodOption[] = [];
    const hasBus = methods?.includes("bus") ?? true;
    const hasOwn = methods?.includes("own_delivery") ?? false;

    if (hasBus) {
        result.push({
            id: "bus",
            name: "Bus Interlocal",
            icon: "fa-solid fa-bus",
            cost: 150,
        });
    }

    if (hasOwn) {
        result.push({
            id: "own_delivery",
            name: "Entrega Propia",
            icon: "fa-solid fa-truck",
            cost: 180,
        });
    }

    result.push({
        id: "courier",
        name: "Empresas de paquetería",
        icon: "fa-solid fa-truck-fast",
        cost: 200,
    });

    return result;
}

async function loadProduct(id: string) {
    isLoading.value = true;

    try {
        const [prodRes] = await Promise.all([
            productApi.getProduct(id).catch((apiErr) => {
                console.warn("Backend getProduct request failed:", apiErr);
                return null;
            }),
            geoStore.initialize().catch((geoErr) => {
                console.warn("Geo initialization failed during product load:", geoErr);
            }),
        ]);

        if (prodRes) {
            let providerName = "Proveedor aliado";
            let providerInitial = "P";
            let providerLocation = "Managua, Nicaragua";
            let providerVerified = false;
            let providerRating = 0;
            let logoBlobId: string | null = null;

            try {
                const org = await organizationApi.getPublicProvider(prodRes.provider_id);
                providerName = org.company_name;
                providerInitial = org.company_name.charAt(0).toUpperCase();
                providerLocation = resolveLocationText(org.municipality_id);
                providerRating = org.rating?.average_score || 0;
                logoBlobId = org.logo_blob_id ?? null;
            } catch (orgErr) {
                console.warn("Could not fetch provider metadata:", orgErr);
            }

            const mappedShipping = resolveShippingMethods(prodRes.shipping_methods);

            let minOrder = 1;
            if ("Physical" in prodRes.spec && prodRes.spec.Physical?.min_order_quantity) {
                minOrder = prodRes.spec.Physical.min_order_quantity;
            }

            product.value = {
                id: prodRes.id,
                title: prodRes.title,
                category: prodRes.category?.name || "General",
                price: prodRes.base_price,
                minOrder,
                rating: prodRes.rating?.average_score || 0,
                reviewCount: prodRes.rating?.review_count || 0,
                providerRating,
                provider: {
                    id: prodRes.provider_id,
                    name: providerName,
                    initial: providerInitial,
                    location: providerLocation,
                    verified: providerVerified,
                    logoBlobId,
                },
                imageBlobId: prodRes.image_blob_ids?.[0] ?? null,
                description: prodRes.description || "Producto de alta calidad disponible para compra al por mayor.",
                shippingMethods: mappedShipping,
            };
        } else {
            product.value = {
                id,
                title: "Producto no encontrado",
                category: "General",
                price: 0,
                minOrder: 1,
                rating: 0,
                reviewCount: 0,
                providerRating: 0,
                provider: { name: "Desconocido", initial: "D", location: "N/A", verified: false },
                imageBlobId: null,
                description: "No se pudo cargar la información del producto.",
                shippingMethods: [],
            };
        }
    } catch (err) {
        console.error("Critical failure during product loading:", err);
        product.value = {
            id,
            title: "Error de carga",
            category: "General",
            price: 0,
            minOrder: 1,
            rating: 0,
            reviewCount: 0,
            providerRating: 0,
            provider: { name: "Error", initial: "E", location: "N/A", verified: false },
            imageBlobId: null,
            description: "Ocurrió un error al cargar el producto.",
            shippingMethods: [],
        };
    } finally {
        quantity.value = product.value.minOrder > 0 ? product.value.minOrder : 1;
        if (product.value.shippingMethods.length > 0) {
            selectedShippingMethod.value = product.value.shippingMethods[0].id;
        }
        isLoading.value = false;
    }
}

watch(
    () => route.params.id,
    (newId) => {
        if (newId) {
            loadProduct(newId as string);
        }
    },
    { immediate: true },
);

onMounted(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});

const selectedShipping = computed(() => {
    if (!product.value.shippingMethods || product.value.shippingMethods.length === 0) {
        return { id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 0 };
    }
    return (
        product.value.shippingMethods.find((m) => m.id === selectedShippingMethod.value) ||
        product.value.shippingMethods[0]
    );
});

const subtotal = computed(() => product.value.price * quantity.value);
const shippingCost = computed(() => selectedShipping.value?.cost || 0);
const total = computed(() => subtotal.value + shippingCost.value);

const formatPrice = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return val.toLocaleString("es-NI");
};

const increaseQuantity = () => {
    quantity.value += 1;
};

const decreaseQuantity = () => {
    const min = product.value.minOrder > 0 ? product.value.minOrder : 1;
    if (quantity.value > min) {
        quantity.value -= 1;
    }
};

const handleAddToCart = async () => {
    if (product.value.id && authStore.isAuthenticated) {
        try {
            await cartApi.updateMyCartProductQuantity(product.value.id, {
                quantity_delta: quantity.value,
            });
        } catch (err) {
            console.warn("Backend cart update failed:", err);
        }
    }
    showAddedToast.value = true;
    setTimeout(() => {
        showAddedToast.value = false;
    }, 3000);
};

const navigateToCategory = () => {
    router.push({ name: "category" });
};
</script>

<template>
    <div class="product-detail-page">
        <main class="container main-content">
            <nav class="breadcrumbs-nav" aria-label="Breadcrumb">
                <router-link :to="{ name: 'home' }">Inicio</router-link>
                <span class="separator">></span>
                <router-link :to="{ name: 'category' }">Categorías</router-link>
                <span class="separator">></span>
                <a href="#" @click.prevent="navigateToCategory">{{
                    product.category || "Categoría"
                }}</a>
                <span class="separator">></span>
                <span class="current-crumb">{{
                    product.title || "Producto"
                }}</span>
            </nav>
            <section v-if="isLoading" class="skeleton-grid-loader">
                <div class="skeleton-box skeleton-left skeleton-pulse"></div>
                <div class="skeleton-box skeleton-right skeleton-pulse"></div>
            </section>
            <template v-else>
                <section class="product-top-grid">
                    <div class="product-gallery-card">
                        <div class="product-image-container">
                            <ProductImage
                                :blob-id="product.imageBlobId"
                                :alt="product.title"
                            />
                        </div>
                    </div>
                    <div class="product-summary-card">
                        <div class="summary-top-row">
                            <span class="category-tag-italic">{{
                                product.category || "General"
                            }}</span>
                        </div>
                        <h1 class="product-main-title">{{ product.title }}</h1>
                        <div class="provider-pill-row">
                            <div class="provider-avatar-circle">
                                <ProviderLogo
                                    :blob-id="product.provider.logoBlobId"
                                    :alt="product.provider.name"
                                    class="rounded-full"
                                />
                            </div>
                            <span class="provider-title-text">{{
                                product.provider.name
                            }}</span>
                            <i
                                v-if="product.provider.verified"
                                class="fa-solid fa-circle-check verified-badge-icon"
                            ></i>
                        </div>
                        <div class="product-price-row">
                            <span class="currency-price">
                                C$ {{ formatPrice(product.price) }}
                            </span>
                        </div>
                        <div class="min-order-row">
                            <strong>Pedido mínimo:</strong>
                            {{ product.minOrder }} unidad{{
                                product.minOrder > 1 ? "es" : ""
                            }}
                        </div>

                        <div class="rating-stars-row">
                            <template v-if="product.reviewCount > 0">
                                <i class="fa-solid fa-star star-orange-outline"></i>
                                <span class="rating-number">{{ product.rating.toFixed(1) }}</span>
                                <span class="review-count">({{ product.reviewCount }} valoraciones)</span>
                            </template>
                            <template v-else>
                                <span class="review-count" style="margin-left: 0;">Sin valoraciones aún</span>
                            </template>
                        </div>

                        <div class="specs-list">
                            <p class="spec-line">
                                <strong>Descripción:</strong>
                                {{ product.description }}
                            </p>
                        </div>
                        <div class="shipping-options-section">
                            <p class="section-label">
                                Tipo de envío disponible:
                            </p>
                            <div class="shipping-methods-row">
                                <div
                                    v-for="method in product.shippingMethods"
                                    :key="method.id"
                                    :class="[
                                        'shipping-method-item',
                                        {
                                            active:
                                                selectedShippingMethod ===
                                                method.id,
                                        },
                                    ]"
                                    @click="selectedShippingMethod = method.id"
                                >
                                    <i :class="method.icon"></i>
                                    <span>{{ method.name }}</span>
                                </div>
                            </div>
                            <p class="shipping-disclaimer">*Costos de envío estimados, calculados al finalizar la compra.</p>
                        </div>
                    </div>
                </section>
                <section class="product-bottom-grid">
                    <div class="card-provider-box">
                        <h3 class="box-heading">Tu proveedor</h3>
                        <div class="provider-profile-summary">
                            <div class="h-10 w-10 overflow-hidden rounded-full bg-blue-400">
                                <ProviderLogo
                                    :blob-id="product.provider.logoBlobId"
                                    :alt="product.provider.name"
                                />
                            </div>
                            <div class="provider-name-wrapper">
                                <span class="provider-name-bold">{{
                                    product.provider.name
                                }}</span>
                                <i
                                    v-if="product.provider.verified"
                                    class="fa-solid fa-circle-check verified-badge-icon"
                                ></i>
                            </div>
                        </div>

                        <div class="provider-rating-score">
                            <template v-if="product.providerRating > 0">
                                <i class="fa-solid fa-star star-orange-outline"></i>
                                <span class="score-number">{{ product.providerRating.toFixed(1) }}</span>
                            </template>
                            <template v-else>
                                <span class="score-number" style="font-size: 0.95rem; color: #718096;">Sin calificación</span>
                            </template>
                        </div>

                        <p class="provider-location-text">
                            {{ product.provider.location }}
                        </p>
                        <router-link
                            v-if="product.provider.id"
                            :to="{
                                name: 'category',
                                query: { provider_id: product.provider.id },
                            }"
                            class="btn-orange-pill btn-catalog"
                        >
                            Ver catálogo
                        </router-link>
                        <button
                            v-else
                            type="button"
                            class="btn-orange-pill btn-catalog"
                            @click="navigateToCategory"
                        >
                            Ver catálogo
                        </button>
                        <hr class="card-divider" />
                        <div class="cart-summary-footer">
                            <div class="cart-left-info">
                                <i
                                    class="fa-solid fa-box-open box-cart-icon"
                                ></i>
                                <span class="cart-items-count"
                                    >Productos al por mayor garantizados</span
                                >
                            </div>
                            <router-link
                                :to="{ name: 'orders' }"
                                class="btn-view-order-link"
                            >
                                Ver pedidos >
                            </router-link>
                        </div>
                    </div>
                    <div class="card-quantity-box">
                        <h3 class="box-heading">Elige la cantidad</h3>
                        <div class="stepper-row">
                            <div class="stepper-controls">
                                <button
                                    type="button"
                                    class="btn-stepper minus"
                                    :disabled="
                                        quantity <=
                                        (product.minOrder > 0
                                            ? product.minOrder
                                            : 1)
                                    "
                                    aria-label="Disminuir cantidad"
                                    @click="decreaseQuantity"
                                >
                                    <i class="fa-solid fa-minus"></i>
                                </button>
                                <span class="stepper-value">{{
                                    quantity
                                }}</span>
                                <button
                                    type="button"
                                    class="btn-stepper plus"
                                    aria-label="Aumentar cantidad"
                                    @click="increaseQuantity"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                            <span class="unit-label">unidades</span>
                            <span class="badge-min-order"
                                >Mín. {{ product.minOrder }} und</span
                            >
                        </div>
                        <div class="price-breakdown-table">
                            <div class="breakdown-row">
                                <span class="row-label">Precio unitario:</span>
                                <span class="row-value"
                                    >C$ {{ formatPrice(product.price) }}</span
                                >
                            </div>
                            <div class="breakdown-row">
                                <span class="row-label">Cantidad:</span>
                                <span class="row-value"
                                    >{{ quantity }} und</span
                                >
                            </div>
                            <hr class="breakdown-divider light" />
                            <div class="breakdown-row">
                                <span class="row-label">Tipo de envío:</span>
                                <span class="row-value">{{
                                    selectedShipping.name
                                }}</span>
                            </div>
                            <div class="breakdown-row">
                                <span class="row-label">Subtotal:</span>
                                <span class="row-value"
                                    >C$ {{ formatPrice(subtotal) }}</span
                                >
                            </div>
                            <div class="breakdown-row">
                                <span class="row-label">Envío estimado:</span>
                                <span class="row-value">
                                    {{
                                        shippingCost > 0
                                            ? `C$ ${formatPrice(shippingCost)}`
                                            : "C$ 0"
                                    }}
                                </span>
                            </div>
                            <hr class="breakdown-divider strong" />
                            <div class="breakdown-row total-row">
                                <span class="total-label">Total estimado:</span>
                                <span class="total-value"
                                    >C$ {{ formatPrice(total) }}</span
                                >
                            </div>
                        </div>
                        <button
                            type="button"
                            class="btn-orange-pill btn-add-to-cart"
                            :disabled="product.price <= 0"
                            @click="handleAddToCart"
                        >
                            Agregar al pedido
                        </button>
                    </div>
                </section>
                <ProductReviewsSection :product-id="product.id" />
            </template>
        </main>
        <transition name="toast-fade">
            <div v-if="showAddedToast" class="toast-notification">
                <i class="fa-solid fa-circle-check"></i>
                <span
                    >¡{{ product.title }} ({{ quantity }} unds) agregado a tu
                    pedido!</span
                >
            </div>
        </transition>
    </div>
</template>

<style scoped>
.product-detail-page {
    min-height: 100vh;
    background-color: #ffffff;
    color: var(--text-dark, #1e293b);
    display: flex;
    flex-direction: column;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1.5rem;
    width: 100%;
}

.main-content {
    padding-top: 1.5rem;
    padding-bottom: 4rem;
    flex: 1;
}

.breadcrumbs-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.88rem;
    color: #718096;
    margin-bottom: 2rem;
}

.breadcrumbs-nav a {
    color: #718096;
    text-decoration: none;
    transition: color 0.2s ease;
}

.breadcrumbs-nav a:hover {
    color: var(--primary-orange, #ff6a00);
}

.separator {
    color: #a0aec0;
    font-weight: 500;
}

.current-crumb {
    color: #718096;
    font-weight: 600;
}

.product-top-grid {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 2.5rem;
    align-items: stretch;
    margin-bottom: 2.5rem;
}

.product-gallery-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 1.5rem 1rem;
}

.product-image-container {
    width: 100%;
    max-width: 500px;
    aspect-ratio: 1 / 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background-color: #f8fafc;
    overflow: hidden;
}

.product-image-container :deep(.product-image-wrapper) {
    width: 100%;
    height: 100%;
    background-color: transparent;
}

.product-summary-card {
    background-color: #f1f4f8;
    border-radius: 24px;
    padding: 2.2rem 2.5rem;
    display: flex;
    flex-direction: column;
    position: relative;
}

.summary-top-row {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    position: absolute;
    top: 1.8rem;
    right: 2rem;
    gap: 0.25rem;
}

.category-tag-italic {
    font-size: 0.85rem;
    color: #718096;
    font-style: italic;
    margin-top: 0.2rem;
}

.product-main-title {
    font-family: "Lora", serif;
    font-size: 1.95rem;
    font-weight: 700;
    color: var(--primary-blue, #083c5a);
    margin-bottom: 0.8rem;
    max-width: 75%;
}

.provider-pill-row {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
}

.provider-avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.95rem;
    overflow: hidden;
}

.provider-avatar-circle.large {
    width: 48px;
    height: 48px;
    font-size: 1.4rem;
}

.provider-avatar-circle :deep(.provider-logo-wrapper) {
    width: 100%;
    height: 100%;
}

.provider-title-text {
    color: var(--primary-blue, #083c5a);
    font-weight: 600;
    font-size: 0.95rem;
}

.verified-badge-icon {
    color: #0284c7;
    font-size: 1.05rem;
}

.product-price-row {
    margin-bottom: 0.6rem;
}

.currency-price {
    font-family: "Lora", serif;
    color: var(--primary-orange, #ff6a00);
    font-size: 1.75rem;
    font-weight: 700;
}

.min-order-row {
    font-size: 0.95rem;
    color: #2d3748;
    margin-bottom: 0.8rem;
}

.rating-stars-row {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.95rem;
    color: #2d3748;
    font-weight: 600;
    margin-bottom: 1.2rem;
}

.star-orange-outline {
    color: var(--primary-orange, #ff6a00);
    font-size: 1.15rem;
}

.review-count {
    font-size: 0.8rem;
    color: #718096;
    font-weight: 400;
    margin-left: 0.2rem;
}

.specs-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.2rem;
}

.spec-line {
    font-size: 0.9rem;
    line-height: 1.45;
    color: #2d3748;
}

.shipping-options-section {
    margin-bottom: 1.2rem;
}

.shipping-methods-row {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.shipping-method-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0.35rem 0.6rem;
    border-radius: 8px;
    color: var(--primary-blue, #083c5a);
}

.shipping-method-item.active {
    background-color: rgba(24, 156, 148, 0.12);
    color: var(--light-teal, #189c94);
}

.shipping-disclaimer {
    font-size: 0.75rem;
    color: #94a3b8;
    font-style: italic;
    margin-top: 0.5rem;
}

.product-bottom-grid {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 2.5rem;
    align-items: stretch;
}

.card-provider-box,
.card-quantity-box {
    background-color: #f1f4f8;
    border-radius: 24px;
    padding: 2.2rem 2.5rem;
    display: flex;
    flex-direction: column;
}

.box-heading {
    font-family: "Lora", serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--primary-blue, #083c5a);
    margin-bottom: 1.25rem;
}

.provider-profile-summary {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin-bottom: 0.8rem;
}

.provider-name-wrapper {
    display: flex;
    align-items: center;
    gap: 0.4rem;
}

.provider-name-bold {
    font-weight: 700;
    color: var(--primary-blue, #083c5a);
    font-size: 1.05rem;
}

.provider-rating-score {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
}

.score-number {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary-blue, #083c5a);
}

.provider-location-text {
    font-size: 0.88rem;
    color: #718096;
    margin-bottom: 1.2rem;
}

.btn-orange-pill {
    background: linear-gradient(180deg, #ff7a18 0%, #ff5500 100%);
    color: #ffffff;
    border: none;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: transform 0.2s ease;
}

.btn-orange-pill:hover:not(:disabled) {
    transform: translateY(-2px);
}

.btn-catalog {
    width: 170px;
    padding: 0.65rem 1.4rem;
    border-radius: 20px;
    font-size: 0.92rem;
    margin-bottom: 1.5rem;
}

.card-divider {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 0.5rem 0 1.25rem;
}

.cart-summary-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-top: auto;
}

.cart-left-info {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.box-cart-icon {
    color: var(--light-teal, #189c94);
    font-size: 1.35rem;
}

.cart-items-count {
    font-size: 0.85rem;
    color: #2d3748;
}

.btn-view-order-link {
    border: 1.5px solid var(--light-teal, #189c94);
    color: var(--light-teal, #189c94);
    text-decoration: none;
    font-size: 0.82rem;
    font-weight: 600;
    padding: 0.35rem 0.85rem;
    border-radius: 6px;
}

.stepper-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
}

.stepper-controls {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.btn-stepper {
    width: 24px;
    height: 24px;
    background-color: #64748b;
    color: #ffffff;
    border: none;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.btn-stepper:disabled {
    background-color: #cbd5e1;
    cursor: not-allowed;
}

.stepper-value {
    color: var(--light-teal, #189c94);
    font-weight: 700;
    font-size: 1.15rem;
    min-width: 28px;
    text-align: center;
}

.unit-label {
    color: #4a5568;
    font-size: 0.9rem;
}

.badge-min-order {
    background-color: #d8f1ef;
    color: var(--light-teal, #189c94);
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.2rem 0.65rem;
    border-radius: 12px;
}

.price-breakdown-table {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.75rem;
}

.breakdown-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
}

.breakdown-divider.light {
    border: none;
    border-top: 1px solid #cbd5e1;
    margin: 0.4rem 0;
}

.breakdown-divider.strong {
    border: none;
    border-top: 1.5px solid #64748b;
    margin: 0.5rem 0;
}

.total-value {
    font-weight: 700;
    color: #1a202c;
    font-size: 1.15rem;
}

.btn-add-to-cart {
    width: 100%;
    padding: 0.9rem;
    border-radius: 26px;
    font-size: 1.05rem;
}

.toast-notification {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background-color: var(--primary-blue, #083c5a);
    color: #ffffff;
    padding: 1rem 1.6rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
    z-index: 1000;
    font-weight: 600;
    border-left: 5px solid var(--primary-orange, #ff6a00);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
    transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

.skeleton-grid-loader {
    display: grid;
    grid-template-columns: 1fr 1.35fr;
    gap: 2.5rem;
    min-height: 450px;
    margin-bottom: 2.5rem;
}

.skeleton-box {
    background: #edf2f7;
    border-radius: 24px;
}

.skeleton-pulse {
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
    0% {
        background-position: 200% 0;
    }
    100% {
        background-position: -200% 0;
    }
}

@media (max-width: 992px) {
    .product-top-grid,
    .product-bottom-grid,
    .skeleton-grid-loader {
        grid-template-columns: 1fr;
    }
}
</style>
