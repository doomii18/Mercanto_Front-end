import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";

// ProductOfferResponseDto | provider offer object (no product payload)
export const ProductOfferResponseSchema = z.object({
  id: z.uuid(),
  product_id: z.uuid(),
  discount_percentage: z.number().int(),
  starts_at: z.iso.datetime(),
  ends_at: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
});

// PaginatedResponseDto<ProductOfferResponseDto> | paginated list of offers
export const PaginatedOfferResponseSchema = PaginatedResponseSchema(
  ProductOfferResponseSchema
);

// BatchOfferResponse | offers mapped by product id
export const BatchOfferResponseSchema = z.record(z.uuid(), ProductOfferResponseSchema);