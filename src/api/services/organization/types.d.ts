import { z } from "zod";
import type {
  InternalOrganizationDtoSchema,
  PublicOrganizationDtoSchema,
  OrganizationResponseSchema,
  PaginatedOrganizationsResponseSchema,
  RegisterOrganizationRequestSchema,
  OrganizationPatchRequestSchema,
  OrganizationMemberRoleSchema,
  UpdateMemberRoleRequestSchema,
} from "./payloads";

export type InternalOrganizationDto = z.infer<typeof InternalOrganizationDtoSchema>;
export type PublicOrganizationDto = z.infer<typeof PublicOrganizationDtoSchema>;
export type OrganizationResponse = z.infer<typeof OrganizationResponseSchema>;
export type PaginatedOrganizationsResponse = z.infer<typeof PaginatedOrganizationsResponseSchema>;
export type RegisterOrganizationRequest = z.infer<typeof RegisterOrganizationRequestSchema>;
export type OrganizationPatchRequest = z.infer<typeof OrganizationPatchRequestSchema>;
export type OrganizationMemberRole = z.infer<typeof OrganizationMemberRoleSchema>;
export type UpdateMemberRoleRequest = z.infer<typeof UpdateMemberRoleRequestSchema>;
