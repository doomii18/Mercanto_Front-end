import { z } from "zod";

export const CategoryNameSchema = z.string().min(1).max(100);
export const CategoryDescriptionSchema = z.string().min(1).max(2000);
export const ProductTitleSchema = z.string().min(1).max(255);
export const ProductDescriptionSchema = z.string().min(1).max(2000);
export const ProductPriceSchema = z.number().min(0);
export const MinOrderQuantitySchema = z.number().min(1);

export const CategorySummarySchema = z.object({
  id: z.uuid(),
  name: CategoryNameSchema,
});

export const PublicInventorySchema = z.object({
  product_id: z.uuid(),
  is_in_stock: z.boolean(),
});

export const InternalInventorySchema = z.object({
  product_id: z.uuid(),
  available_stock: z.number(),
  reserved_stock: z.number(),
  updated_at: z.iso.datetime(),
});

export const PublicProductSchema = z.object({
  id: z.uuid(),
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.nullable().optional(),
  base_price: ProductPriceSchema,
  min_order_quantity: MinOrderQuantitySchema,
  category: CategorySummarySchema,
  inventory: PublicInventorySchema,
});

export const InternalProductSchema = z.object({
  id: z.uuid(),
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.nullable().optional(),
  base_price: ProductPriceSchema,
  min_order_quantity: MinOrderQuantitySchema,
  is_active: z.boolean(),
  updated_at: z.iso.datetime(),
  category: CategorySummarySchema,
  inventory: InternalInventorySchema,
});

export const ProductSchema = z.discriminatedUnion("type", [
  InternalProductSchema.extend({ type: z.literal("Internal") }),
  PublicProductSchema.extend({ type: z.literal("Public") }),
]);
