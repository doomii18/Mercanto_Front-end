import type { ApiClient } from "../../client";
import { CountryNodeSchema, MunicipalityResponseSchema } from "./payloads";
import type { CountryNodeResponse, GeographyQuery, MunicipalityResponse, ReverseGeocodeQuery } from "./types";

export class GeographyService {
  constructor(private readonly client: ApiClient) {}

  async getGeographyTree(params: GeographyQuery): Promise<CountryNodeResponse> {
    const queryParams = new URLSearchParams({ country_iso: params.country_iso ? params.country_iso : "NIC" });
    const data = await this.client.request(`/geography/tree?${queryParams.toString()}`, { method: "GET" });
    return CountryNodeSchema.parse(data);
  }

  async getMunicipalityByCoordinates(params: ReverseGeocodeQuery): Promise<MunicipalityResponse> {
    const queryParams = new URLSearchParams({
      lat: params.lat.toString(),
      lng: params.lng.toString(),
    });
    const data = await this.client.request(`/geography/municipality?${queryParams.toString()}`, { method: "GET" });
    return MunicipalityResponseSchema.parse(data);
  }
}
