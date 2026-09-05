<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { quoteApi, organizationApi, productApi, userProfileApi } from "../api";
import { useToastStore } from "@/stores/toastStore";
import { useQuoteActions } from "@/composables/useQuoteActions";
import type { QuoteAggregateResponse } from "../api/services/quote/types";
import type { PublicProviderDto } from "../api/services/organization/types";
import type { UserProfileResponse } from "../api/services/user_profile/types";
import ProductImage from "../components/product/ProductImage.vue";
import ProviderLogo from "../components/organization/ProviderLogo.vue";
import QuoteIdBadge from "../components/quote/QuoteIdBadge.vue";
import QuoteStatusBadge from "../components/quote/QuoteStatusBadge.vue";
import QuoteActionBar from "@/components/quote/QuoteActionBar.vue";

const route = useRoute();
const router = useRouter();
const toastStore = useToastStore();

const quoteAggregate = ref<QuoteAggregateResponse | null>(null);
const provider = ref<PublicProviderDto | null>(null);
const buyerProfile = ref<UserProfileResponse | null>(null);
const itemBlobIds = ref<Record<string, string | null>>({});
const isLoading = ref(true);
const errorMessage = ref<string | null>(null);
const productBlobCache = new Map<string, Promise<string | null>>();

const PAYMENT_LABELS: Record<string, string> = {
  card: "Tarjeta de crédito / débito",
  transfer: "Transferencia bancaria",
  virtual_wallet: "Billetera virtual",
};

const formatDate = (isoString?: string): string => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("es-NI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatMoney = (val: number): string => {
  return `C$${val.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const totalUnits = computed(() => {
  if (!quoteAggregate.value) return 0;
  return quoteAggregate.value.items.reduce((acc, item) => acc + item.quantity, 0);
});

const calculatedTotal = computed(() => {
  if (!quoteAggregate.value) return 0;
  return quoteAggregate.value.items.reduce(
    (acc, item) => acc + item.quantity * item.unit_price_snapshot,
    0
  );
});

const buyerFullName = computed(() => {
  if (!buyerProfile.value) return "Cliente Registrado";
  return (
    `${buyerProfile.value.first_name || ""} ${buyerProfile.value.last_name || ""}`.trim() ||
    "Cliente Registrado"
  );
});

const buyerPhone = computed(() => {
  if (!buyerProfile.value) return null;
  return (buyerProfile.value as any).phone_number || null;
});

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

const loadQuoteDetails = async () => {
  const quoteId = route.params.id as string;
  if (!quoteId) {
    errorMessage.value = "Identificador de pedido inválido.";
    isLoading.value = false;
    return;
  }
  isLoading.value = true;
  errorMessage.value = null;
  try {
    const [detail, profile] = await Promise.allSettled([
      quoteApi.getQuote(quoteId),
      userProfileApi.getMyProfile(),
    ]);
    if (detail.status === "fulfilled") {
      quoteAggregate.value = detail.value;
      if (detail.value.quote.provider_id) {
        provider.value = await organizationApi.getPublicProvider(
          detail.value.quote.provider_id
        );
      }
      await Promise.all(
        detail.value.items.map(async (item) => {
          const blobId = await loadProductBlobId(item.product_id);
          itemBlobIds.value[item.product_id] = blobId;
        })
      );
    } else {
      throw detail.reason;
    }
    if (profile.status === "fulfilled") {
      buyerProfile.value = profile.value;
    }
  } catch (err: any) {
    console.error("Failed to load quote details:", err);
    errorMessage.value =
      err.message || "Error al cargar los detalles del pedido.";
  } finally {
    isLoading.value = false;
  }
};

const { availableActions, executeAction, isActionProcessing } = useQuoteActions(
  quoteAggregate,
  { onReload: loadQuoteDetails }
);

const goBack = () => {
  router.push({ name: "orders" });
};

const handleDownloadInvoice = () => {
  toastStore.addToast({
    title: "Función en desarrollo",
    message:
      "La descarga de facturas estará disponible próximamente. Te notificaremos cuando esté lista.",
    icon: "fa-solid fa-file-invoice",
    variant: "info",
  });
};

const handleOpenChat = () => {
  router.push({ name: "messages" });
};

onMounted(() => {
  loadQuoteDetails();
});
</script>

<template>
  <div class="flex flex-col">
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-16 px-4 gap-4 text-base text-neutral-500"
    >
      <i class="fa-solid fa-spinner fa-spin text-2xl"></i>
      <span>Cargando información del pedido...</span>
    </div>

    <div
      v-else-if="errorMessage || !quoteAggregate"
      class="flex flex-col items-center justify-center py-16 px-4 gap-4 text-base text-neutral-500"
    >
      <i class="fa-solid fa-circle-exclamation text-5xl text-error"></i>
      <p class="text-neutral-900">{{ errorMessage || "No se encontró el pedido solicitado." }}</p>
      <button
        type="button"
        class="inline-flex items-center gap-2 px-5 py-2 border border-teal-700 text-teal-700 font-semibold rounded-lg hover:bg-teal-700 hover:text-white transition-colors"
        @click="goBack"
      >
        <i class="fa-solid fa-arrow-left"></i> Volver a Mis Pedidos
      </button>
    </div>

    <div v-else class="flex flex-col gap-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div class="flex items-center gap-5">
          <button
            type="button"
            class="bg-transparent border-0 text-xl text-neutral-900 cursor-pointer flex items-center justify-center p-1"
            aria-label="Regresar a pedidos"
            @click="goBack"
          >
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-2xl font-bold font-serif text-neutral-900">Detalles del Pedido</span>
              <QuoteIdBadge :quote-id="quoteAggregate.quote.id" size="lg" />
            </div>
            <p class="text-sm text-neutral-500 mt-1">
              Realizado el {{ formatDate(quoteAggregate.quote.updated_at) }}
            </p>
          </div>
        </div>
        <QuoteStatusBadge :status="quoteAggregate.quote.status" size="md" />
      </div>

      <div class="bg-teal-50 border border-teal-200 rounded-2xl p-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2 text-neutral-900 text-sm font-semibold">
            <i class="fa-regular fa-calendar-days text-base text-neutral-900"></i>
            <span>Fecha de Compra</span>
          </div>
          <strong class="text-neutral-900 text-base font-bold">{{
            formatDate(quoteAggregate.quote.updated_at)
          }}</strong>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2 text-neutral-900 text-sm font-semibold">
            <i class="fa-regular fa-money-bill-1 text-base text-neutral-900"></i>
            <span>Total Pagado</span>
          </div>
          <strong class="text-neutral-900 text-base font-bold">{{ formatMoney(calculatedTotal) }}</strong>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2 text-neutral-900 text-sm font-semibold">
            <i class="fa-regular fa-credit-card text-base text-neutral-900"></i>
            <span>Método de Pago</span>
          </div>
          <strong class="text-neutral-900 text-base font-bold">
            {{
              PAYMENT_LABELS[quoteAggregate.quote.payment_preference] ||
              quoteAggregate.quote.payment_preference
            }}
          </strong>
        </div>
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2 text-neutral-900 text-sm font-semibold">
            <i class="fa-solid fa-bag-shopping text-base text-neutral-900"></i>
            <span>Cantidad de Productos</span>
          </div>
          <strong class="text-neutral-900 text-base font-bold">
            {{ totalUnits }} {{ totalUnits === 1 ? "producto" : "productos" }}
          </strong>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div class="lg:col-span-2 bg-white border border-neutral-200 rounded-2xl p-6">
          <h3 class="text-base font-bold text-neutral-900 mb-5 font-serif">
            Productos ({{ quoteAggregate.items.length }})
          </h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="border-b border-neutral-100 text-neutral-500 font-medium text-left">
                  <th class="pb-4 w-1/2">Producto</th>
                  <th class="pb-4 w-1/5">Precio U.</th>
                  <th class="pb-4 w-1/6">Cantidad</th>
                  <th class="pb-4 w-1/6 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                <tr
                  v-for="item in quoteAggregate.items"
                  :key="item.product_id"
                >
                  <td class="py-4 pr-2 align-middle">
                    <div class="flex items-center gap-4">
                      <div class="w-14 h-14 border border-neutral-200 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 shrink-0">
                        <ProductImage
                          :blob-id="itemBlobIds[item.product_id]"
                          :alt="item.product_title_snapshot"
                          fallback-icon="fa-solid fa-box"
                          object-fit="contain"
                        />
                      </div>
                      <span class="font-semibold text-neutral-900 leading-snug text-sm">
                        {{ item.product_title_snapshot }}
                      </span>
                    </div>
                  </td>
                  <td class="py-4 px-2 align-middle font-semibold text-neutral-900">
                    {{ formatMoney(item.unit_price_snapshot) }}
                  </td>
                  <td class="py-4 px-2 align-middle font-semibold text-neutral-900">
                    Ud. {{ item.quantity }}
                  </td>
                  <td class="py-4 pl-2 align-middle font-semibold text-neutral-900 text-right">
                    {{ formatMoney(item.quantity * item.unit_price_snapshot) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="quoteAggregate.quote.buyer_notes" class="bg-base-200 p-3.5 rounded-lg mt-4 text-sm text-neutral-500">
            <strong class="font-semibold text-neutral-900">Notas del comprador:</strong>
            <p class="mt-1 text-neutral-700">{{ quoteAggregate.quote.buyer_notes }}</p>
          </div>
          <div class="bg-teal-100/50 rounded-xl px-6 py-3.5 flex justify-between items-center mt-6 text-neutral-900">
            <span class="text-sm font-semibold">Total</span>
            <strong class="text-base font-bold">{{ formatMoney(calculatedTotal) }}</strong>
          </div>
        </div>

        <div class="flex flex-col gap-6">
          <div class="bg-white border border-neutral-200 rounded-2xl p-6 text-center">
            <h4 class="text-left mb-5 text-neutral-900 text-base font-bold font-serif">Proveedor</h4>
            <div class="w-16 h-16 rounded-full border-2 border-neutral-900 bg-white flex items-center justify-center mx-auto mb-3 overflow-hidden p-1">
              <ProviderLogo
                :blob-id="provider?.logo_blob_id"
                :alt="provider?.company_name"
                :fallback-text="provider?.company_name"
              />
            </div>
            <h5 class="text-base text-neutral-900 font-bold mb-1.5 font-serif">
              {{ provider?.company_name || "Proveedor" }}
            </h5>
            <div class="flex justify-center gap-1 text-sm mb-5">
              <i class="fa-solid fa-star text-amber-500"></i>
              <i class="fa-solid fa-star text-amber-500"></i>
              <i class="fa-solid fa-star text-amber-500"></i>
              <i class="fa-solid fa-star text-amber-500"></i>
              <i class="fa-regular fa-star text-neutral-300"></i>
            </div>
            <button
              type="button"
              class="w-full bg-transparent border border-teal-700 text-teal-700 py-2 px-5 rounded-lg font-semibold text-sm cursor-pointer hover:bg-teal-700 hover:text-white transition-colors capitalize"
              @click.prevent
            >
              ver proveedor
            </button>
          </div>

          <div class="bg-white border border-neutral-200 rounded-2xl p-6 text-left">
            <h4 class="mb-5 text-neutral-900 text-base font-bold font-serif">Dirección de Entrega</h4>
            <div class="flex items-center gap-2 text-neutral-900 mb-2.5">
              <i class="fa-solid fa-location-dot text-lg text-neutral-900"></i>
              <span class="font-bold text-sm text-neutral-900">{{ buyerFullName }}</span>
            </div>
            <p class="text-neutral-700 text-xs leading-relaxed font-normal mb-1.5">
              {{ quoteAggregate.quote.shipping_address || "Dirección no especificada" }}
            </p>
            <p v-if="buyerPhone" class="text-neutral-500 text-xs font-normal">
              Tel. {{ buyerPhone }}
            </p>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-4 mt-2">
        <QuoteActionBar
          :actions="availableActions"
          :is-action-processing="isActionProcessing"
          @action="executeAction"
        />
        <div class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <button
            type="button"
            class="bg-transparent border border-teal-700 text-teal-700 py-2.5 px-5 rounded-xl font-semibold text-sm cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-teal-700 hover:text-white transition-colors"
            @click="handleDownloadInvoice"
          >
            <i class="fa-solid fa-arrow-down-to-bracket"></i>
            <span>Descargar factura</span>
          </button>
          <button
            type="button"
            class="bg-transparent border border-teal-700 text-teal-700 py-2.5 px-5 rounded-xl font-semibold text-sm cursor-pointer inline-flex items-center justify-center gap-2 hover:bg-teal-700 hover:text-white transition-colors"
            @click="handleOpenChat"
          >
            <i class="fa-regular fa-comment-dots"></i>
            <span>Enviar mensaje al proveedor</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
