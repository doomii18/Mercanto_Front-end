import { z } from "zod";
import { GeoPointSchema } from "@/api/modules/shared/schemas";

// CountryIso | country iso code 2 or 3 characters
export const CountryIsoSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "El código ISO debe tener al menos 2 caracteres")
  .max(3, "El código ISO no debe exceder 3 caracteres");

// GeoPoint | re-export shared geographic coordinates schema
export { GeoPointSchema };
