import type { ApiClient } from "../../client";
import {
  ProductCategoryResponseSchema,
  PaginatedCategoriesResponseSchema,
  ProductCategoryNodeResponseSchema,
  CreateCategoryRequestSchema,
  ProductCategoryPatchRequestSchema,
} from "./payloads";
import type {
  ProductCategoryResponse,
  PaginatedCategoriesResponse,
  ProductCategoryNodeResponse,
  CreateCategoryRequest,
  ProductCategoryPatchRequest,
} from "./types";

export class CategoryService {
  constructor(private readonly client: ApiClient) {}

  async getCategories(params?: { limit?: number; offset?: number }): Promise<PaginatedCategoriesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/categories${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedCategoriesResponseSchema.parse(data);
  }

  async createCategory(payload: CreateCategoryRequest): Promise<ProductCategoryResponse> {
    const validatedPayload = CreateCategoryRequestSchema.parse(payload);
    const data = await this.client.request("/categories", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return ProductCategoryResponseSchema.parse(data);
  }

  async getCategoryTree(rootCategoryId: string): Promise<ProductCategoryNodeResponse> {
    const data = await this.client.request(`/categories/tree/${rootCategoryId}`, { method: "GET" });
    return ProductCategoryNodeResponseSchema.parse(data);
  }

  async updateCategory(categoryId: string, payload: ProductCategoryPatchRequest): Promise<ProductCategoryResponse> {
    const validatedPayload = ProductCategoryPatchRequestSchema.parse(payload);
    const data = await this.client.request(`/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return ProductCategoryResponseSchema.parse(data);
  }

  async deleteCategory(categoryId: string): Promise<void> {
    await this.client.request(`/categories/${categoryId}`, { method: "DELETE" });
  }
}
