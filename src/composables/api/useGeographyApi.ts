import { useApiFetch } from "./useApiFetch";
import {
  CountryNodeSchema,
  MunicipalityResponseSchema
} from "@/api/services/geography/payloads";
import type {
  CountryNodeResponse,
  GeographyQuery,
  MunicipalityResponse,
  ReverseGeocodeQuery
} from "@/api/services/geography/types";

export const useGeographyApi = () => {
  async function getGeographyTree(params: GeographyQuery): Promise<CountryNodeResponse> {
    const queryParams = new URLSearchParams({ ...params });
    const endpoint = `/geography/tree?${queryParams.toString()}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch geography tree");
    }
    return CountryNodeSchema.parse(data.value);
  }

  async function getMunicipalityByCoordinates(params: ReverseGeocodeQuery): Promise<MunicipalityResponse> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
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
