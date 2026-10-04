import { z } from "zod";
import {
  TransactionTypeSchema,
  WalletBalanceSchema,
  WalletLedgerAmountSchema,
  ReferenceNotesSchema,
} from "./domain";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// VirtualWalletResponseDto | virtual wallet summary and balance
export const VirtualWalletResponseSchema = z.object({
  id: z.uuid(),
  balance: WalletBalanceSchema,
  updated_at: z.iso.datetime(),
});

// LedgerEntryResponseDto | individual immutable ledger transaction registry
export const LedgerEntryResponseSchema = z.object({
  id: z.uuid(),
  wallet_id: z.uuid(),
  quote_id: z.uuid().nullable().optional(),
  kind: TransactionTypeSchema,
  amount: WalletLedgerAmountSchema,
  reference_notes: ReferenceNotesSchema.nullable().optional(),
});

// PaginatedResponseDto<LedgerEntryResponseDto> | paginated list of wallet ledger entries
export const PaginatedLedgerResponseSchema = PaginatedResponseSchema(LedgerEntryResponseSchema);
