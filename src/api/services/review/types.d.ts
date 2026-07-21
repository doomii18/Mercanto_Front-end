import { z } from 'zod';
import { CreateProviderReviewSchema, CreateProductReviewSchema, ProviderReviewResponseSchema, ProductReviewResponseSchema, PaginatedProviderReviewResponseSchema, PaginatedProductReviewResponseSchema } from './payloads';

export type CreateProviderReview = z.infer<typeof CreateProviderReviewSchema>;
export type CreateProductReview = z.infer<typeof CreateProductReviewSchema>;
export type ProviderReviewResponse = z.infer<typeof ProviderReviewResponseSchema>;
export type ProductReviewResponse = z.infer<typeof ProductReviewResponseSchema>;
export type PaginatedProviderReviewResponse = z.infer<typeof PaginatedProviderReviewResponseSchema>;
export type PaginatedProductReviewResponse = z.infer<typeof PaginatedProductReviewResponseSchema>;
