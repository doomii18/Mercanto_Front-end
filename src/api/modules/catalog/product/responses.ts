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
  image_blob_ids: z.array(z.uuid()).optional(),
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

export { UploadUrlResponseSchema };
