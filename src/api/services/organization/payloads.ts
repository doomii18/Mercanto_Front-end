import { z } from "zod";
import {
  ProviderKindSchema,
  OrganizationStatusSchema,
  OrganizationMemberRoleSchema,
  GeoPointSchema,
  companyNameSchema,
  taxIdSchema,
  companyDescriptionSchema,
  addressSchema,
  phoneNumberSchema,
} from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";

export { OrganizationMemberRoleSchema };

export const UpdateMemberRoleRequestSchema = z.object({
  new_role: OrganizationMemberRoleSchema,
});

export const PublicProviderDtoSchema = z.object({
  id: z.uuid(),
  company_name: z.string(),
  location: GeoPointSchema,
  company_description: z.string().nullable().optional(),
  logo_blob_id: z.uuid().nullable().optional(),
  kind: ProviderKindSchema,
});

export const OrganizationDetailsDtoSchema = z.object({
  id: z.uuid(),
  company_name: z.string(),
  tax_id: z.string(),
  location: GeoPointSchema,
  company_description: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  logo_blob_id: z.uuid().nullable().optional(),
  status: OrganizationStatusSchema.or(z.string()),
  kind: ProviderKindSchema,
});

export const PaginatedOrganizationsResponseSchema = PaginatedResponseSchema(
  PublicProviderDtoSchema,
);

export const RegisterProviderRequestSchema = z.object({
  company_name: companyNameSchema,
  tax_id: taxIdSchema,
  location: GeoPointSchema,
  company_description: companyDescriptionSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.uuid(),
  address: addressSchema,
  kind: ProviderKindSchema,
});

export const ProviderOrganizationPatchSchema = z.object({
  company_name: companyNameSchema.nullable().optional(),
  tax_id: taxIdSchema.nullable().optional(),
  location: GeoPointSchema.nullable().optional(),
  company_description: companyDescriptionSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
});
