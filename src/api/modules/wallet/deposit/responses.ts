import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// DepositRequestResponseDto | comprehensive deposit details
export const DepositRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  amount: DepositAmountSchema,
  reference_code: z.string(),
  deposited_at: z.string().datetime(),
  depositor_name: z.string().optional().default(""),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  rejection_reason: z.string().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// DepositRequestSummaryResponseDto | summary row in deposit lists
export const DepositRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  user_full_name: z.string(),
  user_email: z.string(),
  bank_account_id: z.string().uuid(),
  bank_name: z.string(),
  amount: DepositAmountSchema,
  reference_code: z.string(),
  deposited_at: z.string().datetime(),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  created_at: z.string().datetime(),
});

// PaginatedResponseDto<DepositRequestSummaryResponseDto>
export const PaginatedDepositSummaryResponseSchema = PaginatedResponseSchema(
  DepositRequestSummaryResponseSchema
);

// FundingMetricsResponseDto | aggregated metric counters matching backend
export const FundingMetricsResponseSchema = z.object({
  all: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
});

export const DepositMetricsResponseSchema = FundingMetricsResponseSchema;
