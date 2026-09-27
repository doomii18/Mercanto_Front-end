import { z } from "zod";
import { EmailSchema, AccountRoleSchema } from "./domain";

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
});
