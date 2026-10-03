<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import ProductImageCarousel from "./ProductImageCarousel.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";
import { useOrganizationStore } from "@/stores/organization";
import { useFavoritesStore, useCategoryStore } from "@/stores/commerce";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  providerId: string;
  categoryId?: string | null;
  categoryName?: string | null;
  minOrder?: number;
  unitOfMeasure?: string | null;
  isActive?: boolean;
  imageBlobId?: string | null;
  imageBlobIds?: string[] | null;
  enableCarousel?: boolean;
  rating?: number;
  reviewCount?: number;
  badgeText?: string | null;
  badgeIcon?: string;
  badgeVariant?: "orange" | "teal" | "blue" | "neutral" | string;
  borderColor?: "orange" | "teal" | "neutral" | "none" | string;
  objectFit?: "contain" | "cover";
  rank?: number | null;
  bubbleClass?: "orange" | "teal" | "blue" | "grey" | string;
  discountPercentage?: number | null;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  categoryId: null,
  categoryName: null,
  minOrder: 1,
  unitOfMeasure: null,
  isActive: true,
  imageBlobId: null,
  imageBlobIds: () => [],
  enableCarousel: true,
  rating: 0,
  reviewCount: 0,
  badgeText: null,
  badgeIcon: "fa-solid fa-fire",
  badgeVariant: "orange",
  borderColor: "orange",
  objectFit: "cover",
  rank: null,
  bubbleClass: "orange",
  discountPercentage: null,
});

const orgStore = useOrganizationStore();
const router = useRouter();
const route = useRoute();
const favoritesStore = useFavoritesStore();
const categoryStore = useCategoryStore();

const isFav = computed(() => favoritesStore.isFavorite(props.id));

const resolvedCategoryName = computed(() => {
  if (props.categoryId) {
    const resolved = categoryStore.getCategoryName(props.categoryId, "");
    if (resolved && resolved !== "General") return resolved;
  }
  if (props.categoryName && props.categoryName !== "General") {
    return props.categoryName;
  }
  if (props.categoryId) {
    return categoryStore.getCategoryName(props.categoryId, "General");
  }
  return props.categoryName || "";
});

function handleCategoryClick(e: Event) {
  if (!props.categoryId) return;
  e.preventDefault();
  e.stopPropagation();
  router.push({
    name: "products",
    query: { categoryId: props.categoryId },
  });
}

function handleFavoriteClick(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  favoritesStore.toggleFavorite(props.id, {
    router,
    redirectPath: route.fullPath,
  });
}

const effectiveBlobIds = computed(() => {
  if (Array.isArray(props.imageBlobIds) && props.imageBlobIds.length > 0) {
    return props.imageBlobIds;
  }
  if (props.imageBlobId) {
    return [props.imageBlobId];
  }
  return [];
});

const providerName = ref<string>("Proveedor aliado");
const providerLogoBlobId = ref<string | null>(null);
const isProviderLoading = ref<boolean>(true);

const hasDiscount = computed(
  () =>
    props.discountPercentage !== null &&
    props.discountPercentage !== undefined &&
    props.discountPercentage > 0
);

function handleProviderClick(e: Event) {
  if (!props.providerId) return;
  e.preventDefault();
  e.stopPropagation();
  router.push({
    name: "provider-catalog",
    params: { providerId: props.providerId },
  });
}

const displayPrice = computed(() =>
  hasDiscount.value
    ? Math.round(props.price * (100 - (props.discountPercentage as number))) / 100
    : props.price
);

const formattedPrice = computed(() => {
  return `C$ ${displayPrice.value.toLocaleString("es-NI")}`;
});

const formattedOriginalPrice = computed(() => {
  return `C$ ${props.price.toLocaleString("es-NI")}`;
});

const bubbleBgClass = computed(() => {
  const map: Record<string, string> = {
    orange: "bg-[#ff6a00]",
    teal: "bg-[#0d9488]",
    blue: "bg-[#023859]",
    grey: "bg-[#64748b]",
  };
  return map[props.bubbleClass] || props.bubbleClass;
});

const borderClass = computed(() => {
  if (props.borderColor === "orange") return "border-2 border-[#ff6a00] hover:shadow-[0_12px_28px_rgba(255,106,0,0.14)]";
  if (props.borderColor === "teal") return "border-2 border-teal-500 hover:shadow-[0_12px_28px_rgba(13,148,136,0.14)]";
  if (props.borderColor === "neutral") return "border border-neutral-200 hover:border-neutral-300 hover:shadow-lg";
  if (props.borderColor === "none") return "border-0 shadow-sm hover:shadow-lg";
  return props.borderColor;
});

const badgeClasses = computed(() => {
  if (props.badgeVariant === "teal") {
    return "bg-teal-50/95 text-teal-700 border border-teal-200/80";
  }
  if (props.badgeVariant === "blue") {
    return "bg-blue-50/95 text-[#023859] border border-blue-200/80";
  }
  if (props.badgeVariant === "neutral") {
    return "bg-neutral-100/95 text-neutral-700 border border-neutral-200";
  }
  return "bg-[#fff0e6]/95 text-[#ff6a00]";
});

async function loadProviderInfo() {
  if (!props.providerId) {
    providerName.value = "Proveedor aliado";
    providerLogoBlobId.value = null;
    isProviderLoading.value = false;
    return;
  }

  isProviderLoading.value = true;
  try {
    const org = await orgStore.getPublicProvider(props.providerId);
    providerName.value = org.company_name || "Proveedor aliado";
    providerLogoBlobId.value = org.logo_blob_id ?? null;
  } catch (err) {
    console.warn(`Failed to fetch provider ${props.providerId}`, err);
    providerName.value = "Proveedor aliado";
    providerLogoBlobId.value = null;
  } finally {
    isProviderLoading.value = false;
  }
}

watch(
  () => props.providerId,
  () => {
    loadProviderInfo();
  }
);

onMounted(() => {
  loadProviderInfo();
  if (props.categoryId && (!props.categoryName || props.categoryName === "General")) {
    categoryStore.fetchCategories().catch(console.warn);
  }
  if (!favoritesStore.isInitialized) {
    favoritesStore.fetchFavorites().catch(console.warn);
  }
});
</script>

<template>
  <router-link
    :to="{ name: 'product-detail', params: { id } }"
    :class="[
      'group relative flex flex-col rounded-[20px] bg-white p-4 text-inherit no-underline transition-all duration-200 hover:-translate-y-1 min-w-0',
      borderClass
    ]"
  >
    <!-- Image Frame -->
    <div class="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[14px] border border-slate-100 bg-slate-50">
      <span
        v-if="badgeText"
        :class="[
          'absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold shadow-sm backdrop-blur-xs',
          badgeClasses
        ]"
      >
        <i v-if="badgeIcon" :class="badgeIcon"></i>
        {{ badgeText }}
      </span>

      <span
        v-if="hasDiscount"
        :class="[
          'absolute left-2 z-10 inline-flex items-center rounded-full bg-[#ff6a00] px-2.5 py-0.5 text-[0.72rem] font-bold text-white shadow-sm',
          badgeText ? 'top-8' : 'top-2'
        ]"
      >
        -{{ discountPercentage }}%
      </span>

      <!-- Favorite / Like Button -->
      <button
        type="button"
        :class="[
          'absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer',
          isFav
            ? 'bg-red-500 text-white hover:bg-red-600'
            : 'bg-white/90 text-slate-400 backdrop-blur-xs hover:text-red-500 hover:bg-white'
        ]"
        :title="isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'"
        :aria-label="isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'"
        @click.stop.prevent="handleFavoriteClick"
      >
        <i :class="[isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart', 'text-xs']"></i>
      </button>

      <ProductImageCarousel
        :blob-ids="effectiveBlobIds"
        :product-id="id"
        :alt="title"
        :object-fit="objectFit"
        :auto-play="enableCarousel"
        :show-dots="enableCarousel"
        :show-arrows="enableCarousel"
        variant="card"
      />
    </div>

    <!-- Category Tag & Min Order Header -->
    <div class="mb-2 flex items-center justify-between gap-1.5 min-h-[22px]">
      <span
        v-if="resolvedCategoryName"
        :class="[
          'inline-flex items-center gap-1.5 rounded-full bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 text-[0.7rem] font-semibold text-teal-700 shadow-2xs transition-colors',
          categoryId ? 'cursor-pointer hover:bg-teal-100 hover:text-teal-800' : ''
        ]"
        :title="categoryId ? `Ver más productos en ${resolvedCategoryName}` : `Categoría: ${resolvedCategoryName}`"
        @click.stop.prevent="handleCategoryClick"
      >
        <i class="fa-solid fa-tag text-[9px] text-teal-600"></i>
        <span class="truncate max-w-[130px]">{{ resolvedCategoryName }}</span>
      </span>
      <span v-else></span>

      <span
        v-if="minOrder && minOrder > 1"
        class="text-[0.68rem] text-slate-400 font-medium whitespace-nowrap"
      >
        Mín. {{ minOrder }} {{ unitOfMeasure || 'und' }}
      </span>
    </div>

    <!-- Product Info (Title & Price) -->
    <div class="mb-2 flex min-w-0 flex-col gap-1">
      <h4
        :title="title"
        class="m-0 min-w-0 line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-[#023859] group-hover:text-teal-700 transition-colors leading-snug"
      >
        {{ title }}
      </h4>

      <div class="flex items-baseline justify-between gap-2 mt-1">
        <span class="flex items-baseline gap-1.5">
          <span class="text-base font-bold text-[#ff6a00]">
            {{ formattedPrice }}
          </span>
          <span v-if="unitOfMeasure" class="text-[0.7rem] text-slate-400 font-normal">
            / {{ unitOfMeasure }}
          </span>
        </span>
        <span v-if="hasDiscount" class="text-xs text-slate-400 line-through">
          {{ formattedOriginalPrice }}
        </span>
      </div>
    </div>

    <!-- Provider Info & Rating Footer -->
    <div class="mt-auto flex min-h-[30px] min-w-0 items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
      <div v-if="isProviderLoading" class="flex flex-1 items-center gap-1.5">
        <div class="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-200"></div>
        <div class="h-3 w-[80px] animate-pulse rounded bg-slate-200"></div>
      </div>

      <div
        v-else
        class="flex min-w-0 items-center gap-1.5 overflow-hidden group/prov cursor-pointer"
        :title="`Ver catálogo de ${providerName}`"
        @click.stop.prevent="handleProviderClick"
      >
        <div class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 group-hover/prov:border-teal-500 transition-colors">
          <ProviderLogo :blob-id="providerLogoBlobId" :alt="providerName" />
        </div>
        <span class="truncate font-medium text-slate-600 group-hover/prov:text-teal-700 transition-colors text-[0.75rem]">
          {{ providerName }}
        </span>
      </div>

      <span
        class="inline-flex shrink-0 items-center gap-1 font-bold text-slate-800"
        :title="reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount} valoraciones)` : 'Sin valoraciones'"
      >
        <i class="fa-solid fa-star text-[10px] text-amber-400"></i>
        <span class="text-xs">{{ rating > 0 ? rating.toFixed(1) : "0.0" }}</span>
        <span v-if="reviewCount > 0" class="text-[10px] font-normal text-slate-400">({{ reviewCount }})</span>
      </span>
    </div>

    <!-- Rank Bubble -->
    <div
      v-if="rank !== null && rank !== undefined"
      :class="[
        'absolute -bottom-3.5 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white',
        bubbleBgClass
      ]"
    >
      {{ rank }}
    </div>
  </router-link>
</template>
