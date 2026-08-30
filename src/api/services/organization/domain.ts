import { z } from "zod";

export const ProviderKindSchema = z.enum([
  "manufacturer",
  "distributor",
  "wholesaler",
  "retailer",
  "service",
]);

export const OrganizationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
]);

export const OrganizationMemberRoleSchema = z.enum([
  "owner",
  "admin",
  "publisher",
  "viewer",
]);

export const GeoPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

export const RatingSummarySchema = z.object({
  average_score: z.number(),
  review_count: z.number().int().nonnegative(),
});

export const companyNameSchema = z.string().trim().min(1).max(255);
export const taxIdSchema = z.string().trim().toUpperCase().min(1).max(50);
export const companyDescriptionSchema = z.string().trim().min(1).max(2000);
export const addressSchema = z.string().trim().min(1);
export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid E.164 phone number format");
