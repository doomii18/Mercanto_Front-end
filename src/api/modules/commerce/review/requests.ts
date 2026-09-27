import { z } from "zod";
import { ReviewRatingSchema, ReviewCommentSchema } from "./domain";

export { BatchProductQuerySchema, BatchProviderQuerySchema } from "@/api/modules/shared/schemas";

// CreateProviderReviewDto | payload to review a provider for a completed quote
export const CreateProviderReviewSchema = z.object({
  provider_id: z.string().uuid("ID de proveedor inválido"),
  quote_id: z.string().uuid("ID de cotización inválido"),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
});

// CreateProductReviewDto | payload to review a product for a completed quote
export const CreateProductReviewSchema = z.object({
  product_id: z.string().uuid("ID de producto inválido"),
  quote_id: z.string().uuid("ID de cotización inválido"),
  rating: ReviewRatingSchema,
  comment: ReviewCommentSchema.nullable().optional(),
});
