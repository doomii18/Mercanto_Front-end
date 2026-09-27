import { useApiFetch } from "@/api/useApiFetch";
import {
  CreateCategoryRequestSchema,
  ProductCategoryPatchRequestSchema,
  BatchCategoryQuerySchema,
} from "./requests";
import {
  ProductCategoryResponseSchema,
  PaginatedCategoriesResponseSchema,
  ProductCategoryNodeResponseSchema,
  CategoryMetricsResponseSchema,
  BatchCategoryMetricsResponseSchema,
} from "./responses";
import type {
  ProductCategoryResponse,
  PaginatedCategoriesResponse,
  ProductCategoryNodeResponse,
  CategoryMetricsResponse,
  BatchCategoryMetricsResponse,
  CreateCategoryRequest,
  ProductCategoryPatchRequest,
} from "./types";
import type { BatchCategoryQuery } from "@/api/modules/shared/types";

export const useCategoryApi = () => {
  // GET /categories
  async function getCategories(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedCategoriesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/categories${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch categories");
    }
    return PaginatedCategoriesResponseSchema.parse(data.value);
  }

  // GET /categories/tree/{id}
  async function getCategoryTree(rootCategoryId: string): Promise<ProductCategoryNodeResponse> {
    const { data, error } = await useApiFetch(`/categories/tree/${rootCategoryId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch category tree for ${rootCategoryId}`);
    }
    return ProductCategoryNodeResponseSchema.parse(data.value);
  }

  // POST /categories
  async function createCategory(payload: CreateCategoryRequest): Promise<ProductCategoryResponse> {
    const validatedPayload = CreateCategoryRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/categories").post(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create category");
    }
    return ProductCategoryResponseSchema.parse(data.value);
  }

  // PATCH /categories/{id}
  async function updateCategory(
    categoryId: string,
    payload: ProductCategoryPatchRequest
  ): Promise<ProductCategoryResponse> {
    const validatedPayload = ProductCategoryPatchRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/categories/${categoryId}`)
      .patch(validatedPayload)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update category ${categoryId}`);
    }
    return ProductCategoryResponseSchema.parse(data.value);
  }

  // DELETE /categories/{id}
  async function deleteCategory(categoryId: string): Promise<void> {
    const { error } = await useApiFetch(`/categories/${categoryId}`).delete();
    if (error.value) {
      throw error.value || new Error(`Failed to delete category ${categoryId}`);
    }
  }

  // GET /categories/{id}/metrics
  async function getCategoryMetrics(categoryId: string): Promise<CategoryMetricsResponse> {
    const { data, error } = await useApiFetch(`/categories/${categoryId}/metrics`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch metrics for category ${categoryId}`);
    }
    return CategoryMetricsResponseSchema.parse(data.value);
  }

  // POST /categories/metrics/batch
  async function getCategoryMetricsBatch(
    payload: BatchCategoryQuery
  ): Promise<BatchCategoryMetricsResponse> {
    const validated = BatchCategoryQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/categories/metrics/batch")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch category metrics");
    }
    return BatchCategoryMetricsResponseSchema.parse(data.value);
  }

  return {
    getCategories,
    getCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryMetrics,
    getCategoryMetricsBatch,
  };
};
