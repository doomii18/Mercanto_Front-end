import { z } from "zod";

// CategoryName | category name length 1 to 100 chars
export const CategoryNameSchema = z
  .string()
  .trim()
  .min(1, "El nombre de la categoría es requerido")
  .max(100, "El nombre de la categoría no debe exceder 100 caracteres");

// CategoryDescription | category description length 1 to 2000 chars
export const CategoryDescriptionSchema = z
  .string()
  .trim()
  .min(1, "La descripción no puede estar vacía")
  .max(2000, "La descripción no debe exceder 2000 caracteres");

// CategorySummaryDto | minimal category summary
export const CategorySummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});
