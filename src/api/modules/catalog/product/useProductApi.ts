import { useApiFetch } from "@/api/useApiFetch";
import { z } from "zod";
import {
  CreateProductRequestSchema,
  PatchProductRequestSchema,
  BatchProductQuerySchema,
  ProductImageSearchUploadSchema,
  SearchProductsByImageSchema,
  SmartProductSearchSchema,
} from "./requests";
import {
  ProductResponseSchema,
  PaginatedProductResponseSchema,
  PaginatedProductImageSearchResponseSchema,
  SmartSearchResponseSchema,
  BatchProductResponseSchema,
  BatchProductShippingResponseSchema,
  UploadUrlResponseSchema,
} from "./responses";
import { ShippingMethodSchema } from "./domain";
import type {
  ProductResponse,
  PaginatedProductResponse,
  ProductFiltersRequest,
  CreateProductRequest,
  PatchProductRequest,
  PaginatedProductImageSearchResponse,
  SmartSearchResponse,
  SmartProductSearchRequest,
  BatchProductResponse,
  BatchProductShippingResponse,
} from "./types";
import type {
  ShippingMethod,
  BatchProductQuery,
} from "@/api/modules/shared/types";
import { useProductImageApi } from "../product_image/useProductImageApi";

export const useProductApi = () => {
  const productImageApi = useProductImageApi();

  // GET /products
  async function getProducts(params?: ProductFiltersRequest): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.category_id) queryParams.append("category_id", params.category_id);
    if (params?.min_price !== undefined) queryParams.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined) queryParams.append("max_price", params.max_price.toString());
    if (params?.min_score !== undefined) queryParams.append("min_score", params.min_score.toString());
    if (params?.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
    if (params?.search_term) queryParams.append("search_term", params.search_term);
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_direction) queryParams.append("sort_direction", params.sort_direction);
    if (params?.spec_filters) {
      const serialized =
        typeof params.spec_filters === "string"
          ? params.spec_filters
          : JSON.stringify(params.spec_filters);
      queryParams.append("spec_filters", serialized);
    }

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch products");
    }
    const paginated = PaginatedProductResponseSchema.parse(data.value);
    if (paginated.data.length > 0) {
      const productIds = paginated.data.map((p) => p.id);
      const imagesMap: Record<string, string[]> = {};
      for (let i = 0; i < productIds.length; i += 100) {
        const chunk = productIds.slice(i, i + 100);
        try {
          const batchRes = await productImageApi.getProductImagesBatch({ product_ids: chunk });
          Object.assign(imagesMap, batchRes);
        } catch {
          // Non-blocking fallback if batch image lookup fails
        }
      }
      paginated.data.forEach((p) => {
        p.image_blob_ids = imagesMap[p.id] || [];
      });
    }
    return paginated;
  }

  // GET /products/{id}
  async function getProduct(id: string): Promise<ProductResponse> {
    const [prodResult, imageBlobIds] = await Promise.all([
      useApiFetch(`/products/${id}`).get().json(),
      productImageApi.getProductImages(id).catch(() => []),
    ]);
    if (prodResult.error.value || !prodResult.data.value) {
      throw prodResult.error.value || new Error(`Failed to fetch product ${id}`);
    }
    const product = ProductResponseSchema.parse(prodResult.data.value);
    product.image_blob_ids = imageBlobIds;
    return product;
  }

  // POST /products
  async function createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
    const validatedPayload = CreateProductRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/products").post(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create product");
    }
    return ProductResponseSchema.parse(data.value);
  }

  // PATCH /products/{id}
  async function updateProduct(
    id: string,
    payload: PatchProductRequest
  ): Promise<ProductResponse> {
    const validatedPayload = PatchProductRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/products/${id}`).patch(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to update product ${id}`);
    }
    return ProductResponseSchema.parse(data.value);
  }

  // DELETE /products/{id}
  async function deleteProduct(id: string): Promise<void> {
    const { error } = await useApiFetch(`/products/${id}`).delete();
    if (error.value) {
      throw error.value || new Error(`Failed to delete product ${id}`);
    }
  }

  // GET /products/{id}/shipping
  async function getProductShipping(productId: string): Promise<ShippingMethod[]> {
    const { data, error } = await useApiFetch(`/products/${productId}/shipping`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch shipping methods for product ${productId}`);
    }
    return z.array(ShippingMethodSchema).parse(data.value);
  }

  // POST /products/shipping/batch
  async function getProductShippingBatch(
    payload: BatchProductQuery
  ): Promise<BatchProductShippingResponse> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/products/shipping/batch")
      .post(validated)
      .json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch product shipping methods");
    }
    return BatchProductShippingResponseSchema.parse(data.value);
  }

  // POST /products/image-search/upload & POST /products/image-search
  async function searchProductsByImage(
    file: File,
    pagination?: { limit?: number; offset?: number }
  ): Promise<PaginatedProductImageSearchResponse> {
    const uploadPayload = ProductImageSearchUploadSchema.parse({
      mime_type: file.type,
      size_bytes: file.size,
    });

    const { data: initData, error: initError } = await useApiFetch(
      "/products/image-search/upload"
    )
      .post(uploadPayload)
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

    if (!storageResponse.ok) {
      throw new Error("Image search upload failed");
    }

    const searchPayload = SearchProductsByImageSchema.parse({
      blob_id: uploadInfo.blob_id,
      limit: pagination?.limit ?? 20,
      offset: pagination?.offset ?? 0,
    });

    const { data, error } = await useApiFetch("/products/image-search")
      .post(searchPayload)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to search products by image");
    }
    const hits = PaginatedProductImageSearchResponseSchema.parse(data.value);
    if (hits.data.length > 0) {
      const productIds = hits.data.map((h) => h.product.id);
      const imagesMap: Record<string, string[]> = {};
      for (let i = 0; i < productIds.length; i += 100) {
        const chunk = productIds.slice(i, i + 100);
        try {
          const batchRes = await productImageApi.getProductImagesBatch({ product_ids: chunk });
          Object.assign(imagesMap, batchRes);
        } catch {
          // Non-blocking fallback
        }
      }
      hits.data.forEach((h) => {
        h.product.image_blob_ids = imagesMap[h.product.id] || [];
      });
    }
    return hits;
  }

  // POST /products/batch
  async function getProductsBatch(payload: BatchProductQuery): Promise<BatchProductResponse> {
    const validated = BatchProductQuerySchema.parse(payload);
    const { data, error } = await useApiFetch("/products/batch")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to batch fetch products");
    }
    return BatchProductResponseSchema.parse(data.value);
  }

  // POST /products/smart-search
  async function searchSmartProducts(
    payload: SmartProductSearchRequest
  ): Promise<SmartSearchResponse> {
    const validated = SmartProductSearchSchema.parse(payload);
    const { data, error } = await useApiFetch("/products/smart-search")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to execute smart search");
    }
    const hits = SmartSearchResponseSchema.parse(data.value);
    if (hits.data.length > 0) {
      const productIds = hits.data.map((h) => h.product.id);
      const imagesMap: Record<string, string[]> = {};
      for (let i = 0; i < productIds.length; i += 100) {
        const chunk = productIds.slice(i, i + 100);
        try {
          const batchRes = await productImageApi.getProductImagesBatch({ product_ids: chunk });
          Object.assign(imagesMap, batchRes);
        } catch {
          // Non-blocking fallback
        }
      }
      hits.data.forEach((h) => {
        h.product.image_blob_ids = imagesMap[h.product.id] || [];
      });
    }
    return hits;
  }

  return {
    getProducts,
    getProduct,
    getProductsBatch,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductShipping,
    getProductShippingBatch,
    searchProductsByImage,
    searchSmartProducts,
  };
};
