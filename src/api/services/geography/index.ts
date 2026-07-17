import type { ApiClient } from "../../client";
import { CountryNodeSchema } from "./payloads";
import type { CountryNodeResponse, GeographyQuery } from "./types";

export class GeographyService {
  constructor(private readonly client: ApiClient) {}

  async getGeographyTree(params: GeographyQuery): Promise<CountryNodeResponse> {
    const queryParams = new URLSearchParams({ country_iso: params.country_iso ? params.country_iso : "NIC" });
    const data = await this.client.request(`/geography/tree?${queryParams.toString()}`, { method: "GET" });
    return CountryNodeSchema.parse(data);
  }
}
