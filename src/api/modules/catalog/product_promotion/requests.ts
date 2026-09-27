import { z } from "zod";

// PromoteProductDto | product promotion signaling payload
export const PromoteProductRequestSchema = z.object({
  product_id: z.uuid("ID de producto inválido"),
  payload: z.unknown(),
});
