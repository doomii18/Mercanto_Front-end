import { useApiFetch } from "@/api/useApiFetch";
import { GeographyQuerySchema, MunicipalityQuerySchema } from "./requests";
import { CountryNodeSchema, MunicipalityResponseSchema } from "./responses";
import type {
  CountryNodeResponse,
  GeographyQuery,
  MunicipalityResponse,
  MunicipalityQuery,
} from "./types";

export const useGeographyApi = () => {
  // GET /geography/tree
  async function getGeographyTree(params: GeographyQuery): Promise<CountryNodeResponse> {
    const validated = GeographyQuerySchema.parse(params);
    const queryParams = new URLSearchParams({
      country_iso: validated.country_iso,
    });
    const endpoint = `/geography/tree?${queryParams.toString()}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch geography tree");
    }
    return CountryNodeSchema.parse(data.value);
  }

  // GET /geography/municipality
  async function getMunicipalityByCoordinates(
    params: MunicipalityQuery
  ): Promise<MunicipalityResponse> {
    const validated = MunicipalityQuerySchema.parse(params);
    const queryParams = new URLSearchParams({
      lat: validated.lat.toString(),
      lng: validated.lng.toString(),
    });
    const endpoint = `/geography/municipality?${queryParams.toString()}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch municipality by coordinates");
    }
    return MunicipalityResponseSchema.parse(data.value);
  }

  return {
    getGeographyTree,
    getMunicipalityByCoordinates,
  };
};
