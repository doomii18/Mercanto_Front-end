import { z } from 'zod';

export const emailSchema = z.string()
  .min(1)
  .max(255)
  .regex(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/);

export const passwordSchema = z.string()
  .min(8)
  .max(128);

export const securePasswordSchema = passwordSchema
  .regex(/[a-z]/)
  .regex(/[A-Z]/)
  .regex(/\d/);

export const personNameSchema = z.string()
  .min(1)
  .max(255);

export const nationalIdSchema = z.string()
  .regex(/^\d{3}-\d{6}-\d{4}[A-Z]$/);

export const phoneNumberSchema = z.string()
  .min(1)
  .max(20)
  .regex(/^\+?[1-9]\d{1,14}$/);

export const uuidSchema = z.string().uuid();
