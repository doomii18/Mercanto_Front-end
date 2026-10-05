import { z } from "zod";
import { WithdrawalRequestStatusSchema, WithdrawalAmountSchema } from "./domain";
import { FundingMetricsResponseSchema } from "../deposit/responses";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// WithdrawalRequestResponseDto | comprehensive withdrawal details
export const WithdrawalRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  amount: WithdrawalAmountSchema,
  target_bank_name: z.string(),
  target_account_number: z.string(),
  target_account_type: z.string(),
  target_account_holder: z.string(),
  status: WithdrawalRequestStatusSchema,
  rejection_reason: z.string().nullable().optional(),
  payout_reference_code: z.string().nullable().optional(),
  payout_voucher_blob_id: z.string().uuid().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// WithdrawalRequestSummaryResponseDto | summary row in withdrawal lists
export const WithdrawalRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  user_full_name: z.string(),
  user_email: z.string(),
  amount: WithdrawalAmountSchema,
  target_bank_name: z.string(),
  target_account_number: z.string(),
  status: WithdrawalRequestStatusSchema,
  created_at: z.string().datetime(),
});

// PaginatedResponseDto<WithdrawalRequestSummaryResponseDto>
export const PaginatedWithdrawalSummaryResponseSchema = PaginatedResponseSchema(
  WithdrawalRequestSummaryResponseSchema
);

export const WithdrawalMetricsResponseSchema = FundingMetricsResponseSchema;
