import { z } from "zod";
import { QuoteStatusSchema, ShippingMethodSchema, PaymentMethodSchema } from "./domain";

export const QuoteItemDtoSchema = z.object({
  product_id: z.uuid(),
  quantity: z.number().int().positive(),
});

export const CreateQuoteRequestSchema = z.object({
  provider_id: z.uuid(),
  shipping_preference: ShippingMethodSchema,
  payment_preference: PaymentMethodSchema,
  buyer_notes: z.string().max(1000).optional().nullable(),
  shipping_address: z.string().trim().min(1),
  items: z.array(QuoteItemDtoSchema).min(1),
});

export const QuoteResponseSchema = z.object({
  id: z.uuid(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
  status: QuoteStatusSchema,
  shipping_preference: ShippingMethodSchema,
  payment_preference: PaymentMethodSchema,
  buyer_notes: z.string().optional().nullable(),
  shipping_address: z.string(),
  updated_at: z.string().datetime(),
});

export const QuoteItemResponseSchema = z.object({
  quote_id: z.uuid(),
  product_id: z.uuid(),
  quantity: z.number().int(),
  unit_price_snapshot: z.coerce.number(),
  product_title_snapshot: z.string(),
});

export const QuoteAggregateResponseSchema = z.object({
  quote: QuoteResponseSchema,
  items: z.array(QuoteItemResponseSchema),
});

export const PaginatedQuoteAggregateResponseSchema = z.object({
  data: z.array(QuoteAggregateResponseSchema),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});
