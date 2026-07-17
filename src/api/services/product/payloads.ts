import { z } from "zod";
import {
  ProductTitleSchema,
  ProductDescriptionSchema,
  ProductPriceSchema,
  MinOrderQuantitySchema,
  ProductSchema
} from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const CreateProductRequestSchema = z.object({
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.optional(),
  base_price: ProductPriceSchema,
  min_order_quantity: MinOrderQuantitySchema,
});

export const PatchProductRequestSchema = z.object({
  category_id: z.uuid().optional(),
  title: ProductTitleSchema.optional(),
  description: ProductDescriptionSchema.optional(),
  base_price: ProductPriceSchema.optional(),
  min_order_quantity: MinOrderQuantitySchema.optional(),
});

export const ProductFiltersRequestSchema = z.object({
  limit: z.number().optional(),
  offset: z.number().optional(),
  provider_id: z.uuid().optional(),
  category_id: z.uuid().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  search_term: z.string().optional(),
});

export const ProductResponseSchema = ProductSchema;

export const PaginatedProductResponseSchema = PaginatedResponseSchema(ProductSchema);
