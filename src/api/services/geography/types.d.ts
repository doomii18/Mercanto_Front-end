import { z } from "zod";
import { CountryNodeSchema, MunicipalityResponseSchema } from "./payloads";

export type CountryNodeResponse = z.infer<typeof CountryNodeSchema>;
export type MunicipalityResponse = z.infer<typeof MunicipalityResponseSchema>;
export interface ReverseGeocodeQuery {
  lat: number;
  lng: number;
}
export interface GeographyQuery {
  country_iso: string;
}
