import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";
import {
  QuoteStatusSchema,
  ShippingMethodSchema,
  PaymentMethodSchema,
} from "./domain";

// QuoteResponseDto | quotation header details
export const QuoteResponseSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  status: QuoteStatusSchema,
  shipping_preference: ShippingMethodSchema,
  payment_preference: PaymentMethodSchema,
  buyer_notes: z.string().optional().nullable(),
  shipping_address: z.string(),
  updated_at: z.string().datetime(),
});

// QuoteItemResponseDto | quote item line with pricing snapshot
export const QuoteItemResponseSchema = z.object({
  quote_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int(),
  unit_price_snapshot: z.coerce.number(),
  product_title_snapshot: z.string(),
});

// QuoteAggregateResponse | combined quotation header with its item lines
export const QuoteAggregateResponseSchema = z.object({
  quote: QuoteResponseSchema,
  items: z.array(QuoteItemResponseSchema),
});

// PaginatedResponseDto<QuoteAggregateResponse> | paginated list of aggregate quotes
export const PaginatedQuoteAggregateResponseSchema = PaginatedResponseSchema(
  QuoteAggregateResponseSchema,
);

// PaginatedResponseDto<QuoteResponseDto> | paginated list of quote headers
export const PaginatedQuoteResponseSchema = PaginatedResponseSchema(
  QuoteResponseSchema,
);
