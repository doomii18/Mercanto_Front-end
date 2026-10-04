
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
    class="bg-white border-[1.5px] border-slate-200 rounded-2xl p-5 sm:px-6 grid grid-cols-1 lg:grid-cols-[minmax(210px,1.35fr)_2.1fr_minmax(135px,0.95fr)] items-center gap-4 lg:gap-6 transition-all duration-200 hover:border-[#00a896] hover:shadow-md"
  >
    <div class="flex flex-col gap-1 min-w-0">
      <div class="flex flex-row items-center flex-wrap gap-2 mb-1">
        <h4 class="text-[#083c5a] text-[1.05rem] font-bold font-serif m-0">Pedido</h4>
        <QuoteIdBadge :quote-id="quote.id" size="sm" />
      </div>
      <p class="text-slate-400 text-xs sm:text-[0.82rem] mb-1.5">{{ formattedDate }}</p>
      <div class="flex flex-col mb-1">
        <p class="text-slate-500 text-xs font-medium m-0">Total</p>
        <h3 class="text-[#083c5a] text-lg font-bold my-0.5">{{ formatCurrency(calculatedTotal) }}</h3>
        <span
          v-if="hasAppliedOffer"
          class="mt-0.5 w-fit rounded-full bg-orange-100 px-2 py-0.5 text-[0.625rem] font-bold text-orange-600"
        >
          Descuento aplicado
        </span>
      </div>
      <p class="text-slate-400 text-xs m-0">
        {{ totalUnits }} {{ totalUnits === 1 ? 'producto' : 'productos' }}
      </p>
    </div>
    <div
      class="flex items-center justify-between gap-4 lg:gap-5 px-0 lg:px-6 py-3.5 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-200 min-w-0 flex-wrap sm:flex-nowrap"
    >
      <div class="flex items-center gap-3.5 min-w-0 flex-1 w-full sm:w-auto">
        <div
          class="w-11 h-11 rounded-full border-[1.5px] border-slate-200 bg-white flex items-center justify-center overflow-hidden text-[#00a896] font-bold text-lg shrink-0"
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
          <a href="#" class="text-xs sm:text-[0.82rem] text-[#00a896] hover:underline font-medium mt-0.5" @click.prevent>
            {{ isProvider ? 'ver comprador' : 'ver proveedor' }}
          </a>
        </div>
      </div>
      <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-start">
        <div
          v-for="item in previewItems"
          :key="item.product_id"
          class="w-12 h-12 border border-slate-200 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 shadow-xs"
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
          class="w-9.5 h-9.5 rounded-full border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-500 bg-white shrink-0"
        >
          +{{ remainingCount }}
        </div>
      </div>
    </div>
    <div
      class="flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap"
    >
      <QuoteStatusBadge :status="quote.status" size="sm" />
      <p v-if="statusDateLabel" class="text-[0.76rem] text-slate-400 m-0 text-left lg:text-center">{{ statusDateLabel }}</p>
      <button
        type="button"
        class="bg-transparent text-[#00a896] border-[1.5px] border-[#00a896] py-1.5 px-5.5 rounded-full font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#00a896] hover:text-white w-full sm:w-auto text-center"
        @click="emit('select', quote.id)"
      >
        ver detalles
      </button>
    </div>
  </div>
</template>
