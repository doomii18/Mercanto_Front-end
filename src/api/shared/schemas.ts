import { z } from "zod";

export const phoneNumberSchema = z
  .string()
  .trim()
  .min(1)
  .max(20)
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid E.164 phone number format");

export const addressSchema = z
  .string()
  .trim()
  .min(1, "Address cannot be empty");

export const ErrorKindSchema = z.enum([
  "validation",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal",
  "unavailable",
  "not_implemented",
]);

export const ErrorPayloadSchema = z.object({
  kind: ErrorKindSchema,
  message: z.string(),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    limit: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
  });

export const UploadUrlResponseSchema = z.object({
  blob_id: z.uuid(),
  presigned_url: z.url(),
});

export const AssetUploadRequestSchema = z.object({
  mime_type: z.string().trim().toLowerCase().min(1).max(100),
  size_bytes: z.number().int().positive(),
});

export const SortDirectionSchema = z.enum(["asc", "desc"]);

export const RatingSummarySchema = z.object({
  average_score: z.number(),
  review_count: z.number().int().nonnegative(),
});
