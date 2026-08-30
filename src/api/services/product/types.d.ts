import { z } from "zod";
import {
  CreateProductRequestSchema,
  PatchProductRequestSchema,
  ProductFiltersRequestSchema,
  ProductResponseSchema,
  PaginatedProductResponseSchema,
  ProductImageSearchUploadSchema,
  SearchProductsByImageSchema,
  ProductImageSearchHitSchema,
  PaginatedProductImageSearchResponseSchema,
} from "./payloads";
import { ProductSortFieldSchema } from "./domain";

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type PatchProductRequest = z.infer<typeof PatchProductRequestSchema>;
export type ProductFiltersRequest = z.infer<typeof ProductFiltersRequestSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type PaginatedProductResponse = z.infer<typeof PaginatedProductResponseSchema>;
export type ProductImageSearchUploadRequest = z.infer<typeof ProductImageSearchUploadSchema>;
export type SearchProductsByImageRequest = z.infer<typeof SearchProductsByImageSchema>;

export type ProductImageSearchHit = z.infer<typeof ProductImageSearchHitSchema>;
export type PaginatedProductImageSearchResponse = z.infer<typeof PaginatedProductImageSearchResponseSchema>;

export type ProductSortField = z.infer<typeof ProductSortFieldSchema>;
