import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// CartItemResponseDto | cart item representation with buyer and product details
export const CartItemResponseSchema = z.object({
  buyer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  added_at: z.string().datetime(),
});

export const PaginatedCartItemResponseSchema = PaginatedResponseSchema(CartItemResponseSchema);

