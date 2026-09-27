import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  CreateProviderReviewSchema,
  CreateProductReviewSchema,
  BatchProductQuerySchema,
  BatchProviderQuerySchema,
} from "./requests";
import {
  ProviderReviewResponseSchema,
  ProductReviewResponseSchema,
  PaginatedProviderReviewResponseSchema,
  PaginatedProductReviewResponseSchema,
  ProductMetricsDtoSchema,
  ProviderMetricsDtoSchema,
} from "./responses";
import type {
  CreateProviderReview,
  CreateProductReview,
  ProviderReviewResponse,
  ProductReviewResponse,
  PaginatedProviderReviewResponse,
  PaginatedProductReviewResponse,
  ProductMetricsDto,
  ProviderMetricsDto,
} from "./types";
import type { BatchProductQuery, BatchProviderQuery } from "@/api/modules/shared/types";

export const useReviewApi = () => {
  // POST /reviews/providers
  async function createProviderReview(payload: CreateProviderReview): Promise<ProviderReviewResponse> {
    const validated = CreateProviderReviewSchema.parse(payload);
    const { data, error } = await useApiFetch("/reviews/providers").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create provider review");
    }
    return ProviderReviewResponseSchema.parse(data.value);
  }

  // GET /providers/{provider_id}/reviews
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

  // DELETE /reviews/providers/{review_id}
  async function deleteProviderReview(reviewId: string): Promise<void> {
    const { error } = await useApiFetch(`/reviews/providers/${reviewId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // GET /providers/{id}/metrics
  async function getProviderMetrics(providerId: string): Promise<ProviderMetricsDto> {
    const { data, error } = await useApiFetch(`/providers/${providerId}/metrics`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch metrics for provider ${providerId}`);
    }
    return ProviderMetricsDtoSchema.parse(data.value);
  }

  // POST /providers/metrics/batch
  async function getProviderMetricsBatch(
    payload: BatchProviderQuery
  ): Promise<Record<string, ProviderMetricsDto>> {
    const validated = BatchProviderQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/providers/metrics/batch")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch provider metrics");
    }
    return z.record(z.string().uuid(), ProviderMetricsDtoSchema).parse(data.value);
  }

  // POST /reviews/products
  async function createProductReview(payload: CreateProductReview): Promise<ProductReviewResponse> {
    const validated = CreateProductReviewSchema.parse(payload);
    const { data, error } = await useApiFetch("/reviews/products").post(validated).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create product review");
    }
    return ProductReviewResponseSchema.parse(data.value);
  }

  // GET /products/{product_id}/reviews
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

  // DELETE /reviews/products/{review_id}
  async function deleteProductReview(reviewId: string): Promise<void> {
    const { error } = await useApiFetch(`/reviews/products/${reviewId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // GET /products/{id}/metrics
  async function getProductMetrics(productId: string): Promise<ProductMetricsDto> {
    const { data, error } = await useApiFetch(`/products/${productId}/metrics`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch metrics for product ${productId}`);
    }
    return ProductMetricsDtoSchema.parse(data.value);
  }

  // POST /products/metrics/batch
  async function getProductMetricsBatch(
    payload: BatchProductQuery
  ): Promise<Record<string, ProductMetricsDto>> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/products/metrics/batch")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch product metrics");
    }
    return z.record(z.string().uuid(), ProductMetricsDtoSchema).parse(data.value);
  }

  return {
    createProviderReview,
    getProviderReviews,
    deleteProviderReview,
    getProviderMetrics,
    getProviderMetricsBatch,
    createProductReview,
    getProductReviews,
    deleteProductReview,
    getProductMetrics,
    getProductMetricsBatch,
  };
};
