import type { z } from "zod";
import type {
  TransactionTypeSchema,
  WalletBalanceSchema,
  WalletLedgerAmountSchema,
  ReferenceNotesSchema,
} from "./domain";
import type { WalletLedgerPaginationQuerySchema } from "./requests";
import type {
  VirtualWalletResponseSchema,
  LedgerEntryResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./responses";

export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type WalletBalance = z.infer<typeof WalletBalanceSchema>;
export type WalletLedgerAmount = z.infer<typeof WalletLedgerAmountSchema>;
export type ReferenceNotes = z.infer<typeof ReferenceNotesSchema>;

export type WalletLedgerPaginationQuery = z.infer<typeof WalletLedgerPaginationQuerySchema>;

export type VirtualWalletResponse = z.infer<typeof VirtualWalletResponseSchema>;
export type LedgerEntryResponse = z.infer<typeof LedgerEntryResponseSchema>;
export type PaginatedLedgerResponse = z.infer<typeof PaginatedLedgerResponseSchema>;
