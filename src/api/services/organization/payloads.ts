import { z } from "zod";
import {
  ProviderKindSchema,
  GeoPointSchema,
  companyNameSchema,
  taxIdSchema,
  companyDescriptionSchema,
  addressSchema,
} from "./domain";

export const InternalOrganizationDtoSchema = z.object({
  type: z.literal("Internal"),
  id: z.uuid(),
  company_name: z.string(),
  tax_id: z.string(),
  location: GeoPointSchema,
  company_description: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  logo_blob_id: z.uuid().optional().nullable(),
  status: z.string(),
  kind: ProviderKindSchema,
});

export const PublicOrganizationDtoSchema = z.object({
  type: z.literal("Public"),
  id: z.uuid(),
  company_name: z.string(),
  location: GeoPointSchema,
  company_description: z.string().optional().nullable(),
  logo_blob_id: z.uuid().optional().nullable(),
  kind: ProviderKindSchema,
});

export const OrganizationResponseSchema = z.discriminatedUnion("type", [
  InternalOrganizationDtoSchema,
  PublicOrganizationDtoSchema,
]);

export const PaginatedOrganizationsResponseSchema = z.object({
  data: z.array(OrganizationResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const RegisterOrganizationRequestSchema = z.object({
  company_name: companyNameSchema,
  tax_id: taxIdSchema,
  location: GeoPointSchema,
  company_description: companyDescriptionSchema.optional().nullable(),
  phone_number: z.string().optional().nullable(),
  municipality_id: z.uuid(),
  address: addressSchema,
  kind: ProviderKindSchema,
});

export const OrganizationPatchRequestSchema = z.object({
  company_name: companyNameSchema.optional().nullable(),
  tax_id: taxIdSchema.optional().nullable(),
  location: GeoPointSchema.optional().nullable(),
  company_description: companyDescriptionSchema.optional().nullable(),
  phone_number: z.string().optional().nullable(),
});
