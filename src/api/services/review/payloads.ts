import { z } from "zod";
import { ReviewRatingSchema, ReviewCommentSchema } from "./domain";
import { PaginatedResponseSchema } from "../../shared/schemas";

export const CreateProviderReviewSchema = z.object({
  provider_id: z.uuid(),
  quote_id: z.uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
});
export const CreateProductReviewSchema = z.object({
  product_id: z.uuid(),
  quote_id: z.uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
});
export const ProviderReviewResponseSchema = z.object({
  id: z.uuid(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
  quote_id: z.uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
  updated_at: z.iso.datetime(),
});
export const ProductReviewResponseSchema = z.object({
  id: z.uuid(),
  buyer_id: z.uuid(),
  product_id: z.uuid(),
  quote_id: z.uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
  updated_at: z.iso.datetime(),
});
export const PaginatedProviderReviewResponseSchema = PaginatedResponseSchema(
  ProviderReviewResponseSchema,
);
export const PaginatedProductReviewResponseSchema = PaginatedResponseSchema(
  ProductReviewResponseSchema,
);
