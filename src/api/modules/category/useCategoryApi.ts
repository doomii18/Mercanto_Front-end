import { useApiFetch } from "@/api/useApiFetch";
import {
  ProductCategoryResponseSchema,
  PaginatedCategoriesResponseSchema,
  ProductCategoryNodeResponseSchema,
  CreateCategoryRequestSchema,
  ProductCategoryPatchRequestSchema,
} from "@/api/modules/category/schemas";
import type {
  ProductCategoryResponse,
  PaginatedCategoriesResponse,
  ProductCategoryNodeResponse,
  CreateCategoryRequest,
  ProductCategoryPatchRequest,
} from "@/api/modules/category/types";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "@/api/modules/shared/schemas";

export const useCategoryApi = () => {
  // IMAGE MANAGEMENT
  async function getCategoryImageBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/categories/images/${blobId}`)
      .get()
      .blob();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch category image");
    }
    return data.value;
  }

  async function uploadCategoryImage(categoryId: string, file: File): Promise<void> {
    const payload = AssetUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    const { data: initData, error: initError } = await useApiFetch(
      `/categories/${categoryId}/images/upload`
    )
      .post(payload)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize image upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);
    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!storageResponse.ok) {
      throw new Error("Failed to upload image to storage");
    }

    const { error: confirmError } = await useApiFetch(
      `/categories/${categoryId}/images/${uploadInfo.blob_id}/confirm`
    ).post();

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  async function deleteCategoryImage(categoryId: string): Promise<void> {
    const { error } = await useApiFetch(`/categories/${categoryId}/images`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // CATEGORY QUERIES
  async function getCategories(params?: { limit?: number; offset?: number }): Promise<PaginatedCategoriesResponse> {
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

  async function getCategoryTree(rootCategoryId: string): Promise<ProductCategoryNodeResponse> {
    const { data, error } = await useApiFetch(`/categories/tree/${rootCategoryId}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch category tree for ${rootCategoryId}`);
    }
    return ProductCategoryNodeResponseSchema.parse(data.value);
  }

  // CATEGORY MUTATIONS
  async function createCategory(payload: CreateCategoryRequest): Promise<ProductCategoryResponse> {
    const validatedPayload = CreateCategoryRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/categories").post(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create category");
    }
    return ProductCategoryResponseSchema.parse(data.value);
  }

  async function updateCategory(categoryId: string, payload: ProductCategoryPatchRequest): Promise<ProductCategoryResponse> {
    const validatedPayload = ProductCategoryPatchRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/categories/${categoryId}`).patch(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update category ${categoryId}`);
    }
    return ProductCategoryResponseSchema.parse(data.value);
  }

  async function deleteCategory(categoryId: string): Promise<void> {
    const { error } = await useApiFetch(`/categories/${categoryId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  return {
    getCategoryImageBlob,
    uploadCategoryImage,
    deleteCategoryImage,
    getCategories,
    getCategoryTree,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};
