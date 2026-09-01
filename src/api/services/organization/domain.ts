import { z } from "zod";
export { phoneNumberSchema, addressSchema } from "../../shared/schemas";

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

export const companyNameSchema = z
  .string()
  .trim()
  .min(1, "Company name cannot be empty")
  .max(255, "Company name must not exceed 255 characters");

export const taxIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, "Tax ID cannot be empty")
  .max(50, "Tax ID must not exceed 50 characters");

export const companyDescriptionSchema = z
  .string()
  .trim()
  .min(1, "Company description cannot be empty")
  .max(2000, "Company description must not exceed 2000 characters");

export const reviewerNotesSchema = z
  .string()
  .trim()
  .max(1000, "Reviewer notes must not exceed 1000 characters");

export const documentLabelSchema = z
  .string()
  .trim()
  .max(100, "Document label must not exceed 100 characters");
