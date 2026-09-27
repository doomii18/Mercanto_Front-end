import type { z } from "zod";
import type {
  EmailSchema,
  PasswordSchema,
  SecurePasswordSchema,
  AccountRoleSchema,
} from "./domain";
import type {
  LoginRequestSchema,
  TokenRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  RegisterUserRequestSchema,
} from "./requests";
import type {
  AuthResponseSchema,
  AccountResponseSchema,
} from "./responses";

export type Email = z.infer<typeof EmailSchema>;
export type Password = z.infer<typeof PasswordSchema>;
export type SecurePassword = z.infer<typeof SecurePasswordSchema>;
export type AccountRole = z.infer<typeof AccountRoleSchema>;

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type RegisterUserRequest = z.infer<typeof RegisterUserRequestSchema>;
export type RegisterRequest = RegisterUserRequest;

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type AccountResponse = z.infer<typeof AccountResponseSchema>;
