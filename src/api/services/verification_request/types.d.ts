import { z } from "zod";
import {
  VerificationRequestResponseSchema,
  VerificationRequestAggregateResponseSchema,
  PaginatedVerificationRequestResponseSchema,
  CreateVerificationRequestSchema,
  SubmitVerificationRequestSchema,
  ApproveVerificationRequestSchema,
  RejectVerificationRequestSchema,
  OrganizationVerificationStatusSchema,
} from "./payloads";

export type OrganizationVerificationStatus = z.infer<typeof OrganizationVerificationStatusSchema>;
export type VerificationRequestResponse = z.infer<typeof VerificationRequestResponseSchema>;
export type VerificationRequestAggregateResponse = z.infer<typeof VerificationRequestAggregateResponseSchema>;
export type PaginatedVerificationRequestResponse = z.infer<typeof PaginatedVerificationRequestResponseSchema>;
export type CreateVerificationRequest = z.infer<typeof CreateVerificationRequestSchema>;
export type SubmitVerificationRequest = z.infer<typeof SubmitVerificationRequestSchema>;
export type ApproveVerificationRequest = z.infer<typeof ApproveVerificationRequestSchema>;
export type RejectVerificationRequest = z.infer<typeof RejectVerificationRequestSchema>;
