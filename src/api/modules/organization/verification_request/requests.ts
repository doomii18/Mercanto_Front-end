import { z } from "zod";
import {
  reviewerNotesSchema,
  OrganizationVerificationStatusSchema,
  VerificationRequestSortFieldSchema,
} from "./domain";
import { SortDirectionSchema } from "@/api/modules/shared/schemas";

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

// RevokeOrganizationVerificationDto | payload for admin revocation of an approved organization
export const RevokeOrganizationVerificationSchema = z.object({
  reviewer_notes: reviewerNotesSchema.nullable().optional(),
});

// VerificationRequestFilterQueryDto | query params for listing verification requests
export const VerificationRequestFilterQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  status: OrganizationVerificationStatusSchema.optional(),
  submitted_after: z.string().datetime().optional(),
  submitted_before: z.string().datetime().optional(),
  sort_by: VerificationRequestSortFieldSchema.optional(),
  sort_direction: SortDirectionSchema.optional(),
});

