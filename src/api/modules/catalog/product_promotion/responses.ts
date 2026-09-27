import { z } from "zod";

// PromoteProductResponseDto | product promotion signaling response
export const PromoteProductResponseSchema = z.object({
  product_id: z.uuid(),
});
