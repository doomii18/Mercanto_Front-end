import { ApiClient } from '../../client';
import {
  createProviderReviewDtoSchema,
  createProductReviewDtoSchema,
  providerReviewResponseDtoSchema,
  productReviewResponseDtoSchema,
} from './payloads';
import type { CreateProductReviewDto, CreateProviderReviewDto, ProductReviewResponseDto, ProviderReviewResponseDto } from './types';


export class ReviewService {
  constructor(private readonly client: ApiClient) {}

  async createProviderReview(dto: CreateProviderReviewDto): Promise<ProviderReviewResponseDto> {
    const validatedDto = createProviderReviewDtoSchema.parse(dto);
    const data = await this.client.request('/reviews/providers', {
      method: 'POST',
      body: JSON.stringify(validatedDto),
    });
    return providerReviewResponseDtoSchema.parse(data);
  }

  async createProductReview(dto: CreateProductReviewDto): Promise<ProductReviewResponseDto> {
    const validatedDto = createProductReviewDtoSchema.parse(dto);
    const data = await this.client.request('/reviews/products', {
      method: 'POST',
      body: JSON.stringify(validatedDto),
    });
    return productReviewResponseDtoSchema.parse(data);
  }

  async getProviderReviews(providerId: string, params?: Record<string, string>) {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return await this.client.request(`/providers/${providerId}/reviews${queryParams}`, {
      method: 'GET',
    });
  }

  async getProductReviews(productId: string, params?: Record<string, string>) {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return await this.client.request(`/products/${productId}/reviews${queryParams}`, {
      method: 'GET',
    });
  }

  async deleteProviderReview(reviewId: string): Promise<void> {
    await this.client.request(`/reviews/providers/${reviewId}`, {
      method: 'DELETE',
    });
  }

  async deleteProductReview(reviewId: string): Promise<void> {
    await this.client.request(`/reviews/products/${reviewId}`, {
      method: 'DELETE',
    });
  }
}
