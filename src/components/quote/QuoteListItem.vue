
<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useUserContextStore } from "@/stores/auth";
import type { QuoteAggregateResponse, QuoteStatus } from "@/api";
import { useProductApi } from "@/api/modules/catalog/product/useProductApi";
import ProductImage from "../product/ProductImage.vue";
import ProviderLogo from "../organization/ProviderLogo.vue";
import ProfileAvatar from "../profile/ProfileAvatar.vue";
import QuoteIdBadge from "./QuoteIdBadge.vue";
import QuoteStatusBadge from "./QuoteStatusBadge.vue";

interface CounterpartyInfo {
  name: string;
  avatarBlobId: string | null;
}

const props = defineProps<{
  quoteAggregate: QuoteAggregateResponse;
  counterparty?: CounterpartyInfo | null;
}>();

const emit = defineEmits<{
  (e: "select", quoteId: string): void;
}>();

const contextStore = useUserContextStore();
const productApi = useProductApi();
const isProvider = computed(() => contextStore.isProvider);

const productBlobCache = new Map<string, Promise<string | null>>();
const itemBlobIds = ref<Record<string, string | null>>({});

const quote = computed(() => props.quoteAggregate.quote);
const items = computed(() => props.quoteAggregate.items);
const previewItems = computed(() => items.value.slice(0, 2));
const remainingCount = computed(() => Math.max(0, items.value.length - 2));

const totalUnits = computed(() => {
  return items.value.reduce((acc, item) => acc + item.quantity, 0);
});

const effectiveUnitPrice = (item: {
  unit_price_snapshot: number;
  discount_percentage: number | null;
}): number =>
  item.discount_percentage !== null
    ? Math.round(item.unit_price_snapshot * (100 - item.discount_percentage)) / 100
    : item.unit_price_snapshot;

const hasAppliedOffer = computed(() =>
  items.value.some((item) => item.discount_percentage !== null)
);

const calculatedTotal = computed(() => {
  return items.value.reduce(
    (acc, item) => acc + item.quantity * effectiveUnitPrice(item),
    0
  );
});

const formattedDate = computed(() => {
  if (!quote.value.updated_at) return "—";
  return new Date(quote.value.updated_at).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

const statusDateLabel = computed(() => {
  if (!quote.value.updated_at) return "";
  const dateStr = new Date(quote.value.updated_at).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const status = quote.value.status as QuoteStatus;
  if (status === "fulfilled") return `Recibido el ${dateStr}`;
  if (status === "accepted" || status === "paid") return `En proceso desde ${dateStr}`;
  return `Actualizado el ${dateStr}`;
});

const formatCurrency = (amount: number) => {
  return `C$ ${amount.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const loadProductBlobId = async (productId: string): Promise<string | null> => {
  if (productBlobCache.has(productId)) {
    return productBlobCache.get(productId)!;
  }
  const promise = (async () => {
    try {
      const prod = await productApi.getProduct(productId);
      return prod.image_blob_ids?.[0] ?? null;
    } catch {
      return null;
    }
  })();
  productBlobCache.set(productId, promise);
  return promise;
};

const loadProductImages = async () => {
  await Promise.all(
    previewItems.value.map(async (item) => {
      const blobId = await loadProductBlobId(item.product_id);
      itemBlobIds.value[item.product_id] = blobId;
    })
  );
};

onMounted(() => {
  loadProductImages();
});
</script>

<template>
  <div
    class="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-xs hover:border-[#00a896]/60 hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
  >
    <!-- Left: Pedido Info -->
    <div class="flex flex-col shrink-0 min-w-0 lg:w-64 xl:w-72">
      <h4 class="text-[#083c5a] text-sm sm:text-base font-bold font-serif m-0 mb-2">Pedido</h4>
      <div class="mb-2.5">
        <QuoteIdBadge :quote-id="quote.id" size="sm" />
      </div>
      <p class="text-slate-400 text-xs sm:text-[0.82rem] m-0 mb-3">{{ formattedDate }}</p>

      <div class="flex flex-col">
        <p class="text-slate-400 text-xs font-normal m-0">Total</p>
        <h3 class="text-[#083c5a] text-lg sm:text-xl font-bold font-serif my-0.5">{{ formatCurrency(calculatedTotal) }}</h3>
        <span
          v-if="hasAppliedOffer"
          class="mt-0.5 w-fit rounded-full bg-orange-100 px-2 py-0.5 text-[0.625rem] font-bold text-orange-600"
        >
          Descuento aplicado
        </span>
      </div>

      <p class="text-slate-400 text-xs m-0 mt-1">
        {{ totalUnits }} {{ totalUnits === 1 ? 'producto' : 'productos' }}
      </p>
    </div>

    <!-- Center Group: Buyer + Products -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-between gap-6 flex-1 min-w-0 lg:px-6 xl:px-10">
      <!-- Buyer info -->
      <div class="flex items-center gap-3.5 min-w-0">
        <div
          class="w-12 h-12 rounded-full border border-slate-200 bg-white flex items-center justify-center overflow-hidden text-[#00a896] font-bold text-lg shrink-0 shadow-2xs"
        >
          <ProfileAvatar
            v-if="isProvider"
            :blob-id="counterparty?.avatarBlobId"
            :alt="counterparty?.name"
          />
          <ProviderLogo
            v-else
            :blob-id="counterparty?.avatarBlobId"
            :alt="counterparty?.name"
          />
        </div>
        <div class="flex flex-col min-w-0">
          <p
            class="font-bold text-[#083c5a] text-sm sm:text-[0.95rem] leading-tight truncate m-0"
            :title="counterparty?.name"
          >
            {{ counterparty?.name || (isProvider ? 'Comprador' : 'Proveedor') }}
          </p>
          <a href="#" class="text-xs sm:text-[0.82rem] text-[#00a896] hover:underline font-medium mt-1 cursor-pointer" @click.prevent>
            {{ isProvider ? 'ver comprador' : 'ver proveedor' }}
          </a>
        </div>
      </div>

      <!-- Products Preview -->
      <div class="flex items-center gap-2.5 shrink-0">
        <div
          v-for="item in previewItems"
          :key="item.product_id"
          class="w-12 h-12 border border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 shadow-2xs shrink-0"
          :title="item.product_title_snapshot"
        >
          <ProductImage
            :blob-id="itemBlobIds[item.product_id]"
            :alt="item.product_title_snapshot"
            fallback-icon="fa-solid fa-box"
            object-fit="contain"
          />
        </div>
        <div
          v-if="remainingCount > 0"
          class="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 bg-white shrink-0"
        >
          +{{ remainingCount }}
        </div>
      </div>
    </div>

    <!-- Vertical Divider (desktop only, between products and status) -->
    <div class="hidden lg:block w-px h-12 bg-slate-200 shrink-0"></div>

    <!-- Right Group: Status & Action -->
    <div
      class="flex flex-col items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto lg:w-48 text-center pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100"
    >
      <QuoteStatusBadge :status="quote.status" size="sm" />
      <p v-if="statusDateLabel" class="text-xs text-slate-400 m-0 whitespace-nowrap">{{ statusDateLabel }}</p>
      <button
        type="button"
        class="mt-1 bg-transparent text-[#00a896] border-[1.5px] border-[#00a896] py-1.5 px-6 rounded-full font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#00a896] hover:text-white"
        @click="emit('select', quote.id)"
      >
        ver detalles
      </button>
    </div>
  </div>
</template>
