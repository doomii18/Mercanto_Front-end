import { z } from "zod";

export const VerificationDocumentUploadRequestSchema = z.object({
  request_id: z.uuid(),
  mime_type: z.string(),
  size_bytes: z.number().int(),
});

export const ConfirmVerificationDocumentSchema = z.object({
  request_id: z.uuid(),
  document_label: z.string().nullable().optional(),
});
