<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useGeoStore } from "@/stores/geo";
import { useOrganizationStore } from "@/stores/organization";
import { useAuthStore } from "@/stores/auth";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import { useCategoryApi } from "@/api/modules/catalog/category/useCategoryApi";
import { useCategoryStore } from "@/stores/commerce";
import { useQuoteApi } from "@/api/modules/commerce/quote/useQuoteApi";
import type {
  SmartProductSearchHit,
  ProductResponse,
  SmartSearchCoverage,
} from "@/api/modules/catalog/product/types";
import AddressPickerModal, { type AddressPickerResult } from "@/components/common/AddressPickerModal.vue";
import ProductImage from "@/components/product/ProductImage.vue";
import {
  ArrowLeft,
  CircleCheck,
  CircleDollarSign,
  ClipboardList,
  Crown,
  Crosshair,
  Info,
  ListChecks,
  LoaderCircle,
  MapPin,
  Navigation,
  Package,
  PackageOpen,
  PiggyBank,
  Plus,
  RefreshCw,
  Scale,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Tags,
  Target,
  TriangleAlert,
  Truck,
  WandSparkles,
  X,
  Zap,
} from "@lucide/vue";

const router = useRouter();
const route = useRoute();
const geoStore = useGeoStore();
const orgStore = useOrganizationStore();
const authStore = useAuthStore();
const productApi = useProductApi();
const categoryApi = useCategoryApi();
const categoryStore = useCategoryStore();
const quoteApi = useQuoteApi();

interface CatalogProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageBlobId: string | null;
  providerId: string;
  providerName: string;
}

interface SelectedProductItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageBlobId?: string | null;
  providerId: string;
  providerName?: string;
  categoryName?: string;
}

export interface EvaluatedOption {
  providerId: string;
  providerName: string;
  initial: string;
  verified: boolean;
  rating: string;
  reviewCount: number;
  location: string;
  deliveryTime: string;
  deliveryCarrier: string;
  distance: string;
  distKm: number;
  subtotal: number;
  shippingCost: number;
  total: number;
  originalTotal: number;
  savings: number;
  savingsPercent: string;
  matchScore: number;
  visualSimilarityPct: number;
  priceScorePct: number;
  geoScorePct: number;
  hitProduct: ProductResponse;
}

export interface CoverageGroupView {
  providerId: string;
  providerName: string;
  itemCount: number;
  subtotal: number;
  items: { id: string; name: string; quantity: number; price: number }[];
}

const viewMode = computed<"config" | "results">(() => {
  return route.query.step === "results" ? "results" : "config";
});

// Persist the in-progress search so a page reload (e.g. Vite HMR) does not
// wipe the selected list and provider coverage.
const SEARCH_STATE_KEY = "mercanto.smart-search.state";
interface PersistedSearchState {
  selectedProducts?: SelectedProductItem[];
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
}
const persistedState: PersistedSearchState = (() => {
  try {
    return JSON.parse(sessionStorage.getItem(SEARCH_STATE_KEY) ?? "{}");
  } catch {
    return {};
  }
})();

const availableCatalog = ref<CatalogProductItem[]>([]);
const selectedProducts = ref<SelectedProductItem[]>(
  persistedState.selectedProducts ?? []
);
const categoriesMap = ref<Map<string, string>>(new Map());
const isLoadingCatalog = ref(false);

// Delivery location with coordinates
const deliveryAddress = ref(persistedState.deliveryAddress ?? "Managua, Nicaragua");
const deliveryLat = ref<number>(persistedState.deliveryLat ?? 12.1328);
const deliveryLng = ref<number>(persistedState.deliveryLng ?? -86.2504);
// Algorithm Tuning: Presets and 3 Sliders
type PresetKey = "balanced" | "savings" | "fast" | "fidelity" | "custom";
const activePreset = ref<PresetKey>("balanced");

const priceWeight = ref<number>(35);
const geoWeight = ref<number>(35);
const visualWeight = ref<number>(30);

// Normalized weights (sum to 100% / 1.0)
const normalizedPricePct = computed(() => priceWeight.value);
const normalizedGeoPct = computed(() => geoWeight.value);
const normalizedVisualPct = computed(() => visualWeight.value);

const selectPreset = (preset: Exclude<PresetKey, "custom">) => {
  activePreset.value = preset;
  if (preset === "balanced") {
    priceWeight.value = 35;
    geoWeight.value = 35;
    visualWeight.value = 30;
  } else if (preset === "savings") {
    priceWeight.value = 60;
    geoWeight.value = 20;
    visualWeight.value = 20;
  } else if (preset === "fast") {
    priceWeight.value = 20;
    geoWeight.value = 60;
    visualWeight.value = 20;
  } else if (preset === "fidelity") {
    priceWeight.value = 20;
    geoWeight.value = 20;
    visualWeight.value = 60;
  }
  if (viewMode.value === "results") {
    executeSearch();
  }
};

const onSliderInput = (slider: "price" | "geo" | "visual", rawVal: number) => {
  activePreset.value = "custom";
  const val = Math.max(0, Math.min(100, Math.round(rawVal)));
  const remaining = 100 - val;

  if (slider === "price") {
    priceWeight.value = val;
    const otherSum = geoWeight.value + visualWeight.value;
    if (otherSum > 0) {
      const newGeo = Math.round((remaining * geoWeight.value) / otherSum);
      geoWeight.value = newGeo;
      visualWeight.value = remaining - newGeo;
    } else {
      const newGeo = Math.floor(remaining / 2);
      geoWeight.value = newGeo;
      visualWeight.value = remaining - newGeo;
    }
  } else if (slider === "geo") {
    geoWeight.value = val;
    const otherSum = priceWeight.value + visualWeight.value;
    if (otherSum > 0) {
      const newPrice = Math.round((remaining * priceWeight.value) / otherSum);
      priceWeight.value = newPrice;
      visualWeight.value = remaining - newPrice;
    } else {
      const newPrice = Math.floor(remaining / 2);
      priceWeight.value = newPrice;
      visualWeight.value = remaining - newPrice;
    }
  } else if (slider === "visual") {
    visualWeight.value = val;
    const otherSum = priceWeight.value + geoWeight.value;
    if (otherSum > 0) {
      const newPrice = Math.round((remaining * priceWeight.value) / otherSum);
      priceWeight.value = newPrice;
      geoWeight.value = remaining - newPrice;
    } else {
      const newPrice = Math.floor(remaining / 2);
      priceWeight.value = newPrice;
      geoWeight.value = remaining - newPrice;
    }
  }
};

// Modals & Search state
const showProductModal = ref(false);
const showGpsModal = ref(false);
const showDetailModal = ref(false);
const selectedOptionDetail = ref<EvaluatedOption | null>(null);
const productSearchFilter = ref("");
const isSearching = ref(false);
const isCreatingQuote = ref(false);
const searchStepMessage = ref("");
const noResultsFound = ref(false);

// Results-sidebar sliders rebalance via v-model; any manual change leaves the preset.
const onSliderChange = () => {
  activePreset.value = "custom";
};

const rankedPrimary = ref<EvaluatedOption | null>(null);
const rankedAlternative = ref<EvaluatedOption | null>(null);
const allRankedHits = ref<EvaluatedOption[]>([]);
const coverage = ref<SmartSearchCoverage | null>(null);

// Exact-ownership view: every requested product mapped to its owning provider.
const coverageGroups = computed<CoverageGroupView[]>(() => {
  if (!coverage.value) return [];
  return coverage.value.groups.map((group) => {
    const items = group.seed_product_ids
      .map((id) => selectedProducts.value.find((p) => p.id === id))
      .filter((p): p is SelectedProductItem => !!p);

    const providerName =
      items[0]?.providerName ||
      availableCatalog.value.find((p) => p.providerId === group.provider_id)?.providerName ||
      `Proveedor ${group.provider_id.substring(0, 8).toUpperCase()}`;

    return {
      providerId: group.provider_id,
      providerName,
      itemCount: group.item_count,
      subtotal: items.reduce((acc, p) => acc + p.price * p.quantity, 0),
      items: items.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        price: p.price,
      })),
    };
  });
});

// Seed product ids that a provider actually owns (exact ownership, from the
// backend coverage report). Empty means the provider cannot supply the list.
const ownedSeedIdsForProvider = (providerId: string | null | undefined): string[] => {
  if (!providerId) return [];
  return coverage.value?.groups.find((g) => g.provider_id === providerId)?.seed_product_ids ?? [];
};

const primaryOwnedIds = computed(() => ownedSeedIdsForProvider(primaryOption.value?.providerId));
const alternativeOwnedIds = computed(() =>
  ownedSeedIdsForProvider(alternativeOption.value?.providerId)
);

const coverageTotalItems = computed(() => coverage.value?.total_items ?? 0);

const selectedOptionOwnedItems = computed(() => {
  if (!selectedOptionDetail.value) return [];
  const ownedIds = ownedSeedIdsForProvider(selectedOptionDetail.value.providerId);
  return selectedProducts.value.filter((p) => ownedIds.includes(p.id));
});

watch(
  [selectedProducts, deliveryAddress, deliveryLat, deliveryLng],
  () => {
    try {
      sessionStorage.setItem(
        SEARCH_STATE_KEY,
        JSON.stringify({
          selectedProducts: selectedProducts.value,
          deliveryAddress: deliveryAddress.value,
          deliveryLat: deliveryLat.value,
          deliveryLng: deliveryLng.value,
        })
      );
    } catch {
      // Storage unavailable: non-blocking.
    }
  },
  { deep: true }
);

// Address picker modal props
const initialLat = computed(() => deliveryLat.value);
const initialLng = computed(() => deliveryLng.value);
const initialAddress = computed(() => deliveryAddress.value);

const filteredCatalog = computed(() => {
  const q = productSearchFilter.value.trim().toLowerCase();
  if (!q) return availableCatalog.value;
  return availableCatalog.value.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.providerName.toLowerCase().includes(q)
  );
});

const primaryOption = computed(() => rankedPrimary.value);
const alternativeOption = computed(() => rankedAlternative.value);

const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1);
};

const addProductFromCatalog = (product: CatalogProductItem) => {
  const existing = selectedProducts.value.find((p) => p.id === product.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    selectedProducts.value.push({
      id: product.id,
      name: product.name,
      quantity: 1,
      price: product.price,
      imageBlobId: product.imageBlobId,
      providerId: product.providerId,
      providerName: product.providerName,
      categoryName: product.category,
    });
  }
  showProductModal.value = false;
};

// Real Two-Stage Backend Search Execution
const executeSearch = async () => {
  if (selectedProducts.value.length === 0) {
    return;
  }

  isSearching.value = true;
  noResultsFound.value = false;
  coverage.value = null;
  searchStepMessage.value = "Extrayendo embeddings y recuperando candidatos...";

  const w_p = normalizedPricePct.value / 100;
  const w_g = normalizedGeoPct.value / 100;
  const w_v = normalizedVisualPct.value / 100;

  try {
    searchStepMessage.value =
      "Ejecutando Stage 1 (pgvector HNSW) y Stage 2 (PostGIS + Rerank)...";

    const seedIds = selectedProducts.value.map((p) => p.id);
    const originalSubtotal = selectedProducts.value.reduce(
      (acc, p) => acc + p.price * p.quantity,
      0
    );

    const res = await productApi.searchSmartProducts({
      seed_product_ids: seedIds,
      buyer_latitude: deliveryLat.value,
      buyer_longitude: deliveryLng.value,
      weights: {
        price: w_p,
        geo: w_g,
        visual: w_v,
      },
      limit: 20,
    });

    if (!res.data || res.data.length === 0) {
      coverage.value = res.coverage;
      noResultsFound.value = !res.coverage || res.coverage.groups.length === 0;
      rankedPrimary.value = null;
      rankedAlternative.value = null;
      allRankedHits.value = [];
      isSearching.value = false;
      router.push({
        name: "smart-search",
        query: { ...route.query, step: "results" },
      });
      return;
    }

    coverage.value = res.coverage;

    const totalUnits = selectedProducts.value.reduce(
      (acc, p) => acc + p.quantity,
      0
    );

    const evaluatedHits: EvaluatedOption[] = await Promise.all(
      res.data.map(async (hit: SmartProductSearchHit) => {
        let provName = "Proveedor Asociado";
        let provRating = "4.8";
        let provReviewCount = 42;
        let provLocation = "Nicaragua";
        let isVerified = true;

        try {
          const prov = await orgStore.getPublicProvider(hit.product.provider_id);
          provName = prov.company_name;
          isVerified = true;
          if (prov.rating) {
            provRating = prov.rating.average_score.toFixed(1);
            provReviewCount = prov.rating.review_count;
          }
          if (prov.municipality_id) {
            const loc = geoStore.resolveLocationHierarchy(prov.municipality_id);
            if (loc?.municipality) {
              provLocation = loc.department
                ? `${loc.municipality.name}, ${loc.department.name}`
                : `${loc.municipality.name}, Nicaragua`;
            }
          }
        } catch {
          provName = `Proveedor ${hit.product.provider_id.substring(0, 8).toUpperCase()}`;
        }

        const distKm = Number(hit.distance_km.toFixed(1));
        let deliveryTime = "2 - 3 días";
        let deliveryCarrier = "Empresas de paquetería (CargoTrans/Express)";
        let baseShipping = 1400;

        if (distKm <= 15) {
          deliveryTime = "Mismo día (24 hrs)";
          deliveryCarrier = "Despacho express motorizado";
          baseShipping = 450;
        } else if (distKm <= 60) {
          deliveryTime = "1 - 2 días";
          deliveryCarrier = "Transporte departamental directo";
          baseShipping = 850;
        } else {
          baseShipping = 1200 + Math.round(distKm * 8);
        }

        // Totals reflect only the requested products this provider owns.
        const ownedIds = ownedSeedIdsForProvider(hit.product.provider_id);
        const ownedItems = selectedProducts.value.filter((p) => ownedIds.includes(p.id));
        const subtotal =
          ownedItems.length > 0
            ? ownedItems.reduce((acc, p) => acc + p.price * p.quantity, 0)
            : Math.round(Number(hit.product.base_price) * totalUnits);
        const total = subtotal + baseShipping;
        const savings = Math.max(0, originalSubtotal - subtotal);
        const savingsPercent =
          originalSubtotal > 0
            ? ((savings / originalSubtotal) * 100).toFixed(1)
            : "0.0";

        const matchScore = Math.min(
          99,
          Math.max(1, Math.round(hit.rank_score * 100))
        );
        const visualSimilarityPct = Math.min(
          100,
          Math.max(1, Math.round(hit.visual_similarity * 100))
        );
        const priceScorePct = Math.min(
          100,
          Math.max(1, Math.round(hit.price_score * 100))
        );
        const geoScorePct = Math.min(
          100,
          Math.max(1, Math.round(Math.exp(-distKm / 45.0) * 100))
        );

        return {
          providerId: hit.product.provider_id,
          providerName: provName,
          initial: provName.charAt(0).toUpperCase(),
          verified: isVerified,
          rating: provRating,
          reviewCount: provReviewCount,
          location: `${provLocation} (${distKm} km)`,
          deliveryTime,
          deliveryCarrier,
          distance: `${distKm} km`,
          distKm,
          subtotal,
          shippingCost: baseShipping,
          total,
          originalTotal: originalSubtotal,
          savings,
          savingsPercent,
          matchScore,
          visualSimilarityPct,
          priceScorePct,
          geoScorePct,
          hitProduct: hit.product,
        };
      })
    );

    allRankedHits.value = evaluatedHits;

    // Only providers that actually own requested products are valid options.
    const ownedOptions = evaluatedHits.filter(
      (h) => ownedSeedIdsForProvider(h.providerId).length > 0
    );
    const primary = ownedOptions[0] ?? null;
    rankedPrimary.value = primary;

    rankedAlternative.value = primary
      ? ownedOptions.find((h) => h.providerId !== primary.providerId) ?? null
      : null;

    isSearching.value = false;
    router.push({
      name: "smart-search",
      query: { ...route.query, step: "results" },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error("Error executing smart search:", err);
    isSearching.value = false;
    noResultsFound.value = true;
    rankedPrimary.value = null;
    rankedAlternative.value = null;
  }
};

const goToConfigView = () => {
  router.push({
    name: "smart-search",
    query: { ...route.query, step: "config" },
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const openGpsModal = () => {
  showGpsModal.value = true;
};

const handleLocationConfirmed = (result: AddressPickerResult) => {
  deliveryAddress.value = result.address;
  deliveryLat.value = result.latitude;
  deliveryLng.value = result.longitude;
  showGpsModal.value = false;

  if (viewMode.value === "results") {
    executeSearch();
  }
};

const openOptionDetails = (option: EvaluatedOption) => {
  selectedOptionDetail.value = option;
  showDetailModal.value = true;
};

const confirmAndOrder = async () => {
  if (!selectedOptionDetail.value) return;

  // Never invent an option: only quote the requested products this provider
  // actually owns.
  const ownedIds = ownedSeedIdsForProvider(selectedOptionDetail.value.providerId);
  if (ownedIds.length === 0) {
    showDetailModal.value = false;
    window.alert(
      "Este proveedor no ofrece los productos de tu lista. No se generó ninguna cotización."
    );
    return;
  }

  if (!authStore.isAuthenticated) {
    showDetailModal.value = false;
    router.push({
      name: "login",
      query: { redirect: route.fullPath },
    });
    return;
  }

  isCreatingQuote.value = true;
  try {
    await quoteApi.createQuote({
      provider_id: selectedOptionDetail.value.providerId,
      payment_preference: "card",
      shipping_address: deliveryAddress.value,
      buyer_notes: "Cotización generada automáticamente vía Búsqueda Inteligente",
      items: selectedOptionOwnedItems.value.map((p) => ({
        product_id: p.id,
        quantity: p.quantity,
        shipping_preference: "own_delivery",
      })),
    });

    showDetailModal.value = false;
    window.alert("¡Cotización generada exitosamente con el comercio seleccionado!");
    router.push({ name: "orders" });
  } catch (err: any) {
    console.error("Error creating quote:", err);
    window.alert(err?.message || "Ocurrió un error al registrar la cotización.");
  } finally {
    isCreatingQuote.value = false;
  }
};

// Creates a quote for a single provider covering its exact owned subset.
const confirmCoverageOrder = async (group: CoverageGroupView) => {
  if (group.items.length === 0) {
    window.alert("Este proveedor no ofrece los productos de tu lista.");
    return;
  }

  if (!authStore.isAuthenticated) {
    router.push({
      name: "login",
      query: { redirect: route.fullPath },
    });
    return;
  }

  isCreatingQuote.value = true;
  try {
    await quoteApi.createQuote({
      provider_id: group.providerId,
      payment_preference: "card",
      shipping_address: deliveryAddress.value,
      buyer_notes:
        "Cotización generada automáticamente vía Búsqueda Inteligente (cobertura por proveedor)",
      items: group.items.map((p) => ({
        product_id: p.id,
        quantity: p.quantity,
        shipping_preference: "own_delivery",
      })),
    });

    window.alert(`¡Cotización generada exitosamente con ${group.providerName}!`);
    router.push({ name: "orders" });
  } catch (err: any) {
    console.error("Error creating quote:", err);
    window.alert(err?.message || "Ocurrió un error al registrar la cotización.");
  } finally {
    isCreatingQuote.value = false;
  }
};

onMounted(async () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  isLoadingCatalog.value = true;

  if (!geoStore.isInitialized) {
    await geoStore.initialize().catch((err) => {
      console.error("Failed to initialize geo store:", err);
    });
  }

  try {
    await categoryStore.fetchCategories().catch(console.warn);
    const catRes = await categoryApi.getCategories();
    if (catRes && catRes.data) {
      catRes.data.forEach((c) => {
        categoriesMap.value.set(c.id, c.name);
      });
    }
  } catch {
    // Non-blocking
  }

  try {
    const productsRes = await productApi.getProducts({ limit: 50 });
    if (productsRes.data && productsRes.data.length > 0) {
      const mapped: CatalogProductItem[] = await Promise.all(
        productsRes.data.map(async (p) => {
          let provName = "Proveedor Asociado";
          try {
            const org = await orgStore.getPublicProvider(p.provider_id);
            provName = org.company_name;
          } catch {
            // Non-blocking
          }

          const catName = categoryStore.getCategoryName(
            p.category_id,
            categoriesMap.value.get(p.category_id) || "Catálogo General"
          );
          const blobId =
            p.image_blob_ids && p.image_blob_ids.length > 0
              ? p.image_blob_ids[0]
              : null;

          return {
            id: p.id,
            name: p.title,
            category: catName,
            price: Number(p.base_price),
            imageBlobId: blobId,
            providerId: p.provider_id,
            providerName: provName,
          };
        })
      );

      availableCatalog.value = mapped;
    }
  } catch (err) {
    console.error("Failed to fetch initial products:", err);
  } finally {
    isLoadingCatalog.value = false;
  }

  // After a reload on the results step, rebuild the ranking/coverage from the
  // restored product list so the provider list is never empty.
  if (viewMode.value === "results" && selectedProducts.value.length > 0) {
    await executeSearch();
  }
});
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0 overflow-y-auto w-full p-4 sm:p-6 lg:p-10 gap-6 box-border relative">
    <!-- Loading Overlay for Algorithm Execution -->
    <div
      v-if="isSearching"
      class="fixed inset-0 bg-[#083c5a]/40 backdrop-blur-xs flex flex-col items-center justify-center z-50 transition-all duration-300"
    >
      <div class="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center border border-teal-100">
        <div class="w-14 h-14 rounded-full bg-teal-50 border-4 border-teal-500 border-t-transparent animate-spin flex items-center justify-center text-teal-600 text-xl">
        </div>
        <div>
          <h4 class="font-serif text-lg font-bold text-[#083c5a]">Ejecutando Búsqueda Inteligente</h4>
          <p class="text-xs text-slate-500 mt-1">{{ searchStepMessage }}</p>
        </div>
      </div>
    </div>

    <!-- Header Banner -->
    <div class="flex flex-col md:flex-row justify-between items-start gap-6 mb-2">
      <div class="flex-1">
        <h1 class="font-serif text-3xl font-bold text-[#083c5a] flex items-center gap-3 mb-1.5">
          <Search :size="30" class="text-[#ff6a00]" />
          Búsqueda Inteligente
        </h1>
        <p class="text-slate-500 text-sm leading-relaxed max-w-2xl">
          Selecciona tus productos, fija tu ubicación y afina el algoritmo en tiempo real para encontrar los mejores proveedores combinando <strong>precio</strong>, <strong>proximidad</strong> y <strong>similitud de producto</strong>.
        </p>
      </div>
      <div class="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center gap-3.5 max-w-sm shadow-xs">
        <div class="w-10 h-10 rounded-full bg-[#083c5a] text-white flex items-center justify-center text-lg shrink-0">
          <WandSparkles :size="20" />
        </div>
        <div class="text-xs">
          <strong class="text-[#083c5a] text-sm block mb-0.5">Algoritmo en 2 Etapas</strong>
          <p class="text-slate-600 leading-snug">Filtrado vectorial inicial seguido de re-puntuación multivariable con PostGIS y optimización de presupuesto.</p>
        </div>
      </div>
    </div>

    <!-- View Mode: Config -->
    <div v-if="viewMode === 'config'" class="flex flex-col gap-7">
      <!-- Steps / Feature Overview -->
      <div class="bg-white border border-slate-200 rounded-2xl p-5 md:p-7 shadow-xs">
        <span class="text-xs font-bold text-[#083c5a] tracking-wider block mb-4">PASOS RECOMENDADOS</span>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-orange-100 text-orange-600">
              <PackageOpen :size="16" />
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">1. Lista de productos</strong>
              <p class="text-slate-500 leading-normal">Selecciona los artículos que deseas cotizar o reemplazar.</p>
            </div>
          </div>
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-teal-100 text-teal-700">
              <MapPin :size="16" />
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">2. Ubicación de entrega</strong>
              <p class="text-slate-500 leading-normal">Coordenadas GPS reales para calcular flete y distancia exacta.</p>
            </div>
          </div>
          <div class="flex items-start gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 bg-indigo-100 text-indigo-700">
              <SlidersHorizontal :size="16" />
            </div>
            <div class="text-xs">
              <strong class="text-[#083c5a] text-sm block mb-1">3. Afina el algoritmo</strong>
              <p class="text-slate-500 leading-normal">Usa presets o sliders para balancear precio, distancia y similitud.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Config Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Panel Products -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 flex flex-col shadow-xs">
          <div class="flex justify-between items-center mb-1.5">
            <h3 class="font-serif text-lg font-bold text-[#083c5a] flex items-center gap-2.5">
              <ListChecks :size="18" class="text-teal-600" /> Productos seleccionados ({{ selectedProducts.length }})
            </h3>
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Semillas de Búsqueda
            </span>
          </div>
          <p class="text-slate-500 text-sm mb-4">El algoritmo extraerá los vectores visuales de estos productos para encontrar sustitutos y ofertas.</p>

          <div v-if="selectedProducts.length === 0" class="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center text-center mb-5">
            <div class="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-2xl mb-3">
              <ClipboardList :size="24" />
            </div>
            <h4 class="text-base font-bold text-[#083c5a] mb-1">Tu lista de productos está vacía</h4>
            <p class="text-slate-500 text-sm leading-normal max-w-xs mb-5">Agrega al menos un producto para iniciar la búsqueda vectorial.</p>
            <button
              type="button"
              class="bg-[#189c94] hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all duration-200 shadow-sm cursor-pointer"
              @click="showProductModal = true"
            >
              Buscar y agregar productos
            </button>
          </div>
          <div v-else class="flex flex-col gap-3 mb-5 max-h-80 overflow-y-auto pr-1">
            <div
              v-for="(prod, idx) in selectedProducts"
              :key="prod.id"
              class="flex items-center gap-3 bg-slate-50 p-2.5 px-3 rounded-xl border border-slate-200"
            >
              <div class="w-12 h-12 shrink-0 rounded-lg bg-white border border-slate-200 p-1 overflow-hidden flex items-center justify-center">
                <ProductImage
                  :blob-id="prod.imageBlobId"
                  :product-id="prod.id"
                />
              </div>
              <div class="flex-1 flex flex-col min-w-0">
                <strong class="text-sm font-semibold text-[#083c5a] truncate">{{ prod.name }}</strong>
                <div class="flex items-center gap-2 mt-0.5">
                  <div class="inline-flex items-center border border-slate-200 rounded-md bg-white overflow-hidden text-xs">
                    <button
                      type="button"
                      class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                      @click="prod.quantity > 1 ? prod.quantity-- : removeProduct(idx)"
                    >
                      -
                    </button>
                    <span class="px-2 py-0.5 font-bold text-slate-700 min-w-6 text-center">{{ prod.quantity }}</span>
                    <button
                      type="button"
                      class="px-1.5 py-0.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                      @click="prod.quantity++"
                    >
                      +
                    </button>
                  </div>
                  <span class="text-xs text-slate-500">C$ {{ prod.price.toLocaleString() }} c/u</span>
                </div>
              </div>
              <div class="text-right mr-2 shrink-0">
                <span class="text-xs font-bold text-[#083c5a] block">C$ {{ (prod.price * prod.quantity).toLocaleString() }}</span>
              </div>
              <button
                type="button"
                class="text-slate-400 hover:text-red-500 text-sm p-1 transition-colors cursor-pointer shrink-0"
                title="Eliminar producto"
                @click="removeProduct(idx)"
              >
                <X :size="16" />
              </button>
            </div>
            <button
              type="button"
              class="border border-[#189c94] text-[#189c94] hover:bg-teal-50 py-2 rounded-full font-semibold text-sm transition-colors cursor-pointer mt-1"
              @click="showProductModal = true"
            >
              + Agregar otro producto al pedido
            </button>
          </div>
          <div class="mt-auto flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-3 rounded-xl">
            <Info :size="16" class="text-teal-600 shrink-0" />
            <span><strong>Tip:</strong> Puedes cotizar múltiples artículos a la vez para encontrar un proveedor que cubra todo tu pedido.</span>
          </div>
        </div>

        <!-- Panel Location & Sliders -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 md:p-7 flex flex-col shadow-xs">
          <!-- Ubicación -->
          <h3 class="font-serif text-lg font-bold text-[#083c5a] flex items-center gap-2.5 mb-1.5">
            <MapPin :size="18" class="text-[#ff6a00]" /> Ubicación de entrega
          </h3>
          <p class="text-slate-500 text-sm mb-3">Las distancias y tiempos se calculan desde estas coordenadas.</p>

          <div class="flex flex-col sm:flex-row gap-2.5 mb-5">
            <div class="flex-1 flex items-center border border-slate-300 rounded-xl px-3.5 py-2 bg-white gap-2 focus-within:border-teal-500 shadow-2xs">
              <MapPin :size="16" class="text-teal-600" />
              <input
                v-model="deliveryAddress"
                type="text"
                placeholder="Ingresa tu ubicación de entrega"
                class="w-full border-none outline-none text-sm text-slate-800 bg-transparent truncate"
              />
              <span class="text-[10px] bg-slate-100 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                {{ deliveryLat.toFixed(2) }}, {{ deliveryLng.toFixed(2) }}
              </span>
            </div>
            <button
              type="button"
              class="border border-slate-300 hover:border-teal-600 bg-white text-[#083c5a] hover:text-teal-600 px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              @click="openGpsModal"
            >
              <Crosshair :size="16" class="text-teal-600" /> Elegir en Mapa
            </button>
          </div>

          <!-- Afinamiento del Algoritmo (Sliders & Presets) -->
          <div class="flex flex-col gap-3.5 border-t border-slate-100 pt-4">
            <div class="flex justify-between items-center">
              <div>
                <label class="font-bold text-sm text-[#083c5a] flex items-center gap-2">
                  <SlidersHorizontal :size="16" class="text-[#189c94]" />
                  Afinamiento del Algoritmo
                </label>
                <p class="text-slate-500 text-xs mt-0.5">Personaliza qué factores prioriza la función de ranking.</p>
              </div>
              <span
                v-if="activePreset === 'custom'"
                class="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full"
              >
                Personalizado
              </span>
            </div>

            <!-- Presets Rápidos -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center',
                  activePreset === 'balanced'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                ]"
                @click="selectPreset('balanced')"
              >
                <Scale :size="14" /><span>Equilibrado</span>
              </button>
              <button
                type="button"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center',
                  activePreset === 'savings'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                ]"
                @click="selectPreset('savings')"
              >
                <Tags :size="14" /><span>Mayor Ahorro</span>
              </button>
              <button
                type="button"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center',
                  activePreset === 'fast'
                    ? 'bg-[#ff6a00] text-white border-[#ff6a00] shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                ]"
                @click="selectPreset('fast')"
              >
                <Zap :size="14" /><span>Más Cercano</span>
              </button>
              <button
                type="button"
                :class="[
                  'py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border text-center',
                  activePreset === 'fidelity'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                ]"
                @click="selectPreset('fidelity')"
              >
                <Target :size="14" /><span>Máxima Fidelidad</span>
              </button>
            </div>

            <!-- Sliders Interactivos -->
            <div class="flex flex-col gap-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 mt-1">
              <!-- Slider 1: Precio -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                    <CircleDollarSign :size="14" class="text-emerald-600" /> Competitividad en Precio
                  </span>
                  <span class="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                    {{ normalizedPricePct }}% peso
                  </span>
                </div>
                <input
                  :value="priceWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1.5 rounded-lg bg-slate-200 outline-none accent-emerald-600 cursor-pointer"
                  @input="onSliderInput('price', ($event.target as HTMLInputElement).valueAsNumber)"
                />
              </div>

              <!-- Slider 2: Distancia -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Navigation :size="14" class="text-[#ff6a00]" /> Proximidad Geográfica (PostGIS)
                  </span>
                  <span class="font-bold text-[#ff6a00] bg-orange-100/70 px-2 py-0.5 rounded text-[11px]">
                    {{ normalizedGeoPct }}% peso
                  </span>
                </div>
                <input
                  :value="geoWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1.5 rounded-lg bg-slate-200 outline-none accent-[#ff6a00] cursor-pointer"
                  @input="onSliderInput('geo', ($event.target as HTMLInputElement).valueAsNumber)"
                />
              </div>

              <!-- Slider 3: Similitud Visual -->
              <div class="flex flex-col gap-1">
                <div class="flex justify-between items-center text-xs">
                  <span class="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Target :size="14" class="text-indigo-600" /> Fidelidad de Producto (Vectorial)
                  </span>
                  <span class="font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded text-[11px]">
                    {{ normalizedVisualPct }}% peso
                  </span>
                </div>
                <input
                  :value="visualWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1.5 rounded-lg bg-slate-200 outline-none accent-indigo-600 cursor-pointer"
                  @input="onSliderInput('visual', ($event.target as HTMLInputElement).valueAsNumber)"
                />
              </div>
            </div>

            <span class="text-[11px] text-slate-400">
              * La suma de los pesos se normaliza automáticamente al 100% para computar la puntuación final.
            </span>
          </div>
        </div>
      </div>

      <!-- Action Button Zone -->
      <div class="flex flex-col items-center gap-2.5 mt-2">
        <button
          type="button"
          class="bg-gradient-to-b from-[#ff7a18] to-[#ff5500] hover:shadow-lg hover:shadow-orange-500/30 text-white font-bold text-lg px-12 py-3.5 rounded-full inline-flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          @click="executeSearch"
        >
          <Search :size="20" /> Ejecutar Búsqueda Inteligente
        </button>
        <span class="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
          <CircleCheck :size="16" /> Compara candidatos en paralelo en base a tus prioridades.
        </span>
      </div>
    </div>

    <!-- View Mode: Results -->
    <div v-else class="flex flex-col">
      <div class="grid grid-cols-1 lg:grid-cols-[310px_1fr] gap-6 items-start">
        <!-- Sidebar with live tuning -->
        <aside class="flex flex-col gap-5">
          <!-- Products Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <div class="flex items-start gap-3 mb-3">
              <ClipboardList :size="20" class="text-slate-500 mt-0.5 shrink-0" />
              <div>
                <h4 class="text-base font-bold text-[#083c5a] mb-0.5">Productos cotizados</h4>
                <p class="text-xs text-slate-500">{{ selectedProducts.length }} productos seleccionados</p>
              </div>
            </div>
            <div class="flex flex-col gap-2.5 mb-3.5 max-h-56 overflow-y-auto pr-1">
              <div
                v-for="(prod, idx) in selectedProducts"
                :key="prod.id"
                class="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl p-2 px-2.5 relative"
              >
                <div class="w-10 h-10 shrink-0 rounded bg-white p-0.5 border border-slate-100 overflow-hidden flex items-center justify-center">
                  <ProductImage
                    :blob-id="prod.imageBlobId"
                    :product-id="prod.id"
                  />
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                  <h5 class="text-xs font-bold text-[#083c5a] truncate">{{ prod.name }}</h5>
                  <span class="text-[11px] text-slate-500">{{ prod.quantity }} und • C$ {{ prod.price.toLocaleString() }}</span>
                </div>
                <button
                  type="button"
                  class="text-slate-400 hover:text-red-500 text-xs p-1 cursor-pointer"
                  title="Eliminar producto"
                  @click="removeProduct(idx)"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>
            <button
              type="button"
              class="border border-[#189c94] text-[#189c94] hover:bg-[#189c94] hover:text-white py-2 px-3 rounded-full font-semibold text-xs transition-colors cursor-pointer text-center"
              @click="showProductModal = true"
            >
              + Agregar otro producto
            </button>
          </div>

          <!-- Location Summary -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <h4 class="text-base font-bold text-[#083c5a] mb-0.5">Ubicación de entrega</h4>
            <p class="text-xs text-slate-500">Calculando envíos desde este punto:</p>
            <div class="flex items-center gap-2 border border-teal-500 bg-teal-50/50 rounded-xl p-2.5 my-3 text-xs text-[#083c5a] font-semibold">
              <MapPin :size="16" class="text-teal-600 shrink-0" />
              <span class="truncate">{{ deliveryAddress }}</span>
            </div>
            <button
              type="button"
              class="border border-teal-500 hover:bg-teal-50 text-teal-700 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              @click="openGpsModal"
            >
              Cambiar Ubicación <Crosshair :size="14" />
            </button>
          </div>

          <!-- Live Preferences Tuning Sidebar -->
          <div class="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col shadow-xs">
            <div class="flex justify-between items-center mb-1">
              <h4 class="text-base font-bold text-[#083c5a]">Afinar Algoritmo</h4>
              <span class="text-[10px] font-bold text-slate-400">EN VIVO</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">Re-balancea los pesos para ver cómo cambia el ranking.</p>

            <!-- Mini Preset Pills -->
            <div class="grid grid-cols-2 gap-1.5 mb-3">
              <button
                type="button"
                :class="[
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border',
                  activePreset === 'balanced'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                ]"
                @click="selectPreset('balanced')"
              >
                <Scale :size="12" class="inline" /> Equilibrado
              </button>
              <button
                type="button"
                :class="[
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border',
                  activePreset === 'savings'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                ]"
                @click="selectPreset('savings')"
              >
                <Tags :size="12" class="inline" /> Ahorro
              </button>
              <button
                type="button"
                :class="[
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border',
                  activePreset === 'fast'
                    ? 'bg-[#ff6a00] text-white border-[#ff6a00]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                ]"
                @click="selectPreset('fast')"
              >
                <Zap :size="12" class="inline" /> Cercano
              </button>
              <button
                type="button"
                :class="[
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border',
                  activePreset === 'fidelity'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                ]"
                @click="selectPreset('fidelity')"
              >
                <Target :size="12" class="inline" /> Fidelidad
              </button>
            </div>

            <!-- Mini Sliders -->
            <div class="flex flex-col gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-4">
              <div class="flex flex-col gap-0.5">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-600 font-semibold">Precio</span>
                  <strong class="text-emerald-700">{{ normalizedPricePct }}%</strong>
                </div>
                <input
                  v-model.number="priceWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1 rounded bg-slate-200 outline-none accent-emerald-600 cursor-pointer"
                  @input="onSliderChange"
                />
              </div>

              <div class="flex flex-col gap-0.5">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-600 font-semibold">Distancia</span>
                  <strong class="text-[#ff6a00]">{{ normalizedGeoPct }}%</strong>
                </div>
                <input
                  v-model.number="geoWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1 rounded bg-slate-200 outline-none accent-[#ff6a00] cursor-pointer"
                  @input="onSliderChange"
                />
              </div>

              <div class="flex flex-col gap-0.5">
                <div class="flex justify-between text-[11px]">
                  <span class="text-slate-600 font-semibold">Similitud</span>
                  <strong class="text-indigo-700">{{ normalizedVisualPct }}%</strong>
                </div>
                <input
                  v-model.number="visualWeight"
                  type="range"
                  min="0"
                  max="100"
                  class="w-full h-1 rounded bg-slate-200 outline-none accent-indigo-600 cursor-pointer"
                  @input="onSliderChange"
                />
              </div>
            </div>

            <button
              type="button"
              class="bg-gradient-to-b from-[#ff7a18] to-[#ff5500] hover:shadow-md hover:shadow-orange-500/20 text-white font-bold text-sm py-2.5 px-4 rounded-full flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              @click="executeSearch"
            >
              <RefreshCw :size="16" /> Recalcular Ranking
            </button>
            <button
              type="button"
              class="text-slate-500 hover:text-[#083c5a] text-xs font-semibold mt-3 flex items-center justify-center gap-1.5 cursor-pointer"
              @click="goToConfigView"
            >
              <ArrowLeft :size="14" /> Modificar búsqueda
            </button>
          </div>
        </aside>

        <!-- Main Results Area -->
        <main class="flex flex-col gap-5">
          <!-- Top Results Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="font-serif text-2xl text-[#083c5a] font-bold flex items-center gap-2 mb-1">
                <Search :size="20" class="text-[#ff6a00]" />
                Opciones recomendadas
              </h2>
              <p class="text-slate-500 text-sm">
                Rankeadas por afinamiento: <strong>{{ normalizedPricePct }}% precio</strong>, <strong>{{ normalizedGeoPct }}% proximidad</strong>, <strong>{{ normalizedVisualPct }}% similitud</strong>.
              </p>
            </div>
            <div v-if="primaryOption && coverageTotalItems > 0 && primaryOwnedIds.length === coverageTotalItems" class="bg-teal-50 border border-teal-200 rounded-2xl p-2.5 px-4 flex items-center gap-3 shadow-xs">
              <div class="flex flex-col">
                <span class="text-xs text-teal-700">Ahorro con mejor opción:</span>
                <strong class="text-lg text-[#083c5a] font-bold leading-tight">C$ {{ primaryOption.savings.toLocaleString() }}</strong>
              </div>
              <PiggyBank :size="24" class="text-teal-600" />
            </div>
          </div>

          <!-- Provider Coverage (exact ownership of the requested list) -->
          <div
            v-if="coverage"
            class="rounded-2xl border p-5 md:p-6 shadow-xs"
            :class="coverage.single_provider ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'"
          >
            <div class="flex items-start gap-3">
              <CircleCheck
                v-if="coverage.single_provider"
                :size="24"
                class="text-emerald-600 mt-0.5 shrink-0"
              />
              <TriangleAlert
                v-else
                :size="24"
                class="text-amber-600 mt-0.5 shrink-0"
              />
              <div class="flex-1">
                <h3 class="font-serif text-lg font-bold text-[#083c5a]">
                  {{ coverage.single_provider ? 'Un proveedor puede cubrir toda tu lista' : 'Ningún proveedor tiene tu lista completa' }}
                </h3>
                <p class="text-sm text-slate-600 mt-1 mb-3">{{ coverage.message }}</p>

                <div class="flex flex-col gap-2">
                  <div
                    v-for="group in coverageGroups"
                    :key="group.providerId"
                    class="bg-white/80 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <strong class="text-sm text-[#083c5a]">{{ group.providerName }}</strong>
                        <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">
                          {{ group.itemCount }} de {{ coverage.total_items }} productos
                        </span>
                      </div>
                      <p class="text-xs text-slate-500 mt-1 line-clamp-2">
                        {{ group.items.map((i) => i.name).join(', ') }}
                      </p>
                      <span class="text-xs font-semibold text-[#083c5a]">
                        Subtotal: C$ {{ group.subtotal.toLocaleString() }}
                      </span>
                    </div>
                    <button
                      type="button"
                      :disabled="isCreatingQuote"
                      class="shrink-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer shadow-sm"
                      @click="confirmCoverageOrder(group)"
                    >
                      Cotizar con {{ group.providerName }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty Results State -->
          <div
            v-if="!primaryOption && !isSearching && (!coverage || coverage.groups.length === 0)"
            class="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 flex flex-col items-center text-center shadow-xs"
          >
            <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl mb-4">
              <Store :size="28" />
            </div>
            <h3 class="font-serif text-xl font-bold text-[#083c5a] mb-2">No se encontraron alternativas coincidentes</h3>
            <p class="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
              El motor Two-Stage (pgvector + PostGIS) no encontró proveedores con stock disponible que coincidan con los criterios y pesos seleccionados.
            </p>
            <div class="flex flex-wrap gap-3 justify-center">
              <button
                type="button"
                class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-2.5 rounded-full transition-colors cursor-pointer inline-flex items-center gap-2"
                @click="goToConfigView"
              >
                <SlidersHorizontal :size="14" /> Cambiar Productos o Sliders
              </button>
            </div>
          </div>

          <template v-else-if="primaryOption && primaryOwnedIds.length > 0">
            <!-- Primary Recommendation Card -->
            <div class="bg-white border-2 border-teal-500 rounded-2xl relative overflow-hidden pt-7 shadow-xs">
              <div class="absolute top-0 left-5 bg-teal-600 text-white text-xs font-bold py-1 px-4 rounded-b-xl shadow-xs flex items-center gap-2">
                <Crown :size="14" class="text-amber-300" />
                La mejor opción para tu configuración
              </div>
              <div class="absolute top-2 right-4 flex items-center gap-1.5 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full text-xs font-bold text-teal-800">
                <CircleCheck :size="14" class="text-teal-600" />
                {{ primaryOption.matchScore }}% Coincidencia
              </div>

              <div class="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
                <!-- Proveedor -->
                <div class="flex flex-col">
                  <span class="text-xs text-slate-500 mb-1">Proveedor líder</span>
                  <div class="flex items-center gap-2.5 mb-1.5">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-[#083c5a] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {{ primaryOption.initial }}
                    </div>
                    <div class="flex items-center gap-1.5">
                      <strong class="text-sm text-[#083c5a]">{{ primaryOption.providerName }}</strong>
                      <CircleCheck v-if="primaryOption.verified" :size="14" class="text-sky-500 shrink-0" title="Proveedor verificado" />
                    </div>
                  </div>
                  <div class="flex items-center gap-1.5 text-sm font-bold text-[#083c5a] mb-1">
                    <Star :size="14" class="text-[#ff6a00]" />
                    <span>{{ primaryOption.rating }}</span>
                    <span class="text-xs font-normal text-slate-400">({{ primaryOption.reviewCount }} opiniones)</span>
                  </div>
                  <p class="text-xs text-slate-500 mb-2">{{ primaryOption.location }}</p>

                  <!-- Coverage badges -->
                  <div class="flex flex-wrap gap-1 mt-auto">
                    <span class="text-[10px] bg-teal-50 text-teal-700 font-semibold px-2 py-0.5 rounded border border-teal-100">
                      <Package :size="12" class="inline" /> {{ primaryOwnedIds.length }} de {{ coverageTotalItems }} productos
                    </span>
                    <span
                      class="text-[10px] font-semibold px-2 py-0.5 rounded border"
                      :class="primaryOwnedIds.length === coverageTotalItems ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
                    >
                      {{ primaryOwnedIds.length === coverageTotalItems ? 'Cubre toda la lista' : 'Cobertura parcial' }}
                    </span>
                  </div>
                </div>

              <!-- Logística y Distancia -->
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Tiempo de entrega estimado</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <Truck :size="14" class="text-teal-600" />
                  <strong>{{ primaryOption.deliveryTime }}</strong>
                </div>
                <span class="text-xs text-slate-500 mb-3">{{ primaryOption.deliveryCarrier }}</span>

                <span class="text-xs text-slate-500 mb-0.5">Distancia esferoidal</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <MapPin :size="14" class="text-teal-600" />
                  <strong>{{ primaryOption.distance }}</strong>
                </div>
                <span class="text-xs text-slate-500">Desde {{ deliveryAddress }}</span>
              </div>

              <!-- Costo y Acción -->
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Total estimado del pedido</span>
                <div class="font-serif text-2xl font-bold text-[#ff6a00] leading-tight">
                  C$ {{ primaryOption.total.toLocaleString() }}
                </div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-slate-500 font-medium">+ C$ {{ primaryOption.shippingCost.toLocaleString() }} envío</span>
                </div>
                <span
                  class="inline-flex text-xs px-2.5 py-1 rounded-md w-fit mb-3 font-semibold border"
                  :class="primaryOwnedIds.length === coverageTotalItems ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'"
                >
                  {{ primaryOwnedIds.length === coverageTotalItems ? 'Cubre toda tu lista' : `Cobertura parcial: ${primaryOwnedIds.length} de ${coverageTotalItems} productos` }}
                </span>
                <button
                  type="button"
                  class="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                  @click="openOptionDetails(primaryOption)"
                >
                  Ver detalle y cotizar
                </button>
              </div>
            </div>
          </div>

          <!-- Alternative Recommendation Card -->
          <div
            v-if="alternativeOption && alternativeOption.providerId !== primaryOption.providerId && alternativeOwnedIds.length > 0"
            class="bg-white border border-slate-200 rounded-2xl relative overflow-hidden pt-7 shadow-xs"
          >
            <div class="absolute top-0 left-5 bg-slate-200 text-slate-700 text-xs font-bold py-1 px-4 rounded-b-xl flex items-center gap-2">
              <Scale :size="14" class="text-slate-500" />
              Opción alternativa
            </div>
            <div class="absolute top-2 right-4 flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-700">
              {{ alternativeOption.matchScore }}% Coincidencia
            </div>

            <div class="p-6 md:p-7 grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-1">Proveedor alternativo</span>
                <div class="flex items-center gap-2.5 mb-1.5">
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {{ alternativeOption.initial }}
                  </div>
                  <div class="flex items-center gap-1.5">
                    <strong class="text-sm text-[#083c5a]">{{ alternativeOption.providerName }}</strong>
                    <CircleCheck v-if="alternativeOption.verified" :size="14" class="text-sky-500 shrink-0" />
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-sm font-bold text-[#083c5a] mb-1">
                  <Star :size="14" class="text-[#ff6a00]" />
                  <span>{{ alternativeOption.rating }}</span>
                  <span class="text-xs font-normal text-slate-400">({{ alternativeOption.reviewCount }} opiniones)</span>
                </div>
                <p class="text-xs text-slate-500 mb-2">{{ alternativeOption.location }}</p>

                <div class="flex flex-wrap gap-1 mt-auto">
                  <span class="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                    <Package :size="12" class="inline" /> {{ alternativeOwnedIds.length }} de {{ coverageTotalItems }} productos
                  </span>
                  <span
                    class="text-[10px] font-semibold px-2 py-0.5 rounded border"
                    :class="alternativeOwnedIds.length === coverageTotalItems ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
                  >
                    {{ alternativeOwnedIds.length === coverageTotalItems ? 'Cubre toda la lista' : 'Cobertura parcial' }}
                  </span>
                </div>
              </div>

              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Tiempo de entrega estimado</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <Truck :size="14" class="text-slate-500" />
                  <strong>{{ alternativeOption.deliveryTime }}</strong>
                </div>
                <span class="text-xs text-slate-500 mb-3">{{ alternativeOption.deliveryCarrier }}</span>

                <span class="text-xs text-slate-500 mb-0.5">Distancia esferoidal</span>
                <div class="flex items-center gap-1.5 text-sm font-semibold text-[#083c5a]">
                  <MapPin :size="14" class="text-slate-500" />
                  <strong>{{ alternativeOption.distance }}</strong>
                </div>
                <span class="text-xs text-slate-500">Desde {{ deliveryAddress }}</span>
              </div>

              <div class="flex flex-col">
                <span class="text-xs text-slate-500 mb-0.5">Total estimado del pedido</span>
                <div class="font-serif text-2xl font-bold text-slate-800 leading-tight">
                  C$ {{ alternativeOption.total.toLocaleString() }}
                </div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs text-slate-500 font-medium">+ C$ {{ alternativeOption.shippingCost.toLocaleString() }} envío</span>
                </div>
                <span
                  class="inline-flex text-xs px-2.5 py-1 rounded-md w-fit mb-3 font-semibold border"
                  :class="alternativeOwnedIds.length === coverageTotalItems ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'"
                >
                  {{ alternativeOwnedIds.length === coverageTotalItems ? 'Cubre toda tu lista' : `Cobertura parcial: ${alternativeOwnedIds.length} de ${coverageTotalItems} productos` }}
                </span>
                <button
                  type="button"
                  class="bg-slate-600 hover:bg-slate-700 text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-colors cursor-pointer shadow-sm text-center"
                  @click="openOptionDetails(alternativeOption)"
                >
                  Ver detalle y cotizar
                </button>
              </div>
            </div>
          </div>

          <!-- Comparison Table Matrix -->
          <div
            v-if="alternativeOption && alternativeOption.providerId !== primaryOption.providerId && alternativeOwnedIds.length > 0"
            class="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-xs overflow-x-auto"
          >
            <h4 class="font-serif text-base font-bold text-[#083c5a] mb-3">Matriz Comparativa de Variables</h4>
            <table class="w-full text-left text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-200 bg-slate-50/50">
                  <th class="py-3 px-4 font-bold text-[#083c5a]">Criterio</th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">
                    {{ primaryOption.providerName }}
                    <span class="inline-block text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded ml-1.5">MEJOR OPCIÓN</span>
                  </th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">
                    {{ alternativeOption.providerName }}
                    <span class="inline-block text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded ml-1.5">ALTERNATIVA</span>
                  </th>
                  <th class="py-3 px-4 font-bold text-[#083c5a]">Diferencia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Subtotal productos</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">C$ {{ primaryOption.subtotal.toLocaleString() }}</td>
                  <td class="py-3 px-4 font-semibold text-slate-800">C$ {{ alternativeOption.subtotal.toLocaleString() }}</td>
                  <td class="py-3 px-4 font-semibold" :class="primaryOption.subtotal <= alternativeOption.subtotal ? 'text-emerald-600' : 'text-amber-600'">
                    {{ primaryOption.subtotal <= alternativeOption.subtotal ? 'C$ ' + (alternativeOption.subtotal - primaryOption.subtotal).toLocaleString() + ' más barato' : 'C$ ' + (primaryOption.subtotal - alternativeOption.subtotal).toLocaleString() + ' más costoso' }}
                  </td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Costo de envío estimado</td>
                  <td class="py-3 px-4">C$ {{ primaryOption.shippingCost.toLocaleString() }}</td>
                  <td class="py-3 px-4">C$ {{ alternativeOption.shippingCost.toLocaleString() }}</td>
                  <td class="py-3 px-4 font-semibold" :class="primaryOption.shippingCost <= alternativeOption.shippingCost ? 'text-emerald-600' : 'text-amber-600'">
                    {{ primaryOption.shippingCost <= alternativeOption.shippingCost ? 'C$ ' + (alternativeOption.shippingCost - primaryOption.shippingCost).toLocaleString() + ' menor flete' : 'C$ ' + (primaryOption.shippingCost - alternativeOption.shippingCost).toLocaleString() + ' mayor flete' }}
                  </td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Distancia PostGIS</td>
                  <td class="py-3 px-4">{{ primaryOption.distance }}</td>
                  <td class="py-3 px-4">{{ alternativeOption.distance }}</td>
                  <td class="py-3 px-4 text-slate-600 font-semibold">
                    {{ Math.abs(primaryOption.distKm - alternativeOption.distKm).toFixed(1) }} km de diferencia
                  </td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Tiempo de entrega</td>
                  <td class="py-3 px-4">{{ primaryOption.deliveryTime }}</td>
                  <td class="py-3 px-4">{{ alternativeOption.deliveryTime }}</td>
                  <td class="py-3 px-4 text-slate-500 text-xs">Dependiente de ruta</td>
                </tr>
                <tr>
                  <td class="py-3 px-4 font-medium text-slate-600">Calificación</td>
                  <td class="py-3 px-4">{{ primaryOption.rating }} <Star :size="14" class="inline text-amber-500" /></td>
                  <td class="py-3 px-4">{{ alternativeOption.rating }} <Star :size="14" class="inline text-amber-500" /></td>
                  <td class="py-3 px-4 text-slate-600 font-semibold">
                    {{ (Number(primaryOption.rating) - Number(alternativeOption.rating)) >= 0 ? '+' : '' }}{{ (Number(primaryOption.rating) - Number(alternativeOption.rating)).toFixed(1) }}
                  </td>
                </tr>
                <tr class="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <td class="py-3 px-4 text-[#083c5a]">Total general a pagar</td>
                  <td class="py-3 px-4 text-[#083c5a]">C$ {{ primaryOption.total.toLocaleString() }}</td>
                  <td class="py-3 px-4 text-[#083c5a]">C$ {{ alternativeOption.total.toLocaleString() }}</td>
                  <td class="py-3 px-4 font-bold" :class="primaryOption.total <= alternativeOption.total ? 'text-emerald-600' : 'text-amber-600'">
                    {{ primaryOption.total <= alternativeOption.total ? 'C$ ' + (alternativeOption.total - primaryOption.total).toLocaleString() + ' mejor total' : 'C$ ' + (primaryOption.total - alternativeOption.total).toLocaleString() + ' diferencia' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        </main>
      </div>
    </div>

    <!-- Product Catalog Modal -->
    <div
      v-if="showProductModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showProductModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-[#083c5a] flex items-center gap-2">
            <ShoppingBag :size="18" class="text-teal-600" /> Agregar Productos a Búsqueda Inteligente
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="showProductModal = false"><X :size="20" /></button>
        </div>
        <div class="flex items-center px-6 py-3 bg-slate-50 border-b border-slate-200 gap-2">
          <Search :size="16" class="text-slate-400" />
          <input
            v-model="productSearchFilter"
            type="text"
            placeholder="Buscar por nombre, categoría o comercio..."
            class="w-full bg-transparent border-none outline-none text-sm text-slate-800"
          />
        </div>
        <div class="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh]">
          <div v-if="isLoadingCatalog" class="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
            <LoaderCircle :size="24" class="animate-spin text-teal-600" />
            <span class="text-xs">Cargando catálogo de productos...</span>
          </div>
          <div v-else-if="filteredCatalog.length === 0" class="col-span-full py-12 text-center text-slate-400 text-sm">
            No se encontraron productos coincidentes en el catálogo.
          </div>
          <div
            v-for="item in filteredCatalog"
            :key="item.id"
            class="border border-slate-200 rounded-xl p-3.5 flex flex-col bg-white hover:border-teal-500 hover:shadow-md transition-all shadow-2xs group"
          >
            <div class="w-full h-28 mb-2 p-1 bg-slate-50 rounded-lg overflow-hidden flex items-center justify-center group-hover:scale-[1.02] transition-transform">
              <ProductImage
                :blob-id="item.imageBlobId"
                :product-id="item.id"
              />
            </div>
            <div class="mb-1 flex">
              <span class="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200/80 px-2 py-0.5 text-[10px] font-semibold text-teal-700 shadow-2xs">
                <i class="fa-solid fa-tag text-[8px] text-teal-600"></i>
                {{ item.category }}
              </span>
            </div>
            <h5 class="text-sm font-bold text-[#083c5a] my-0.5 line-clamp-2 min-h-[2.5rem] leading-tight" :title="item.name">
              {{ item.name }}
            </h5>
            <span class="text-xs text-slate-400 mb-1 truncate" :title="item.providerName">Por: {{ item.providerName }}</span>
            <span class="text-sm font-bold text-[#ff6a00] mb-2.5">C$ {{ item.price.toLocaleString() }}</span>
            <button
              type="button"
              class="bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer mt-auto flex items-center justify-center gap-1.5 shadow-2xs hover:shadow"
              @click="addProductFromCatalog(item)"
            >
              <Plus :size="14" /> Agregar al Pedido
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- GPS Location Modal (AddressPickerModal) -->
    <AddressPickerModal
      v-model="showGpsModal"
      :initial-lat="initialLat"
      :initial-lng="initialLng"
      :initial-address="initialAddress"
      @confirm="handleLocationConfirmed"
    />

    <!-- Order Detail Modal -->
    <div
      v-if="showDetailModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showDetailModal = false"
    >
      <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div class="flex justify-between items-center p-5 border-b border-slate-200">
          <h3 class="text-base font-bold text-[#083c5a] flex items-center gap-2">
            <CircleCheck :size="18" class="text-teal-600" /> Pedido con {{ selectedOptionDetail?.providerName }}
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-600 cursor-pointer" @click="showDetailModal = false"><X :size="20" /></button>
        </div>
        <div class="p-6 flex flex-col gap-4 overflow-y-auto">
          <div class="flex gap-3 bg-teal-50 border border-teal-200 p-3.5 rounded-xl">
            <CircleCheck :size="24" class="text-teal-600 shrink-0 mt-0.5" />
            <div class="text-xs text-slate-700 leading-snug">
              <strong class="text-[#083c5a] text-sm block mb-0.5">¡Proveedor optimizado por algoritmo!</strong>
              Tu pedido será preparado por <strong>{{ selectedOptionDetail?.providerName }}</strong> y despachado hacia <strong>{{ deliveryAddress }}</strong> ({{ selectedOptionDetail?.distance }}).
            </div>
          </div>
          <h4 class="text-sm font-bold text-[#083c5a]">Resumen de Productos ({{ selectedOptionOwnedItems.length }})</h4>
          <div class="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
            <div
              v-for="item in selectedOptionOwnedItems"
              :key="item.id"
              class="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200"
            >
              <div class="w-9 h-9 shrink-0 bg-white rounded border border-slate-100 p-0.5 overflow-hidden flex items-center justify-center">
                <ProductImage
                  :blob-id="item.imageBlobId"
                  :product-id="item.id"
                />
              </div>
              <div class="flex-1 flex flex-col">
                <strong class="text-xs font-semibold text-[#083c5a]">{{ item.name }}</strong>
                <span class="text-[11px] text-slate-500">{{ item.quantity }} unidades x C$ {{ item.price.toLocaleString() }}</span>
              </div>
              <span class="text-xs font-bold text-[#083c5a]">
                C$ {{ (item.price * item.quantity).toLocaleString() }}
              </span>
            </div>
          </div>
          <hr class="border-slate-200 my-1" />
          <div class="flex flex-col gap-1.5 text-xs text-slate-600">
            <div class="flex justify-between">
              <span>Subtotal productos:</span>
              <strong class="text-slate-800">C$ {{ selectedOptionDetail?.subtotal?.toLocaleString() }}</strong>
            </div>
            <div class="flex justify-between">
              <span>Costo de flete:</span>
              <strong class="text-slate-800">C$ {{ selectedOptionDetail?.shippingCost?.toLocaleString() }}</strong>
            </div>
            <div class="flex justify-between text-sm text-[#083c5a] font-bold border-t border-dashed border-slate-300 pt-2 mt-1">
              <span>Total a pagar:</span>
              <span class="text-[#ff6a00]">C$ {{ selectedOptionDetail?.total?.toLocaleString() }}</span>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            class="border border-slate-300 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-semibold text-xs cursor-pointer"
            @click="showDetailModal = false"
          >
            Cerrar
          </button>
          <button
            type="button"
            :disabled="isCreatingQuote"
            class="bg-[#ff6a00] hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-lg cursor-pointer shadow-sm flex items-center gap-2"
            @click="confirmAndOrder"
          >
            <LoaderCircle v-if="isCreatingQuote" :size="14" class="animate-spin" />
            <span>{{ isCreatingQuote ? "Generando cotización..." : "Confirmar y Realizar Pedido" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
