<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import ProductImage from "./ProductImage.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";
import { useOrganizationStore } from "@/stores/organizationStore";

export interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  providerId: string;
  categoryName?: string | null;
  minOrder?: number;
  imageBlobId?: string | null;
  rating?: number;
  reviewCount?: number;
  badgeText?: string | null;
  badgeIcon?: string;
  rank?: number | null;
  bubbleClass?: "orange" | "teal" | "blue" | "grey" | string;
}

const props = withDefaults(defineProps<ProductCardProps>(), {
  categoryName: null,
  minOrder: 1,
  imageBlobId: null,
  rating: 0,
  reviewCount: 0,
  badgeText: null,
  badgeIcon: "fa-solid fa-fire",
  rank: null,
  bubbleClass: "orange",
});

const orgStore = useOrganizationStore();

const providerName = ref<string>("Proveedor aliado");
const providerLogoBlobId = ref<string | null>(null);
const isProviderLoading = ref<boolean>(true);

const formattedPrice = computed(() => {
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
});
</script>

<template>
  <router-link
    :to="{ name: 'product-detail', params: { id } }"
    class="group relative flex flex-col rounded-[20px] border-2 border-[#ff6a00] bg-white p-4 text-inherit no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(255,106,0,0.14)] min-w-0"
  >
    <!-- Image Frame -->
    <div class="relative mb-3 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[14px] border border-slate-100 bg-slate-50">
      <span
        v-if="badgeText"
        class="absolute left-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#fff0e6]/95 px-2.5 py-0.5 text-[0.72rem] font-bold text-[#ff6a00] shadow-sm backdrop-blur-xs"
      >
        <i v-if="badgeIcon" :class="badgeIcon"></i>
        {{ badgeText }}
      </span>

      <ProductImage
        :blob-id="imageBlobId"
        :alt="title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>

    <!-- Category -->
    <p v-if="categoryName" class="mb-1.5 truncate text-center text-[0.72rem] text-slate-500">
      {{ categoryName }}
    </p>

    <!-- Product Info -->
    <div class="mb-1 flex min-w-0 items-center justify-between gap-2">
      <h4 :title="title" class="m-0 min-w-0 flex-1 truncate text-sm font-semibold text-[#023859]">
        {{ title }}
      </h4>
      <span class="shrink-0 text-[0.95rem] font-bold text-[#ff6a00]">
        {{ formattedPrice }}
      </span>
    </div>

    <!-- Min Order -->
    <p v-if="minOrder" class="mb-3 text-right text-[0.72rem] text-slate-500">
      Pedido mín. {{ minOrder }} und
    </p>

    <!-- Provider Info -->
    <div class="mt-auto flex min-h-[28px] min-w-0 items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600">
      <div v-if="isProviderLoading" class="flex flex-1 items-center gap-1.5">
        <div class="h-5 w-5 shrink-0 animate-pulse rounded-full bg-slate-200"></div>
        <div class="h-3 w-[90px] animate-pulse rounded bg-slate-200"></div>
      </div>

      <div v-else class="flex min-w-0 items-center gap-2 overflow-hidden" :title="providerName">
        <div class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          <ProviderLogo :blob-id="providerLogoBlobId" :alt="providerName" />
        </div>
        <span class="truncate font-medium text-slate-700">{{ providerName }}</span>
      </div>

      <span class="inline-flex shrink-0 items-center gap-1 font-bold text-slate-800" :title="`${reviewCount} valoraciones`">
        <i class="fa-solid fa-star text-[10px] text-amber-400"></i>
        <span>{{ rating > 0 ? rating.toFixed(1) : "0.0" }}</span>
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
