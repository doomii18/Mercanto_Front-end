import { z } from "zod";
import {
  TransactionTypeSchema,
  WalletBalanceSchema,
  WalletLedgerAmountSchema,
  ReferenceNotesSchema,
} from "./domain";
import {
  WalletLedgerFilterQuerySchema,
  WalletLedgerPaginationQuerySchema,
} from "./requests";
import {
  VirtualWalletResponseSchema,
  LedgerEntryResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./responses";

export type TransactionType = z.infer<typeof TransactionTypeSchema>;
export type WalletBalance = z.infer<typeof WalletBalanceSchema>;
export type WalletLedgerAmount = z.infer<typeof WalletLedgerAmountSchema>;
export type ReferenceNotes = z.infer<typeof ReferenceNotesSchema>;

export type WalletLedgerFilterQuery = z.infer<typeof WalletLedgerFilterQuerySchema>;
export type WalletLedgerFilterQueryDto = WalletLedgerFilterQuery;
export type WalletLedgerPaginationQuery = WalletLedgerFilterQuery;

export type VirtualWalletResponseDto = z.infer<typeof VirtualWalletResponseSchema>;
export type VirtualWalletResponse = VirtualWalletResponseDto;

export type LedgerEntryResponseDto = z.infer<typeof LedgerEntryResponseSchema>;
export type LedgerEntryResponse = LedgerEntryResponseDto;

export type PaginatedLedgerResponseDto = z.infer<typeof PaginatedLedgerResponseSchema>;
export type PaginatedLedgerResponse = PaginatedLedgerResponseDto;
