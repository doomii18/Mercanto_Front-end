import { z } from "zod";
import { EmailSchema, PasswordSchema, SecurePasswordSchema } from "./domain";
import { PersonNameSchema, NationalIdSchema } from "../user_profile/domain";
import { phoneNumberSchema } from "@/api/modules/shared/schemas";

// LoginRequestDto | user credentials for login
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

// TokenRequestDto | refresh token for new access token
export const TokenRequestSchema = z.object({
  refresh_token: z.string().min(1, "El token de refresco es requerido"),
});

// RequestPasswordResetDto | email to trigger password reset
export const RequestPasswordResetSchema = z.object({
  email: EmailSchema,
});

// ResetPasswordDto | reset token and new secure password
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "El token de reinicio es requerido"),
  new_password: SecurePasswordSchema,
});

// RegisterUserRequestDto | new user registration payload
export const RegisterUserRequestSchema = z.object({
  email: EmailSchema,
  password: SecurePasswordSchema,
  first_name: PersonNameSchema,
  last_name: PersonNameSchema,
  national_id: NationalIdSchema.nullable().optional(),
  phone_number: phoneNumberSchema.nullable().optional(),
  municipality_id: z.uuid("ID de municipio inválido"),
  interests: z.array(z.uuid("ID de categoría de interés inválido")),
});

export const RegisterRequestSchema = RegisterUserRequestSchema;
