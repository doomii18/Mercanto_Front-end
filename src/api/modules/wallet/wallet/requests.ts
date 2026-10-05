import { z } from "zod";
import { TransactionTypeSchema } from "./domain";

// WalletLedgerFilterQueryDto | filter and sort query parameters for wallet ledger
export const WalletLedgerFilterQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  kind: TransactionTypeSchema.optional(),
  quote_id: z.string().uuid().optional(),
  correlation_id: z.string().uuid().optional(),
  min_amount: z.number().nonnegative().optional(),
  max_amount: z.number().nonnegative().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  search_term: z.string().trim().optional(),
  sort_by: z.enum(["created_at", "amount", "kind", "id"]).optional(),
  sort_direction: z.enum(["asc", "desc"]).optional(),
});

// Backward-compatibility alias
export const WalletLedgerPaginationQuerySchema = WalletLedgerFilterQuerySchema;

