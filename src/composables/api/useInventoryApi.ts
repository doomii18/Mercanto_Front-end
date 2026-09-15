import { useApiFetch } from "./useApiFetch";
import {
  AdjustInventoryRequestSchema,
  InventoryResponseSchema
} from "@/api/services/inventory/payloads";
import type {
  AdjustInventoryRequest,
  InventoryResponse
} from "@/api/services/inventory/types";

export const useInventoryApi = () => {
  async function getInventory(productId: string): Promise<InventoryResponse> {
    const { data, error } = await useApiFetch(`/inventories/${productId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch inventory for product ${productId}`);
    }
    return InventoryResponseSchema.parse(data.value);
  }

  async function updateInventory(
    productId: string,
    payload: AdjustInventoryRequest
  ): Promise<InventoryResponse> {
    const validatedPayload = AdjustInventoryRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/inventories/${productId}`)
      .patch(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update inventory for product ${productId}`);
    }
    return InventoryResponseSchema.parse(data.value);
  }

  return {
    getInventory,
    updateInventory,
  };
};
