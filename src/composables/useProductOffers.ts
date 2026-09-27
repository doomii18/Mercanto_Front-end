import { ref, watch, type Ref } from "vue";
import { useOfferApi } from "@/api/modules/catalog/offer/useOfferApi";
import type { ProductOfferResponse } from "@/api";

const CHUNK_SIZE = 100;

/**
 * Batch-resolves the current offer (if any) for a reactive list of product ids.
 * Failures are non-blocking: the map simply stays empty.
 */
export function useProductOffers(productIds: Ref<string[]>) {
  const offerApi = useOfferApi();
  const offers = ref<Map<string, ProductOfferResponse>>(new Map());
  let requestToken = 0;

  async function load(ids: string[]) {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) {
      offers.value = new Map();
      return;
    }

    const token = ++requestToken;
    const resolved = new Map<string, ProductOfferResponse>();

    try {
      for (let i = 0; i < unique.length; i += CHUNK_SIZE) {
        const chunk = unique.slice(i, i + CHUNK_SIZE);
        const batch = await offerApi.getOffersBatch({ product_ids: chunk });
        for (const [productId, offer] of Object.entries(batch)) {
          resolved.set(productId, offer);
        }
      }
    } catch (err) {
      console.warn("Failed to batch fetch product offers:", err);
    }

    if (token === requestToken) {
      offers.value = resolved;
    }
  }

  watch(
    productIds,
    (ids) => {
      load(ids);
    },
    { immediate: true },
  );

  function offerFor(productId: string): ProductOfferResponse | undefined {
    return offers.value.get(productId);
  }

  function discountFor(productId: string): number | null {
    return offers.value.get(productId)?.discount_percentage ?? null;
  }

  return { offers, offerFor, discountFor };
}

/** Applies a percentage discount to a base price, rounded to 2 decimals. */
export function applyDiscount(basePrice: number, discountPercentage: number | null): number {
  if (discountPercentage === null || discountPercentage === undefined) return basePrice;
  return Math.round(basePrice * (100 - discountPercentage)) / 100;
}