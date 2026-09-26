import { useApiFetch } from "@/api/useApiFetch";
import {
  ProductResponseSchema,
  PaginatedProductResponseSchema,
  CreateProductRequestSchema,
  PatchProductRequestSchema,
  ProductImageSearchUploadSchema,
  SearchProductsByImageSchema,
  PaginatedProductImageSearchResponseSchema,
} from "@/api/modules/product/schemas";
import type {
  PaginatedProductResponse,
  ProductFiltersRequest,
  ProductResponse,
  CreateProductRequest,
  PatchProductRequest,
  PaginatedProductImageSearchResponse,
} from "@/api/modules/product/types";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "@/api/modules/shared/schemas";

export const useProductApi = () => {
  // IMAGE MANAGEMENT
  async function getProductImageBlob(blobId: string): Promise<Blob> {
    const { data, error } = await useApiFetch(`/products/images/${blobId}`)
      .get()
      .blob();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch product image");
    }
    return data.value;
  }

  async function uploadProductImage(productId: string, file: File): Promise<void> {
    const payload = AssetUploadRequestSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    const { data: initData, error: initError } = await useApiFetch(
      `/products/${productId}/images/upload`
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
      `/products/${productId}/images/${uploadInfo.blob_id}/confirm`
    ).post();

    if (confirmError.value) {
      throw confirmError.value;
    }
  }

  async function deleteProductImage(productId: string, blobId: string): Promise<void> {
    const { error } = await useApiFetch(`/products/${productId}/images/${blobId}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // PRODUCT QUERIES
  async function getProducts(params?: ProductFiltersRequest): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.category_id) queryParams.append("category_id", params.category_id);
    if (params?.min_price !== undefined) queryParams.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined) queryParams.append("max_price", params.max_price.toString());
    if (params?.min_score !== undefined) queryParams.append("min_score", params.min_score.toString());
    if (params?.search_term) queryParams.append("search_term", params.search_term);
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_direction) queryParams.append("sort_direction", params.sort_direction);

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch products");
    }
    return PaginatedProductResponseSchema.parse(data.value);
  }

  async function getProduct(id: string): Promise<ProductResponse> {
    const { data, error } = await useApiFetch(`/products/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch product ${id}`);
    }
    return ProductResponseSchema.parse(data.value);
  }

  // PRODUCT MUTATIONS
  async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
    const validatedPayload = CreateProductRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/products").post(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create product");
    }
    return ProductResponseSchema.parse(data.value);
  }

  async function updateProduct(id: string, payload: PatchProductRequest): Promise<ProductResponse> {
    const validatedPayload = PatchProductRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/products/${id}`).patch(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update product ${id}`);
    }
    return ProductResponseSchema.parse(data.value);
  }

  async function deleteProduct(id: string): Promise<void> {
    const { error } = await useApiFetch(`/products/${id}`).delete();
    if (error.value) {
      throw error.value;
    }
  }

  // IMAGE SEARCH
  async function searchProductsByImage(file: File): Promise<PaginatedProductImageSearchResponse> {
    const uploadPayload = {
      mime_type: file.type,
      size_bytes: file.size,
    };
    const validatedUploadPayload = ProductImageSearchUploadSchema.parse(uploadPayload);

    const { data: initData, error: initError } = await useApiFetch("/products/image-search/upload")
      .post(validatedUploadPayload)
      .json();

    if (initError.value || !initData.value) {
      throw initError.value || new Error("Failed to initialize image search upload");
    }

    const uploadInfo = UploadUrlResponseSchema.parse(initData.value);
    const storageResponse = await fetch(uploadInfo.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!storageResponse.ok) throw new Error("Image upload failed");

    const searchPayload = {
      blob_id: uploadInfo.blob_id,
      limit: 20,
      offset: 0,
    };
    const validatedSearchPayload = SearchProductsByImageSchema.parse(searchPayload);

    const { data, error } = await useApiFetch("/products/image-search")
      .post(validatedSearchPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to search products by image");
    }
    return PaginatedProductImageSearchResponseSchema.parse(data.value);
  }

  return {
    getProductImageBlob,
    uploadProductImage,
    deleteProductImage,
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProductsByImage,
  };
};
