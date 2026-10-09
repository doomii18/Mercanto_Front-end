import { z } from "zod";
import {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  companyNameSchema,
  taxIdSchema,
  companyDescriptionSchema,
  phoneNumberSchema,
  GeoPointSchema,
} from "./domain";
import { PaginatedResponseSchema, RatingSummarySchema } from "@/api/modules/shared/schemas";

export { UploadUrlResponseSchema } from "@/api/modules/shared/schemas";

// PublicProviderDto | public summary view of a provider organization
export const PublicProviderDtoSchema = z.object({
  id: z.string().uuid(),
  company_name: companyNameSchema,
  location: GeoPointSchema,
  municipality_id: z.string().uuid(),
  company_description: companyDescriptionSchema.nullable().optional(),
  logo_blob_id: z.string().uuid().nullable().optional(),
  kind: ProviderKindSchema,
  rating: RatingSummarySchema.nullish().transform(
    (val) => val ?? { average_score: 0, review_count: 0 }
  ),
});

// OrganizationDetailsDto | full internal/tenant view of an organization
export const OrganizationDetailsDtoSchema = z.object({
  id: z.string().uuid(),
  company_name: companyNameSchema,
  tax_id: taxIdSchema,
  location: GeoPointSchema,
  company_description: companyDescriptionSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  logo_blob_id: z.string().uuid().nullable().optional(),
  status: OrganizationStatusSchema.or(z.string()),
  kind: ProviderKindSchema,
});

// PaginatedResponseDto<PublicProviderDto> | paginated list of public provider organizations
export const PaginatedOrganizationsResponseSchema = PaginatedResponseSchema(
  PublicProviderDtoSchema,
);

// PaginatedResponseDto<OrganizationDetailsDto> | paginated admin/auditor list of all organizations
export const PaginatedOrganizationDetailsResponseSchema = PaginatedResponseSchema(
  OrganizationDetailsDtoSchema,
);

// ProviderMembershipDto | a provider organization an account belongs to, with its role
export const ProviderMembershipDtoSchema = z.object({
  provider_id: z.uuid(),
  role: OrganizationMemberRoleSchema,
});

// HashMap<Uuid, Vec<ProviderMembershipDto>> | provider memberships keyed by account id
export const ProviderMembershipsByAccountSchema = z.record(
  z.uuid(),
  z.array(ProviderMembershipDtoSchema),
);

// Backward-compatible alias
export const PaginatedOrganizationResponseSchema = PaginatedOrganizationsResponseSchema;
