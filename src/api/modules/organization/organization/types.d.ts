import type { z } from "zod";
import type {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  OrganizationSortFieldSchema,
} from "./domain";
import type {
  OrganizationFiltersRequestSchema,
  UpdateMemberRoleRequestSchema,
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
} from "./requests";
import type {
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  PaginatedOrganizationDetailsResponseSchema,
} from "./responses";

// Domain types
export type ProviderKind = z.infer<typeof ProviderKindSchema>;
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;
export type OrganizationMemberRole = z.infer<typeof OrganizationMemberRoleSchema>;
export type OrganizationSortField = z.infer<typeof OrganizationSortFieldSchema>;

// Request types
export type OrganizationFiltersRequest = z.infer<typeof OrganizationFiltersRequestSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;
export type RegisterProviderRequest = z.infer<typeof RegisterProviderRequestSchema>;
export type ProviderOrganizationPatch = z.infer<typeof ProviderOrganizationPatchSchema>;

// Response types
export type PublicProviderDto = z.infer<typeof PublicProviderDtoSchema>;
export type OrganizationDetailsDto = z.infer<typeof OrganizationDetailsDtoSchema>;
export type PaginatedOrganizationsResponse = z.infer<typeof PaginatedOrganizationsResponseSchema>;
export type PaginatedOrganizationDetailsResponse = z.infer<
  typeof PaginatedOrganizationDetailsResponseSchema
>;

// Backward-compatible aliases
export type CreateOrganizationRequest = RegisterProviderRequest;
export type PatchOrganizationRequest = ProviderOrganizationPatch;
export type OrganizationResponse = OrganizationDetailsDto;
export type PaginatedOrganizationResponse = PaginatedOrganizationsResponse;
