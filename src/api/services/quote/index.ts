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
  AccountQuoteFiltersQuery,
  ProviderQuoteFiltersQuery,
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

  async getMyQuotes(
    params?: AccountQuoteFiltersQuery,
  ): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    if (params?.provider_id)
      queryParams.append("provider_id", params.provider_id);
    if (params?.quote_group_id)
      queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) {
      params.statuses.forEach((status) => queryParams.append("statuses", status));
    }
    if (params?.payment_preference)
      queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference)
      queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after)
      queryParams.append("created_after", params.created_after);
    if (params?.created_before)
      queryParams.append("created_before", params.created_before);
    if (params?.search_term)
      queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/quotes/me${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedQuoteAggregateResponseSchema.parse(data);
  }

  async getProviderQuotes(
    providerId: string,
    params?: ProviderQuoteFiltersQuery,
  ): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    if (params?.buyer_id)
      queryParams.append("buyer_id", params.buyer_id);
    if (params?.quote_group_id)
      queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) {
      params.statuses.forEach((status) => queryParams.append("statuses", status));
    }
    if (params?.payment_preference)
      queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference)
      queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after)
      queryParams.append("created_after", params.created_after);
    if (params?.created_before)
      queryParams.append("created_before", params.created_before);
    if (params?.search_term)
      queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/providers/${providerId}/quotes${queryString ? `?${queryString}` : ""}`;

    const data = await this.client.request(endpoint, { method: "GET" });
    return PaginatedQuoteAggregateResponseSchema.parse(data);
  }

  async getAccountQuotes(
    accountId: string,
    params?: AccountQuoteFiltersQuery,
  ): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined)
      queryParams.append("offset", params.offset.toString());
    if (params?.provider_id)
      queryParams.append("provider_id", params.provider_id);
    if (params?.quote_group_id)
      queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) {
      params.statuses.forEach((status) => queryParams.append("statuses", status));
    }
    if (params?.payment_preference)
      queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference)
      queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after)
      queryParams.append("created_after", params.created_after);
    if (params?.created_before)
      queryParams.append("created_before", params.created_before);
    if (params?.search_term)
      queryParams.append("search_term", params.search_term);

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
