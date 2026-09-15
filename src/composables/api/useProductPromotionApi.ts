import { useApiFetch } from "./useApiFetch";
import {
  PromoteProductRequestSchema,
  PromoteProductResponseSchema
} from "@/api/services/product_promotion/payloads";
import type {
  PromoteProductRequest,
  PromoteProductResponse
} from "@/api/services/product_promotion/types";

export const useProductPromotionApi = () => {
  async function promoteProduct(payload: PromoteProductRequest): Promise<PromoteProductResponse> {
    const validatedPayload = PromoteProductRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/products/promote")
      .post(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to promote product");
    }
    return PromoteProductResponseSchema.parse(data.value);
  }

  return {
    promoteProduct,
  };
};
