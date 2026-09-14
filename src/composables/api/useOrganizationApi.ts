import { useApiFetch } from "./useApiFetch";
import { z } from "zod";
import {
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
  UpdateMemberRoleRequestSchema,

} from "@/api/services/organization/payloads";
import type {
  PublicProviderDto,
  OrganizationDetailsDto,
  PaginatedOrganizationsResponse,
  RegisterProviderRequest,
  ProviderOrganizationPatch,
  UpdateMemberRoleRequest,
  OrganizationFiltersRequest,
} from "@/api/services/organization/types";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "@/api/shared/schemas";

export const useOrganizationApi = () => {

  // ORGANIZATION QUERIES
  async function getOrganizations(
    params?: OrganizationFiltersRequest
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
    if (params?.sort_by)
      queryParams.append("sort_by", params.sort_by);
    if (params?.sort_dir)
      queryParams.append("sort_dir", params.sort_dir);
    if (params?.lat !== undefined)
      queryParams.append("lat", params.lat.toString());
    if (params?.lng !== undefined)
      queryParams.append("lng", params.lng.toString());

    const queryString = queryParams.toString();
    const endpoint = `/providers${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch organizations");
    }

    return PaginatedOrganizationsResponseSchema.parse(data.value);
  }

  async function getPublicProvider(providerId: string): Promise<PublicProviderDto> {
    const { data, error } = await useApiFetch(`/providers/${providerId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch provider ${providerId}`);
    }

    return PublicProviderDtoSchema.parse(data.value);
  }

  async function getOrganizationDetails(
    organizationId: string
  ): Promise<OrganizationDetailsDto> {
    const { data, error } = await useApiFetch(`/organizations/${organizationId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch organization ${organizationId}`);
    }

    return OrganizationDetailsDtoSchema.parse(data.value);
  }

  async function getMyOrganizations(): Promise<OrganizationDetailsDto[]> {
    const { data, error } = await useApiFetch("/memberships/me/organizations")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch user organizations");
    }

    return z.array(OrganizationDetailsDtoSchema).parse(data.value);
  }


  // ORGANIZATION MANAGEMENT
  async function registerOrganization(
    payload: RegisterProviderRequest
  ): Promise<OrganizationDetailsDto> {
    const validatedPayload = RegisterProviderRequestSchema.parse(payload);

    const { data, error } = await useApiFetch("/organizations")
      .post(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to register provider organization");
    }

    return OrganizationDetailsDtoSchema.parse(data.value);
  }

  async function patchOrganization(
    organizationId: string,
    payload: ProviderOrganizationPatch
  ): Promise<OrganizationDetailsDto> {
    const validatedPayload = ProviderOrganizationPatchSchema.parse(payload);

    const { data, error } = await useApiFetch(`/organizations/${organizationId}`)
      .patch(validatedPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update organization ${organizationId}`);
    }

    return OrganizationDetailsDtoSchema.parse(data.value);
  }


  // MEMBER MANAGEMENT
  async function updateMemberRole(
    organizationId: string,
    memberId: string,
    payload: UpdateMemberRoleRequest
  ): Promise<void> {
    const validatedPayload = UpdateMemberRoleRequestSchema.parse(payload);

    const { error } = await useApiFetch(
      `/organizations/${organizationId}/members/${memberId}/role`
    ).patch(validatedPayload);

    if (error.value) {
      throw error.value;
    }
  }

  async function revokeMember(
    organizationId: string,
    memberId: string
  ): Promise<void> {
    const { error } = await useApiFetch(
      `/organizations/${organizationId}/members/${memberId}`
    ).delete();

    if (error.value) {
      throw error.value;
    }
  }


  // LOGO MANAGEMENT
  async function getOrganizationLogoBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/providers/logo/${blobId}`)
      .get()
      .blob();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch organization logo");
    }

    return data.value;
  }



  async function uploadOrganizationLogo(
    organizationId: string,
    file: File
  ): Promise<void> {
    const payload = AssetUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    // Get presigned upload URL
    const { data: initData, error: initError } = await useApiFetch(
      `/providers/${organizationId}/logo/upload`
    )
      .post(payload)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize logo upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);

    // Upload to storage
    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) {
      throw new Error("Failed to upload logo to storage");
    }

    // Confirm upload
    const { error: confirmError } = await useApiFetch(
      `/providers/${organizationId}/logo/${uploadInfo.blob_id}/confirm`
    ).post();

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  async function deleteOrganizationLogo(organizationId: string): Promise<void> {
    const { error } = await useApiFetch(`/providers/${organizationId}/logo`)
      .delete();

    if (error.value) {
      throw error.value;
    }
  }

  return {
    // Queries
    getOrganizations,
    getPublicProvider,
    getOrganizationDetails,
    getMyOrganizations,

    // Management
    registerOrganization,
    patchOrganization,

    // Members
    updateMemberRole,
    revokeMember,

    // Logo
    getOrganizationLogoBlob,
    uploadOrganizationLogo,
    deleteOrganizationLogo,
  };
};
