import { z } from "zod";
import { CategoryNameSchema, CategoryDescriptionSchema } from "./domain";

// CreateCategoryDto | new category creation payload
export const CreateCategoryRequestSchema = z.object({
  parent_id: z.uuid("ID de categoría padre inválido").optional().nullable(),
  name: CategoryNameSchema,
  description: CategoryDescriptionSchema.optional().nullable(),
});

// ProductCategoryPatchDto | partial category update payload
export const ProductCategoryPatchRequestSchema = z.object({
  name: CategoryNameSchema.optional().nullable(),
  description: CategoryDescriptionSchema.optional().nullable(),
});

// BatchCategoryQueryDto | batch category query with 1 to 100 items limit
export const BatchCategoryQuerySchema = z.object({
  category_ids: z
    .array(z.uuid("ID de categoría inválido"))
    .min(1, "El lote debe contener al menos 1 categoría")
    .max(100, "El lote no debe exceder las 100 categorías"),
});
