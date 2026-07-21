import type { ApiClient } from "../../client";
import {
  AssetUploadRequestSchema,
  UploadUrlResponseSchema,
} from "../../shared/schemas";
import {
  ProductResponseSchema,
  PaginatedProductResponseSchema,
  CreateProductRequestSchema,
  PatchProductRequestSchema,
} from "./payloads";
import type {
  PaginatedProductResponse,
  ProductFiltersRequest,
  ProductResponse,
  CreateProductRequest,
  PatchProductRequest,
} from "./types";

export class ProductService {
  constructor(private readonly client: ApiClient) {}

  async getProductImageBlobUrl(blobId: string): Promise<string> {
    const response = await fetch(
      `${this.client.getBaseUrl()}/assets/product-image/${blobId}`,
      { method: "GET" },
    );

    if (!response.ok)
      throw new Error(`Failed to fetch product image: ${response.statusText}`);

    return URL.createObjectURL(await response.blob());
  }

  async uploadProductImage(productId: string, file: File): Promise<void> {
    const payload = {
      ...AssetUploadRequestSchema.parse({
        mime_type: file.type,
        size_bytes: file.size,
      }),
      product_id: productId,
    };
    const initData = UploadUrlResponseSchema.parse(
      await this.client.request("/assets/product-image", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const storageResponse = await fetch(initData.presigned_url, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!storageResponse.ok) throw new Error("Upload failed");
    await this.client.request(
      `/assets/product-image/${initData.blob_id}/confirm`,
      { method: "POST", body: JSON.stringify({ product_id: productId }) },
    );
  }
  async deleteProductImage(blobId: string): Promise<void> {
    await this.client.request(`/assets/product-image/${blobId}`, {
      method: "DELETE",
    });
  }

  async getProducts(
    params?: ProductFiltersRequest,
  ): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    if (params?.provider_id)
      queryParams.append("provider_id", params.provider_id);
    if (params?.category_id)
      queryParams.append("category_id", params.category_id);
    if (params?.min_price !== undefined)
      queryParams.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined)
      queryParams.append("max_price", params.max_price.toString());
    if (params?.search_term)
      queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedProductResponseSchema.parse(data);
  }

  async getProduct(id: string): Promise<ProductResponse> {
    const data = await this.client.request(`/products/${id}`, {
      method: "GET",
    });
    return ProductResponseSchema.parse(data);
  }

  async createProduct(payload: CreateProductRequest): Promise<ProductResponse> {
    const validatedPayload = CreateProductRequestSchema.parse(payload);
    const data = await this.client.request("/products", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return ProductResponseSchema.parse(data);
  }

  async updateProduct(
    id: string,
    payload: PatchProductRequest,
  ): Promise<ProductResponse> {
    const validatedPayload = PatchProductRequestSchema.parse(payload);
    const data = await this.client.request(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validatedPayload),
    });
    return ProductResponseSchema.parse(data);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.request(`/products/${id}`, { method: "DELETE" });
  }
}
