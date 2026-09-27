import { z } from "zod";

// PublicInventoryDto | public product stock availability
export const PublicInventoryResponseSchema = z.object({
  product_id: z.uuid(),
  is_in_stock: z.boolean(),
  lifetime_units_sold: z.number().int(),
});

// InternalInventoryDto | internal detailed product stock metrics
export const InternalInventoryResponseSchema = z.object({
  product_id: z.uuid(),
  available_stock: z.number().int(),
  reserved_stock: z.number().int(),
  lifetime_units_sold: z.number().int(),
  updated_at: z.iso.datetime(),
});

// PublicInventoryDto | batch stock availability map response
export const BatchInventoryResponseSchema = z.record(
  z.uuid(),
  PublicInventoryResponseSchema
);

// PublicInventoryDto | compatibility alias
export const InventoryResponseSchema = PublicInventoryResponseSchema;
