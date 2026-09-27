import { z } from "zod";

// UpdateCartItemQuantityDto | delta to increase or decrease item quantity in cart
export const UpdateCartItemQuantitySchema = z.object({
  quantity_delta: z.number().int(),
});
