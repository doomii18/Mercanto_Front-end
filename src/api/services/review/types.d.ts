import { z } from 'zod';
import {
  createProviderReviewDtoSchema,
  createProductReviewDtoSchema,
  providerReviewResponseDtoSchema,
  productReviewResponseDtoSchema,
} from './payloads';

export type CreateProviderReviewDto = z.infer<typeof createProviderReviewDtoSchema>;
export type CreateProductReviewDto = z.infer<typeof createProductReviewDtoSchema>;
export type ProviderReviewResponseDto = z.infer<typeof providerReviewResponseDtoSchema>;
export type ProductReviewResponseDto = z.infer<typeof productReviewResponseDtoSchema>;
