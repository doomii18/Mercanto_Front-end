import { z } from "zod";
import { CountryNodeSchema } from "./payloads";

export type CountryNodeResponse = z.infer<typeof CountryNodeSchema>;

export interface GeographyQuery {
  country_iso: string;
}
