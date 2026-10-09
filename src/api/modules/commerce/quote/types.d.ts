import type { z } from "zod";
import type {
  QuoteStatusSchema,
  PaymentMethodSchema,
  QuoteSortFieldSchema,
  QuoteItemSpecSchema,
} from "./domain";
import type {
  QuoteItemDtoSchema,
  CreateQuoteRequestSchema,
  AccountQuoteFiltersQuerySchema,
  ProviderQuoteFiltersQuerySchema,
  GlobalQuoteFiltersQuerySchema,
} from "./requests";
import type {
  QuoteResponseSchema,
  QuoteItemResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
  PaginatedQuoteResponseSchema,
  PrintQuoteResponseSchema,
} from "./responses";

// Domain types
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type QuoteSortField = z.infer<typeof QuoteSortFieldSchema>;
export type QuoteItemSpec = z.infer<typeof QuoteItemSpecSchema>;

// Request types
export type QuoteItemDto = z.infer<typeof QuoteItemDtoSchema>;
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;
export type AccountQuoteFiltersQuery = z.infer<typeof AccountQuoteFiltersQuerySchema>;
export type ProviderQuoteFiltersQuery = z.infer<typeof ProviderQuoteFiltersQuerySchema>;
export type GlobalQuoteFiltersQuery = z.infer<typeof GlobalQuoteFiltersQuerySchema>;

// Response types
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteItemResponse = z.infer<typeof QuoteItemResponseSchema>;
export type QuoteAggregateResponse = z.infer<typeof QuoteAggregateResponseSchema>;
export type PaginatedQuoteAggregateResponse = z.infer<typeof PaginatedQuoteAggregateResponseSchema>;
export type PaginatedQuoteResponse = z.infer<typeof PaginatedQuoteResponseSchema>;
export type PrintQuoteResponse = z.infer<typeof PrintQuoteResponseSchema>;
