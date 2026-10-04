import { z } from "zod";

// DepositRequestStatus | life cycle of a deposit request
export const DepositRequestStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

// DepositAmount | positive deposit amount
export const DepositAmountSchema = z.coerce
  .number()
  .positive("El monto a recargar debe ser mayor a 0");
