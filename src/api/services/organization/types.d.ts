import type { z } from "zod";
import type {
  PublicProviderDtoSchema,
  OrganizationDetailsDtoSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterProviderRequestSchema,
  ProviderOrganizationPatchSchema,
  UpdateMemberRoleRequestSchema,
} from "./payloads";
import type {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  GeoPointSchema,
} from "./domain";

export type PublicProviderDto = z.infer<typeof PublicProviderDtoSchema>;
export type OrganizationDetailsDto = z.infer<
  typeof OrganizationDetailsDtoSchema
>;
export type PaginatedOrganizationsResponse = z.infer<
  typeof PaginatedOrganizationsResponseSchema
>;
export type RegisterProviderRequest = z.infer<
  typeof RegisterProviderRequestSchema
>;
export type ProviderOrganizationPatchRequest = z.infer<
  typeof ProviderOrganizationPatchSchema
>;
export type UpdateMemberRoleRequest = z.infer<
  typeof UpdateMemberRoleRequestSchema
>;

export type ProviderKind = z.infer<typeof ProviderKindSchema>;
export type OrganizationStatus = z.infer<typeof OrganizationStatusSchema>;
export type OrganizationMemberRole = z.infer<
  typeof OrganizationMemberRoleSchema
>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;

export interface OrganizationFilters {
  limit?: number;
  offset?: number;
  search_term?: string;
  municipality_id?: string;
  sort_by?: "id" | "distance";
  sort_dir?: "asc" | "desc";
  lat?: number;
  lng?: number;
}
