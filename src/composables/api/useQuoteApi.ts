import { useApiFetch } from "./useApiFetch";
import { z } from "zod";
import {
  CreateQuoteRequestSchema,
  QuoteResponseSchema,
  QuoteAggregateResponseSchema,
  PaginatedQuoteAggregateResponseSchema,
} from "@/api/services/quote/payloads";
import type {
  CreateQuoteRequest,
  QuoteResponse,
  QuoteAggregateResponse,
  PaginatedQuoteAggregateResponse,
  AccountQuoteFiltersQuery,
  ProviderQuoteFiltersQuery,
} from "@/api/services/quote/types";

export const useQuoteApi = () => {
  async function createQuote(payload: CreateQuoteRequest): Promise<QuoteAggregateResponse[]> {
    const validatedPayload = CreateQuoteRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/quotes").post(validatedPayload).json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create quote");
    }
    return z.array(QuoteAggregateResponseSchema).parse(data.value);
  }

  async function getQuote(id: string): Promise<QuoteAggregateResponse> {
    const { data, error } = await useApiFetch(`/quotes/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch quote ${id}`);
    }
    return QuoteAggregateResponseSchema.parse(data.value);
  }

  async function getMyQuotes(params?: AccountQuoteFiltersQuery): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.quote_group_id) queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) params.statuses.forEach((status) => queryParams.append("statuses", status));
    if (params?.payment_preference) queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference) queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after) queryParams.append("created_after", params.created_after);
    if (params?.created_before) queryParams.append("created_before", params.created_before);
    if (params?.search_term) queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/quotes/me${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my quotes");
    }
    return PaginatedQuoteAggregateResponseSchema.parse(data.value);
  }

  async function getProviderQuotes(providerId: string, params?: ProviderQuoteFiltersQuery): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.buyer_id) queryParams.append("buyer_id", params.buyer_id);
    if (params?.quote_group_id) queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) params.statuses.forEach((status) => queryParams.append("statuses", status));
    if (params?.payment_preference) queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference) queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after) queryParams.append("created_after", params.created_after);
    if (params?.created_before) queryParams.append("created_before", params.created_before);
    if (params?.search_term) queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/providers/${providerId}/quotes${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch quotes for provider ${providerId}`);
    }
    return PaginatedQuoteAggregateResponseSchema.parse(data.value);
  }

  async function getAccountQuotes(accountId: string, params?: AccountQuoteFiltersQuery): Promise<PaginatedQuoteAggregateResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit !== undefined) queryParams.append("limit", params.limit.toString());
    if (params?.offset !== undefined) queryParams.append("offset", params.offset.toString());
    if (params?.provider_id) queryParams.append("provider_id", params.provider_id);
    if (params?.quote_group_id) queryParams.append("quote_group_id", params.quote_group_id);
    if (params?.statuses) params.statuses.forEach((status) => queryParams.append("statuses", status));
    if (params?.payment_preference) queryParams.append("payment_preference", params.payment_preference);
    if (params?.shipping_preference) queryParams.append("shipping_preference", params.shipping_preference);
    if (params?.created_after) queryParams.append("created_after", params.created_after);
    if (params?.created_before) queryParams.append("created_before", params.created_before);
    if (params?.search_term) queryParams.append("search_term", params.search_term);

    const queryString = queryParams.toString();
    const endpoint = `/accounts/${accountId}/quotes${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch quotes for account ${accountId}`);
    }
    return PaginatedQuoteAggregateResponseSchema.parse(data.value);
  }

  // STATE MACHINE ACTIONS
  async function acceptQuote(id: string): Promise<QuoteResponse> {
    const { data, error } = await useApiFetch(`/quotes/${id}/accept`).post().json();
    if (error.value || !data.value) throw error.value || new Error(`Failed to accept quote ${id}`);
    return QuoteResponseSchema.parse(data.value);
  }

  async function rejectQuote(id: string): Promise<void> {
    const { error } = await useApiFetch(`/quotes/${id}/reject`).post();
    if (error.value) throw error.value;
  }

  async function payQuote(id: string): Promise<QuoteResponse> {
    const { data, error } = await useApiFetch(`/quotes/${id}/pay`).post().json();
    if (error.value || !data.value) throw error.value || new Error(`Failed to pay quote ${id}`);
    return QuoteResponseSchema.parse(data.value);
  }

  async function fulfillQuote(id: string): Promise<QuoteResponse> {
    const { data, error } = await useApiFetch(`/quotes/${id}/fulfill`).post().json();
    if (error.value || !data.value) throw error.value || new Error(`Failed to fulfill quote ${id}`);
    return QuoteResponseSchema.parse(data.value);
  }

  async function cancelQuote(id: string): Promise<QuoteResponse> {
    const { data, error } = await useApiFetch(`/quotes/${id}/cancel`).post().json();
    if (error.value || !data.value) throw error.value || new Error(`Failed to cancel quote ${id}`);
    return QuoteResponseSchema.parse(data.value);
  }

  return {
    createQuote,
    getQuote,
    getMyQuotes,
    getProviderQuotes,
    getAccountQuotes,
    acceptQuote,
    rejectQuote,
    payQuote,
    fulfillQuote,
    cancelQuote,
  };
};
