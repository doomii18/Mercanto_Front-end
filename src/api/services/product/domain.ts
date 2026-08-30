import { z } from "zod";

export const CategoryNameSchema = z.string().min(1).max(100);
export const CategoryDescriptionSchema = z.string().min(1).max(2000);
export const ProductTitleSchema = z.string().min(1).max(255);
export const ProductDescriptionSchema = z.string().min(1).max(2000);
export const ProductPriceSchema = z.number().min(0);

export const UnitOfMeasureSchema = z.enum([
  "piece",
  "box",
  "roll",
  "pallet",
  "lot",
  "package",
  "set",
  "system",
  "service",
  "contract",
]);

export const ProductSortFieldSchema = z.enum([
  "created_at",
  "updated_at",
  "title",
  "price",
  "score",
  "id",
]);

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const RatingSummarySchema = z.object({
  average_score: z.number(),
  review_count: z.number().int().nonnegative(),
});

export const PhysicalSpecSchema = z.object({
  min_order_quantity: z.number().int().min(1),
});

export const ServiceSpecSchema = z.object({
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  service_radius_km: z.number().min(0).optional().nullable(),
  requires_appointment: z.boolean(),
});

export const ProductSpecSchema = z.union([
  z.object({ Physical: PhysicalSpecSchema }),
  z.object({ Service: ServiceSpecSchema }),
]);

export const PhysicalSpecUpdateSchema = z.object({
  min_order_quantity: z.number().int().min(1).optional().nullable(),
});

export const ServiceSpecUpdateSchema = z.object({
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  service_radius_km: z.number().min(0).optional().nullable(),
  requires_appointment: z.boolean().optional().nullable(),
});

export const ProductSpecUpdateSchema = z.union([
  z.object({ Physical: PhysicalSpecUpdateSchema }),
  z.object({ Service: ServiceSpecUpdateSchema }),
]);

export const CategorySummarySchema = z.object({
  id: z.uuid(),
  name: CategoryNameSchema,
});
