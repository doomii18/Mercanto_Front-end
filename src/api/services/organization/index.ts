import type { ApiClient } from "../../client";
import { z } from "zod";
import {
  OrganizationResponseSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterOrganizationRequestSchema,
  OrganizationPatchRequestSchema,
} from "./payloads";
import type {
  OrganizationResponse,
  PaginatedOrganizationsResponse,
  RegisterOrganizationRequest,
  OrganizationPatchRequest,
} from "./types";

export class OrganizationService {
  constructor(private readonly client: ApiClient) {}

  async getOrganizations(params?: {
    limit?: number;
    offset?: number;
    search_term?: string;
    municipality_id?: string;
  }): Promise<PaginatedOrganizationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.search_term) queryParams.append("search_term", params.search_term);
    if (params?.municipality_id) queryParams.append("municipality_id", params.municipality_id);

    const queryString = queryParams.toString();
    const endpoint = `/providers${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedOrganizationsResponseSchema.parse(data);
  }

  async getOrganization(id: string): Promise<OrganizationResponse> {
    const data = await this.client.request(`/providers/${id}`, { method: "GET" });
    return OrganizationResponseSchema.parse(data);
  }

  async registerOrganization(payload: RegisterOrganizationRequest): Promise<OrganizationResponse> {
    const validatedPayload = RegisterOrganizationRequestSchema.parse(payload);
    const data = await this.client.request("/providers", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return OrganizationResponseSchema.parse(data);
  }

  async updateOrganization(id: string, payload: OrganizationPatchRequest): Promise<OrganizationResponse> {
    const validatedPayload = OrganizationPatchRequestSchema.parse(payload);
    const data = await this.client.request(`/providers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return OrganizationResponseSchema.parse(data);
  }

  async getMyOrganizations(): Promise<OrganizationResponse[]> {
    const data = await this.client.request("/memberships/me/providers", { method: "GET" });
    return z.array(OrganizationResponseSchema).parse(data);
  }
}
