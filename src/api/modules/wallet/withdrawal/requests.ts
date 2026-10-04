import { z } from "zod";
import { WithdrawalRequestStatusSchema, WithdrawalAmountSchema } from "./domain";

// CreateWithdrawalRequestDto | payload to register a new extraction request
export const CreateWithdrawalRequestSchema = z.object({
  amount: WithdrawalAmountSchema,
  target_bank_name: z.string().trim().min(2, "El nombre del banco es obligatorio").max(100),
  target_account_number: z.string().trim().min(5, "Número de cuenta bancaria inválido").max(50),
  target_account_type: z.string().trim().min(2, "Tipo de cuenta obligatorio").max(50),
  target_account_holder: z.string().trim().min(2, "Titular de cuenta obligatorio").max(150),
});

// CompleteWithdrawalRequestDto | payload to mark withdrawal as transferred
export const CompleteWithdrawalRequestSchema = z.object({
  payout_reference_code: z.string().trim().min(1, "El código de referencia es obligatorio").max(100),
  payout_voucher_blob_id: z.string().uuid().nullable().optional(),
});

// RejectWithdrawalRequestDto | payload to reject a withdrawal and trigger refund
export const RejectWithdrawalRequestSchema = z.object({
  reason: z.string().trim().min(3, "El motivo de rechazo debe contener al menos 3 caracteres").max(500),
});

// WithdrawalFilterQueryDto | query params for listing withdrawal requests
export const WithdrawalFilterQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  status: WithdrawalRequestStatusSchema.optional(),
  search: z.string().trim().optional(),
});
