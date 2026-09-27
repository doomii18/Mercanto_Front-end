import type { z } from "zod";
import type { UpdateCartItemQuantitySchema } from "./requests";
import type { CartItemResponseSchema } from "./responses";

// Request types
export type UpdateCartItemQuantityRequest = z.infer<typeof UpdateCartItemQuantitySchema>;

// Response types
export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
