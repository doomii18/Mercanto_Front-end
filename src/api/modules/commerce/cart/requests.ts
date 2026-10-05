import { z } from "zod";

// UpdateCartItemQuantityDto | delta to increase or decrease item quantity in cart
export const UpdateCartItemQuantitySchema = z.object({
  quantity_delta: z.number().int(),
});

// PaginationQueryDto | pagination query parameters for cart products
export const CartPaginationQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

