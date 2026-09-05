<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { productApi, organizationApi } from "../api";

import { useGeoStore } from "../stores/geo";
import { useQuoteBuilderStore } from "@/stores/quoteBuilderStore";
import { useToastStore } from "@/stores/toastStore";
import ProductImage from "../components/product/ProductImage.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";
import ProductReviewsSection from "@/components/product/ProductReviewsSection.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import AddressPickerModal, { type AddressPickerResult } from "@/components/common/AddressPickerModal.vue";
import type { PaymentMethod } from "@/api/services/quote/types";

interface ShippingMethodOption {
    id: string;
    name: string;
    icon: string;
    cost: number;
}

interface ProductColor {
    name: string;
    hex: string;
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
    description: string;
    shippingMethods: ShippingMethodOption[];
}

const COLOR_PRESETS: ProductColor[] = [
    { name: "Café Rústico", hex: "#4a2c11" },
    { name: "Negro Mate", hex: "#1e293b" },
    { name: "Miel / Tan", hex: "#c88a4b" },
    { name: "Azul Marino", hex: "#0f3460" },
    { name: "Gris Asfalto", hex: "#64748b" },
    { name: "Verde Oliva", hex: "#4d5b3d" },
    { name: "Vino", hex: "#6b212f" },
    { name: "Blanco Hueso", hex: "#f1f5f9" },
];

const route = useRoute();
const router = useRouter();

const geoStore = useGeoStore();
const quoteBuilderStore = useQuoteBuilderStore();
const toastStore = useToastStore();

const isLoading = ref(true);
const selectedShippingMethod = ref("bus");
const selectedColor = ref<string>("");
const quantity = ref(1);

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
const currentDraft = computed(() => providerId.value ? quoteBuilderStore.getDraft(providerId.value) : null);
const draftItems = computed(() => currentDraft.value?.items ?? []);
const draftSubtotal = computed(() => providerId.value ? quoteBuilderStore.getSubtotal(providerId.value) : 0);

const showConfirmQuoteModal = ref(false);
const showAddressPicker = ref(false);
const shippingAddress = ref("");
const shippingMunicipalityId = ref<string | null>(null);
const shippingCoordinates = ref<{ lat: number; lng: number } | null>(null);
const paymentPreference = ref<PaymentMethod>("virtual_wallet");

function hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
}

const availableColors = computed<ProductColor[]>(() => {
    if (!product.value.id) return [];
    const seed = hashString(product.value.id);
    const hasColorVariants = (seed % 10) < 6;
    if (!hasColorVariants) return [];
    const count = 2 + (Math.floor(seed / 10) % 4);
    const colors: ProductColor[] = [];
    for (let i = 0; i < count; i++) {
        const index = (seed + i * 2) % COLOR_PRESETS.length;
        const candidate = COLOR_PRESETS[index];
        if (!colors.some((c) => c.name === candidate.name)) {
            colors.push(candidate);
        }
    }
    return colors;
});

watch(
    availableColors,
    (colors) => {
        if (colors.length > 0) {
            if (!selectedColor.value || !colors.some((c) => c.name === selectedColor.value)) {
                selectedColor.value = colors[0].name;
            }
        } else {
            selectedColor.value = "";
        }
    },
    { immediate: true },
);

function resolveLocationText(municipalityId?: string): string {
    if (!municipalityId) return "Managua, Nicaragua";
    const hierarchy = geoStore.resolveLocationHierarchy(municipalityId);
    if (!hierarchy) return "Managua, Nicaragua";
    return hierarchy.department
        ? `${hierarchy.municipality.name}, ${hierarchy.department.name}`
        : hierarchy.municipality.name;
}

function resolveShippingMethods(methods?: string[]): ShippingMethodOption[] {
    const result: ShippingMethodOption[] = [];
    const hasBus = methods?.includes("bus") ?? true;
    const hasOwn = methods?.includes("own_delivery") ?? false;

    if (hasBus) {
        result.push({ id: "bus", name: "Bus Interlocal", icon: "fa-solid fa-bus", cost: 150 });
    }
    if (hasOwn) {
        result.push({ id: "own_delivery", name: "Entrega Propia", icon: "fa-solid fa-truck", cost: 180 });
    }
    result.push({ id: "courier", name: "Empresas de paquetería", icon: "fa-solid fa-truck-fast", cost: 200 });
    return result;
}

async function loadProduct(id: string) {
    isLoading.value = true;
    try {
        const [prodRes] = await Promise.all([
            productApi.getProduct(id).catch(() => null),
            geoStore.initialize().catch(() => {}),
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
                category_id: prodRes.category?.id || "",
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
                category_id: "",
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

const handleAddToQuote = () => {
    if (!product.value.id || !providerId.value) return;

    quoteBuilderStore.addItem(providerId.value, {
        productId: product.value.id,
        productTitle: product.value.title,
        unitPrice: product.value.price,
        imageBlobId: product.value.imageBlobId,
        quantity: quantity.value,
    }, {
        name: product.value.provider.name,
        logoBlobId: product.value.provider.logoBlobId,
    });

    toastStore.addToast({
        title: "Producto agregado",
        message: `${product.value.title} agregado a tu cotización.`,
        icon: "fa-solid fa-cart-plus",
        variant: "success",
    });
};

const openConfirmModal = () => {
    if (currentDraft.value) {
        shippingAddress.value = currentDraft.value.shippingAddress || "";
        paymentPreference.value = currentDraft.value.paymentPreference || "virtual_wallet";
    }
    showConfirmQuoteModal.value = true;
};

const handleAddressConfirm = (result: AddressPickerResult) => {
    shippingAddress.value = result.address;
    shippingMunicipalityId.value = result.municipalityId;
    shippingCoordinates.value = { lat: result.latitude, lng: result.longitude };
};

const confirmQuote = async () => {
    if (!providerId.value) return;
    if (!shippingAddress.value.trim()) {
        toastStore.addToast({
            title: "Dirección requerida",
            message: "Por favor ingresa una dirección de envío.",
            icon: "fa-solid fa-circle-exclamation",
            variant: "error",
        });
        return;
    }

    quoteBuilderStore.setShippingAddress(providerId.value, shippingAddress.value.trim());
    quoteBuilderStore.setPaymentPreference(providerId.value, paymentPreference.value);

    try {
        await quoteBuilderStore.createQuoteForProvider(providerId.value);
        toastStore.addToast({
            title: "¡Pedido creado!",
            message: "Tu cotización ha sido enviada al proveedor.",
            icon: "fa-solid fa-circle-check",
            variant: "success",
        });
        showConfirmQuoteModal.value = false;
        router.push({ name: "orders" });
    } catch (err: any) {
        toastStore.addToast({
            title: "Error al crear pedido",
            message: err.message || "No se pudo crear el pedido.",
            icon: "fa-solid fa-circle-exclamation",
            variant: "error",
        });
    }
};

const navigateToCategory = () => {
    router.push({ name: "category" });
};
</script>

<template>
    <div class="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
        <main class="mx-auto w-full max-w-[1200px] px-6 pt-6 pb-16 flex-1">
            <nav class="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-neutral-500" aria-label="Breadcrumb">
                <router-link :to="{ name: 'home' }" class="text-neutral-500 transition-colors duration-200 hover:text-orange-500">Inicio</router-link>
                <span class="font-medium text-neutral-400">&gt;</span>
                <router-link v-if="product.category_id" :to="{ name: 'category', params: { categoryId: product.category_id  } }" class="text-neutral-500 transition-colors duration-200 hover:text-orange-500">
                  Categorías
                </router-link>>
                <span class="font-medium text-neutral-400">&gt;</span>
                <a href="#" class="text-neutral-500 transition-colors duration-200 hover:text-orange-500" @click.prevent="navigateToCategory">
                    {{ product.category || "Categoría" }}
                </a>
                <span class="font-medium text-neutral-400">&gt;</span>
                <span class="font-semibold text-neutral-600">{{ product.title || "Producto" }}</span>
            </nav>

            <section v-if="isLoading" class="mb-10 grid min-h-[450px] grid-cols-1 gap-10 lg:grid-cols-[1fr_1.35fr]">
                <div class="animate-pulse rounded-3xl bg-neutral-200"></div>
                <div class="animate-pulse rounded-3xl bg-neutral-200"></div>
            </section>

            <template v-else>
                <section class="mb-10 grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1fr_1.35fr]">
                    <div class="flex flex-col items-center justify-center p-4">
                        <div class="flex aspect-square w-full max-w-[500px] items-center justify-center overflow-hidden rounded-2xl bg-neutral-50">
                            <ProductImage
                                :blob-id="product.imageBlobId"
                                :alt="product.title"
                                class="w-full h-full"
                            />
                        </div>
                    </div>
                    <div class="relative flex flex-col rounded-3xl bg-neutral-100 p-8 lg:p-10">
                        <div class="absolute top-7 right-8 flex flex-col items-end gap-1">
                            <span class="text-xs italic text-neutral-500">{{ product.category || "General" }}</span>
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
                        <div class="mb-2.5">
                            <span class="font-serif text-2xl lg:text-3xl font-bold text-orange-500">
                                C$ {{ formatPrice(product.price) }}
                            </span>
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

                        <div v-if="availableColors.length > 0" class="mb-5">
                            <div class="mb-2 flex items-center gap-2 text-sm">
                                <span class="font-semibold text-neutral-900">Color:</span>
                                <span class="text-neutral-500">{{ selectedColor }}</span>
                            </div>
                            <div class="flex items-center gap-3">
                                <button
                                    v-for="color in availableColors"
                                    :key="color.name"
                                    type="button"
                                    :title="color.name"
                                    :aria-label="color.name"
                                    :class="[
                                        'group relative flex h-7 w-7 items-center justify-center rounded-full transition-all focus:outline-none',
                                        selectedColor === color.name
                                            ? 'ring-2 ring-neutral-900 ring-offset-2 scale-110'
                                            : 'border border-neutral-300 hover:scale-105'
                                    ]"
                                    :style="{ backgroundColor: color.hex }"
                                    @click="selectedColor = color.name"
                                >
                                    <i
                                        v-if="selectedColor === color.name"
                                        class="fa-solid fa-check text-[10px]"
                                        :class="color.name.includes('Blanco') ? 'text-neutral-900' : 'text-white'"
                                    ></i>
                                </button>
                            </div>
                        </div>

                        <div class="mb-5 flex flex-col gap-2">
                            <p class="text-sm leading-relaxed text-neutral-900">
                                <strong class="font-semibold text-neutral-900">Descripción:</strong>
                                {{ product.description }}
                            </p>
                        </div>

                        <div>
                            <p class="mb-2 text-sm font-semibold text-neutral-900">Tipo de envío disponible:</p>
                            <div class="flex flex-wrap gap-3">
                                <div
                                    v-for="method in product.shippingMethods"
                                    :key="method.id"
                                    :class="[
                                        'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors duration-150',
                                        selectedShippingMethod === method.id
                                            ? 'bg-teal-500/15 text-teal-600'
                                            : 'text-neutral-900 hover:bg-neutral-200'
                                    ]"
                                    @click="selectedShippingMethod = method.id"
                                >
                                    <i :class="method.icon"></i>
                                    <span>{{ method.name }}</span>
                                </div>
                            </div>
                            <p class="mt-2 text-xs italic text-neutral-500">*Costos de envío estimados, calculados al finalizar la compra.</p>
                        </div>
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
                                <span class="font-medium text-neutral-900">C$ {{ formatPrice(product.price) }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Cantidad:</span>
                                <span class="font-medium text-neutral-900">{{ quantity }} und</span>
                            </div>
                            <hr class="my-1 border-t border-neutral-300" />
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Tipo de envío:</span>
                                <span class="font-medium text-neutral-900">{{ selectedShipping.name }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Subtotal:</span>
                                <span class="font-medium text-neutral-900">C$ {{ formatPrice(subtotal) }}</span>
                            </div>
                            <div class="flex items-center justify-between">
                                <span class="text-neutral-500">Envío estimado:</span>
                                <span class="font-medium text-neutral-900">
                                    {{ shippingCost > 0 ? `C$ ${formatPrice(shippingCost)}` : "C$ 0" }}
                                </span>
                            </div>
                            <hr class="my-1 border-t-2 border-neutral-500" />
                            <div class="flex items-center justify-between text-base font-bold text-neutral-900">
                                <span>Total estimado:</span>
                                <span class="text-lg font-bold text-neutral-900">C$ {{ formatPrice(total) }}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="w-full rounded-full bg-gradient-to-b from-orange-400 to-orange-600 py-3.5 text-base font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                            :disabled="product.price <= 0"
                            @click="handleAddToQuote"
                        >
                            Agregar a cotización
                        </button>
                    </div>
                </section>

                <!-- Quote Draft Section -->
                <section v-if="draftItems.length > 0" class="mt-10 rounded-3xl bg-neutral-100 p-8 lg:p-10">
                    <h3 class="mb-5 font-serif text-xl font-bold text-neutral-900">
                        Tu cotización con {{ product.provider.name }}
                    </h3>
                    <div class="flex flex-col gap-4">
                        <div v-for="item in draftItems" :key="item.productId" class="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                            <div class="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center border border-neutral-200">
                                <ProductImage :blob-id="item.imageBlobId" :alt="item.productTitle" />
                            </div>
                            <div class="flex-1 min-w-0">
                                <h4 class="font-semibold text-neutral-900 truncate">{{ item.productTitle }}</h4>
                                <p class="text-sm text-neutral-500">{{ item.quantity }} und x C$ {{ formatPrice(item.unitPrice) }}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <div class="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                                    <button @click="quoteBuilderStore.updateItemQuantity(providerId, item.productId, item.quantity - 1)" class="h-6 w-6 flex items-center justify-center rounded bg-neutral-300 text-xs text-neutral-700 hover:bg-neutral-400">
                                        <i class="fa-solid fa-minus"></i>
                                    </button>
                                    <span class="text-sm font-bold text-teal-600 min-w-[20px] text-center">{{ item.quantity }}</span>
                                    <button @click="quoteBuilderStore.updateItemQuantity(providerId, item.productId, item.quantity + 1)" class="h-6 w-6 flex items-center justify-center rounded bg-neutral-300 text-xs text-neutral-700 hover:bg-neutral-400">
                                        <i class="fa-solid fa-plus"></i>
                                    </button>
                                </div>
                                <button @click="quoteBuilderStore.removeItem(providerId, item.productId)" class="text-red-500 hover:text-red-700 p-1" title="Eliminar">
                                    <i class="fa-solid fa-trash text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-neutral-300">
                            <span class="text-lg font-bold text-neutral-900">
                                Subtotal: <span class="text-orange-500">C$ {{ formatPrice(draftSubtotal) }}</span>
                            </span>
                            <button @click="openConfirmModal" class="w-full sm:w-auto rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-8 py-3 text-base font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
                                Hacer oficial el pedido
                            </button>
                        </div>
                    </div>
                </section>

                <ProductReviewsSection :product-id="product.id" />
            </template>
        </main>

        <ConfirmModal
            v-model="showConfirmQuoteModal"
            title="Confirmar Pedido"
            description="Revisa los detalles y confirma la dirección de envío para enviar tu cotización al proveedor."
            confirm-text="Enviar Cotización"
            cancel-text="Cancelar"
            icon="fa-solid fa-file-invoice"
            icon-variant="teal"
            @confirm="confirmQuote"
        >
            <div class="text-left space-y-4 mt-4 text-neutral-900">
                <div>
                    <label class="block text-sm font-semibold text-neutral-900 mb-1">
                        Dirección de envío *
                    </label>
                    <div class="flex gap-2">
                        <input
                            v-model="shippingAddress"
                            type="text"
                            class="w-full p-2.5 bg-white text-neutral-900 placeholder:text-neutral-400 border border-neutral-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            placeholder="Escribe tu dirección o usa el mapa"
                        />
                        <button
                            type="button"
                            class="flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-white transition-colors hover:bg-teal-700"
                            title="Seleccionar en el mapa"
                            aria-label="Abrir mapa"
                            @click="showAddressPicker = true"
                        >
                            <i class="fa-solid fa-map-location-dot"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-semibold text-neutral-900 mb-1">
                        Método de pago preferido
                    </label>
                    <select
                        v-model="paymentPreference"
                        class="w-full p-2.5 bg-white text-neutral-900 border border-neutral-300 rounded-lg focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                    >
                        <option value="virtual_wallet" class="bg-white text-neutral-900">Billetera virtual</option>
                        <option value="transfer" class="bg-white text-neutral-900">Transferencia bancaria</option>
                        <option value="card" class="bg-white text-neutral-900">Tarjeta de crédito / débito</option>
                    </select>
                </div>
            </div>
        </ConfirmModal>

        <AddressPickerModal
            v-model="showAddressPicker"
            :initial-address="shippingAddress"
            :initial-lat="shippingCoordinates?.lat"
            :initial-lng="shippingCoordinates?.lng"
            @confirm="handleAddressConfirm"
        />
    </div>
</template>
