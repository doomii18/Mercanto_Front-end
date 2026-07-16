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
