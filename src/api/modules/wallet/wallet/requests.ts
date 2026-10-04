import { z } from "zod";

// PaginationQueryDto | pagination query parameters for wallet ledger
export const WalletLedgerPaginationQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});
