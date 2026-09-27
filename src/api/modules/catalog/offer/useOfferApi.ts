import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  SetOfferRequestSchema,
  PatchOfferRequestSchema,
  BatchProductQuerySchema,
} from "./requests";
import {
  ProductOfferResponseSchema,
  PaginatedOfferResponseSchema,
  BatchOfferResponseSchema,
} from "./responses";
import type {
  SetOfferRequest,
  PatchOfferRequest,
  OfferFiltersRequest,
  ProductOfferResponse,
  PaginatedOfferResponse,
  BatchOfferResponse,
} from "./types";
import type { BatchProductQuery } from "@/api/modules/shared/types";

export const useOfferApi = () => {
  // GET /offers
  async function getOffers(params?: OfferFiltersRequest): Promise<PaginatedOfferResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.category_id) queryParams.append("category_id", params.category_id);
    if (params?.min_discount !== undefined)
      queryParams.append("min_discount", params.min_discount.toString());
    if (params?.only_current !== undefined)
      queryParams.append("only_current", params.only_current.toString());
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_direction) queryParams.append("sort_direction", params.sort_direction);

    const queryString = queryParams.toString();
    const endpoint = `/offers${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch offers");
    }
    return PaginatedOfferResponseSchema.parse(data.value);
  }

  // GET /offers/product/{product_id}
  async function getOfferByProduct(productId: string): Promise<ProductOfferResponse> {
    const { data, error } = await useApiFetch(`/offers/product/${productId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch offer for product ${productId}`);
    }
    return ProductOfferResponseSchema.parse(data.value);
  }

  // POST /offers/batch
  async function getOffersBatch(payload: BatchProductQuery): Promise<BatchOfferResponse> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/offers/batch").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch offers");
    }
    return BatchOfferResponseSchema.parse(data.value);
  }

  // GET /offers/product/{product_id}/history
  async function getOfferHistory(productId: string): Promise<ProductOfferResponse[]> {
    const { data, error } = await useApiFetch(
      `/offers/product/${productId}/history`
    )
      .get()
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch offer history for product ${productId}`);
    }
    return z.array(ProductOfferResponseSchema).parse(data.value);
  }

  // PUT /offers/product/{product_id}
  async function setOffer(
    productId: string,
    payload: SetOfferRequest
  ): Promise<ProductOfferResponse> {
    const validated = SetOfferRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/offers/product/${productId}`)
      .put(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to set offer for product ${productId}`);
    }
    return ProductOfferResponseSchema.parse(data.value);
  }

  // PATCH /offers/product/{product_id}
  async function patchOffer(
    productId: string,
    payload: PatchOfferRequest
  ): Promise<ProductOfferResponse> {
    const validated = PatchOfferRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/offers/product/${productId}`)
      .patch(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update offer for product ${productId}`);
    }
    return ProductOfferResponseSchema.parse(data.value);
  }

  // DELETE /offers/product/{product_id}
  async function removeOffer(productId: string): Promise<void> {
    const { error } = await useApiFetch(`/offers/product/${productId}`).delete();
    if (error.value) {
      throw error.value || new Error(`Failed to remove offer for product ${productId}`);
    }
  }

  return {
    getOffers,
    getOfferByProduct,
    getOffersBatch,
    getOfferHistory,
    setOffer,
    patchOffer,
    removeOffer,
  };
};