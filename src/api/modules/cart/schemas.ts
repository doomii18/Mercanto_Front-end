import { z } from "zod";

export const CartItemResponseSchema = z.object({
  buyer_id: z.uuid(),
  product_id: z.uuid(),
  quantity: z.number().int().nonnegative(),
  added_at: z.iso.datetime(),
});

export const UpdateCartItemQuantitySchema = z.object({
  quantity_delta: z.number().int(),
});
