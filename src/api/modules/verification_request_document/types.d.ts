import { z } from "zod";
import {
  VerificationDocumentUploadRequestSchema,
  ConfirmVerificationDocumentSchema,
} from "./schemas";

export type VerificationDocumentUploadRequest = z.infer<typeof VerificationDocumentUploadRequestSchema>;
export type ConfirmVerificationDocument = z.infer<typeof ConfirmVerificationDocumentSchema>;
