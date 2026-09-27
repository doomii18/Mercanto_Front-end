import { z } from "zod";
import { SortDirectionSchema } from "@/api/modules/shared/schemas";

export { SortDirectionSchema };

// DiscountPercentage | integer percentage off, 1 to 99
export const DiscountPercentageSchema = z
  .number()
  .int("El descuento debe ser un entero")
  .min(1, "El descuento mínimo es 1%")
  .max(99, "El descuento máximo es 99%");

// OfferSortField | offer listing sort fields
export const OfferSortFieldSchema = z.enum([
  "created_at",
  "discount_percentage",
  "starts_at",
]);