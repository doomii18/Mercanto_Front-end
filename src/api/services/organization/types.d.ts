import { z } from "zod";
import type {
  InternalOrganizationDtoSchema,
  PublicOrganizationDtoSchema,
  OrganizationResponseSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterOrganizationRequestSchema,
  OrganizationPatchRequestSchema,
} from "./payloads";

export type InternalOrganizationDto = z.infer<typeof InternalOrganizationDtoSchema>;
export type PublicOrganizationDto = z.infer<typeof PublicOrganizationDtoSchema>;
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
export type PaginatedOrganizationsResponse = z.infer<typeof PaginatedOrganizationsResponseSchema>;
export type RegisterOrganizationRequest = z.infer<typeof RegisterOrganizationRequestSchema>;
export type OrganizationPatchRequest = z.infer<typeof OrganizationPatchRequestSchema>;
