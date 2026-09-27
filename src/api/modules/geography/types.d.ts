import type { z } from "zod";
import type { CountryIsoSchema } from "./domain";
import type {
  GeographyQuerySchema,
  MunicipalityQuerySchema,
  ReverseGeocodeQuerySchema,
} from "./requests";
import type {
  MunicipalityNodeSchema,
  DepartmentNodeSchema,
  CountryNodeSchema,
  MunicipalityResponseSchema,
} from "./responses";

export type CountryIso = z.infer<typeof CountryIsoSchema>;

export type GeographyQuery = z.infer<typeof GeographyQuerySchema>;
export type MunicipalityQuery = z.infer<typeof MunicipalityQuerySchema>;
export type ReverseGeocodeQuery = z.infer<typeof ReverseGeocodeQuerySchema>;

export type MunicipalityNode = z.infer<typeof MunicipalityNodeSchema>;
export type DepartmentNode = z.infer<typeof DepartmentNodeSchema>;
export type CountryNode = z.infer<typeof CountryNodeSchema>;
export type CountryNodeResponse = CountryNode;
export type MunicipalityResponse = z.infer<typeof MunicipalityResponseSchema>;
