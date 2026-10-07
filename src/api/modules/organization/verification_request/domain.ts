import { z } from "zod";
export {
  reviewerNotesSchema,
  documentLabelSchema,
} from "@/api/modules/organization/organization/domain";

// OrganizationVerificationStatus | lifecycle status of a verification request
export const OrganizationVerificationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "revoked",
]);

// VerificationRequestSortField | sort fields for verification requests
export const VerificationRequestSortFieldSchema = z.enum([
  "submitted_at",
  "updated_at",
  "status",
  "id",
]);

