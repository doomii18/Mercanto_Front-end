import { z } from "zod";
import type {
  CreateQuoteRequestSchema,
  QuoteResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
  QuoteItemDtoSchema,
  AccountQuoteFiltersQuerySchema,
  ProviderQuoteFiltersQuerySchema,
} from "./payloads";
import type {
  QuoteStatusSchema,
  PaymentMethodSchema,
  ShippingMethodSchema,
} from "./domain";

export type QuoteItemDto = z.infer<typeof QuoteItemDtoSchema>;
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteAggregateResponse = z.infer<typeof QuoteAggregateResponseSchema>;
export type PaginatedQuoteAggregateResponse = z.infer<typeof PaginatedQuoteAggregateResponseSchema>;
export type AccountQuoteFiltersQuery = z.infer<typeof AccountQuoteFiltersQuerySchema>;
export type ProviderQuoteFiltersQuery = z.infer<typeof ProviderQuoteFiltersQuerySchema>;
export type QuoteStatus = z.infer<typeof QuoteStatusSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;
