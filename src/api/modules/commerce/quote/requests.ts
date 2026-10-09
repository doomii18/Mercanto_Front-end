import { z } from "zod";
import {
  QuoteStatusSchema,
  ShippingMethodSchema,
  PaymentMethodSchema,
  buyerNotesSchema,
  QuoteItemSpecSchema,
} from "./domain";

export { BatchQuoteQuerySchema } from "@/api/modules/shared/schemas";

// QuoteItemDto | individual product item specification in quote request
export const QuoteItemDtoSchema = z.object({
  product_id: z.string().uuid("ID de producto inválido"),
  quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
  shipping_preference: ShippingMethodSchema,
  selected_spec: QuoteItemSpecSchema.default({}),
});

// CreateQuoteDto | payload to request quotation from a provider
export const CreateQuoteRequestSchema = z.object({
  provider_id: z.string().uuid("ID de proveedor inválido"),
  payment_preference: PaymentMethodSchema,
  buyer_notes: buyerNotesSchema.optional().nullable(),
  shipping_address: z.string().trim().min(1, "La dirección de envío es obligatoria"),
  items: z.array(QuoteItemDtoSchema).min(1, "Debe incluir al menos un producto en la cotización"),
});

// AccountQuoteFiltersQuery | query filters for buyer quotation list
export const AccountQuoteFiltersQuerySchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  provider_id: z.string().uuid().optional(),
  quote_group_id: z.string().uuid().optional(),
  statuses: z.array(QuoteStatusSchema).optional(),
  payment_preference: PaymentMethodSchema.optional(),
  shipping_preference: ShippingMethodSchema.optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  search_term: z.string().optional(),
});

// ProviderQuoteFiltersQuery | query filters for provider quotation list
export const ProviderQuoteFiltersQuerySchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  buyer_id: z.string().uuid().optional(),
  quote_group_id: z.string().uuid().optional(),
  statuses: z.array(QuoteStatusSchema).optional(),
  payment_preference: PaymentMethodSchema.optional(),
  shipping_preference: ShippingMethodSchema.optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  search_term: z.string().optional(),
});

// GlobalQuoteFiltersQuery | query filters for global quotation list (Admin / Auditor)
export const GlobalQuoteFiltersQuerySchema = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  buyer_id: z.string().uuid().optional(),
  provider_id: z.string().uuid().optional(),
  quote_group_id: z.string().uuid().optional(),
  statuses: z.array(QuoteStatusSchema).optional(),
  payment_preference: PaymentMethodSchema.optional(),
  shipping_preference: ShippingMethodSchema.optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  search_term: z.string().optional(),
});
