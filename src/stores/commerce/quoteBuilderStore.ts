
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useQuoteApi } from "@/api/modules/commerce/quote/useQuoteApi";
import type {
  ShippingMethod,
  PaymentMethod,
  QuoteResponse,
  QuoteItemDto,
} from "@/api";

export interface QuoteItemDraft {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  imageBlobId: string | null;
  shippingPreference: ShippingMethod;
  offerId: string | null;
  discountPercentage: number | null;
  selectedSpec: Record<string, string>;
}

export interface QuoteDraft {
  providerId: string;
  providerName: string;
  providerLogoBlobId: string | null;
  items: QuoteItemDraft[];
  buyerNotes: string;
  shippingAddress: string;
  paymentPreference: PaymentMethod;
}

export interface AddItemInput {
  productId: string;
  productTitle: string;
  unitPrice: number;
  imageBlobId?: string | null;
  quantity?: number;
  shippingPreference?: ShippingMethod;
  offerId?: string | null;
  discountPercentage?: number | null;
  selectedSpec?: Record<string, string>;
}

const DEFAULT_SHIPPING: ShippingMethod = "bus";
const DEFAULT_PAYMENT: PaymentMethod = "virtual_wallet";

function areSpecsEqual(
  a?: Record<string, string>,
  b?: Record<string, string>
): boolean {
  const objA = a || {};
  const objB = b || {};
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => objA[k] === objB[k]);
}

export const useQuoteBuilderStore = defineStore("quoteBuilder", () => {
  const quoteApi = useQuoteApi();

  // state
  const drafts = ref<Record<string, QuoteDraft>>({});
  const isSubmitting = ref(false);
  const lastCreatedQuotes = ref<QuoteResponse[]>([]);

  // helpers
  const getOrCreateDraft = (
    providerId: string,
    providerName = "Proveedor",
    providerLogoBlobId: string | null = null,
  ): QuoteDraft => {
    if (!drafts.value[providerId]) {
      drafts.value[providerId] = {
        providerId,
        providerName,
        providerLogoBlobId,
        items: [],
        buyerNotes: "",
        shippingAddress: "",
        paymentPreference: DEFAULT_PAYMENT,
      };
    } else {
      if (providerName !== "Proveedor") drafts.value[providerId].providerName = providerName;
      if (providerLogoBlobId !== null)
        drafts.value[providerId].providerLogoBlobId = providerLogoBlobId;
    }
    return drafts.value[providerId];
  };

  // item operations
  function addItem(
    providerId: string,
    input: AddItemInput,
    providerMeta?: { name?: string; logoBlobId?: string | null },
  ): void {
    const draft = getOrCreateDraft(
      providerId,
      providerMeta?.name,
      providerMeta?.logoBlobId ?? null,
    );

    const shippingPreference = input.shippingPreference ?? DEFAULT_SHIPPING;
    const selectedSpec = input.selectedSpec ?? {};

    const existing = draft.items.find(
      (i) =>
        i.productId === input.productId &&
        i.shippingPreference === shippingPreference &&
        areSpecsEqual(i.selectedSpec, selectedSpec),
    );
    if (existing) {
      existing.quantity += input.quantity ?? 1;
      if (input.offerId !== undefined) existing.offerId = input.offerId;
      if (input.discountPercentage !== undefined)
        existing.discountPercentage = input.discountPercentage;
      return;
    }

    draft.items.push({
      productId: input.productId,
      productTitle: input.productTitle,
      quantity: input.quantity ?? 1,
      unitPrice: input.unitPrice,
      imageBlobId: input.imageBlobId ?? null,
      shippingPreference,
      offerId: input.offerId ?? null,
      discountPercentage: input.discountPercentage ?? null,
      selectedSpec,
    });
  }

  function removeItem(
    providerId: string,
    productId: string,
    shippingPreference?: ShippingMethod,
    selectedSpec?: Record<string, string>,
  ): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    draft.items = draft.items.filter((i) => {
      if (i.productId !== productId) return true;
      if (shippingPreference && i.shippingPreference !== shippingPreference) return true;
      if (selectedSpec && !areSpecsEqual(i.selectedSpec, selectedSpec)) return true;
      return false;
    });
    if (draft.items.length === 0) delete drafts.value[providerId];
  }

  function updateItemQuantity(
    providerId: string,
    productId: string,
    quantity: number,
    shippingPreference?: ShippingMethod,
    selectedSpec?: Record<string, string>,
  ): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    const item = draft.items.find((i) => {
      if (i.productId !== productId) return false;
      if (shippingPreference && i.shippingPreference !== shippingPreference) return false;
      if (selectedSpec && !areSpecsEqual(i.selectedSpec, selectedSpec)) return false;
      return true;
    });
    if (!item) return;
    if (quantity <= 0) {
      removeItem(providerId, productId, shippingPreference, selectedSpec);
      return;
    }
    item.quantity = quantity;
  }

  function setItemShipping(
    providerId: string,
    productId: string,
    method: ShippingMethod,
    oldMethod?: ShippingMethod,
    selectedSpec?: Record<string, string>,
  ): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    const item = draft.items.find((i) => {
      if (i.productId !== productId) return false;
      if (oldMethod && i.shippingPreference !== oldMethod) return false;
      if (selectedSpec && !areSpecsEqual(i.selectedSpec, selectedSpec)) return false;
      return true;
    });
    if (!item) return;

    const target = draft.items.find(
      (i) =>
        i.productId === productId &&
        i.shippingPreference === method &&
        areSpecsEqual(i.selectedSpec, item.selectedSpec) &&
        i !== item,
    );
    if (target) {
      target.quantity += item.quantity;
      draft.items = draft.items.filter((i) => i !== item);
    } else {
      item.shippingPreference = method;
    }
  }

  // draft setters
  function setShippingAddress(providerId: string, address: string): void {
    getOrCreateDraft(providerId).shippingAddress = address;
  }

  function setPaymentPreference(providerId: string, method: PaymentMethod): void {
    getOrCreateDraft(providerId).paymentPreference = method;
  }

  function setBuyerNotes(providerId: string, notes: string): void {
    getOrCreateDraft(providerId).buyerNotes = notes;
  }

  // selectors
  const providerIds = computed(() => Object.keys(drafts.value));

  function getDraft(providerId: string): QuoteDraft | undefined {
    return drafts.value[providerId];
  }

  function getItemCount(providerId: string): number {
    return drafts.value[providerId]?.items.length ?? 0;
  }

  function getTotalUnits(providerId: string): number {
    const draft = drafts.value[providerId];
    if (!draft) return 0;
    return draft.items.reduce((acc, i) => acc + i.quantity, 0);
  }

  function getSubtotal(providerId: string): number {
    const draft = drafts.value[providerId];
    if (!draft) return 0;
    return draft.items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  }

  // Estimated subtotal applying each item's current offer (applied by the
  // backend only once the provider accepts the quote).
  function getDiscountedSubtotal(providerId: string): number {
    const draft = drafts.value[providerId];
    if (!draft) return 0;
    return draft.items.reduce((acc, i) => {
      const unitPrice =
        i.discountPercentage !== null
          ? Math.round(i.unitPrice * (100 - i.discountPercentage)) / 100
          : i.unitPrice;
      return acc + i.quantity * unitPrice;
    }, 0);
  }

  // creation
  async function createQuoteForProvider(
    providerId: string,
  ): Promise<QuoteResponse[]> {
    const draft = drafts.value[providerId];
    if (!draft) throw new Error(`No draft found for provider ${providerId}`);
    if (draft.items.length === 0) {
      throw new Error("Cannot create a quote with no items.");
    }
    if (!draft.shippingAddress.trim()) {
      throw new Error("Shipping address is required.");
    }

    const items: QuoteItemDto[] = draft.items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
      shipping_preference: i.shippingPreference,
      selected_spec: i.selectedSpec ?? {},
    }));

    const payload = {
      provider_id: providerId,
      payment_preference: draft.paymentPreference,
      buyer_notes: draft.buyerNotes.trim() || null,
      shipping_address: draft.shippingAddress.trim(),
      items,
    };

    isSubmitting.value = true;
    try {
      const created = await quoteApi.createQuote(payload);
      lastCreatedQuotes.value = created;
      delete drafts.value[providerId];
      return created;
    } finally {
      isSubmitting.value = false;
    }
  }

  // cleanup
  function clearDraft(providerId: string): void {
    delete drafts.value[providerId];
  }

  function clearAll(): void {
    drafts.value = {};
    lastCreatedQuotes.value = [];
  }

  return {
    drafts,
    isSubmitting,
    lastCreatedQuotes,
    providerIds,
    getDraft,
    getItemCount,
    getTotalUnits,
    getSubtotal,
    getDiscountedSubtotal,
    addItem,
    removeItem,
    updateItemQuantity,
    setItemShipping,
    setShippingAddress,
    setPaymentPreference,
    setBuyerNotes,
    createQuoteForProvider,
    clearDraft,
    clearAll,
  };
});
