import type { z } from "zod";
import type {
  QuoteStatusSchema,
  PaymentMethodSchema,
} from "./domain";
import type {
  QuoteItemDtoSchema,
  CreateQuoteRequestSchema,
  AccountQuoteFiltersQuerySchema,
  ProviderQuoteFiltersQuerySchema,
} from "./requests";
import type {
  QuoteResponseSchema,
  QuoteItemResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
  PaginatedQuoteResponseSchema,
} from "./responses";

// Domain types
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

// Request types
export type QuoteItemDto = z.infer<typeof QuoteItemDtoSchema>;
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;
export type AccountQuoteFiltersQuery = z.infer<typeof AccountQuoteFiltersQuerySchema>;
export type ProviderQuoteFiltersQuery = z.infer<typeof ProviderQuoteFiltersQuerySchema>;

// Response types
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteItemResponse = z.infer<typeof QuoteItemResponseSchema>;
export type QuoteAggregateResponse = z.infer<typeof QuoteAggregateResponseSchema>;
export type PaginatedQuoteAggregateResponse = z.infer<typeof PaginatedQuoteAggregateResponseSchema>;
export type PaginatedQuoteResponse = z.infer<typeof PaginatedQuoteResponseSchema>;
