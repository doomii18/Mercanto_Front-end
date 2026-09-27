import { z } from "zod";
import {
  RatingSummarySchema,
  SortDirectionSchema,
  ShippingMethodSchema,
} from "@/api/modules/shared/schemas";
import { CategorySummarySchema } from "../category/domain";

export {
  RatingSummarySchema,
  SortDirectionSchema,
  ShippingMethodSchema,
  CategorySummarySchema,
};

// ProductTitle | product title length 1 to 255 chars
export const ProductTitleSchema = z
  .string()
  .trim()
  .min(1, "El título del producto es requerido")
  .max(255, "El título no debe exceder 255 caracteres");

// ProductDescription | product description length 1 to 2000 chars
export const ProductDescriptionSchema = z
  .string()
  .trim()
  .min(1, "La descripción no puede estar vacía")
  .max(2000, "La descripción no debe exceder 2000 caracteres");

// ProductPrice | non-negative base price
export const ProductPriceSchema = z.coerce
  .number()
  .min(0, "El precio base no puede ser negativo");

// MinOrderQuantity | minimum order quantity positive integer
export const MinOrderQuantitySchema = z
  .number()
  .int("La cantidad mínima debe ser un entero")
  .min(1, "La cantidad mínima debe ser al menos 1");

// UnitOfMeasure | catalog unit of measure enum
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

// ProductSortField | product listing sort fields
export const ProductSortFieldSchema = z.enum([
  "created_at",
  "updated_at",
  "title",
  "price",
  "score",
  "id",
]);

// PhysicalSpec | physical product specification details
export const PhysicalSpecSchema = z.object({
  min_order_quantity: MinOrderQuantitySchema,
});

// ServiceSpec | service product specification details
export const ServiceSpecSchema = z.object({
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  service_radius_km: z.coerce.number().min(0).optional().nullable(),
  requires_appointment: z.boolean(),
});

// ProductSpec | physical or service product specification
export const ProductSpecSchema = z.union([
  z.object({ Physical: PhysicalSpecSchema }),
  z.object({ Service: ServiceSpecSchema }),
]);

// PhysicalSpecUpdate | physical specification update parameters
export const PhysicalSpecUpdateSchema = z.object({
  min_order_quantity: MinOrderQuantitySchema.optional().nullable(),
});

// ServiceSpecUpdate | service specification update parameters
export const ServiceSpecUpdateSchema = z.object({
  estimated_duration_minutes: z.number().int().positive().optional().nullable(),
  service_radius_km: z.coerce.number().min(0).optional().nullable(),
  requires_appointment: z.boolean().optional().nullable(),
});

// ProductSpecUpdateParams | partial update for product specification
export const ProductSpecUpdateSchema = z.union([
  z.object({ Physical: PhysicalSpecUpdateSchema }),
  z.object({ Service: ServiceSpecUpdateSchema }),
]);
