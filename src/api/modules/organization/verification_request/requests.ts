import { z } from "zod";
import { reviewerNotesSchema } from "./domain";

// CreateVerificationRequestDto | payload to initiate a new verification request
export const CreateVerificationRequestSchema = z.object({
  organization_id: z.string().uuid(),
});

// SubmitVerificationRequestDto | payload to submit a draft verification request for review
export const SubmitVerificationRequestSchema = z.object({
  request_id: z.string().uuid(),
});

// ApproveVerificationRequestDto | payload for admin approval of verification request
export const ApproveVerificationRequestSchema = z.object({
  reviewer_notes: reviewerNotesSchema.nullable().optional(),
});

// RejectVerificationRequestDto | payload for admin rejection of verification request
export const RejectVerificationRequestSchema = z.object({
  reviewer_notes: reviewerNotesSchema.nullable().optional(),
});
