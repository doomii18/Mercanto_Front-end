<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useQuoteBuilderStore } from "@/stores/commerce";
import { useAuthStore } from "@/stores/auth";
import { useToastStore } from "@/stores/ui";
import ProductImage from "@/components/product/ProductImage.vue";
import ConfirmModal from "@/components/common/ConfirmModal.vue";
import AddressPickerModal, {
  type AddressPickerResult,
} from "@/components/common/AddressPickerModal.vue";
import type { PaymentMethod } from "@/api";

interface Props {
  providerId: string;
  providerName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  providerName: "el proveedor",
});

const emit = defineEmits<{
  (e: "quote-created"): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const quoteBuilderStore = useQuoteBuilderStore();
const toastStore = useToastStore();

const showConfirmQuoteModal = ref(false);
const showAddressPicker = ref(false);
const shippingAddress = ref("");
const shippingMunicipalityId = ref<string | null>(null);
const shippingCoordinates = ref<{ lat: number; lng: number } | null>(null);
const paymentPreference = ref<PaymentMethod>("virtual_wallet");
const isSubmittingQuote = ref(false);

const currentDraft = computed(() =>
  props.providerId ? quoteBuilderStore.getDraft(props.providerId) : null
);

const draftItems = computed(() => currentDraft.value?.items ?? []);

const draftSubtotal = computed(() =>
  props.providerId ? quoteBuilderStore.getSubtotal(props.providerId) : 0
);

const draftDiscountedSubtotal = computed(() =>
  props.providerId
    ? quoteBuilderStore.getDiscountedSubtotal(props.providerId)
    : 0
);

const draftHasDiscount = computed(
  () => draftDiscountedSubtotal.value < draftSubtotal.value
);

const formatPrice = (val: number | null | undefined) => {
  if (val === null || val === undefined || isNaN(val)) return "0";
  return val.toLocaleString("es-NI");
};

const itemEffectiveUnitPrice = (
  unitPrice: number,
  discountPercentage: number | null
) =>
  discountPercentage !== null
    ? Math.round(unitPrice * (100 - discountPercentage)) / 100
    : unitPrice;

const openConfirmModal = () => {
  if (currentDraft.value) {
    shippingAddress.value = currentDraft.value.shippingAddress || "";
    paymentPreference.value = "virtual_wallet";
  }
  showConfirmQuoteModal.value = true;
};

const handleOpenAddressPicker = () => {
  showAddressPicker.value = true;
};

const handleAddressConfirm = (result: AddressPickerResult) => {
  shippingAddress.value = result.address;
  shippingMunicipalityId.value = result.municipalityId;
  shippingCoordinates.value = {
    lat: result.latitude,
    lng: result.longitude,
  };
};

const confirmQuote = async () => {
  if (!props.providerId) return;
  if (!shippingAddress.value.trim()) {
    toastStore.addToast({
      title: "Dirección requerida",
      message: "Por favor ingresa una dirección de envío.",
      icon: "fa-solid fa-circle-exclamation",
      variant: "error",
    });
    return;
  }

  isSubmittingQuote.value = true;
  quoteBuilderStore.setShippingAddress(
    props.providerId,
    shippingAddress.value.trim()
  );
  quoteBuilderStore.setPaymentPreference(
    props.providerId,
    paymentPreference.value
  );

  try {
    await quoteBuilderStore.createQuoteForProvider(props.providerId);
    toastStore.addToast({
      title: "¡Pedido creado!",
      message: "Tu cotización ha sido enviada al proveedor.",
      icon: "fa-solid fa-circle-check",
      variant: "success",
    });
    showConfirmQuoteModal.value = false;
    emit("quote-created");
    router.push({ name: "orders" });
  } catch (err: any) {
    toastStore.addToast({
      title: "Error al crear pedido",
      message: err.message || "No se pudo crear el pedido.",
      icon: "fa-solid fa-circle-exclamation",
      variant: "error",
    });
  } finally {
    isSubmittingQuote.value = false;
  }
};
</script>

<template>
  <div v-if="authStore.isAuthenticated && draftItems.length > 0">
    <section class="mt-10 rounded-3xl bg-neutral-100 p-8 lg:p-10">
      <h3 class="mb-5 font-serif text-xl font-bold text-neutral-900">
        Tu cotización con {{ providerName }}
      </h3>
      <div class="flex flex-col gap-4">
        <div
          v-for="item in draftItems"
          :key="item.productId"
          class="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm"
        >
          <div
            class="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-neutral-50 flex items-center justify-center border border-neutral-200"
          >
            <ProductImage
              :blob-id="item.imageBlobId"
              :alt="item.productTitle"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-neutral-900 truncate">
              {{ item.productTitle }}
            </h4>
            <p class="text-sm text-neutral-500">
              {{ item.quantity }} und x
              <span
                v-if="item.discountPercentage"
                class="text-neutral-400 line-through"
              >
                C$ {{ formatPrice(item.unitPrice) }}
              </span>
              <span
                :class="
                  item.discountPercentage ? 'font-semibold text-orange-500' : ''
                "
              >
                C$
                {{
                  formatPrice(
                    itemEffectiveUnitPrice(
                      item.unitPrice,
                      item.discountPercentage
                    )
                  )
                }}
              </span>
              <span
                v-if="item.discountPercentage"
                class="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[0.625rem] font-bold text-orange-600"
              >
                -{{ item.discountPercentage }}%
              </span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
              <button
                type="button"
                class="h-6 w-6 flex items-center justify-center rounded bg-neutral-300 text-xs text-neutral-700 hover:bg-neutral-400 cursor-pointer"
                @click="
                  quoteBuilderStore.updateItemQuantity(
                    providerId,
                    item.productId,
                    item.quantity - 1
                  )
                "
              >
                <i class="fa-solid fa-minus"></i>
              </button>
              <span
                class="text-sm font-bold text-teal-600 min-w-[20px] text-center"
              >
                {{ item.quantity }}
              </span>
              <button
                type="button"
                class="h-6 w-6 flex items-center justify-center rounded bg-neutral-300 text-xs text-neutral-700 hover:bg-neutral-400 cursor-pointer"
                @click="
                  quoteBuilderStore.updateItemQuantity(
                    providerId,
                    item.productId,
                    item.quantity + 1
                  )
                "
              >
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
            <button
              type="button"
              class="text-red-500 hover:text-red-700 p-1 cursor-pointer"
              title="Eliminar"
              @click="quoteBuilderStore.removeItem(providerId, item.productId)"
            >
              <i class="fa-solid fa-trash text-sm"></i>
            </button>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-neutral-300"
        >
          <span class="text-lg font-bold text-neutral-900">
            Subtotal:
            <span
              v-if="draftHasDiscount"
              class="text-neutral-400 line-through"
            >
              C$ {{ formatPrice(draftSubtotal) }}
            </span>
            <span class="text-orange-500">
              C$
              {{
                formatPrice(
                  draftHasDiscount ? draftDiscountedSubtotal : draftSubtotal
                )
              }}
            </span>
          </span>
          <button
            type="button"
            class="w-full sm:w-auto rounded-full bg-gradient-to-b from-orange-400 to-orange-600 px-8 py-3 text-base font-bold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
            @click="openConfirmModal"
          >
            Hacer oficial el pedido
          </button>
        </div>
      </div>
    </section>

    <!-- Confirm Quote Modal -->
    <ConfirmModal
      v-model="showConfirmQuoteModal"
      title="Confirmar Pedido"
      description="Revisa los detalles y confirma la dirección de envío para enviar tu cotización al proveedor."
      confirm-text="Enviar Cotización"
      cancel-text="Cancelar"
      icon="fa-solid fa-file-invoice"
      icon-variant="teal"
      :loading="isSubmittingQuote"
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
              class="flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-white transition-colors hover:bg-teal-700 cursor-pointer shrink-0"
              title="Seleccionar en el mapa"
              aria-label="Abrir mapa"
              @click="handleOpenAddressPicker"
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
            disabled
            class="w-full p-2.5 bg-neutral-100 text-neutral-600 border border-neutral-300 rounded-lg cursor-not-allowed focus:outline-none"
          >
            <option value="virtual_wallet" class="bg-white text-neutral-900">Billetera virtual</option>
          </select>
        </div>
      </div>
    </ConfirmModal>

    <!-- Address Picker Modal -->
    <AddressPickerModal
      v-model="showAddressPicker"
      :initial-address="shippingAddress"
      :initial-lat="shippingCoordinates?.lat"
      :initial-lng="shippingCoordinates?.lng"
      @confirm="handleAddressConfirm"
    />
  </div>
</template>
