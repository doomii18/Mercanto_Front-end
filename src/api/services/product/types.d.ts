import { z } from "zod";
import {
  CreateProductRequestSchema,
  PatchProductRequestSchema,
  ProductFiltersRequestSchema,
  ProductResponseSchema,
  PaginatedProductResponseSchema,
} from "./payloads";

export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type PatchProductRequest = z.infer<typeof PatchProductRequestSchema>;
export type ProductFiltersRequest = z.infer<typeof ProductFiltersRequestSchema>;
export type ProductResponse = z.infer<typeof ProductResponseSchema>;
export type PaginatedProductResponse = z.infer<typeof PaginatedProductResponseSchema>;
