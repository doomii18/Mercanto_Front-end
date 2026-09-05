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
const authStore = useAuthStore();
const geoStore = useGeoStore();

const showAddedToast = ref(false);
const isLoading = ref(true);

const selectedShippingMethod = ref("bus");
const selectedColor = ref<string>("");
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

    // Seeded check: ~60% chance of having color variants
    const hasColorVariants = (seed % 10) < 6;
    if (!hasColorVariants) return [];

    const count = 2 + (Math.floor(seed / 10) % 4); // 2 to 5 colors
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
    <div class="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
        <main class="mx-auto w-full max-w-[1200px] px-6 pt-6 pb-16 flex-1">
            <nav class="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-neutral-500" aria-label="Breadcrumb">
                <router-link :to="{ name: 'home' }" class="text-neutral-500 transition-colors duration-200 hover:text-orange-500">Inicio</router-link>
                <span class="font-medium text-neutral-400">&gt;</span>
                <router-link :to="{ name: 'category' }" class="text-neutral-500 transition-colors duration-200 hover:text-orange-500">Categorías</router-link>
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

                        <!-- Seeded Color Picker -->
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
                                name: 'category',
                                query: { provider_id: product.provider.id },
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
                            @click="handleAddToCart"
                        >
                            Agregar al pedido
                        </button>
                    </div>
                </section>

                <ProductReviewsSection :product-id="product.id" />
            </template>
        </main>

        <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="translate-y-5 opacity-0"
            enter-to-class="translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="translate-y-0 opacity-100"
            leave-to-class="translate-y-5 opacity-0"
        >
            <div
                v-if="showAddedToast"
                class="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-xl border-l-[5px] border-orange-500 bg-neutral-900 px-6 py-4 font-semibold text-white shadow-2xl"
            >
                <i class="fa-solid fa-circle-check text-base"></i>
                <span>¡{{ product.title }} ({{ quantity }} unds{{ selectedColor ? ` - ${selectedColor}` : '' }}) agregado a tu pedido!</span>
            </div>
        </transition>
    </div>
</template>
