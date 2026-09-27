import { z } from "zod";
import { DiscountPercentageSchema, OfferSortFieldSchema, SortDirectionSchema } from "./domain";
import { BatchProductQuerySchema } from "@/api/modules/shared/schemas";

export { BatchProductQuerySchema };

// SetOfferDto | create or replace the current offer for a product
export const SetOfferRequestSchema = z.object({
  discount_percentage: DiscountPercentageSchema,
  starts_at: z.iso.datetime().optional().nullable(),
  ends_at: z.iso.datetime().optional().nullable(),
});

// PatchOfferDto | partial offer update payload
export const PatchOfferRequestSchema = z.object({
  discount_percentage: DiscountPercentageSchema.optional().nullable(),
  starts_at: z.iso.datetime().optional().nullable(),
  ends_at: z.iso.datetime().optional().nullable(),
});

// OfferFiltersQuery | query filters for listing offers
export const OfferFiltersRequestSchema = z.object({
  limit: z.number().int().nonnegative().optional(),
  offset: z.number().int().nonnegative().optional(),
  provider_id: z.uuid().optional(),
  category_id: z.uuid().optional(),
  min_discount: z.number().int().min(1).max(99).optional(),
  only_current: z.boolean().optional(),
  sort_by: OfferSortFieldSchema.optional(),
  sort_direction: SortDirectionSchema.optional(),
});