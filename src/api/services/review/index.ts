import type { ApiClient } from "../../client";
import {
  CreateProviderReviewSchema,
  CreateProductReviewSchema,
  ProviderReviewResponseSchema,
  ProductReviewResponseSchema,
  PaginatedProviderReviewResponseSchema,
  PaginatedProductReviewResponseSchema,
} from "./payloads";
import type {
  CreateProviderReview,
  CreateProductReview,
  ProviderReviewResponse,
  ProductReviewResponse,
  PaginatedProviderReviewResponse,
  PaginatedProductReviewResponse,
} from "./types";

export class ReviewService {
  constructor(private readonly client: ApiClient) {}
  async createProviderReview(
    payload: CreateProviderReview,
  ): Promise<ProviderReviewResponse> {
    const validated = CreateProviderReviewSchema.parse(payload);
    const data = await this.client.request("/reviews/providers", {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return ProviderReviewResponseSchema.parse(data);
  }
  async createProductReview(
    payload: CreateProductReview,
  ): Promise<ProductReviewResponse> {
    const validated = CreateProductReviewSchema.parse(payload);
    const data = await this.client.request("/reviews/products", {
      method: "POST",
      body: JSON.stringify(validated),
    });
    return ProductReviewResponseSchema.parse(data);
  }
  async getProviderReviews(
    providerId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedProviderReviewResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    const qs = queryParams.toString();
    const data = await this.client.request(
      `/providers/${providerId}/reviews${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    return PaginatedProviderReviewResponseSchema.parse(data);
  }
  async getProductReviews(
    productId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedProductReviewResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    const qs = queryParams.toString();
    const data = await this.client.request(
      `/products/${productId}/reviews${qs ? `?${qs}` : ""}`,
      { method: "GET" },
    );
    return PaginatedProductReviewResponseSchema.parse(data);
  }
  async deleteProviderReview(reviewId: string): Promise<void> {
    await this.client.request(`/reviews/providers/${reviewId}`, {
      method: "DELETE",
    });
  }
  async deleteProductReview(reviewId: string): Promise<void> {
    await this.client.request(`/reviews/products/${reviewId}`, {
      method: "DELETE",
    });
  }
}
