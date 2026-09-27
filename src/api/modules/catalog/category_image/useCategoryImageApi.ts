import { useApiFetch } from "@/api/useApiFetch";
import { CategoryImageUploadRequestSchema } from "./requests";
import { UploadUrlResponseSchema } from "./responses";
import type { CategoryImageUploadRequest } from "./types";
import type { UploadUrlResponse } from "@/api/modules/shared/types";

export const useCategoryImageApi = () => {
  // POST /categories/{category_id}/images/upload
  async function requestCategoryImageUpload(
    categoryId: string,
    payload: CategoryImageUploadRequest
  ): Promise<UploadUrlResponse> {
    const validated = CategoryImageUploadRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/categories/${categoryId}/images/upload`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to initialize category image upload");
    }
    return UploadUrlResponseSchema.parse(data.value);
  }

  // POST /categories/{category_id}/images/{blob_id}/confirm
  async function confirmCategoryImageUpload(
    categoryId: string,
    blobId: string
  ): Promise<void> {
    const { error } = await useApiFetch(
      `/categories/${categoryId}/images/${blobId}/confirm`
    ).post();
    if (error.value) {
      throw error.value || new Error("Failed to confirm category image upload");
    }
  }

  // DELETE /categories/{category_id}/images
  async function deleteCategoryImage(categoryId: string): Promise<void> {
    const { error } = await useApiFetch(`/categories/${categoryId}/images`).delete();
    if (error.value) {
      throw error.value || new Error("Failed to delete category image");
    }
  }

  // GET /categories/images/{blob_id}
  async function getCategoryImageBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/categories/images/${blobId}`)
      .get()
      .blob();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch category image");
    }
    return data.value;
  }

  // Complete client flow: request URL, PUT file, confirm
  async function uploadCategoryImage(categoryId: string, file: File): Promise<string> {
    const uploadInfo = await requestCategoryImageUpload(categoryId, {
      mime_type: file.type,
      size_bytes: file.size,
    });

    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload category image binary to storage");
    }

    await confirmCategoryImageUpload(categoryId, uploadInfo.blob_id);
    return uploadInfo.blob_id;
  }

  return {
    requestCategoryImageUpload,
    confirmCategoryImageUpload,
    deleteCategoryImage,
    getCategoryImageBlob,
    uploadCategoryImage,
  };
};
