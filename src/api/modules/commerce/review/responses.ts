import { z } from "zod";
import { PaginatedResponseSchema } from "@/api/modules/shared/schemas";
import { ReviewRatingSchema, ReviewCommentSchema } from "./domain";

// ProviderReviewResponseDto | review data for a provider organization
export const ProviderReviewResponseSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
  updated_at: z.string().datetime(),
});

// ProductReviewResponseDto | review data for a specific catalog product
export const ProductReviewResponseSchema = z.object({
  id: z.string().uuid(),
  buyer_id: z.string().uuid(),
  product_id: z.string().uuid(),
  quote_id: z.string().uuid(),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
  updated_at: z.string().datetime(),
});

// PaginatedResponseDto<ProviderReviewResponseDto> | paginated provider reviews
export const PaginatedProviderReviewResponseSchema = PaginatedResponseSchema(
  ProviderReviewResponseSchema,
);

// PaginatedResponseDto<ProductReviewResponseDto> | paginated product reviews
export const PaginatedProductReviewResponseSchema = PaginatedResponseSchema(
  ProductReviewResponseSchema,
);

// ProductMetricsDto | rating score and review count for a product
export const ProductMetricsDtoSchema = z.object({
  rating_score: z.number(),
  review_count: z.number().int(),
});

// ProviderMetricsDto | rating score and review count for a provider
export const ProviderMetricsDtoSchema = z.object({
  rating_score: z.number(),
  review_count: z.number().int(),
});

// ReviewEligibilityDto | whether the authenticated buyer may review an item
export const ReviewEligibilityDtoSchema = z.object({
  id: z.string().uuid(),
  review_id: z.string().uuid().nullable(),
  can_review: z.boolean(),
  has_open_quote: z.boolean(),
});
