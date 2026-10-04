import { z } from "zod";

// TransactionType | wallet ledger transaction types
export const TransactionTypeSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum([
    "deposit",
    "withdrawal",
    "payment",
    "refund",
    "commission",
  ])
);

// DepositRequestStatus | deposit request status
export const DepositRequestStatusSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["pending", "approved", "rejected"])
);

// WithdrawalRequestStatus | withdrawal request status
export const WithdrawalRequestStatusSchema = z.preprocess(
  (val) => (typeof val === "string" ? val.toLowerCase() : val),
  z.enum(["pending", "processing", "completed", "rejected"])
);

// WalletBalance | non-negative virtual wallet balance
export const WalletBalanceSchema = z.coerce
  .number()
  .min(0, "El balance no puede ser negativo");

// WalletLedgerAmount | non-negative ledger transaction amount
export const WalletLedgerAmountSchema = z.coerce
  .number()
  .min(0, "El monto de la transacción no puede ser negativo");

// ReferenceNotes | optional transaction reference notes max 1000 chars
export const ReferenceNotesSchema = z
  .string()
  .trim()
  .max(1000, "Las notas de referencia no deben exceder 1000 caracteres");
