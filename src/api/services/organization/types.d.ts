import type { z } from "zod";
import type {
  UpdateMemberRoleRequestSchema,
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
  OrganizationFiltersRequestSchema,
  OrganizationSortFieldSchema,
  SortDirectionSchema,
} from "./payloads";
import type {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  GeoPointSchema,
  RatingSummarySchema,
} from "./domain";

export type ProviderKind = z.infer<typeof ProviderKindSchema>;
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;
export type OrganizationMemberRole = z.infer<typeof OrganizationMemberRoleSchema>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type RatingSummary = z.infer<typeof RatingSummarySchema>;

export type OrganizationSortField = z.infer<typeof OrganizationSortFieldSchema>;
export type SortDirection = z.infer<typeof SortDirectionSchema>;
export type OrganizationFiltersRequest = z.infer<typeof OrganizationFiltersRequestSchema>;

export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;
export type PublicProviderDto = z.infer<typeof PublicProviderDtoSchema>;
export type OrganizationDetailsDto = z.infer<typeof OrganizationDetailsDtoSchema>;
export type PaginatedOrganizationsResponse = z.infer<typeof PaginatedOrganizationsResponseSchema>;
export type RegisterProviderRequest = z.infer<typeof RegisterProviderRequestSchema>;
export type ProviderOrganizationPatch = z.infer<typeof ProviderOrganizationPatchSchema>;
