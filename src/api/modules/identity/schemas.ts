import { z } from "zod";
import {
  emailSchema,
  passwordSchema,
  securePasswordSchema,
  personNameSchema,
  phoneNumberSchema,
  nationalIdSchema,
} from "./domain";

export const AccountRoleSchema = z.enum(["admin", "auditor", "member"]);

export const AccountResponseSchema = z.object({
  id: z.uuid(),
  email: emailSchema,
  role: AccountRoleSchema,
  created_at: z.iso.datetime(),
});

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const TokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});

export const RegisterRequestSchema = z.object({
  email: emailSchema,
  password: securePasswordSchema,
  first_name: personNameSchema,
  last_name: personNameSchema,
  national_id: nationalIdSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.uuid(),
  interests: z.array(z.uuid()),
});

export const RequestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  new_password: securePasswordSchema,
});
