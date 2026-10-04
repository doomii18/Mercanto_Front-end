import { useApiFetch } from "@/api/useApiFetch";
import {
  CreateDepositRequestSchema,
  RejectDepositRequestSchema,
  DepositFilterQuerySchema,
} from "./requests";
import {
  DepositRequestResponseSchema,
  PaginatedDepositSummaryResponseSchema,
  FundingMetricsResponseSchema,
} from "./responses";
import type {
  CreateDepositRequest,
  RejectDepositRequest,
  DepositFilterQuery,
  DepositRequestResponse,
  PaginatedDepositSummaryResponse,
  FundingMetricsResponse,
} from "./types";

export const useDepositApi = () => {
  // ----------------------------------------------------
  // User Deposit (Recharge) Operations
  // ----------------------------------------------------

  // POST /wallets/me/recharges
  async function createRecharge(
    payload: CreateDepositRequest
  ): Promise<DepositRequestResponse> {
    const validated = CreateDepositRequestSchema.parse(payload);
    const { data, error } = await useApiFetch("/wallets/me/recharges")
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error("Failed to create recharge request");
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  // GET /wallets/me/recharges
  async function getMyRecharges(params?: {
    page?: number;
    per_page?: number;
  }): Promise<PaginatedDepositSummaryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.per_page !== undefined) queryParams.append("per_page", params.per_page.toString());

    const queryString = queryParams.toString();
    const endpoint = `/wallets/me/recharges${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch my recharges");
    }

    return PaginatedDepositSummaryResponseSchema.parse(data.value);
  }

  // ----------------------------------------------------
  // Admin Deposit (Recharge) Operations
  // ----------------------------------------------------

  // GET /admin/payments/recharges
  async function getRecharges(
    params?: DepositFilterQuery
  ): Promise<PaginatedDepositSummaryResponse> {
    const validated = params ? DepositFilterQuerySchema.parse(params) : undefined;
    const queryParams = new URLSearchParams();
    if (validated?.page !== undefined) queryParams.append("page", validated.page.toString());
    if (validated?.per_page !== undefined) queryParams.append("per_page", validated.per_page.toString());
    if (validated?.status) queryParams.append("status", validated.status);
    if (validated?.platform_bank_account_id)
      queryParams.append("platform_bank_account_id", validated.platform_bank_account_id);
    if (validated?.search) queryParams.append("search", validated.search);

    const queryString = queryParams.toString();
    const endpoint = `/admin/payments/recharges${queryString ? `?${queryString}` : ""}`;

    const { data, error } = await useApiFetch(endpoint).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch recharge requests");
    }

    return PaginatedDepositSummaryResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/metrics
  async function getRechargeMetrics(): Promise<FundingMetricsResponse> {
    const { data, error } = await useApiFetch("/admin/payments/recharges/metrics").get().json();
    if (error.value || !data.value) {
      throw error.value || new Error("Failed to fetch recharge metrics");
    }

    return FundingMetricsResponseSchema.parse(data.value);
  }

  // GET /admin/payments/recharges/{id}
  async function getRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}`).get().json();
    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to fetch recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/recharges/{id}/approve
  async function approveRecharge(id: string): Promise<DepositRequestResponse> {
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/approve`)
      .post()
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to approve recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  // POST /admin/payments/recharges/{id}/reject
  async function rejectRecharge(
    id: string,
    payload: RejectDepositRequest
  ): Promise<DepositRequestResponse> {
    const validated = RejectDepositRequestSchema.parse(payload);
    const { data, error } = await useApiFetch(`/admin/payments/recharges/${id}/reject`)
      .post(validated)
      .json();

    if (error.value || !data.value) {
      throw error.value || new Error(`Failed to reject recharge request ${id}`);
    }

    return DepositRequestResponseSchema.parse(data.value);
  }

  return {
    createRecharge,
    getMyRecharges,
    getRecharges,
    getRechargeMetrics,
    getRecharge,
    approveRecharge,
    rejectRecharge,
  };
};
