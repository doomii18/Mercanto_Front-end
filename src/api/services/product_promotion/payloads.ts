import { z } from "zod";

export const PromoteProductRequestSchema = z.object({
  product_id: z.uuid(),
  payload: z.unknown()
});

export const PromoteProductResponseSchema = z.object({
  product_id: z.uuid(),
});
