import { z } from "zod";

export const personNameSchema = z.string().trim().min(1).max(255);

export const nationalIdSchema = z.string()
  .trim()
  .toUpperCase()
  .regex(/^\d{3}-\d{6}-\d{4}[A-Z]$/, "Invalid National ID format");

export const phoneNumberSchema = z.string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid E.164 phone number format");
