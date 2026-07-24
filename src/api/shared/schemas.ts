import { z } from "zod";

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


export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
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
  mime_type: z.string(),
  size_bytes: z.number().int().positive(),
});
