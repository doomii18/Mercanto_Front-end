import type { z } from "zod";
import type { CartItemResponseSchema, UpdateCartItemQuantitySchema } from "./payloads";

export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
export type UpdateCartItemQuantityRequest = z.infer<typeof UpdateCartItemQuantitySchema>;
