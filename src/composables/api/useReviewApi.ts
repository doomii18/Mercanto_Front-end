import { useApiFetch } from "./useApiFetch";
import {
  CreateProviderReviewSchema,
  CreateProductReviewSchema,
  ProviderReviewResponseSchema,
  ProductReviewResponseSchema,
  PaginatedProviderReviewResponseSchema,
  PaginatedProductReviewResponseSchema,
} from "@/api/services/review/payloads";
import type {
  CreateProviderReview,
  CreateProductReview,
  ProviderReviewResponse,
  ProductReviewResponse,
  PaginatedProviderReviewResponse,
  PaginatedProductReviewResponse,
} from "@/api/services/review/types";

export const useReviewApi = () => {
  // PROVIDER REVIEWS
  async function createProviderReview(payload: CreateProviderReview): Promise<ProviderReviewResponse> {
    const validated = CreateProviderReviewSchema.parse(payload);
    const { data, error } = await useApiFetch("/reviews/providers").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create provider review");
    }
    return ProviderReviewResponseSchema.parse(data.value);
  }

  async function getProviderReviews(
    providerId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedProviderReviewResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/providers/${providerId}/reviews${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch reviews for provider ${providerId}`);
    }
    return PaginatedProviderReviewResponseSchema.parse(data.value);
  }

  async function deleteProviderReview(reviewId: string): Promise<void> {
    const { error } = await useApiFetch(`/reviews/providers/${reviewId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // PRODUCT REVIEWS
  async function createProductReview(payload: CreateProductReview): Promise<ProductReviewResponse> {
    const validated = CreateProductReviewSchema.parse(payload);
    const { data, error } = await useApiFetch("/reviews/products").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create product review");
    }
    return ProductReviewResponseSchema.parse(data.value);
  }

  async function getProductReviews(
    productId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<PaginatedProductReviewResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const qs = queryParams.toString();
    const endpoint = `/products/${productId}/reviews${qs ? `?${qs}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch reviews for product ${productId}`);
    }
    return PaginatedProductReviewResponseSchema.parse(data.value);
  }

  async function deleteProductReview(reviewId: string): Promise<void> {
    const { error } = await useApiFetch(`/reviews/products/${reviewId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  return {
    createProviderReview,
    getProviderReviews,
    deleteProviderReview,
    createProductReview,
    getProductReviews,
    deleteProductReview,
  };
};
