import { z } from "zod";
import {
  UnitOfMeasureSchema,
  ShippingMethodSchema,
  ProductSpecSchema,
  CategorySummarySchema,
  RatingSummarySchema,
} from "./domain";
import { PaginatedResponseSchema, UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// ProductResponseDto | product response payload
export const ProductResponseSchema = z.object({
  id: z.uuid(),
  provider_id: z.uuid(),
  category_id: z.uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  base_price: z.coerce.number(),
  unit_of_measure: UnitOfMeasureSchema,
  spec: ProductSpecSchema,
  is_active: z.boolean(),
  updated_at: z.iso.datetime(),
  // Optional enriched fields for frontend UI convenience
  category: CategorySummarySchema.optional(),
  shipping_methods: z.array(ShippingMethodSchema).optional(),
  image_blob_ids: z.array(z.string()).optional(),
  rating: RatingSummarySchema.optional(),
});

// PaginatedResponseDto<ProductResponseDto> | paginated list of products
export const PaginatedProductResponseSchema = PaginatedResponseSchema(ProductResponseSchema);

// ProductImageSearchHitDto | similarity search hit
export const ProductImageSearchHitSchema = z.object({
  product: ProductResponseSchema,
  distance: z.number(),
});

// PaginatedResponseDto<ProductImageSearchHitDto> | paginated similarity search hits
export const PaginatedProductImageSearchResponseSchema = PaginatedResponseSchema(ProductImageSearchHitSchema);

// BatchProductResponse | products mapped by product id
export const BatchProductResponseSchema = z.record(z.uuid(), ProductResponseSchema);

// BatchProductShippingResponse | batch product shipping methods map
export const BatchProductShippingResponseSchema = z.record(
  z.uuid(),
  z.array(ShippingMethodSchema)
);

// SmartProductSearchHitDto | multi-criteria smart search hit
export const SmartProductSearchHitSchema = z.object({
  product: ProductResponseSchema,
  rank_score: z.number(),
  visual_similarity: z.number(),
  distance_km: z.number(),
  price_score: z.number(),
});

// ProviderCoverageDto | provider that can supply part of the requested list
export const ProviderCoverageSchema = z.object({
  provider_id: z.uuid(),
  seed_product_ids: z.array(z.uuid()),
  item_count: z.number(),
});

// SmartSearchCoverageDto | exact-ownership analysis of the requested list
export const SmartSearchCoverageSchema = z.object({
  single_provider: z.boolean(),
  total_items: z.number(),
  covered_items: z.number(),
  groups: z.array(ProviderCoverageSchema),
  message: z.string(),
});

// SmartSearchResponseDto | ranked hits plus provider coverage
export const SmartSearchResponseSchema = z.object({
  data: z.array(SmartProductSearchHitSchema),
  coverage: SmartSearchCoverageSchema,
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export { UploadUrlResponseSchema };
