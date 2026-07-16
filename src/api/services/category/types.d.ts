import { z } from "zod";
import type {
  ProductCategoryResponseSchema,
  PaginatedCategoriesResponseSchema,
  CreateCategoryRequestSchema,
  ProductCategoryPatchRequestSchema,
  ProductCategoryNodeResponse,
} from "./payloads";

export type ProductCategoryResponse = z.infer<typeof ProductCategoryResponseSchema>;
export type PaginatedCategoriesResponse = z.infer<typeof PaginatedCategoriesResponseSchema>;
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type ProductCategoryPatchRequest = z.infer<typeof ProductCategoryPatchRequestSchema>;
export type { ProductCategoryNodeResponse };
