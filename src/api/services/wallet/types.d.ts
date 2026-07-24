import { z } from "zod";
import type {
  VirtualWalletResponseSchema,
  LedgerEntryResponseSchema,
  PaginatedLedgerResponseSchema,
} from "./payloads";

export type VirtualWalletResponse = z.infer<typeof VirtualWalletResponseSchema>;
export type LedgerEntryResponse = z.infer<typeof LedgerEntryResponseSchema>;
export type PaginatedLedgerResponse = z.infer<typeof PaginatedLedgerResponseSchema>;
