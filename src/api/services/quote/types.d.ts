import { z } from "zod";
import type {
  CreateQuoteRequestSchema,
  QuoteResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
  QuoteItemDtoSchema,
} from "./payloads";

export type QuoteItemDto = z.infer<typeof QuoteItemDtoSchema>;
export type CreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>;
export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;
export type QuoteAggregateResponse = z.infer<typeof QuoteAggregateResponseSchema>;
export type PaginatedQuoteAggregateResponse = z.infer<typeof PaginatedQuoteAggregateResponseSchema>;
