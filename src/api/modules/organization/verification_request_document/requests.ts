import { z } from "zod";
import { documentLabelSchema } from "./domain";

// VerificationDocumentUploadRequestDto | payload to request verification document upload url
export const VerificationDocumentUploadRequestSchema = z.object({
  request_id: z.string().uuid(),
  mime_type: z.string().min(1, "El tipo MIME es obligatorio"),
  size_bytes: z.number().int().positive("El tamaño debe ser mayor a cero"),
});

// ConfirmVerificationDocumentDto | payload to confirm document upload with optional label
export const ConfirmVerificationDocumentSchema = z.object({
  request_id: z.string().uuid(),
  document_label: documentLabelSchema.nullable().optional(),
});
