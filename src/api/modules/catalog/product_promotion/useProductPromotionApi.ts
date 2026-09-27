import { useApiFetch } from "@/api/useApiFetch";
import { PromoteProductRequestSchema } from "./requests";
import { PromoteProductResponseSchema } from "./responses";
import type { PromoteProductRequest, PromoteProductResponse } from "./types";

export const useProductPromotionApi = () => {
  // POST /products/promote
  async function promoteProduct(
    payload: PromoteProductRequest
  ): Promise<PromoteProductResponse> {
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
