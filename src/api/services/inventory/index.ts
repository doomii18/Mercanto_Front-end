import type { ApiClient } from "../../client";
import { AdjustInventoryRequestSchema, InventoryResponseSchema } from "./payloads";
import type { AdjustInventoryRequest, InventoryResponse } from "./types";

export class InventoryService {
  constructor(private readonly client: ApiClient) {}

  async updateInventory(productId: string, payload: AdjustInventoryRequest): Promise<InventoryResponse> {
    const validatedPayload = AdjustInventoryRequestSchema.parse(payload);
    const data = await this.client.request(`/inventories/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return InventoryResponseSchema.parse(data);
  }
}
