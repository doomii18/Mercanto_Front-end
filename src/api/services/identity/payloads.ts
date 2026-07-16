import { z } from 'zod';
import { emailSchema, passwordSchema } from './domain';

export const LoginRequestSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export const TokenRequestSchema = z.object({
  refresh_token: z.string(),
});
export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});
