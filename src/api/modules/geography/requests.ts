import { z } from "zod";
import { CountryIsoSchema } from "./domain";

// GeographyQuery | country iso query parameters
export const GeographyQuerySchema = z.object({
  country_iso: CountryIsoSchema,
});

// MunicipalityQuery | reverse geocode coordinates query
export const MunicipalityQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

// MunicipalityQuery | compatibility alias
export const ReverseGeocodeQuerySchema = MunicipalityQuerySchema;
