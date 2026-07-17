import { z } from "zod";
import { stockDeltaSchema } from "./domain";

export const AdjustInventoryRequestSchema = z.object({
  available_stock_delta: stockDeltaSchema,
});

export const InternalInventoryDtoSchema = z.object({
  type: z.literal("Internal"),
  product_id: z.uuid(),
  available_stock: z.number().int(),
  reserved_stock: z.number().int(),
  updated_at: z.iso.datetime(),
});

export const PublicInventoryDtoSchema = z.object({
  type: z.literal("Public"),
  product_id: z.uuid(),
  is_in_stock: z.boolean(),
});

export const InventoryResponseSchema = z.discriminatedUnion("type", [
  InternalInventoryDtoSchema,
  PublicInventoryDtoSchema,
]);
