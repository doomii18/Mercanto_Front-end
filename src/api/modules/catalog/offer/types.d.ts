import type { z } from "zod";
import type { DiscountPercentageSchema, OfferSortFieldSchema } from "./domain";
import type {
  SetOfferRequestSchema,
  PatchOfferRequestSchema,
  OfferFiltersRequestSchema,
} from "./requests";
import type {
  ProductOfferResponseSchema,
  PaginatedOfferResponseSchema,
  BatchOfferResponseSchema,
} from "./responses";

export type DiscountPercentage = z.infer<typeof DiscountPercentageSchema>;
export type OfferSortField = z.infer<typeof OfferSortFieldSchema>;

export type SetOfferRequest = z.infer<typeof SetOfferRequestSchema>;
export type PatchOfferRequest = z.infer<typeof PatchOfferRequestSchema>;
export type OfferFiltersRequest = z.infer<typeof OfferFiltersRequestSchema>;

export type ProductOfferResponse = z.infer<typeof ProductOfferResponseSchema>;
export type PaginatedOfferResponse = z.infer<typeof PaginatedOfferResponseSchema>;
export type BatchOfferResponse = z.infer<typeof BatchOfferResponseSchema>;