import { z } from "zod";
import {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  OrganizationSortFieldSchema,
  SortDirectionSchema,
  companyNameSchema,
  taxIdSchema,
  companyDescriptionSchema,
  addressSchema,
  phoneNumberSchema,
  GeoPointSchema,
} from "./domain";

// OrganizationFiltersQuery & OrganizationSortQuery | filters and sorting for listing providers
export const OrganizationFiltersRequestSchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  search_term: z.string().optional(),
  municipality_id: z.string().uuid().optional(),
  min_rating: z.number().optional(),
  status: OrganizationStatusSchema.optional(),
  kind: ProviderKindSchema.optional(),
  sort_by: OrganizationSortFieldSchema.optional(),
  sort_dir: SortDirectionSchema.optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});


// UpdateMemberRoleDto | payload to update a member role
export const UpdateMemberRoleRequestSchema = z.object({
  new_role: OrganizationMemberRoleSchema,
});

// RegisterProviderRequestDto | payload to register a new provider organization
export const RegisterProviderRequestSchema = z.object({
  company_name: companyNameSchema,
  tax_id: taxIdSchema,
  location: GeoPointSchema,
  company_description: companyDescriptionSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.string().uuid(),
  address: addressSchema,
  kind: ProviderKindSchema,
});

// ProviderOrganizationPatchDto | payload to partially update a provider organization
export const ProviderOrganizationPatchSchema = z.object({
  company_name: companyNameSchema.nullable().optional(),
  tax_id: taxIdSchema.nullable().optional(),
  location: GeoPointSchema.nullable().optional(),
  company_description: companyDescriptionSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
});
