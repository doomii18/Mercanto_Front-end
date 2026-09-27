import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";
import {
  OrganizationVerificationStatusSchema,
  reviewerNotesSchema,
  documentLabelSchema,
} from "./domain";

// VerificationRequestResponseDto | response payload for a single verification request
export const VerificationRequestResponseSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  status: OrganizationVerificationStatusSchema,
  submitted_by: z.string().uuid().nullable().optional(),
  submitted_at: z.string().datetime(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  reviewer_notes: reviewerNotesSchema.nullable().optional(),
  updated_at: z.string().datetime(),
});

// VerificationRequestDocumentResponseDto | response payload for a verification request document attachment
export const VerificationRequestDocumentResponseSchema = z.object({
  request_id: z.string().uuid(),
  blob_id: z.string().uuid(),
  document_label: documentLabelSchema.nullable().optional(),
  uploaded_at: z.string().datetime(),
});

// VerificationRequestAggregateResponseDto | aggregate verification request along with attached documents
export const VerificationRequestAggregateResponseSchema = z.object({
  request: VerificationRequestResponseSchema,
  documents: z.array(VerificationRequestDocumentResponseSchema),
});

// PaginatedResponseDto<VerificationRequestResponseDto> | paginated list of verification requests
export const PaginatedVerificationRequestResponseSchema = PaginatedResponseSchema(
  VerificationRequestResponseSchema,
);
