import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";

// DepositRequestResponseDto | comprehensive deposit details
export const DepositRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  platform_bank_account_id: z.string().uuid(),
  amount: DepositAmountSchema,
  reference_code: z.string().nullable().optional(),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  rejection_reason: z.string().nullable().optional(),
  deposited_at: z.string().datetime().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// DepositRequestSummaryResponseDto | summary row in deposit lists
export const DepositRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  platform_bank_account_id: z.string().uuid(),
  bank_name: z.string(),
  amount: DepositAmountSchema,
  reference_code: z.string().nullable().optional(),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  rejection_reason: z.string().nullable().optional(),
  deposited_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
});

// PaginatedFundingResponse | paginated wrapper for deposit list
export const PaginatedDepositSummaryResponseSchema = z.object({
  data: z.array(DepositRequestSummaryResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().nonnegative(),
  per_page: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});

// FundingMetricsResponseDto | aggregated metric counters
export const FundingMetricsResponseSchema = z.object({
  total_count: z.number().int().nonnegative(),
  pending_count: z.number().int().nonnegative(),
  approved_count: z.number().int().nonnegative(),
  rejected_count: z.number().int().nonnegative(),
  pending_amount: z.coerce.number().nonnegative(),
  approved_amount: z.coerce.number().nonnegative(),
});

export const DepositMetricsResponseSchema = FundingMetricsResponseSchema;
