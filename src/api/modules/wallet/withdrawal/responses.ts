import { z } from "zod";
import { WithdrawalRequestStatusSchema, WithdrawalAmountSchema } from "./domain";
import { FundingMetricsResponseSchema } from "../deposit/responses";

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
  processed_by: z.string().uuid().nullable().optional(),
  processed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// WithdrawalRequestSummaryResponseDto | summary row in withdrawal lists
export const WithdrawalRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  amount: WithdrawalAmountSchema,
  target_bank_name: z.string(),
  target_account_number: z.string(),
  target_account_holder: z.string(),
  status: WithdrawalRequestStatusSchema,
  rejection_reason: z.string().nullable().optional(),
  payout_reference_code: z.string().nullable().optional(),
  created_at: z.string().datetime(),
});

// PaginatedFundingResponse | paginated wrapper for withdrawal list
export const PaginatedWithdrawalSummaryResponseSchema = z.object({
  data: z.array(WithdrawalRequestSummaryResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  per_page: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});

export const WithdrawalMetricsResponseSchema = FundingMetricsResponseSchema;
