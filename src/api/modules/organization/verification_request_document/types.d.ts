import type { z } from "zod";
import type {
  VerificationDocumentUploadRequestSchema,
  ConfirmVerificationDocumentSchema,
} from "./requests";

// Request types
export type VerificationDocumentUploadRequest = z.infer<typeof VerificationDocumentUploadRequestSchema>;
export type ConfirmVerificationDocument = z.infer<typeof ConfirmVerificationDocumentSchema>;
