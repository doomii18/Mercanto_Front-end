import type { ApiClient } from "../../client";
import { z } from "zod";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "../../shared/schemas";
import {
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
  UpdateMemberRoleRequestSchema,
} from "./payloads";
import type {
  PublicProviderDto,
  OrganizationDetailsDto,
  PaginatedOrganizationsResponse,
  RegisterProviderRequest,
  ProviderOrganizationPatchRequest,
  UpdateMemberRoleRequest,
  OrganizationFilters,
} from "./types";

export class OrganizationService {
  constructor(private readonly client: ApiClient) {}

  async getOrganizations(
    params?: OrganizationFilters,
  ): Promise<PaginatedOrganizationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    if (params?.search_term)
      queryParams.append("search_term", params.search_term);
    if (params?.municipality_id)
      queryParams.append("municipality_id", params.municipality_id);
    if (params?.min_rating !== undefined)
      queryParams.append("min_rating", params.min_rating.toString());
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_dir) queryParams.append("sort_dir", params.sort_dir);
    if (params?.lat !== undefined)
      queryParams.append("lat", params.lat.toString());
    if (params?.lng !== undefined)
      queryParams.append("lng", params.lng.toString());

    const queryString = queryParams.toString();
    const endpoint = `/providers${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedOrganizationsResponseSchema.parse(data);
  }

  async getPublicProvider(id: string): Promise<PublicProviderDto> {
    const data = await this.client.request(`/providers/${id}`, {
      method: "GET",
    });
    return PublicProviderDtoSchema.parse(data);
  }

  async getTenantOrganization(id: string): Promise<OrganizationDetailsDto> {
    const data = await this.client.request(`/organizations/${id}`, {
      method: "GET",
    });
    return OrganizationDetailsDtoSchema.parse(data);
  }

  async getOrganization(id: string): Promise<PublicProviderDto> {
    return this.getPublicProvider(id);
  }

  async registerOrganization(
    payload: RegisterProviderRequest,
  ): Promise<OrganizationDetailsDto> {
    const validatedPayload = RegisterProviderRequestSchema.parse(payload);
    const data = await this.client.request("/organizations", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return OrganizationDetailsDtoSchema.parse(data);
  }

  async updateOrganization(
    id: string,
    payload: ProviderOrganizationPatchRequest,
  ): Promise<OrganizationDetailsDto> {
    const validatedPayload = ProviderOrganizationPatchSchema.parse(payload);
    const data = await this.client.request(`/organizations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return OrganizationDetailsDtoSchema.parse(data);
  }

  async getMyOrganizations(): Promise<OrganizationDetailsDto[]> {
    const data = await this.client.request("/memberships/me/organizations", {
      method: "GET",
    });
    return z.array(OrganizationDetailsDtoSchema).parse(data);
  }

  async updateMemberRole(
    organizationId: string,
    accountId: string,
    payload: UpdateMemberRoleRequest,
  ): Promise<void> {
    const validatedPayload = UpdateMemberRoleRequestSchema.parse(payload);
    await this.client.request(
      `/organizations/${organizationId}/members/${accountId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify(validatedPayload),
      },
    );
  }

  async revokeMember(organizationId: string, accountId: string): Promise<void> {
    await this.client.request(
      `/organizations/${organizationId}/members/${accountId}`,
      { method: "DELETE" },
    );
  }

  async getOrganizationLogoBlob(blobId: string): Promise<Blob> {
    return this.client.downloadBlob(`/providers/logo/${blobId}`);
  }

  async getOrganizationLogoBlobUrl(blobId: string): Promise<string> {
    const blob = await this.getOrganizationLogoBlob(blobId);
    return URL.createObjectURL(blob);
  }

  async uploadOrganizationLogo(
    organizationId: string,
    file: File,
  ): Promise<void> {
    const payload = AssetUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });
    const initData = UploadUrlResponseSchema.parse(
      await this.client.request(`/providers/${organizationId}/logo/upload`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const storageResponse = await fetch(initData.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!storageResponse.ok) throw new Error("Logo upload failed");

    await this.client.request(
      `/providers/${organizationId}/logo/${initData.blob_id}/confirm`,
      { method: "POST" },
    );
  }

  async deleteOrganizationLogo(organizationId: string): Promise<void> {
    await this.client.request(`/providers/${organizationId}/logo`, {
      method: "DELETE",
    });
  }
}
