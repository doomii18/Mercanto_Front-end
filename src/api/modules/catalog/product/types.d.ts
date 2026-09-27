import type { z } from "zod";
import type {
  ProductTitleSchema,
  ProductDescriptionSchema,
  ProductPriceSchema,
  MinOrderQuantitySchema,
  UnitOfMeasureSchema,
  ProductSortFieldSchema,
  ProductSpecSchema,
  ProductSpecUpdateSchema,
  PhysicalSpecSchema,
  ServiceSpecSchema,
} from "./domain";
import type {
  CreateProductRequestSchema,
  PatchProductRequestSchema,
  ProductFiltersRequestSchema,
  ProductImageSearchUploadSchema,
  SearchProductsByImageSchema,
} from "./requests";
import type {
  ProductResponseSchema,
  PaginatedProductResponseSchema,
  ProductImageSearchHitSchema,
  PaginatedProductImageSearchResponseSchema,
  BatchProductShippingResponseSchema,
} from "./responses";

export type ProductTitle = z.infer<typeof ProductTitleSchema>;
export type ProductDescription = z.infer<typeof ProductDescriptionSchema>;
export type ProductPrice = z.infer<typeof ProductPriceSchema>;
export type MinOrderQuantity = z.infer<typeof MinOrderQuantitySchema>;
export type UnitOfMeasure = z.infer<typeof UnitOfMeasureSchema>;
export type ProductSortField = z.infer<typeof ProductSortFieldSchema>;
export type ProductSpec = z.infer<typeof ProductSpecSchema>;
export type ProductSpecUpdate = z.infer<typeof ProductSpecUpdateSchema>;
export type PhysicalSpec = z.infer<typeof PhysicalSpecSchema>;
export type ServiceSpec = z.infer<typeof ServiceSpecSchema>;

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type PatchProductRequest = z.infer<typeof PatchProductRequestSchema>;
export type ProductFiltersRequest = z.infer<typeof ProductFiltersRequestSchema>;
export type ProductImageSearchUpload = z.infer<typeof ProductImageSearchUploadSchema>;
export type SearchProductsByImageRequest = z.infer<typeof SearchProductsByImageSchema>;

export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type PaginatedProductResponse = z.infer<typeof PaginatedProductResponseSchema>;
export type ProductImageSearchHit = z.infer<typeof ProductImageSearchHitSchema>;
export type PaginatedProductImageSearchResponse = z.infer<typeof PaginatedProductImageSearchResponseSchema>;
export type BatchProductShippingResponse = z.infer<typeof BatchProductShippingResponseSchema>;
