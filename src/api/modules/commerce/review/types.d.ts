import type { z } from "zod";
import type {
  CreateProviderReviewSchema,
  CreateProductReviewSchema,
} from "./requests";
import type {
  ProviderReviewResponseSchema,
  ProductReviewResponseSchema,
  PaginatedProviderReviewResponseSchema,
  PaginatedProductReviewResponseSchema,
  ProductMetricsDtoSchema,
  ProviderMetricsDtoSchema,
  ReviewEligibilityDtoSchema,
} from "./responses";

// Request types
export type CreateProviderReview = z.infer<typeof CreateProviderReviewSchema>;
export type CreateProductReview = z.infer<typeof CreateProductReviewSchema>;

// Response types
export type ProviderReviewResponse = z.infer<typeof ProviderReviewResponseSchema>;
export type ProductReviewResponse = z.infer<typeof ProductReviewResponseSchema>;
export type PaginatedProviderReviewResponse = z.infer<typeof PaginatedProviderReviewResponseSchema>;
export type PaginatedProductReviewResponse = z.infer<typeof PaginatedProductReviewResponseSchema>;
export type ProductMetricsDto = z.infer<typeof ProductMetricsDtoSchema>;
export type ProviderMetricsDto = z.infer<typeof ProviderMetricsDtoSchema>;
export type ReviewEligibilityDto = z.infer<typeof ReviewEligibilityDtoSchema>;
