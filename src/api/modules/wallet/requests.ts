import { z } from "zod";
import {
  DepositRequestStatusSchema,
  WithdrawalRequestStatusSchema,
  WalletLedgerAmountSchema,
} from "./domain";

// PaginationQueryDto | pagination query parameters for wallet ledger
export const WalletLedgerPaginationQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// CreateDepositRequestDto | payload for initiating a new recharge request
export const CreateDepositRequestSchema = z.object({
  platform_bank_account_id: z.string().uuid("ID de cuenta bancaria inválido"),
  amount: WalletLedgerAmountSchema,
  reference_code: z.string().trim().min(1, "El código de referencia es requerido"),
  voucher_blob_id: z.string().uuid("ID de comprobante inválido"),
  deposited_at: z.string().datetime("Fecha de depósito inválida"),
});

// RejectDepositRequestDto | payload for rejecting a deposit request
export const RejectDepositRequestSchema = z.object({
  reason: z.string().trim().min(1, "El motivo de rechazo es requerido"),
});

// CreateWithdrawalRequestDto | payload for requesting a withdrawal
export const CreateWithdrawalRequestSchema = z.object({
  amount: WalletLedgerAmountSchema,
  target_bank_name: z.string().trim().min(1, "El nombre del banco destino es requerido"),
  target_account_number: z.string().trim().min(1, "El número de cuenta destino es requerido"),
  target_account_type: z.string().trim().min(1, "El tipo de cuenta es requerido"),
  target_account_holder: z.string().trim().min(1, "El titular de la cuenta es requerido"),
});

// CompleteWithdrawalRequestDto | payload for completing a withdrawal request (Admin)
export const CompleteWithdrawalRequestSchema = z.object({
  payout_reference_code: z.string().trim().nullable().optional(),
  payout_voucher_blob_id: z.string().uuid().nullable().optional(),
});

// RejectWithdrawalRequestDto | payload for rejecting a withdrawal request (Admin)
export const RejectWithdrawalRequestSchema = z.object({
  reason: z.string().trim().min(1, "El motivo de rechazo es requerido"),
});

// InitiateVoucherUploadDto | payload for requesting a presigned voucher upload URL
export const InitiateVoucherUploadSchema = z.object({
  mime_type: z.string().trim().min(1, "El tipo MIME es requerido"),
  size_bytes: z.number().int().positive("El tamaño del archivo debe ser mayor a 0"),
});

// DepositFilterQueryDto | query filters for listing deposit requests
export const DepositFilterQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  status: DepositRequestStatusSchema.optional(),
  platform_bank_account_id: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});

// WithdrawalFilterQueryDto | query filters for listing withdrawal requests
export const WithdrawalFilterQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  status: WithdrawalRequestStatusSchema.optional(),
  search: z.string().trim().optional(),
});
