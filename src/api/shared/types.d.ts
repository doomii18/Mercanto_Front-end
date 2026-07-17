import { z } from "zod";
import { ErrorKindSchema, ErrorPayloadSchema, UploadUrlResponseSchema } from "./schemas";

export type ErrorKind = z.infer<typeof ErrorKindSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseSchema>;
