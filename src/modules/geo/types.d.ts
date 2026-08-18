
import type { CountryNodeResponse } from "../../api/services/geography/types";

export interface Municipality {
  id: string;
  name: string;
  departmentId: string;
  countryId: string;
}

export interface Department {
  id: string;
  name: string;
  countryId: string;
  municipalities: Municipality[];
}

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  departments: Department[];
}

export interface CachedGeoPayload {
  countries: CountryNodeResponse[];
  timestamp: number;
}

export interface BootstrapGeoOptions {
  countryIso?: string;
  forceRefresh?: boolean;
}
