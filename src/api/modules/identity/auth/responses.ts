import { z } from "zod";
import { EmailSchema, AccountRoleSchema } from "./domain";
import { PersonNameSchema, NationalIdSchema } from "../user_profile/domain";
import { PaginatedResponseSchema, phoneNumberSchema } from "@/api/modules/shared/schemas";

// AuthResponseDto | access and refresh token pair
export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

// AccountResponseDto | account details and assigned role
export const AccountResponseSchema = z.object({
  id: z.uuid(),
  email: EmailSchema,
  role: AccountRoleSchema,
  created_at: z.iso.datetime(),
  suspended_at: z.iso.datetime().nullable().optional(),
});

// AdminUserItemDto | account and user profile item for admin/auditor listing
export const AdminUserItemSchema = z.object({
  id: z.uuid(),
  email: EmailSchema,
  role: AccountRoleSchema,
  created_at: z.iso.datetime(),
  suspended_at: z.iso.datetime().nullable().optional(),
  is_suspended: z.boolean(),
  first_name: PersonNameSchema.nullable().optional(),
  last_name: PersonNameSchema.nullable().optional(),
  national_id: NationalIdSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.uuid().nullable().optional(),
  avatar_blob_id: z.uuid().nullable().optional(),
});

// PaginatedResponse<AdminUserItemDto> | paginated accounts response
export const PaginatedAdminUsersResponseSchema = PaginatedResponseSchema(AdminUserItemSchema);
