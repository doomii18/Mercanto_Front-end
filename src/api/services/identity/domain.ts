import { z } from "zod";
export { phoneNumberSchema } from "../../shared/schemas";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(255)
  .regex(
    /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
    "Invalid email format"
  );

export const passwordSchema = z
  .string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters");

export const securePasswordSchema = passwordSchema
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/\d/, "Must contain at least one number");

export const personNameSchema = z
  .string()
  .trim()
  .min(1, "Name cannot be empty")
  .max(255, "Name must not exceed 255 characters");

export const nationalIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^\d{3}-\d{6}-\d{4}[A-Z]$/, "Invalid National ID format");

export const uuidSchema = z.uuid();
