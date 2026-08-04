import { z } from "zod";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const OrganizationVerificationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
]);

export const VerificationRequestResponseSchema = z.object({
  id: z.uuid(),
  organization_id: z.uuid(),
  status: OrganizationVerificationStatusSchema,
  submitted_by: z.uuid().nullable().optional(),
  submitted_at: z.iso.datetime(),
  reviewed_by: z.uuid().nullable().optional(),
  reviewed_at: z.iso.datetime().nullable().optional(),
  reviewer_notes: z.string().nullable().optional(),
  updated_at: z.iso.datetime(),
});

export const VerificationRequestDocumentResponseSchema = z.object({
  request_id: z.uuid(),
  blob_id: z.uuid(),
  document_label: z.string().nullable().optional(),
  uploaded_at: z.iso.datetime(),
});

export const VerificationRequestAggregateResponseSchema = z.object({
  request: VerificationRequestResponseSchema,
  documents: z.array(VerificationRequestDocumentResponseSchema),
});

export const PaginatedVerificationRequestResponseSchema = PaginatedResponseSchema(
  VerificationRequestResponseSchema,
);

export const CreateVerificationRequestSchema = z.object({
  organization_id: z.uuid(),
});

export const SubmitVerificationRequestSchema = z.object({
  request_id: z.uuid(),
});

export const ApproveVerificationRequestSchema = z.object({
  reviewer_notes: z.string().nullable().optional(),
});

export const RejectVerificationRequestSchema = z.object({
  reviewer_notes: z.string().nullable().optional(),
});
