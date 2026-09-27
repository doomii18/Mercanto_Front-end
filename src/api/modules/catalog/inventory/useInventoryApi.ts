import { useApiFetch } from "@/api/useApiFetch";
import {
  AdjustInventoryRequestSchema,
  BatchProductQuerySchema,
} from "./requests";
import {
  PublicInventoryResponseSchema,
  InternalInventoryResponseSchema,
  BatchInventoryResponseSchema,
} from "./responses";
import type {
  PublicInventoryResponse,
  InternalInventoryResponse,
  BatchInventoryResponse,
  AdjustInventoryRequest,
} from "./types";
import type { BatchProductQuery } from "@/api/modules/shared/types";

export const useInventoryApi = () => {
  // GET /inventories/{product_id}
  async function getInventory(productId: string): Promise<PublicInventoryResponse> {
    const { data, error } = await useApiFetch(`/inventories/${productId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch inventory for product ${productId}`);
    }
    return PublicInventoryResponseSchema.parse(data.value);
  }

  // GET /inventories/{product_id}/details
  async function getInventoryDetails(
    productId: string
  ): Promise<InternalInventoryResponse> {
    const { data, error } = await useApiFetch(`/inventories/${productId}/details`)
      .get()
      .json();
    if (error.value || !data.value) {
      throw (
        error.value ||
        new Error(`Failed to fetch internal inventory details for product ${productId}`)
      );
    }
    return InternalInventoryResponseSchema.parse(data.value);
  }

  // PATCH /inventories/{product_id}
  async function updateInventory(
    productId: string,
    payload: AdjustInventoryRequest
  ): Promise<InternalInventoryResponse> {
    const validatedPayload = AdjustInventoryRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/inventories/${productId}`)
      .patch(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update inventory for product ${productId}`);
    }
    return InternalInventoryResponseSchema.parse(data.value);
  }

  // POST /inventories/batch
  async function getInventoryBatch(
    payload: BatchProductQuery
  ): Promise<BatchInventoryResponse> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/inventories/batch")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch product inventories");
    }
    return BatchInventoryResponseSchema.parse(data.value);
  }

  return {
    getInventory,
    getInventoryDetails,
    updateInventory,
    getInventoryBatch,
  };
};
