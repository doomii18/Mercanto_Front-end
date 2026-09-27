import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  ProductImageUploadRequestSchema,
  BatchProductQuerySchema,
} from "./requests";
import {
  BatchProductImagesResponseSchema,
  UploadUrlResponseSchema,
} from "./responses";
import type {
  ProductImageUploadRequest,
  BatchProductImagesResponse,
} from "./types";
import type { UploadUrlResponse, BatchProductQuery } from "@/api/modules/shared/types";

export const useProductImageApi = () => {
  // GET /products/{id}/images
  async function getProductImages(productId: string): Promise<string[]> {
    const { data, error } = await useApiFetch(`/products/${productId}/images`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch images for product ${productId}`);
    }
    return z.array(z.string().uuid()).parse(data.value);
  }

  // POST /products/images/batch
  async function getProductImagesBatch(
    payload: BatchProductQuery
  ): Promise<BatchProductImagesResponse> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/products/images/batch")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch product images");
    }
    return BatchProductImagesResponseSchema.parse(data.value);
  }

  // POST /products/{product_id}/images/upload
  async function requestProductImageUpload(
    productId: string,
    payload: ProductImageUploadRequest
  ): Promise<UploadUrlResponse> {
    const validated = ProductImageUploadRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/products/${productId}/images/upload`)
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to initialize product image upload");
    }
    return UploadUrlResponseSchema.parse(data.value);
  }

  // POST /products/{product_id}/images/{blob_id}/confirm
  async function confirmProductImageUpload(
    productId: string,
    blobId: string
  ): Promise<void> {
    const { error } = await useApiFetch(
      `/products/${productId}/images/${blobId}/confirm`
    ).post();
    if (error.value) {
      throw error.value || new Error("Failed to confirm product image upload");
    }
  }

  // DELETE /products/{product_id}/images/{blob_id}
  async function deleteProductImage(productId: string, blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/products/${productId}/images/${blobId}`).delete();
    if (error.value) {
      throw error.value || new Error("Failed to delete product image");
    }
  }

  // GET /products/images/{blob_id}
  async function getProductImageBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/products/images/${blobId}`)
      .get()
      .blob();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch product image");
    }
    return data.value;
  }

  // Complete client flow: request URL, PUT file, confirm
  async function uploadProductImage(productId: string, file: File): Promise<string> {
    const uploadInfo = await requestProductImageUpload(productId, {
      mime_type: file.type,
      size_bytes: file.size,
    });

    const response = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!response.ok) {
      throw new Error("Failed to upload product image to storage");
    }

    await confirmProductImageUpload(productId, uploadInfo.blob_id);
    return uploadInfo.blob_id;
  }

  return {
    getProductImages,
    getProductImagesBatch,
    requestProductImageUpload,
    confirmProductImageUpload,
    deleteProductImage,
    getProductImageBlob,
    uploadProductImage,
  };
};
