import { z } from "zod";
import { TransactionTypeSchema } from "./domain";

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

export const PaginatedLedgerResponseSchema = z.object({
  data: z.array(LedgerEntryResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
