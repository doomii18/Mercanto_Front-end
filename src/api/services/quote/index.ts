import type { ApiClient } from "../../client";
import {
  CreateQuoteRequestSchema,
  QuoteResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
} from "./payloads";
import type {
  CreateQuoteRequest,
  QuoteResponse,
  QuoteAggregateResponse,
  PaginatedQuoteAggregateResponse,
} from "./types";
import { z } from "zod";

export class QuoteService {
  constructor(private readonly client: ApiClient) {}

  async createQuote(
    payload: CreateQuoteRequest,
  ): Promise<QuoteAggregateResponse[]> {
    const validatedPayload = CreateQuoteRequestSchema.parse(payload);
    const data = await this.client.request("/quotes", {
      method: "POST",
      body: JSON.stringify(validatedPayload),
    });
    return z.array(QuoteAggregateResponseSchema).parse(data);
  }

  async getQuote(id: string): Promise<QuoteAggregateResponse> {
    const data = await this.client.request(`/quotes/${id}`, { method: "GET" });
    return QuoteAggregateResponseSchema.parse(data);
  }

  async getMyQuotes(params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/quotes/me${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedQuoteAggregateResponseSchema.parse(data);
  }

  async getProviderQuotes(
    providerId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/providers/${providerId}/quotes${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedQuoteAggregateResponseSchema.parse(data);
  }

  async getAccountQuotes(
    accountId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/accounts/${accountId}/quotes${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedQuoteAggregateResponseSchema.parse(data);
  }

  async acceptQuote(id: string): Promise<QuoteResponse> {
    const data = await this.client.request(`/quotes/${id}/accept`, {
      method: "POST",
    });
    return QuoteResponseSchema.parse(data);
  }

  async rejectQuote(id: string): Promise<void> {
    await this.client.request(`/quotes/${id}/reject`, { method: "POST" });
  }

  async payQuote(id: string): Promise<QuoteResponse> {
    const data = await this.client.request(`/quotes/${id}/pay`, {
      method: "POST",
    });
    return QuoteResponseSchema.parse(data);
  }

  async fulfillQuote(id: string): Promise<QuoteResponse> {
    const data = await this.client.request(`/quotes/${id}/fulfill`, {
      method: "POST",
    });
    return QuoteResponseSchema.parse(data);
  }

  async cancelQuote(id: string): Promise<QuoteResponse> {
    const data = await this.client.request(`/quotes/${id}/cancel`, {
      method: "POST",
    });
    return QuoteResponseSchema.parse(data);
  }
}
