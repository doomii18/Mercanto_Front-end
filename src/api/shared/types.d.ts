import { z } from "zod";
import { AssetUploadRequestSchema, ErrorKindSchema, ErrorPayloadSchema, UploadUrlResponseSchema } from "./schemas";

export type ErrorKind = z.infer<typeof ErrorKindSchema>;
export type ErrorPayload = z.infer<typeof ErrorPayloadSchema>;
export type UploadUrlResponseDto = z.infer<typeof UploadUrlResponseSchema>;
export type AssetUploadRequestDto = z.infer<typeof AssetUploadRequestSchema>;
