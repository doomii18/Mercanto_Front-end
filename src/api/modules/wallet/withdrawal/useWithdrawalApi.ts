import { useApiFetch } from "@/api/useApiFetch";
import {
  CreateWithdrawalRequestSchema,
  CompleteWithdrawalRequestSchema,
  RejectWithdrawalRequestSchema,
  WithdrawalFilterQuerySchema,
} from "./requests";
import {
  WithdrawalRequestResponseSchema,
  PaginatedWithdrawalSummaryResponseSchema,
  WithdrawalMetricsResponseSchema,
} from "./responses";
import type {
  CreateWithdrawalRequest,
  CompleteWithdrawalRequest,
  RejectWithdrawalRequest,
  WithdrawalFilterQuery,
  WithdrawalRequestResponse,
  PaginatedWithdrawalSummaryResponse,
  WithdrawalMetricsResponse,
} from "./types";

export const useWithdrawalApi = () => {
  // ----------------------------------------------------
  // User Withdrawal (Extraction) Operations
  // ----------------------------------------------------

  // POST /wallets/me/withdrawals
  async function createWithdrawal(
    payload: CreateWithdrawalRequest
  ): Promise<WithdrawalRequestResponse> {
    const validated = CreateWithdrawalRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/withdrawals")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create withdrawal request");
    }

    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // GET /wallets/me/withdrawals
  async function getMyWithdrawals(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedWithdrawalSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/withdrawals${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my withdrawals");
    }

    return PaginatedWithdrawalSummaryResponseSchema.parse(data.value);
  }

  // ----------------------------------------------------
  // Admin Withdrawal Operations
  // ----------------------------------------------------

  // GET /admin/payments/withdrawals
  async function getWithdrawals(
    params?: WithdrawalFilterQuery
  ): Promise<PaginatedWithdrawalSummaryResponse> {
    const validated = params ? WithdrawalFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.page !== undefined) queryParams.append("page", validated.page.toString());
    if (validated?.per_page !== undefined) queryParams.append("per_page", validated.per_page.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.search) queryParams.append("search", validated.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/payments/withdrawals${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch withdrawal requests");
    }

    return PaginatedWithdrawalSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/payments/withdrawals/metrics
  async function getWithdrawalMetrics(): Promise<WithdrawalMetricsResponse> {
    const { data, error } = await useApiFetch("/admin/payments/withdrawals/metrics").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch withdrawal metrics");
    }

    return WithdrawalMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/payments/withdrawals/{id}
  async function getWithdrawal(id: string): Promise<WithdrawalRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch withdrawal request ${id}`);
    }

    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/withdrawals/{id}/complete
  async function completeWithdrawal(
    id: string,
    payload: CompleteWithdrawalRequest
  ): Promise<WithdrawalRequestResponse> {
    const validated = CompleteWithdrawalRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}/complete`)
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to complete withdrawal request ${id}`);
    }

    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/withdrawals/{id}/reject
  async function rejectWithdrawal(
    id: string,
    payload: RejectWithdrawalRequest
  ): Promise<WithdrawalRequestResponse> {
    const validated = RejectWithdrawalRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/admin/payments/withdrawals/${id}/reject`)
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject withdrawal request ${id}`);
    }

    return WithdrawalRequestResponseSchema.parse(data.value);
  }

  return {
    createWithdrawal,
    getMyWithdrawals,
    getWithdrawals,
    getWithdrawalMetrics,
    getWithdrawal,
    completeWithdrawal,
    rejectWithdrawal,
  };
};
