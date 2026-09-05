
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { quoteApi } from "@/api";
import type {
  ShippingMethod,
  PaymentMethod,
  QuoteAggregateResponse,
  QuoteItemDto,
} from "@/api/services/quote/types";

export interface QuoteItemDraft {
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  imageBlobId: string | null;
  shippingPreference: ShippingMethod;
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
}

const DEFAULT_SHIPPING: ShippingMethod = "bus";
const DEFAULT_PAYMENT: PaymentMethod = "virtual_wallet";

export const useQuoteBuilderStore = defineStore("quoteBuilder", () => {
  // state
  const drafts = ref<Record<string, QuoteDraft>>({});
  const isSubmitting = ref(false);
  const lastCreatedQuotes = ref<QuoteAggregateResponse[]>([]);

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

    const existing = draft.items.find((i) => i.productId === input.productId);
    if (existing) {
      existing.quantity += input.quantity ?? 1;
      return;
    }

    draft.items.push({
      productId: input.productId,
      productTitle: input.productTitle,
      quantity: input.quantity ?? 1,
      unitPrice: input.unitPrice,
      imageBlobId: input.imageBlobId ?? null,
      shippingPreference: input.shippingPreference ?? DEFAULT_SHIPPING,
    });
  }

  function removeItem(providerId: string, productId: string): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    draft.items = draft.items.filter((i) => i.productId !== productId);
    if (draft.items.length === 0) delete drafts.value[providerId];
  }

  function updateItemQuantity(
    providerId: string,
    productId: string,
    quantity: number,
  ): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    const item = draft.items.find((i) => i.productId === productId);
    if (!item) return;
    if (quantity <= 0) {
      removeItem(providerId, productId);
      return;
    }
    item.quantity = quantity;
  }

  function setItemShipping(
    providerId: string,
    productId: string,
    method: ShippingMethod,
  ): void {
    const draft = drafts.value[providerId];
    if (!draft) return;
    const item = draft.items.find((i) => i.productId === productId);
    if (item) item.shippingPreference = method;
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

  // creation
  async function createQuoteForProvider(
    providerId: string,
  ): Promise<QuoteAggregateResponse[]> {
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
