import { z } from 'zod';
import { reviewRatingSchema, reviewCommentSchema } from './domain';

export const createProviderReviewDtoSchema = z.object({
  provider_id: z.uuid(),
  quote_id: z.uuid(),
  rating: reviewRatingSchema,
  comment: reviewCommentSchema,
});

export const createProductReviewDtoSchema = z.object({
  product_id: z.uuid(),
  quote_id: z.uuid(),
  rating: reviewRatingSchema,
  comment: reviewCommentSchema,
});

export const providerReviewResponseDtoSchema = z.object({
  id: z.uuid(),
  buyer_id: z.uuid(),
  provider_id: z.uuid(),
  quote_id: z.uuid(),
  rating: reviewRatingSchema,
  comment: reviewCommentSchema,
  updated_at: z.iso.datetime(),
});

export const productReviewResponseDtoSchema = z.object({
  id: z.uuid(),
  buyer_id: z.uuid(),
  product_id: z.uuid(),
  quote_id: z.uuid(),
  rating: reviewRatingSchema,
  comment: reviewCommentSchema,
  updated_at: z.iso.datetime(),
});
