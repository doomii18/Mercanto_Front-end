import { z } from "zod";
import { TransactionTypeSchema } from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const VirtualWalletResponseSchema = z.object({
  id: z.uuid(),
  balance: z.coerce.number(),
  updated_at: z.iso.datetime(),
});

export const LedgerEntryResponseSchema = z.object({
  id: z.uuid(),
  wallet_id: z.uuid(),
  quote_id: z.uuid().optional().nullable(),
  kind: TransactionTypeSchema,
  amount: z.coerce.number(),
  reference_notes: z.string().optional().nullable(),
});

export const PaginatedLedgerResponseSchema = PaginatedResponseSchema(LedgerEntryResponseSchema);
