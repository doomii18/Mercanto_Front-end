import { z } from "zod";
import { DepositRequestStatusSchema, DepositAmountSchema } from "./domain";

// CreateDepositRequestDto | payload to register a new recharge backed by voucher
export const CreateDepositRequestSchema = z.object({
  platform_bank_account_id: z.string().uuid("ID de cuenta bancaria de plataforma inválido"),
  amount: DepositAmountSchema,
  reference_code: z.string().trim().min(1, "El código de referencia es requerido").max(100),
  voucher_blob_id: z.string().uuid("ID de comprobante (blob) inválido"),
  deposited_at: z.string().datetime("Fecha de depósito en formato ISO requerida"),
});

// RejectDepositRequestDto | payload to reject a recharge
export const RejectDepositRequestSchema = z.object({
  reason: z.string().trim().min(3, "El motivo de rechazo debe contener al menos 3 caracteres").max(500),
});

// DepositFilterQueryDto | query params for listing deposit requests
export const DepositFilterQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  wallet_id: z.string().uuid().optional(),
  status: DepositRequestStatusSchema.optional(),
  platform_bank_account_id: z.string().uuid().optional(),
  min_amount: z.number().nonnegative().optional(),
  max_amount: z.number().nonnegative().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  deposited_after: z.string().datetime().optional(),
  deposited_before: z.string().datetime().optional(),
  search_term: z.string().trim().optional(),
  sort_by: z.enum(["created_at", "deposited_at", "updated_at", "amount", "status", "id"]).optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
});

