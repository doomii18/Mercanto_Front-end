import type { z } from "zod";
import type { UpdateCartItemQuantitySchema, CartPaginationQuerySchema } from "./requests";
import type { CartItemResponseSchema, PaginatedCartItemResponseSchema } from "./responses";

// Request types
export type UpdateCartItemQuantityRequest = z.infer<typeof UpdateCartItemQuantitySchema>;
export type CartPaginationQuery = z.infer<typeof CartPaginationQuerySchema>;

// Response types
export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
export type PaginatedCartItemResponse = z.infer<typeof PaginatedCartItemResponseSchema>;

