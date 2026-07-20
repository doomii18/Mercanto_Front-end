import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  securePasswordSchema,
  personNameSchema,
  phoneNumberSchema,
  nationalIdSchema
} from './domain';

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

export const RegisterRequestSchema = z.object({
  first_name: personNameSchema,
  last_name: personNameSchema,
  email: emailSchema,
  password: securePasswordSchema,
  phone_number: phoneNumberSchema,
  national_id: nationalIdSchema,
  department: z.string().min(1).max(100),
});
