import { z } from "zod";
import type {
  AuthResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  TokenRequestSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
} from "./payloads";

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type TokenRequest = z.infer<typeof TokenRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RequestPasswordReset = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
