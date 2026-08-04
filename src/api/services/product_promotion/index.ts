import type { ApiClient } from "../../client";
import { PromoteProductRequestSchema, PromoteProductResponseSchema } from "./payloads";
import type { PromoteProductRequest, PromoteProductResponse } from "./types";

export class ProductPromotionService {
  constructor(private readonly client: ApiClient) {}

  async promoteProduct(payload: PromoteProductRequest): Promise<PromoteProductResponse> {
    const validatedPayload = PromoteProductRequestSchema.parse(payload);
    const data = await this.client.request("/products/promote", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return PromoteProductResponseSchema.parse(data);
  }
}
