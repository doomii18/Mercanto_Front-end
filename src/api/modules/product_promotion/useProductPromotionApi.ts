import { useApiFetch } from "@/api/useApiFetch";
import {
  PromoteProductRequestSchema,
  PromoteProductResponseSchema
} from "@/api/modules/product_promotion/schemas";
import type {
  PromoteProductRequest,
  PromoteProductResponse
} from "@/api/modules/product_promotion/types";

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
