import type { z } from "zod";
import type {
  TransactionTypeSchema,
  DepositRequestStatusSchema,
  WithdrawalRequestStatusSchema,
  WalletBalanceSchema,
  WalletLedgerAmountSchema,
  ReferenceNotesSchema,
} from "./domain";
import type {
  WalletLedgerPaginationQuerySchema,
  CreateDepositRequestSchema,
  RejectDepositRequestSchema,
  CreateWithdrawalRequestSchema,
  CompleteWithdrawalRequestSchema,
  RejectWithdrawalRequestSchema,
  InitiateVoucherUploadSchema,
  DepositFilterQuerySchema,
  WithdrawalFilterQuerySchema,
} from "./requests";
import type {
  VirtualWalletResponseSchema,
  LedgerEntryResponseSchema,
  PaginatedLedgerResponseSchema,
  PlatformBankAccountResponseSchema,
  DepositRequestResponseSchema,
  DepositRequestSummaryResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  WithdrawalRequestResponseSchema,
  WithdrawalRequestSummaryResponseSchema,
  PaginatedWithdrawalSummaryResponseSchema,
  FundingMetricsResponseSchema,
  VoucherDownloadResponseSchema,
} from "./responses";

// Domain Types
export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type DepositRequestStatus = z.infer<typeof DepositRequestStatusSchema>;
export type WithdrawalRequestStatus = z.infer<typeof WithdrawalRequestStatusSchema>;
export type WalletBalance = z.infer<typeof WalletBalanceSchema>;
export type WalletLedgerAmount = z.infer<typeof WalletLedgerAmountSchema>;
export type ReferenceNotes = z.infer<typeof ReferenceNotesSchema>;

// Request Types
export type WalletLedgerPaginationQuery = z.infer<typeof WalletLedgerPaginationQuerySchema>;
export type CreateDepositRequest = z.infer<typeof CreateDepositRequestSchema>;
export type RejectDepositRequest = z.infer<typeof RejectDepositRequestSchema>;
export type CreateWithdrawalRequest = z.infer<typeof CreateWithdrawalRequestSchema>;
export type CompleteWithdrawalRequest = z.infer<typeof CompleteWithdrawalRequestSchema>;
export type RejectWithdrawalRequest = z.infer<typeof RejectWithdrawalRequestSchema>;
export type InitiateVoucherUpload = z.infer<typeof InitiateVoucherUploadSchema>;
export type DepositFilterQuery = z.infer<typeof DepositFilterQuerySchema>;
export type WithdrawalFilterQuery = z.infer<typeof WithdrawalFilterQuerySchema>;

// Response Types
export type VirtualWalletResponse = z.infer<typeof VirtualWalletResponseSchema>;
export type LedgerEntryResponse = z.infer<typeof LedgerEntryResponseSchema>;
export type PaginatedLedgerResponse = z.infer<typeof PaginatedLedgerResponseSchema>;
export type PlatformBankAccountResponse = z.infer<typeof PlatformBankAccountResponseSchema>;
export type DepositRequestResponse = z.infer<typeof DepositRequestResponseSchema>;
export type DepositRequestSummaryResponse = z.infer<typeof DepositRequestSummaryResponseSchema>;
export type PaginatedDepositSummaryResponse = z.infer<typeof PaginatedDepositSummaryResponseSchema>;
export type WithdrawalRequestResponse = z.infer<typeof WithdrawalRequestResponseSchema>;
export type WithdrawalRequestSummaryResponse = z.infer<typeof WithdrawalRequestSummaryResponseSchema>;
export type PaginatedWithdrawalSummaryResponse = z.infer<typeof PaginatedWithdrawalSummaryResponseSchema>;
export type FundingMetricsResponse = z.infer<typeof FundingMetricsResponseSchema>;
export type VoucherDownloadResponse = z.infer<typeof VoucherDownloadResponseSchema>;
