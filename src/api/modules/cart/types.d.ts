import type { z } from "zod";
import type { CartItemResponseSchema, UpdateCartItemQuantitySchema } from "./schemas";

export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
export type UpdateCartItemQuantityRequest = z.infer<typeof UpdateCartItemQuantitySchema>;
