import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .email();

export const passwordSchema = z
  .string()
  .min(8)
  .max(128);

export const securePasswordSchema = passwordSchema
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/\d/, "Must contain at least one number");

export const personNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(255);

export const nationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{3}-\d{6}-\d{4}[A-Z]$/, "Invalid National ID format");

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid E.164 phone number format");

export const uuidSchema = z.uuid();
