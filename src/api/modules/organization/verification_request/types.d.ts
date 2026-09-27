import type { z } from "zod";
import type {
  OrganizationVerificationStatusSchema,
  VerificationRequestSortFieldSchema,
} from "./domain";
import type {
  CreateVerificationRequestSchema,
  SubmitVerificationRequestSchema,
  ApproveVerificationRequestSchema,
  RejectVerificationRequestSchema,
} from "./requests";
import type {
  VerificationRequestResponseSchema,
  VerificationRequestDocumentResponseSchema,
  VerificationRequestAggregateResponseSchema,
  PaginatedVerificationRequestResponseSchema,
} from "./responses";

// Domain types
export type OrganizationVerificationStatus = z.infer<typeof OrganizationVerificationStatusSchema>;
export type VerificationRequestSortField = z.infer<typeof VerificationRequestSortFieldSchema>;

// Request types
export type CreateVerificationRequest = z.infer<typeof CreateVerificationRequestSchema>;
export type SubmitVerificationRequest = z.infer<typeof SubmitVerificationRequestSchema>;
export type ApproveVerificationRequest = z.infer<typeof ApproveVerificationRequestSchema>;
export type RejectVerificationRequest = z.infer<typeof RejectVerificationRequestSchema>;

// Response types
export type VerificationRequestResponse = z.infer<typeof VerificationRequestResponseSchema>;
export type VerificationRequestDocumentResponse = z.infer<typeof VerificationRequestDocumentResponseSchema>;
export type VerificationRequestAggregateResponse = z.infer<typeof VerificationRequestAggregateResponseSchema>;
export type PaginatedVerificationRequestResponse = z.infer<typeof PaginatedVerificationRequestResponseSchema>;
