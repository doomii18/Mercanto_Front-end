import { z } from "zod";
import { CategoryNameSchema, CategoryDescriptionSchema, CategorySummarySchema } from "./domain";
import { PaginatedResponseSchema, UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// ProductCategoryResponseDto | product category response
export const ProductCategoryResponseSchema = z.object({
  id: z.uuid(),
  parent_id: z.uuid().nullable(),
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.nullable(),
  image_blob_id: z.uuid().nullable(),
});

// ProductCategoryNodeResponseDto | hierarchical category tree node
export type ProductCategoryNodeResponse = {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  image_blob_id: string | null;
  children: ProductCategoryNodeResponse[];
};

export const ProductCategoryNodeResponseSchema: z.ZodType<ProductCategoryNodeResponse> = z.lazy(() =>
  z.object({
    id: z.uuid(),
    parent_id: z.uuid().nullable(),
    name: z.string(),
    description: z.string().nullable(),
    image_blob_id: z.uuid().nullable(),
    children: z.array(ProductCategoryNodeResponseSchema),
  })
);

// CategoryMetricsDto | category statistical metrics
export const CategoryMetricsResponseSchema = z.object({
  product_count: z.number().int().nonnegative(),
});

// CategoryMetricsDto | batch category metrics map response
export const BatchCategoryMetricsResponseSchema = z.record(
  z.uuid(),
  CategoryMetricsResponseSchema
);

// PaginatedResponseDto<ProductCategoryResponseDto> | paginated list of categories
export const PaginatedCategoriesResponseSchema = PaginatedResponseSchema(ProductCategoryResponseSchema);

// CategorySummaryDto | re-export summary schema
export { CategorySummarySchema, UploadUrlResponseSchema };
