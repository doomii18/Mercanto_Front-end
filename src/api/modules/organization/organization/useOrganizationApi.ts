import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import { BatchAccountQuerySchema } from "@/api/modules/shared/schemas";
import {
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
  UpdateMemberRoleRequestSchema,
} from "./requests";
import {
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  PaginatedOrganizationDetailsResponseSchema,
  ProviderMembershipsByAccountSchema,
} from "./responses";
import type {
  PublicProviderDto,
  OrganizationDetailsDto,
  PaginatedOrganizationsResponse,
  PaginatedOrganizationDetailsResponse,
  ProviderMembershipsByAccount,
  RegisterProviderRequest,
  ProviderOrganizationPatch,
  UpdateMemberRoleRequest,
  OrganizationFiltersRequest,
} from "./types";
import type { BatchAccountQuery } from "@/api/modules/shared/types";

export const useOrganizationApi = () => {
  // GET /providers
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
    if (params?.status)
      queryParams.append("status", params.status);
    if (params?.kind)
      queryParams.append("kind", params.kind);
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

  // GET /admin/organizations
  // Admin/Auditor view: returns organizations in every verification state
  // (draft, pending, approved, rejected, revoked) unless filtered by status.
  async function getAllOrganizations(
    params?: OrganizationFiltersRequest
  ): Promise<PaginatedOrganizationDetailsResponse> {
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
    if (params?.status)
      queryParams.append("status", params.status);
    if (params?.kind)
      queryParams.append("kind", params.kind);
    if (params?.sort_by)
      queryParams.append("sort_by", params.sort_by);
    if (params?.sort_dir)
      queryParams.append("sort_dir", params.sort_dir);
    if (params?.lat !== undefined)
      queryParams.append("lat", params.lat.toString());
    if (params?.lng !== undefined)
      queryParams.append("lng", params.lng.toString());

    const queryString = queryParams.toString();
    const endpoint = `/admin/organizations${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch all organizations");
    }

    return PaginatedOrganizationDetailsResponseSchema.parse(data.value);
  }

  // POST /admin/organizations/memberships/batch
  // Admin/Auditor view: resolves the active provider memberships for a set of
  // account IDs. Every requested account id is a key; accounts without any
  // active provider membership map to an empty list.
  async function getProviderMembershipsBatch(
    payload: BatchAccountQuery
  ): Promise<ProviderMembershipsByAccount> {
    const validated = BatchAccountQuerySchema.parse(payload);

    const { data, error } = await useApiFetch(
      "/admin/organizations/memberships/batch"
    )
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch provider memberships");
    }

    return ProviderMembershipsByAccountSchema.parse(data.value);
  }

  // GET /providers/{id}
  async function getPublicProvider(providerId: string): Promise<PublicProviderDto> {
    const { data, error } = await useApiFetch(`/providers/${providerId}`)
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch provider ${providerId}`);
    }

    return PublicProviderDtoSchema.parse(data.value);
  }

  // GET /organizations/{id}
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

  // GET /memberships/me/organizations
  async function getMyOrganizations(): Promise<OrganizationDetailsDto[]> {
    const { data, error } = await useApiFetch("/memberships/me/organizations")
      .get()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch user organizations");
    }

    return z.array(OrganizationDetailsDtoSchema).parse(data.value);
  }

  // POST /organizations
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

  // PATCH /organizations/{id}
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

  // PATCH /organizations/{organization_id}/members/{account_id}/role
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

  // DELETE /organizations/{organization_id}/members/{account_id}
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

  return {
    getOrganizations,
    getAllOrganizations,
    getProviderMembershipsBatch,
    getPublicProvider,
    getOrganizationDetails,
    getMyOrganizations,
    registerOrganization,
    patchOrganization,
    updateMemberRole,
    revokeMember,
  };
};
