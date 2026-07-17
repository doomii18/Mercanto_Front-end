import type { ApiClient } from "../../client";
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

  async getProducts(params?: ProductFiltersRequest): Promise<PaginatedProductResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.category_id) queryParams.append("category_id", params.category_id);
    if (params?.min_price !== undefined) queryParams.append("min_price", params.min_price.toString());
    if (params?.max_price !== undefined) queryParams.append("max_price", params.max_price.toString());
    if (params?.search_term) queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedProductResponseSchema.parse(data);
  }

  async getProduct(id: string): Promise<ProductResponse> {
    const data = await this.client.request(`/products/${id}`, { method: "GET" });
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

  async updateProduct(id: string, payload: PatchProductRequest): Promise<ProductResponse> {
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
