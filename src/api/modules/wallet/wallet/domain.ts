import { z } from "zod";

// TransactionType | wallet ledger transaction types
export const TransactionTypeSchema = z.enum([
  "deposit",
  "withdrawal",
  "payment",
  "refund",
  "commission",
]);

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
