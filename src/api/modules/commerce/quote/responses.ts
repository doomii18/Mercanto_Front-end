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
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime(),
});

// QuoteItemResponseDto | quote item line with pricing snapshot
export const QuoteItemResponseSchema = z.object({
  quote_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quantity: z.number().int(),
  unit_price_snapshot: z.coerce.number(),
  product_title_snapshot: z.string(),
  offer_id: z.uuid().nullable(),
  discount_percentage: z.number().int().nullable(),
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

// PrintQuoteResponseDto | presigned download url and metadata for quote invoice PDF
export const PrintQuoteResponseSchema = z.object({
  download_url: z.string().url(),
  filename: z.string(),
  expires_at: z.string().datetime(),
});
