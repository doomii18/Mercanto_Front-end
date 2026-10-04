import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";

// CreateDepositRequestDto | payload to register a new recharge backed by voucher
export const CreateDepositRequestSchema = z.object({
  platform_bank_account_id: z.string().uuid("ID de cuenta bancaria de plataforma inválido"),
  amount: DepositAmountSchema,
  reference_code: z.string().trim().max(100).nullable().optional(),
  voucher_blob_id: z.string().uuid("ID de comprobante (blob) inválido"),
  deposited_at: z.string().datetime().nullable().optional(),
});

// RejectDepositRequestDto | payload to reject a recharge
export const RejectDepositRequestSchema = z.object({
  reason: z.string().trim().min(3, "El motivo de rechazo debe contener al menos 3 caracteres").max(500),
});

// DepositFilterQueryDto | query params for listing deposit requests
export const DepositFilterQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  per_page: z.number().int().min(1).max(100).optional(),
  status: DepositRequestStatusSchema.optional(),
  platform_bank_account_id: z.string().uuid().optional(),
  search: z.string().trim().optional(),
});
