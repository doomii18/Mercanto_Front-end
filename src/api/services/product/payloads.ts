import { z } from "zod";
import {
  ProductTitleSchema,
  ProductDescriptionSchema,
  ProductPriceSchema,
  UnitOfMeasureSchema,
  ProductSpecSchema,
  ProductSpecUpdateSchema,
  CategorySummarySchema,
  ProductSortFieldSchema,
  SortDirectionSchema,
  RatingSummarySchema,
} from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";
import { ShippingMethodSchema } from "../quote/domain";

export const CreateProductRequestSchema = z.object({
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.optional().nullable(),
  base_price: ProductPriceSchema,
  shipping_methods: z.array(ShippingMethodSchema),
  unit_of_measure: UnitOfMeasureSchema.optional(),
  spec: ProductSpecSchema,
});

export const PatchProductRequestSchema = z.object({
  category_id: z.uuid().optional().nullable(),
  title: ProductTitleSchema.optional().nullable(),
  description: ProductDescriptionSchema.optional().nullable(),
  base_price: ProductPriceSchema.optional().nullable(),
  shipping_methods: z.array(ShippingMethodSchema).optional().nullable(),
  spec: ProductSpecUpdateSchema.optional().nullable(),
});

export const ProductFiltersRequestSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  provider_id: z.uuid().optional(),
  category_id: z.uuid().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  min_score: z.number().optional(),
  search_term: z.string().optional(),
  sort_by: ProductSortFieldSchema.optional(),
  sort_direction: SortDirectionSchema.optional(),
});

export const ProductResponseSchema = z.object({
  id: z.uuid(),
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: ProductTitleSchema,
  description: ProductDescriptionSchema.nullable().optional(),
  base_price: ProductPriceSchema,
  unit_of_measure: UnitOfMeasureSchema,
  spec: ProductSpecSchema,
  is_active: z.boolean(),
  updated_at: z.iso.datetime(),
  category: CategorySummarySchema,
  shipping_methods: z.array(ShippingMethodSchema),
  image_blob_ids: z.array(z.uuid()),
  rating: RatingSummarySchema,
});

export const PaginatedProductResponseSchema =
  PaginatedResponseSchema(ProductResponseSchema);

export const ProductImageSearchHitSchema = z.object({
  product: ProductResponseSchema,
  distance: z.number(),
});

export const PaginatedProductImageSearchResponseSchema =
  PaginatedResponseSchema(ProductImageSearchHitSchema);

export const ProductImageSearchUploadSchema = z.object({
  mime_type: z.string(),
  size_bytes: z.number().int().positive(),
});

export const SearchProductsByImageSchema = z.object({
  blob_id: z.uuid(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
