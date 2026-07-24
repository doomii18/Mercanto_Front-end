import { z } from "zod";
import { CategoryDescriptionSchema, CategoryNameSchema } from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const ProductCategoryResponseSchema = z.object({
  id: z.uuid(),
  parent_id: z.uuid().nullable(),
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.nullable(),
  image_blob_id: z.uuid().nullable(),
});

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

export const PaginatedCategoriesResponseSchema = PaginatedResponseSchema(ProductCategoryResponseSchema);

export const CreateCategoryRequestSchema = z.object({
  parent_id: z.uuid().optional().nullable(),
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.optional().nullable(),
});

export const ProductCategoryPatchRequestSchema = z.object({
  name: CategoryNameSchema.optional().nullable(),
  description: CategoryDescriptionSchema.optional().nullable(),
});
