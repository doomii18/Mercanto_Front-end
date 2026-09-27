import type { z } from "zod";
import type {
  CategoryNameSchema,
  CategoryDescriptionSchema,
  CategorySummarySchema,
} from "./domain";
import type {
  CreateCategoryRequestSchema,
  ProductCategoryPatchRequestSchema,
} from "./requests";
import type {
  ProductCategoryResponseSchema,
  ProductCategoryNodeResponse,
  CategoryMetricsResponseSchema,
  BatchCategoryMetricsResponseSchema,
  PaginatedCategoriesResponseSchema,
} from "./responses";

export type CategoryName = z.infer<typeof CategoryNameSchema>;
export type CategoryDescription = z.infer<typeof CategoryDescriptionSchema>;
export type CategorySummary = z.infer<typeof CategorySummarySchema>;

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type ProductCategoryPatchRequest = z.infer<typeof ProductCategoryPatchRequestSchema>;

export type ProductCategoryResponse = z.infer<typeof ProductCategoryResponseSchema>;
export type { ProductCategoryNodeResponse };
export type CategoryMetricsResponse = z.infer<typeof CategoryMetricsResponseSchema>;
export type BatchCategoryMetricsResponse = z.infer<typeof BatchCategoryMetricsResponseSchema>;
export type PaginatedCategoriesResponse = z.infer<typeof PaginatedCategoriesResponseSchema>;
