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

export const GeoPointSchema = z.object({
  longitude: z.number(),
  latitude: z.number(),
});

export const companyNameSchema = z.string().trim().min(1).max(255);
export const taxIdSchema = z.string().trim().toUpperCase().min(1).max(50);
export const companyDescriptionSchema = z.string().trim().min(1).max(2000);
export const addressSchema = z.string().trim().min(1);
