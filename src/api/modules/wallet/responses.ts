import { z } from "zod";
import {
  TransactionTypeSchema,
  DepositRequestStatusSchema,
  WithdrawalRequestStatusSchema,
  WalletBalanceSchema,
  WalletLedgerAmountSchema,
  ReferenceNotesSchema,
} from "./domain";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// VirtualWalletResponseDto | virtual wallet summary and balance
export const VirtualWalletResponseSchema = z.object({
  id: z.string().uuid(),
  balance: WalletBalanceSchema,
  updated_at: z.string().datetime(),
});

// LedgerEntryResponseDto | individual immutable ledger transaction registry
export const LedgerEntryResponseSchema = z.object({
  id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  quote_id: z.string().uuid().nullable().optional(),
  kind: TransactionTypeSchema,
  amount: WalletLedgerAmountSchema,
  reference_notes: ReferenceNotesSchema.nullable().optional(),
  created_at: z.string().datetime(),
});

// PaginatedResponseDto<LedgerEntryResponseDto> | paginated list of wallet ledger entries
export const PaginatedLedgerResponseSchema =
  PaginatedResponseSchema(LedgerEntryResponseSchema);

// PlatformBankAccountResponseDto | official bank account for recharge deposits
export const PlatformBankAccountResponseSchema = z.object({
  id: z.string().uuid(),
  bank_name: z.string(),
  account_number: z.string(),
  account_type: z.string(),
  account_holder: z.string(),
  icon_hint: z.string().nullable().optional(),
  is_active: z.boolean(),
});

// DepositRequestResponseDto | comprehensive recharge request details
export const DepositRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  amount: WalletLedgerAmountSchema,
  reference_code: z.string(),
  deposited_at: z.string().datetime(),
  depositor_name: z.string(),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// DepositRequestSummaryResponseDto | summary for tabular listings
export const DepositRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  user_full_name: z.string(),
  user_email: z.string(),
  bank_account_id: z.string().uuid(),
  bank_name: z.string(),
  amount: WalletLedgerAmountSchema,
  reference_code: z.string(),
  deposited_at: z.string().datetime(),
  voucher_blob_id: z.string().uuid(),
  status: DepositRequestStatusSchema,
  created_at: z.string().datetime(),
});

export const PaginatedDepositSummaryResponseSchema =
  PaginatedResponseSchema(DepositRequestSummaryResponseSchema);

// WithdrawalRequestResponseDto | comprehensive withdrawal request details
export const WithdrawalRequestResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  amount: WalletLedgerAmountSchema,
  target_bank_name: z.string(),
  target_account_number: z.string(),
  target_account_type: z.string(),
  target_account_holder: z.string(),
  status: WithdrawalRequestStatusSchema,
  payout_reference_code: z.string().nullable().optional(),
  payout_voucher_blob_id: z.string().uuid().nullable().optional(),
  reviewed_by: z.string().uuid().nullable().optional(),
  reviewed_at: z.string().datetime().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// WithdrawalRequestSummaryResponseDto | summary for tabular listings
export const WithdrawalRequestSummaryResponseSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  user_full_name: z.string(),
  user_email: z.string(),
  amount: WalletLedgerAmountSchema,
  target_bank_name: z.string(),
  target_account_number: z.string(),
  status: WithdrawalRequestStatusSchema,
  created_at: z.string().datetime(),
});

export const PaginatedWithdrawalSummaryResponseSchema =
  PaginatedResponseSchema(WithdrawalRequestSummaryResponseSchema);

// FundingMetricsResponseDto | status counts for badges and tabs
export const FundingMetricsResponseSchema = z.object({
  all: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  approved: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative(),
});

// VoucherDownloadResponseDto | presigned download URL for voucher inspection
export const VoucherDownloadResponseSchema = z.object({
  url: z.string(),
});
