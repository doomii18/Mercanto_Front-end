<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useOfferApi } from "@/api/modules/catalog/offer/useOfferApi";

import { useGeoStore } from "@/stores/geo";
import { useQuoteBuilderStore, useFavoritesStore, useCategoryStore } from "@/stores/commerce";
import { useAuthStore } from "@/stores/auth";
import { useToastStore, useAuthPromptStore } from "@/stores/ui";
import ProductImageCarousel from "@/components/product/ProductImageCarousel.vue";
import ProviderLogo from "@/components/organization/ProviderLogo.vue";
import ProductReviewsSection from "@/components/product/ProductReviewsSection.vue";
import QuoteDraftSection from "@/components/quote/QuoteDraftSection.vue";
import MockProductColorPicker from "@/components/mock/MockProductColorPicker.vue";
import ShippingMethodSelector from "@/components/product/ShippingMethodSelector.vue";
import RelatedProductsSection from "@/components/product/RelatedProductsSection.vue";
import type { ProductOfferResponse, ShippingMethod } from "@/api";
import { useOrganizationApi } from "@/api/modules/organization/organization/useOrganizationApi";
import { useReviewApi } from "@/api/modules/commerce/review/useReviewApi";

interface ProductDetailData {
    id: string;
    title: string;
    category: string;
    price: number;
    minOrder: number;
    rating: number;
    reviewCount: number;
    providerRating: number;
    category_id: string;
    provider: {
        id?: string;
        name: string;
        initial: string;
        location: string;
        verified: boolean;
        logoBlobId?: string | null;
    };
    imageBlobId?: string | null;
    imageBlobIds?: string[];
    description: string;
    shippingMethods: string[];
}

const route = useRoute();
const router = useRouter();
const organizationApi = useOrganizationApi();
const productApi = useProductApi();
const categoryStore = useCategoryStore();
const offerApi = useOfferApi();
const reviewApi = useReviewApi();
const geoStore = useGeoStore();
const quoteBuilderStore = useQuoteBuilderStore();
const toastStore = useToastStore();
const authPromptStore = useAuthPromptStore();
const favoritesStore = useFavoritesStore();
const authStore = useAuthStore();

const isFavorite = computed(() => (product.value.id ? favoritesStore.isFavorite(product.value.id) : false));

function handleFavoriteClick() {
  if (!product.value.id) return;
  favoritesStore.toggleFavorite(product.value.id, {
    router,
    redirectPath: route.fullPath,
  });
}

const isLoading = ref(true);
const selectedColor = ref<string>("");
const quantity = ref(1);
const currentOffer = ref<ProductOfferResponse | null>(null);

const product = ref<ProductDetailData>({
    id: "",
    title: "",
  category: "",
    category_id: "",
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

const providerId = computed(() => product.value.provider.id ?? "");

function resolveLocationText(municipalityId?: string): string {
    if (!municipalityId) return "";
    const hierarchy = geoStore.resolveLocationHierarchy(municipalityId);
    if (!hierarchy) return "";
    return hierarchy.department
        ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
        : hierarchy.municipality.name;
}

const selectedShippingMethod = ref<ShippingMethod>("bus");
const selectedShippingMethodName = computed(() => {
    if (selectedShippingMethod.value === "own_delivery") return "Entrega Propia / Paquetería";
    if (selectedShippingMethod.value === "bus") return "Bus Interlocal";
    return "Por definir";
});

async function loadProduct(id: string) {
    isLoading.value = true;
    try {
        const [prodRes, shippingRes] = await Promise.all([
            productApi.getProduct(id).catch(() => null),
            productApi.getProductShipping(id).catch(() => [] as ShippingMethod[]),
            geoStore.initialize().catch(() => {}),
        ]);

        if (prodRes) {
            let providerName = "Proveedor aliado";
            let providerInitial = "P";
            let providerLocation = "";
            let providerRating = 0;
            let logoBlobId: string | null = null;

            try {
                const org = await organizationApi.getPublicProvider(prodRes.provider_id);
                providerName = org.company_name;
                providerInitial = org.company_name.charAt(0).toUpperCase();
                providerLocation = resolveLocationText(org.municipality_id);
                logoBlobId = org.logo_blob_id ?? null;
                try {
                    const provMetric = await reviewApi.getProviderMetrics(prodRes.provider_id);
                    providerRating = provMetric.rating_score;
                } catch {
                    providerRating = org.rating?.average_score || 0;
                }
            } catch (orgErr) {
                console.warn("Could not fetch provider metadata:", orgErr);
            }

            let productRating = prodRes.rating?.average_score || 0;
            let productReviewCount = prodRes.rating?.review_count || 0;
            try {
                const prodMetric = await reviewApi.getProductMetrics(prodRes.id);
                productRating = prodMetric.rating_score;
                productReviewCount = prodMetric.review_count;
            } catch (metricErr) {
                console.warn("Could not fetch product metrics:", metricErr);
            }

            let minOrder = 1;
            if ("Physical" in prodRes.spec && prodRes.spec.Physical?.min_order_quantity) {
                minOrder = prodRes.spec.Physical.min_order_quantity;
            }

            const categoryId = prodRes.category_id || (prodRes as any).category?.id || "";
            let categoryName = (prodRes as any).category?.name || "General";

            if (categoryId) {
                await categoryStore.fetchCategories().catch(console.warn);
                categoryName = categoryStore.getCategoryName(categoryId, categoryName);
            }

            const availableShipping = (shippingRes && shippingRes.length > 0)
                ? shippingRes
                : (prodRes.shipping_methods && prodRes.shipping_methods.length > 0)
                    ? prodRes.shipping_methods
                    : [];

            product.value = {
                id: prodRes.id,
                title: prodRes.title,
                category: categoryName,
                category_id: categoryId,
                price: prodRes.base_price,
                minOrder,
                rating: productRating,
                reviewCount: productReviewCount,
                providerRating,

                provider: {
                    id: prodRes.provider_id,
                    name: providerName,
                    initial: providerInitial,
                    location: providerLocation,
                    verified: true,
                    logoBlobId,
                },
                imageBlobId: prodRes.image_blob_ids?.[0] ?? null,
                imageBlobIds: prodRes.image_blob_ids ?? [],
                description: prodRes.description || "",
                shippingMethods: availableShipping,
            };

            if (availableShipping.length > 0) {
                if (!availableShipping.includes(selectedShippingMethod.value as ShippingMethod)) {
                    selectedShippingMethod.value = availableShipping[0];
                }
            }

            try {
                currentOffer.value = await offerApi.getOfferByProduct(prodRes.id);
            } catch {
                currentOffer.value = null;
            }
        } else {
            currentOffer.value = null;
            product.value = {
                id,
                category_id: "",
                title: "Producto no encontrado",
                category: "General",
                price: 0,
                minOrder: 1,
                rating: 0,
                reviewCount: 0,
                providerRating: 0,
                provider: { name: "Desconocido", initial: "D", location: "", verified: false },
                imageBlobId: null,
                description: "No se pudo cargar la información del producto.",
                shippingMethods: [],
            };
        }
    } catch (err) {
        console.error("Critical failure during product loading:", err);
    } finally {
        quantity.value = product.value.minOrder > 0 ? product.value.minOrder : 1;
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
    if (!favoritesStore.isInitialized) {
        favoritesStore.fetchFavorites().catch(console.warn);
    }
});

const hasOffer = computed(() => currentOffer.value !== null);
const discountPercentage = computed(() => currentOffer.value?.discount_percentage ?? null);
const discountedUnitPrice = computed(() =>
    discountPercentage.value !== null
        ? Math.round(product.value.price * (100 - discountPercentage.value)) / 100
        : product.value.price
);

const subtotal = computed(() => product.value.price * quantity.value);
const discountedSubtotal = computed(() => discountedUnitPrice.value * quantity.value);
const total = computed(() => discountedSubtotal.value);

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

const handleLoginToQuote = () => {
    authPromptStore.promptLogin({
        title: "¿Deseas solicitar una cotización?",
        message: "Para agregar productos y solicitar una cotización necesitas iniciar sesión. Puedes iniciar sesión ahora o continuar explorando los productos.",
        confirmText: "Iniciar sesión",
        cancelText: "Seguir explorando",
        icon: "fa-solid fa-clipboard-list",
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50 ring-orange-50/50",
        router,
        redirectPath: route.fullPath,
    });
};

const handleAddToQuote = () => {
    if (!authStore.isAuthenticated) {
        handleLoginToQuote();
        return;
    }
    if (!product.value.id || !providerId.value) return;

    const chosenShipping = (selectedShippingMethod.value as ShippingMethod) ||
        (product.value.shippingMethods[0] as ShippingMethod) ||
        "bus";

    quoteBuilderStore.addItem(providerId.value, {
        productId: product.value.id,
        productTitle: product.value.title,
        unitPrice: product.value.price,
        imageBlobId: product.value.imageBlobId,
        quantity: quantity.value,
        shippingPreference: chosenShipping,
        offerId: currentOffer.value?.id ?? null,
        discountPercentage: discountPercentage.value,
    }, {
        name: product.value.provider.name,
        logoBlobId: product.value.provider.logoBlobId,
    });

    toastStore.addToast({
        title: "Producto agregado",
        message: `${product.value.title} agregado a tu cotización.`,
        icon: "fa-solid fa-clipboard-check",
        variant: "success",
    });
};

const navigateToCategory = () => {
    router.push({
        name: "products",
        query: product.value.category_id ? { categoryId: product.value.category_id } : {},
    });
};

const handleReviewChanged = async () => {
    if (!product.value.id) return;
    try {
        const prodMetric = await reviewApi.getProductMetrics(product.value.id);
        product.value.rating = prodMetric.rating_score;
        product.value.reviewCount = prodMetric.review_count;
    } catch (metricErr) {
        console.warn("Could not refresh product metrics after review update:", metricErr);
    }
};
</script>

<template>
    <div class="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
        <main class="mx-auto w-full max-w-[1200px] px-6 pt-6 pb-16 flex-1">
            <section v-if="isLoading" class="mb-10 grid min-h-[450px] grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr]">
                <div class="animate-pulse rounded-3xl bg-neutral-200"></div>
                <div class="animate-pulse rounded-3xl bg-neutral-200"></div>
            </section>

            <template v-else>
                <section class="mb-10 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1fr_1.35fr]">
                    <div class="flex flex-col items-center justify-start p-2 sm:p-4 w-full">
                        <div class="w-full max-w-[500px]">
                            <ProductImageCarousel
                                :blob-ids="product.imageBlobIds"
                                :product-id="product.id"
                                :alt="product.title"
                                :auto-play="false"
                                :show-arrows="true"
                                :show-dots="true"
                                :show-thumbnails="true"
                                :show-counter="true"
                                variant="detail"
                                object-fit="contain"
                            />
                        </div>
                    </div>
                    <div class="relative flex flex-col rounded-3xl bg-neutral-100 p-8 lg:p-10">
                        <div class="absolute top-6 right-6 sm:top-7 sm:right-8 flex items-center gap-2.5 z-10">
                            <!-- Category Badge -->
                            <router-link
                                v-if="product.category_id && product.category"
                                :to="{ name: 'products', query: { categoryId: product.category_id } }"
                                class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-3 py-1 text-xs font-semibold text-teal-700 shadow-2xs transition-colors hover:bg-teal-100 hover:text-teal-800"
                                :title="`Ver más productos en ${product.category}`"
                            >
                                <i class="fa-solid fa-tag text-[10px] text-teal-600"></i>
                                {{ product.category }}
                            </router-link>
                            <span
                                v-else-if="product.category"
                                class="inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-3 py-1 text-xs font-semibold text-teal-700 shadow-2xs"
                            >
                                <i class="fa-solid fa-tag text-[10px] text-teal-600"></i>
                                {{ product.category }}
                            </span>

                            <!-- Favorite / Like Button -->
                            <button
                                type="button"
                                :class="[
                                    'flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer',
                                    isFavorite
                                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                                        : 'bg-white text-slate-400 hover:text-red-500 hover:bg-white border border-slate-200/60'
                                ]"
                                :title="isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                                :aria-label="isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'"
                                @click="handleFavoriteClick"
                            >
                                <i :class="[isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart', 'text-sm']"></i>
                            </button>
                        </div>
                        <h1 class="mb-3 max-w-[75%] font-serif text-2xl lg:text-3xl font-bold text-neutral-900">
                            {{ product.title }}
                        </h1>
                        <div class="mb-5 inline-flex items-center gap-2">
                            <div class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                                <ProviderLogo
                                    :blob-id="product.provider.logoBlobId"
                                    :alt="product.provider.name"
                                    class="w-full h-full rounded-full"
                                />
                            </div>
                            <span class="text-sm font-semibold text-neutral-900">{{ product.provider.name }}</span>
                            <i v-if="product.provider.verified" class="fa-solid fa-circle-check text-blue-500 text-base"></i>
                        </div>
                        <div class="mb-2.5 flex flex-wrap items-center gap-3">
                            <span v-if="hasOffer" class="text-base text-neutral-400 line-through">
                                C$ {{ formatPrice(product.price) }}
                            </span>
                            <span class="font-serif text-2xl lg:text-3xl font-bold text-orange-500">
                                C$ {{ formatPrice(discountedUnitPrice) }}
                            </span>
                            <span
                                v-if="hasOffer"
                                class="rounded-full bg-orange-500 px-2.5 py-1 text-xs font-bold text-white"
                            >
                                -{{ discountPercentage }}%
                            </span>
                        </div>
                        <div v-if="hasOffer" class="mb-3 inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                            <i class="fa-solid fa-tags"></i>
                            <span>Descuento aplicado al aceptar la cotización</span>
                        </div>
                        <div class="mb-3 text-sm text-neutral-900">
                            <strong class="font-semibold text-neutral-900">Pedido mínimo:</strong>
                            {{ product.minOrder }} unidad{{ product.minOrder > 1 ? "es" : "" }}
                        </div>
                        <div class="mb-5 flex items-center gap-1.5 text-sm font-semibold text-neutral-900">
                            <template v-if="product.reviewCount > 0">
                                <i class="fa-solid fa-star text-orange-500 text-base"></i>
                                <span class="text-neutral-900">{{ product.rating.toFixed(1) }}</span>
                                <span class="font-normal text-neutral-500">({{ product.reviewCount }} valoraciones)</span>
                            </template>
                            <template v-else>
                                <span class="font-normal text-neutral-500">Sin valoraciones aún</span>
                            </template>
                        </div>

                        <MockProductColorPicker
                            :seed="product.id"
                            v-model="selectedColor"
                            class="mb-5"
                        />

                        <div class="mb-5 flex flex-col gap-2">
                            <p class="text-sm leading-relaxed text-neutral-900">
                                <strong class="font-semibold text-neutral-900">Descripción:</strong>
                                {{ product.description }}
                            </p>
                        </div>

                        <ShippingMethodSelector
                            :methods="product.shippingMethods"
                            v-model="selectedShippingMethod"
                        />
                    </div>
                </section>

                <section class="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1fr_1.35fr]">
                    <div class="flex flex-col rounded-3xl bg-neutral-100 p-8 lg:p-10">
                        <h3 class="mb-5 font-serif text-xl font-bold text-neutral-900">Tu proveedor</h3>
                        <div class="mb-3 flex items-center gap-3">
                            <div class="h-10 w-10 overflow-hidden rounded-full bg-blue-400">
                                <ProviderLogo
                                    :blob-id="product.provider.logoBlobId"
                                    :alt="product.provider.name"
                                    class="w-full h-full"
                                />
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span class="font-bold text-neutral-900">{{ product.provider.name }}</span>
                                <i v-if="product.provider.verified" class="fa-solid fa-circle-check text-blue-500 text-base"></i>
                            </div>
                        </div>
                        <div class="mb-2 flex items-center gap-1.5">
                            <template v-if="product.providerRating > 0">
                                <i class="fa-solid fa-star text-orange-500"></i>
                                <span class="text-xl font-bold text-neutral-900">{{ product.providerRating.toFixed(1) }}</span>
                            </template>
                            <template v-else>
                                <span class="text-sm text-neutral-500">Sin calificación</span>
                            </template>
                        </div>
                        <p class="mb-5 text-sm text-neutral-500">{{ product.provider.location }}</p>
                        <router-link
                            v-if="product.provider.id"
                            :to="{
                                name: 'provider-catalog',
                                params: { providerId: product.provider.id },
                            }"
                            class="mb-6 inline-flex w-44 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                        >
                            Ver catálogo
                        </router-link>
                        <button
                            v-else
                            type="button"
                            class="mb-6 inline-flex w-44 items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                            @click="navigateToCategory"
                        >
                            Ver catálogo
                        </button>
                        <hr class="my-3 border-t border-neutral-300" />
                        <div class="mt-auto flex items-center justify-between gap-4">
                            <div class="flex items-center gap-2.5">
                                <i class="fa-solid fa-box-open text-xl text-teal-600"></i>
                                <span class="text-xs text-neutral-900">Productos al por mayor garantizados</span>
                            </div>
                            <router-link
                                :to="{ name: 'orders' }"
                                class="rounded-md border border-teal-600 px-3 py-1 text-xs font-semibold text-teal-600 transition-colors hover:bg-teal-600 hover:text-white"
                            >
                                Ver pedidos &gt;
                            </router-link>
                        </div>
                    </div>
                    <div class="flex flex-col rounded-3xl bg-neutral-100 p-8 lg:p-10">
                        <h3 class="mb-5 font-serif text-xl font-bold text-neutral-900">Elige la cantidad</h3>
                        <div class="mb-6 flex items-center gap-3">
                            <div class="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    class="flex h-6 w-6 items-center justify-center rounded bg-neutral-500 text-xs text-white transition-colors hover:bg-neutral-900 disabled:cursor-not-allowed disabled:bg-neutral-300"
                                    :disabled="quantity <= (product.minOrder > 0 ? product.minOrder : 1)"
                                    aria-label="Disminuir cantidad"
                                    @click="decreaseQuantity"
                                >
                                    <i class="fa-solid fa-minus"></i>
                                </button>
                                <span class="min-w-[28px] text-center text-lg font-bold text-teal-600">{{ quantity }}</span>
                                <button
                                    type="button"
                                    class="flex h-6 w-6 items-center justify-center rounded bg-neutral-500 text-xs text-white transition-colors hover:bg-neutral-900"
                                    aria-label="Aumentar cantidad"
                                    @click="increaseQuantity"
                                >
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                            <span class="text-sm text-neutral-900">unidades</span>
                            <span class="rounded-xl bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-600">
                                Mín. {{ product.minOrder }} und
                            </span>
                        </div>
                        <div class="mb-7 flex flex-col gap-2.5 text-sm">
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Precio unitario:</span>
                                <span class="flex items-center gap-2">
                                    <span v-if="hasOffer" class="text-neutral-400 line-through">C$ {{ formatPrice(product.price) }}</span>
                                    <span class="font-medium text-neutral-900">C$ {{ formatPrice(discountedUnitPrice) }}</span>
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Cantidad:</span>
                                <span class="font-medium text-neutral-900">{{ quantity }} und</span>
                            </div>
                            <hr class="my-1 border-t border-neutral-300" />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Método de envío:</span>
                                <span class="font-medium text-neutral-900">{{ selectedShippingMethodName }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Subtotal:</span>
                                <span class="flex items-center gap-2">
                                    <span v-if="hasOffer" class="text-neutral-400 line-through">C$ {{ formatPrice(subtotal) }}</span>
                                    <span class="font-medium text-neutral-900">C$ {{ formatPrice(discountedSubtotal) }}</span>
                                </span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Costo de flete:</span>
                                <span class="font-medium text-teal-700 text-xs bg-teal-50 px-2 py-0.5 rounded">
                                    Calculado al cotizar
                                </span>
                            </div>
                            <hr class="my-1 border-t-2 border-neutral-500" />
                            <div class="flex items-center justify-between text-base font-bold text-neutral-900">
                                <span>Subtotal productos:</span>
                                <span class="text-lg font-bold text-neutral-900">C$ {{ formatPrice(total) }}</span>
                            </div>
                        </div>
                        <!-- Unauthenticated: Login to Quote -->
                        <button
                            v-if="!authStore.isAuthenticated"
                            type="button"
                            class="flex items-center justify-center gap-2 w-full rounded-full bg-gradient-to-b from-orange-400 to-orange-600 py-3.5 text-base font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
                            @click="handleLoginToQuote"
                        >
                            <i class="fa-solid fa-arrow-right-to-bracket text-sm"></i>
                            <span>Inicia sesión para cotizar</span>
                        </button>

                        <!-- Authenticated: Add to Quote -->
                        <button
                            v-else
                            type="button"
                            class="w-full rounded-full bg-gradient-to-b from-orange-400 to-orange-600 py-3.5 text-base font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                            :disabled="product.price <= 0"
                            @click="handleAddToQuote"
                        >
                            Agregar a cotización
                        </button>
                    </div>
                </section>

                <!-- Quote Draft Section (Self-contained) -->
                <QuoteDraftSection
                    v-if="providerId"
                    :provider-id="providerId"
                    :provider-name="product.provider.name"
                />

                <!-- Productos Relacionados -->
                <RelatedProductsSection
                    :category-id="product.category_id"
                    :category-name="product.category"
                    :current-product-id="product.id"
                    :provider-id="product.provider.id"
                />

                <ProductReviewsSection
                    v-if="product.id"
                    :product-id="product.id"
                    @review-changed="handleReviewChanged"
                />
            </template>
        </main>
    </div>
</template>
