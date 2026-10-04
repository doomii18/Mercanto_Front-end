import { z } from "zod";

// WithdrawalRequestStatus | life cycle of a withdrawal request
export const WithdrawalRequestStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "rejected",
]);

// WithdrawalAmount | positive withdrawal amount
export const WithdrawalAmountSchema = z.coerce
  .number()
  .positive("El monto a retirar debe ser mayor a 0");
